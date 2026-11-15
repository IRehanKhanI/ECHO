from django.test import TestCase
from rest_framework.test import APIClient
from api.ml_service import predict_degradation


class TerraOpsApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    # --- SIMULATE WEAR TESTS ---

    def test_simulate_wear_valid(self):
        response = self.client.post(
            "/api/simulate-wear/",
            {"sulfur_ppm": 510, "exposure_days": 180},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("predicted_degradation_mg_cm2", data)
        self.assertGreater(data["predicted_degradation_mg_cm2"], 0)

    def test_simulate_wear_invalid_negative(self):
        response = self.client.post(
            "/api/simulate-wear/",
            {"sulfur_ppm": -50, "exposure_days": 10},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_simulate_wear_missing_fields(self):
        response = self.client.post(
            "/api/simulate-wear/",
            {"sulfur_ppm": 510},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_predict_degradation_math(self):
        deg_30d = predict_degradation(500, 30)
        self.assertGreater(deg_30d, 0.01)
        deg_365d = predict_degradation(500, 365)
        self.assertGreater(deg_365d, deg_30d)

    # --- FIND ANALOG TESTS ---

    def test_find_analog_default_post(self):
        response = self.client.post(
            "/api/find-analog/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("matches", data)
        self.assertEqual(data["lunar_target_vector"], [-203.0, 14.8, 280.0, 82.0])
        self.assertGreater(len(data["matches"]), 0)

    def test_find_analog_default_get(self):
        response = self.client.get("/api/find-analog/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("matches", data)
        self.assertEqual(data["lunar_target_vector"], [-203.0, 14.8, 280.0, 82.0])

    def test_find_analog_with_target_id(self):
        response = self.client.get("/api/find-analog/?target_id=moon_haworth_crater")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["target_id"], "moon_haworth_crater")
        self.assertEqual(data["target_name"], "Haworth PSR")
        self.assertEqual(data["lunar_target_vector"], [-246.0, 7.2, 680.0, 70.0])
        self.assertGreater(len(data["matches"]), 0)

    def test_find_analog_with_custom_lunar_params(self):
        response = self.client.post(
            "/api/find-analog/",
            {"lunar_temp_c": -188.0, "lunar_slope_deg": 16.2},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["lunar_target_vector"], [-188.0, 16.2])

    def test_find_analog_record_fields(self):
        response = self.client.get("/api/find-analog/?match_count=5")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertLessEqual(len(data["matches"]), 5)

        first_match = data["matches"][0]
        required_fields = [
            "id",
            "name",
            "country",
            "lat",
            "lng",
            "min_temp_c",
            "slope_deg",
            "match_score_pct",
            "sulfur_ppm",
            "status",
            "reason",
            "cosine_distance",
            "normalized_euclidean_distance",
            "prior_nasa_use_status",
            "provenance",
        ]
        for field in required_fields:
            self.assertIn(field, first_match, f"Missing required field '{field}' in analog match")

        # Score percentage should be between 0 and 100
        self.assertGreaterEqual(first_match["match_score_pct"], 0.0)
        self.assertLessEqual(first_match["match_score_pct"], 100.0)
        self.assertIn("ranking", first_match)

    def test_find_analog_novelty_only_filter(self):
        """Test finding novel candidate sites with no documented prior NASA usage."""
        response = self.client.get("/api/find-analog/?novelty_only=true")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["novelty_only"])
        self.assertGreater(len(data["matches"]), 0)

        # All matches must have NO_DOCUMENTED_PRIOR_NASA_USE_FOUND
        for match in data["matches"]:
            self.assertEqual(match["prior_nasa_use_status"], "NO_DOCUMENTED_PRIOR_NASA_USE_FOUND")
            self.assertTrue(match["is_novel"])

        # Well-known documented legacy sites must be excluded
        match_names = [m["name"] for m in data["matches"]]
        self.assertNotIn("University Valley (McMurdo Dry Valleys)", match_names)
        self.assertNotIn("Haughton Impact Crater (Devon Island)", match_names)
        self.assertNotIn("San Francisco Volcanic Field / Black Point (Arizona)", match_names)

        # Novel candidate sites must be present
        self.assertTrue(any("Mount Fleming" in n for n in match_names))
        self.assertTrue(any("Victoria Valley" in n for n in match_names))
        self.assertTrue(any("Pedernales" in n for n in match_names))

    # --- TARGETS ENDPOINT TESTS ---

    def test_targets_list(self):
        response = self.client.get("/api/targets/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("targets", data)
        self.assertEqual(data["count"], 5)

        target_ids = [t["id"] for t in data["targets"]]
        self.assertIn("moon_shackleton_rim", target_ids)
        self.assertIn("moon_malapert_massif", target_ids)
        self.assertIn("moon_haworth_crater", target_ids)
        self.assertIn("moon_mons_mouton", target_ids)
        self.assertIn("moon_connecting_ridge", target_ids)

        # Verify verified parameters of Shackleton
        shackleton = next(t for t in data["targets"] if t["id"] == "moon_shackleton_rim")
        self.assertEqual(shackleton["lat"], -89.90)
        self.assertEqual(shackleton["elevation_m"], 1240)
        self.assertEqual(shackleton["min_temp_c"], -203.0)
        self.assertEqual(shackleton["mean_slope_deg"], 14.8)
        self.assertEqual(shackleton["sulfur_ppm"], 280.0)
        self.assertEqual(shackleton["plagioclase_pct"], 82.0)
        self.assertEqual(shackleton["lunar_target_vector"], [-203.0, 14.8, 280.0, 82.0])

    def test_targets_filter_by_id(self):
        response = self.client.get("/api/targets/?target_id=moon_malapert_massif")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("target", data)
        self.assertEqual(data["target"]["id"], "moon_malapert_massif")
        self.assertEqual(data["target"]["elevation_m"], 5040)
        self.assertEqual(data["target"]["sulfur_ppm"], 320.0)
        self.assertEqual(data["target"]["plagioclase_pct"], 76.0)

    def test_targets_not_found(self):
        response = self.client.get("/api/targets/?target_id=non_existent_target")
        self.assertEqual(response.status_code, 404)

    # --- ANALOGS ENDPOINT TESTS ---

    def test_analogs_list(self):
        response = self.client.get("/api/analogs/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("analogs", data)
        self.assertEqual(data["count"], 30)

        names = [a["name"] for a in data["analogs"]]
        self.assertTrue(any("Salar de Gorbea" in n for n in names))
        self.assertTrue(any("University Valley" in n for n in names))
        self.assertTrue(any("Stillwater" in n for n in names))
        self.assertTrue(any("Pyhäsalmi" in n for n in names))
        self.assertTrue(any("Taklamakan" in n for n in names))

    def test_analogs_novelty_filter(self):
        """Test filtering analog catalog by novelty_only=true."""
        response = self.client.get("/api/analogs/?novelty_only=true")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["count"], 15)
        for a in data["analogs"]:
            self.assertEqual(a["prior_nasa_use_status"], "NO_DOCUMENTED_PRIOR_NASA_USE_FOUND")
            self.assertTrue(a["is_novel"])

    def test_analogs_status_filter(self):
        response = self.client.get("/api/analogs/?status=RESTRICTED")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["count"], 2)
        names = [a["name"] for a in data["analogs"]]
        self.assertTrue(any("Taklamakan" in n for n in names))
        self.assertTrue(any("Qaidam Dalangtan" in n for n in names))

    def test_analogs_country_filter(self):
        response = self.client.get("/api/analogs/?country=USA")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data["count"], 0)
        for a in data["analogs"]:
            self.assertIn("USA", a["country"])
