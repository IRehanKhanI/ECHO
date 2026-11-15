from django.test import TestCase
from rest_framework.test import APIClient
from api.ml_service import predict_degradation


class TerraOpsApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

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

    def test_find_analog_endpoint(self):
        response = self.client.post(
            "/api/find-analog/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("matches", data)

    def test_predict_degradation_math(self):
        deg_30d = predict_degradation(500, 30)
        self.assertGreater(deg_30d, 0.01)
        deg_365d = predict_degradation(500, 365)
        self.assertGreater(deg_365d, deg_30d)
