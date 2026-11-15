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

    def test_analogs_verified_scientific_dimensions(self):
        """Test that all Earth analog records contain ERA5-Land, ECV, and PetDB dimensions."""
        response = self.client.get("/api/analogs/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["count"], 30)

        for a in data["analogs"]:
            self.assertIn("era5_soil_temp_c", a, f"Missing era5_soil_temp_c in {a['id']}")
            self.assertIsInstance(a["era5_soil_temp_c"], (int, float))
            self.assertIn("ecv_air_temp_c", a, f"Missing ecv_air_temp_c in {a['id']}")
            self.assertIsInstance(a["ecv_air_temp_c"], (int, float))
            self.assertIn("petdb_sample_id", a, f"Missing petdb_sample_id in {a['id']}")
            self.assertTrue(len(a["petdb_sample_id"]) > 0)
            self.assertIn("petdb_silica_pct", a, f"Missing petdb_silica_pct in {a['id']}")
            self.assertGreater(a["petdb_silica_pct"], 0.0)

    # --- PERMITS ANALYZE ENDPOINT TESTS ---

    def test_permits_analyze_with_site_id_usa(self):
        """Test permit analysis for USA analog site EAR-03 (Mauna Kea & Kilauea)."""
        response = self.client.post(
            "/api/permits/analyze/",
            {"site_id": "EAR-03"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["resolved_country"], "USA")

        # Statutory jurisdiction checks
        jurisdiction = data["statutory_jurisdiction"]
        self.assertIn("United States", jurisdiction["primary_jurisdiction"])
        self.assertTrue(any("BLM" in a or "NPS" in a or "Bureau of Land Management" in a for a in jurisdiction["lead_agencies"]))

        # Verified statutory permits
        permits = data["verified_permits"]
        self.assertGreaterEqual(len(permits), 3)
        for p in permits:
            self.assertTrue(p["is_statutory_verified"])
            self.assertIn("portal_url", p)
            self.assertTrue(p["portal_url"].startswith("http"))
            self.assertIn("statute", p)

        # Wolf Amendment check: USA site is NOT subject to bilateral restriction
        self.assertFalse(data["wolf_amendment_flag"])
        self.assertEqual(data["wolf_amendment_details"]["restriction_level"], "NONE")

        # AI regulatory assessment
        ai_assess = data["ai_regulatory_assessment"]
        self.assertIn("environmental_clearances", ai_assess)
        self.assertIn("zoning_considerations", ai_assess)
        self.assertIn("sample_export_requirements", ai_assess)
        self.assertIn("flagged_uncertainties", ai_assess)
        self.assertIn("estimated_approval_timeline_days", ai_assess)

        # Confidence and disclaimers
        self.assertGreater(data["confidence_score"], 0.8)
        self.assertIn("STATUTORY NOTICE", data["disclaimer"])
        self.assertGreater(len(data["data_provenance"]), 0)

    def test_permits_analyze_with_coordinates_chile(self):
        """Test permit analysis using raw coordinates for Salar de Gorbea (Chile)."""
        response = self.client.post(
            "/api/permits/analyze/",
            {"lat": -25.40, "lng": -68.70, "country": "Chile"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["resolved_country"], "Chile")
        self.assertFalse(data["wolf_amendment_flag"])

        permit_ids = [p["permit_id"] for p in data["verified_permits"]]
        self.assertTrue(any("DIFROL" in pid for pid in permit_ids))
        self.assertTrue(any("SERNAGEOMIN" in pid for pid in permit_ids))

    def test_permits_analyze_antarctica(self):
        """Test permit analysis under Antarctic Treaty System."""
        response = self.client.post(
            "/api/permits/analyze/",
            {"site_id": "EAR-02"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["resolved_country"], "Antarctica")
        self.assertIn("Antarctic Treaty System", data["statutory_jurisdiction"]["primary_jurisdiction"])
        self.assertFalse(data["wolf_amendment_flag"])

        permit_names = [p["name"] for p in data["verified_permits"]]
        self.assertTrue(any("Antarctic Conservation Act" in n for n in permit_names))

    def test_permits_analyze_china_wolf_amendment(self):
        """Test that Chinese candidate sites trigger PL 112-55 §539 Wolf Amendment flag."""
        response = self.client.post(
            "/api/permits/analyze/",
            {"site_id": "EAR-15"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["resolved_country"], "China")
        self.assertTrue(data["wolf_amendment_flag"])
        self.assertEqual(data["wolf_amendment_details"]["restriction_level"], "STATUTORY_BILATERAL_PROHIBITION")
        self.assertIn("112-55", data["wolf_amendment_details"]["statutory_authority"])
        self.assertIn("prohibited", data["wolf_amendment_details"]["guidance"].lower())

    def test_permits_analyze_missing_input(self):
        """Missing both coordinates and site_id must return 400 Bad Request."""
        response = self.client.post("/api/permits/analyze/", {}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())

    def test_permits_analyze_invalid_coordinates(self):
        """Latitude > 90 must return 400 Bad Request."""
        response = self.client.post(
            "/api/permits/analyze/",
            {"lat": 95.5, "lng": 10.0},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())

    def test_permits_analyze_non_numeric_coordinates(self):
        """Non-numeric lat/lng must return 400 Bad Request."""
        response = self.client.post(
            "/api/permits/analyze/",
            {"lat": "north_pole", "lng": 0.0},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_permits_analyze_unknown_site_id(self):
        """Unknown site_id without coordinates must return 400."""
        response = self.client.post(
            "/api/permits/analyze/",
            {"site_id": "NON_EXISTENT_ID_999"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    # --- CDS & PETDB DATA PIPELINE TESTS ---

    def test_cds_pipeline_era5_soil_temp(self):
        """Test CDS pipeline retrieval for ERA5-Land topsoil temperature."""
        from data_pipelines.cds_petdb_service import get_era5_soil_temperature

        result = get_era5_soil_temperature(lat=-25.40, lng=-68.70)
        self.assertIn("era5_soil_temp_c", result)
        self.assertIsInstance(result["era5_soil_temp_c"], float)
        self.assertEqual(result["variable"], "soil_temperature_level_1")
        self.assertEqual(result["dataset"], "reanalysis-era5-land-timeseries")
        self.assertIn(result["retrieval_status"], ("CDS_API_LIVE", "CDS_OFFLINE_CACHE", "CACHED_LOCAL"))

    def test_cds_pipeline_ecv_air_temp(self):
        """Test CDS pipeline retrieval for Copernicus ECV surface air temperature."""
        from data_pipelines.cds_petdb_service import get_ecv_surface_air_temperature

        result = get_ecv_surface_air_temperature(lat=-25.40, lng=-68.70, year="2026")
        self.assertIn("ecv_air_temp_c", result)
        self.assertIsInstance(result["ecv_air_temp_c"], float)
        self.assertEqual(result["variable"], "surface_air_temperature")
        self.assertEqual(result["dataset"], "ecv-for-climate-change")
        self.assertIn(result["retrieval_status"], ("CDS_API_LIVE", "CDS_OFFLINE_CACHE", "CACHED_LOCAL"))

    def test_petdb_pipeline_sample_query(self):
        """Test PetDB geochemical query client for rock/mineral composition."""
        from data_pipelines.cds_petdb_service import query_petdb_geochemical_sample

        result = query_petdb_geochemical_sample(lat=-25.40, lng=-68.70, sample_id="PETDB-SGR-0412")
        self.assertEqual(result["sample_id"], "PETDB-SGR-0412")
        self.assertEqual(result["sio2_pct"], 42.8)
        self.assertEqual(result["plagioclase_pct"], 62.0)
        self.assertEqual(result["pyroxene_pct"], 19.0)
        self.assertIn("retrieval_status", result)

    def test_combined_earth_science_dimensions(self):
        """Test combined pipeline dimensions aggregation."""
        from data_pipelines.cds_petdb_service import get_combined_earth_science_dimensions

        res = get_combined_earth_science_dimensions(lat=-77.85, lng=160.70, site_id="EAR-02")
        self.assertEqual(res["site_id"], "EAR-02")
        self.assertEqual(res["era5_soil_temp_c"], -24.8)
        self.assertEqual(res["ecv_air_temp_c"], -28.2)
        self.assertEqual(res["petdb_sample_id"], "PETDB-MDV-1093")
        self.assertEqual(res["petdb_silica_pct"], 54.2)
        self.assertIn("retrieval_status", res)
