from __future__ import annotations

import csv
import math
import os
from pathlib import Path
from typing import Any

from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.status import HTTP_500_INTERNAL_SERVER_ERROR
from rest_framework.views import APIView

try:
    from postgrest.exceptions import APIError
except ImportError:
    class APIError(Exception):  # type: ignore
        pass

from api.supabase import get_supabase_client
from api.ml_service import predict_degradation


LUNAR_TARGET_VECTOR = [-203.0, 14.8]
BASE_DIR = Path(__file__).resolve().parent.parent


def get_local_analog_matches(
    query_vector: list[float], match_count: int = 3
) -> list[dict[str, Any]]:
    """Compute top cosine-similarity matches from local earth_analogs.csv."""
    csv_paths = [
        BASE_DIR / "earth_analogs.csv",
        BASE_DIR / "data" / "earth_analogs.csv",
    ]
    target_csv = None
    for p in csv_paths:
        if p.is_file():
            target_csv = p
            break

    if not target_csv:
        return []

    target_temp, target_slope = query_vector[0], query_vector[1]
    target_mag = math.sqrt(target_temp**2 + target_slope**2)

    matches: list[dict[str, Any]] = []
    with open(target_csv, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader, 1):
            try:
                temp = float(row.get("min_temp_c", row.get("min_temp_k", 0)))
                if temp > 100:
                    temp = temp - 273.15
                slope = float(row.get("slope_deg", row.get("mean_slope_deg", 0)))
                lat = float(row.get("lat", 0))
                lng = float(row.get("lng", row.get("lon", 0)))
                loc_name = row.get("location_name", row.get("name", f"Site {idx}"))
                country = row.get("country", "Unknown")
            except (ValueError, TypeError):
                continue

            dot = target_temp * temp + target_slope * slope
            mag = math.sqrt(temp**2 + slope**2)
            cosine_dist = (
                1.0 - (dot / (target_mag * mag)) if (target_mag * mag) > 0 else 1.0
            )

            matches.append({
                "id": idx,
                "location_name": loc_name,
                "country": country,
                "lat": lat,
                "lng": lng,
                "min_temp_c": round(temp, 1),
                "slope_deg": round(slope, 1),
                "cosine_distance": cosine_dist,
            })

    matches.sort(key=lambda x: x["cosine_distance"])
    return matches[:match_count]


class FindAnalogView(APIView):
    """Return the Earth locations closest to the lunar target vector."""

    def post(self, request: Any) -> Response:
        return self.get(request)

    def get(self, request: Any) -> Response:
        matches = None

        if os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_SERVICE_ROLE_KEY"):
            try:
                response = get_supabase_client().rpc(
                    "match_earth_analogs",
                    {
                        "query_embedding": LUNAR_TARGET_VECTOR,
                        "match_count": 3,
                    },
                ).execute()
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
            except (APIError, OSError, RuntimeError, ValueError):
                matches = None

        if matches is None:
            try:
                matches = get_local_analog_matches(LUNAR_TARGET_VECTOR, match_count=3)
            except Exception as exc:
                return Response(
                    {"error": f"Could not query Earth analogs: {exc}"},
                    status=HTTP_500_INTERNAL_SERVER_ERROR,
                )

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
