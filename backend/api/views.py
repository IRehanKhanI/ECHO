from __future__ import annotations

import math
from typing import Any

from rest_framework.request import Request
from postgrest.exceptions import APIError
from rest_framework.response import Response
from rest_framework.status import HTTP_500_INTERNAL_SERVER_ERROR
from rest_framework.views import APIView

from api.supabase import get_supabase_client
from api.ml_service import predict_degradation


LUNAR_TARGET_VECTOR = [-203.0, 14.8]


class FindAnalogView(APIView):
    """Return the three Earth locations closest to the lunar target vector."""

    def get(self, request: Any) -> Response:
        try:
            response = get_supabase_client().rpc(
                "match_earth_analogs",
                {
                    "query_embedding": LUNAR_TARGET_VECTOR,
                    "match_count": 3,
                },
            ).execute()
        except (APIError, OSError, RuntimeError, ValueError) as exc:
            return Response(
                {"error": f"Could not query Earth analogs: {exc}"},
                status=HTTP_500_INTERNAL_SERVER_ERROR,
            )

        matches = [
            {
                "id": match["id"],
                "location_name": match["location_name"],
                "country": match["country"],
                "lat": match["lat"],
                "lng": match["lng"],
                "min_temp_c": match["min_temp_c"],
                "slope_deg": match["slope_deg"],
                "cosine_distance": match["cosine_distance"],
            }
            for match in response.data
        ]

        return Response(
            {
                "lunar_target_vector": LUNAR_TARGET_VECTOR,
                "matches": matches,
            }
        )


find_analog = FindAnalogView.as_view()


class SimulateWearView(APIView):
    """Predict sulfur-corrosion degradation for the Virtual Lab."""

    def post(self, request: Request) -> Response:
        try:
            sulfur_ppm = float(request.data["sulfur_ppm"])
            exposure_days = float(request.data["exposure_days"])
        except (KeyError, TypeError, ValueError) as exc:
            return Response(
                {"error": "sulfur_ppm and exposure_days must be numeric."},
                status=400,
            )

        if not math.isfinite(sulfur_ppm) or not math.isfinite(exposure_days):
            return Response(
                {"error": "sulfur_ppm and exposure_days must be finite."},
                status=400,
            )

        try:
            prediction = predict_degradation(sulfur_ppm, exposure_days)
        except (OSError, ValueError) as exc:
            return Response({"error": str(exc)}, status=400)

        return Response(
            {
                "sulfur_ppm": sulfur_ppm,
                "exposure_days": exposure_days,
                "predicted_degradation_mg_cm2": prediction,
            }
        )


simulate_wear = SimulateWearView.as_view()
