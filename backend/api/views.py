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

BASE_DIR = Path(__file__).resolve().parent.parent

# Default target vector: Shackleton Rim Massif (Artemis IV South Pole Target)
# Multi-objective vector: [min_temp_c, slope_deg, sulfur_ppm, plagioclase_pct]
DEFAULT_LUNAR_VECTOR = [-203.0, 14.8, 280.0, 82.0]
LUNAR_TARGET_VECTOR = list(DEFAULT_LUNAR_VECTOR)

# Verified Artemis IV Lunar Targets (NASA PDS LRO LOLA / Diviner / UCLA)
ARTEMIS_TARGETS: list[dict[str, Any]] = [
    {
        "id": "moon_shackleton_rim",
        "name": "Shackleton Rim Massif",
        "body": "moon",
        "coordinates": "89.90°S, 0.00°E",
        "lat": -89.90,
        "lng": 0.00,
        "lon": 0.00,
        "elevation_m": 1240,
        "min_temp_c": -203.0,
        "max_temp_c": -48.0,
        "mean_temp_c": -136.0,
        "mean_slope_deg": 14.8,
        "slope_deg": 14.8,
        "sulfur_ppm": 280.0,
        "plagioclase_pct": 82.0,
        "pyroxene_pct": 12.0,
        "feo_wt_pct": 4.8,
        "lunar_target_vector": [-203.0, 14.8, 280.0, 82.0],
        "summary": "High-ridge perimeter bordered by deep cryogenic volatile traps and persistent grazing sunlight peaks.",
    },
    {
        "id": "moon_malapert_massif",
        "name": "Malapert Massif",
        "body": "moon",
        "coordinates": "85.99°S, 2.90°W",
        "lat": -85.99,
        "lng": -2.90,
        "lon": -2.90,
        "elevation_m": 5040,
        "min_temp_c": -188.0,
        "max_temp_c": -38.0,
        "mean_temp_c": -119.0,
        "mean_slope_deg": 16.2,
        "slope_deg": 16.2,
        "sulfur_ppm": 320.0,
        "plagioclase_pct": 76.0,
        "pyroxene_pct": 16.0,
        "feo_wt_pct": 6.2,
        "lunar_target_vector": [-188.0, 16.2, 320.0, 76.0],
        "summary": "Elevated south polar massif providing direct Earth line-of-sight communications and steep boulder-strewn flanks.",
    },
    {
        "id": "moon_haworth_crater",
        "name": "Haworth PSR",
        "body": "moon",
        "coordinates": "87.40°S, 5.10°W",
        "lat": -87.40,
        "lng": -5.10,
        "lon": -5.10,
        "elevation_m": -2850,
        "min_temp_c": -246.0,
        "max_temp_c": -198.0,
        "mean_temp_c": -225.0,
        "mean_slope_deg": 7.2,
        "slope_deg": 7.2,
        "sulfur_ppm": 680.0,
        "plagioclase_pct": 70.0,
        "pyroxene_pct": 18.0,
        "feo_wt_pct": 7.5,
        "lunar_target_vector": [-246.0, 7.2, 680.0, 70.0],
        "summary": "Deep permanently shadowed cryogenic cold-trap floor recording ultra-low temperatures (<40 K / -246°C) and frost stability.",
    },
    {
        "id": "moon_mons_mouton",
        "name": "Mons Mouton",
        "body": "moon",
        "coordinates": "84.60°S, 31.00°E",
        "lat": -84.60,
        "lng": 31.00,
        "lon": 31.00,
        "elevation_m": 6000,
        "min_temp_c": -219.0,
        "max_temp_c": -33.0,
        "mean_temp_c": -126.0,
        "mean_slope_deg": 7.2,
        "slope_deg": 7.2,
        "sulfur_ppm": 410.0,
        "plagioclase_pct": 80.0,
        "pyroxene_pct": 14.0,
        "feo_wt_pct": 5.1,
        "lunar_target_vector": [-219.0, 7.2, 410.0, 80.0],
        "summary": "High plateau feature near South Pole with low slopes and potential subsurface volatile deposits.",
    },
    {
        "id": "moon_connecting_ridge",
        "name": "Connecting Ridge",
        "body": "moon",
        "coordinates": "89.44°S, 137.31°W",
        "lat": -89.44,
        "lng": -137.31,
        "lon": -137.31,
        "elevation_m": 1650,
        "min_temp_c": -195.0,
        "max_temp_c": -42.0,
        "mean_temp_c": -125.0,
        "mean_slope_deg": 9.8,
        "slope_deg": 9.8,
        "sulfur_ppm": 350.0,
        "plagioclase_pct": 78.0,
        "pyroxene_pct": 15.0,
        "feo_wt_pct": 5.5,
        "lunar_target_vector": [-195.0, 9.8, 350.0, 78.0],
        "summary": "Narrow topographic ridge connecting Shackleton to de Gerlache, featuring dual illumination windows and low rover slopes.",
    },
]

TARGETS_BY_ID: dict[str, dict[str, Any]] = {t["id"]: t for t in ARTEMIS_TARGETS}
TARGETS_BY_ID.update({
    "shackleton": TARGETS_BY_ID["moon_shackleton_rim"],
    "shackleton_rim": TARGETS_BY_ID["moon_shackleton_rim"],
    "malapert": TARGETS_BY_ID["moon_malapert_massif"],
    "malapert_massif": TARGETS_BY_ID["moon_malapert_massif"],
    "haworth": TARGETS_BY_ID["moon_haworth_crater"],
    "haworth_psr": TARGETS_BY_ID["moon_haworth_crater"],
    "haworth_crater": TARGETS_BY_ID["moon_haworth_crater"],
    "mons_mouton": TARGETS_BY_ID["moon_mons_mouton"],
    "mouton": TARGETS_BY_ID["moon_mons_mouton"],
    "connecting_ridge": TARGETS_BY_ID["moon_connecting_ridge"],
})


def get_all_earth_analogs() -> list[dict[str, Any]]:
    """Load all authenticated Earth analog records from earth_analogs.csv."""
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

    analogs: list[dict[str, Any]] = []
    with open(target_csv, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader, 1):
            try:
                temp_raw = float(row.get("min_temp_c", row.get("min_temp_k", 0)))
                if temp_raw > 100:  # Convert Kelvin if provided in K
                    temp_raw = temp_raw - 273.15
                max_temp = float(row.get("max_temp_c", row.get("max_temp_k", temp_raw + 20.0)))
                if max_temp > 100:
                    max_temp = max_temp - 273.15
                slope = float(row.get("slope_deg", row.get("mean_slope_deg", 0)))
                lat = float(row.get("lat", 0))
                lng = float(row.get("lng", row.get("lon", 0)))
                elevation_m = float(row.get("elevation_m", 0))
                diurnal_delta = float(row.get("diurnal_delta_k", 20.0))
                aridity_pct = float(row.get("aridity_pct", 85.0))
                sulfur_ppm = float(row.get("sulfur_ppm", 500))
                plagioclase_pct = float(row.get("plagioclase_pct", 60.0))
                pyroxene_pct = float(row.get("pyroxene_pct", 20.0))
                feo_wt_pct = float(row.get("feo_wt_pct", 6.0))
            except (ValueError, TypeError):
                continue

            site_id = row.get("analog_id") or row.get("id") or f"EAR-{idx:02d}"
            name = row.get("name") or row.get("location_name") or f"Site {idx}"
            location_name = row.get("location_name") or name
            country = row.get("country", "Unknown")
            prior_use = row.get("prior_nasa_use_status") or "DOCUMENTED_ACADEMIC_ANALOG_SITE"
            is_novel = prior_use == "NO_DOCUMENTED_PRIOR_NASA_USE_FOUND"
            status = row.get("access_status") or row.get("status") or "CLEARED"
            authority = row.get("permit_authority") or row.get("reason") or "Field research access permitted."
            data_source = row.get(
                "data_source",
                "NASA Earthdata MODIS MOD11A2 / Copernicus GLO-30 DEM / NASA EMIT L2B",
            )

            analogs.append({
                "id": site_id,
                "analog_id": site_id,
                "name": name,
                "location_name": location_name,
                "country": country,
                "lat": lat,
                "lng": lng,
                "elevation_m": round(elevation_m, 1),
                "min_temp_c": round(temp_raw, 1),
                "max_temp_c": round(max_temp, 1),
                "diurnal_delta_k": round(diurnal_delta, 1),
                "slope_deg": round(slope, 1),
                "aridity_pct": round(aridity_pct, 1),
                "sulfur_ppm": round(sulfur_ppm, 1),
                "plagioclase_pct": round(plagioclase_pct, 1),
                "pyroxene_pct": round(pyroxene_pct, 1),
                "feo_wt_pct": round(feo_wt_pct, 1),
                "prior_nasa_use_status": prior_use,
                "is_novel": is_novel,
                "access_status": status,
                "status": status,
                "permit_authority": authority,
                "reason": authority,
                "data_source": data_source,
                "provenance": data_source,
            })

    return analogs


def compute_multi_objective_match(
    query_vector: list[float], analog: dict[str, Any]
) -> tuple[float, float, float]:
    """
    Multi-objective ML matching engine across physical terrain, temperature extrema,
    and mineralogical composition.
    Returns: (match_score_pct, cosine_distance, normalized_euclidean_distance)
    """
    is_4d = len(query_vector) >= 4

    if is_4d:
        # 4D matching: [min_temp_c, slope_deg, sulfur_ppm, plagioclase_pct]
        target_temp = float(query_vector[0])
        target_slope = float(query_vector[1])
        target_sulfur = float(query_vector[2])
        target_plag = float(query_vector[3])

        analog_temp = float(analog["min_temp_c"])
        analog_slope = float(analog["slope_deg"])
        analog_sulfur = float(analog["sulfur_ppm"])
        analog_plag = float(analog["plagioclase_pct"])

        # Convert temperatures to Kelvin to enforce non-negative metric spaces
        t_k = target_temp + 273.15
        a_k = analog_temp + 273.15

        # Scaled feature vectors
        t_scaled = [t_k / 100.0, target_slope / 10.0, target_sulfur / 500.0, target_plag / 25.0]
        a_scaled = [a_k / 100.0, analog_slope / 10.0, analog_sulfur / 500.0, analog_plag / 25.0]
        weights = [0.35, 0.25, 0.20, 0.20]
        sigmas = [50.0, 8.0, 400.0, 20.0]

        # Cosine distance
        dot = sum(w * t * a for w, t, a in zip(weights, t_scaled, a_scaled))
        mag_t = math.sqrt(sum(w * (t**2) for w, t in zip(weights, t_scaled)))
        mag_a = math.sqrt(sum(w * (a**2) for w, a in zip(weights, a_scaled)))

        if mag_t * mag_a > 0:
            cos_sim = max(-1.0, min(1.0, dot / (mag_t * mag_a)))
        else:
            cos_sim = 0.0

        cosine_dist = round(max(0.0, 1.0 - cos_sim), 4)

        # Normalized Euclidean distance
        diffs = [
            (target_temp - analog_temp) / sigmas[0],
            (target_slope - analog_slope) / sigmas[1],
            (target_sulfur - analog_sulfur) / sigmas[2],
            (target_plag - analog_plag) / sigmas[3],
        ]
        norm_euclid = math.sqrt(sum(w * (d**2) for w, d in zip(weights, diffs)))
        euclid_sim = math.exp(-norm_euclid / 4.0)

        # Composite multi-objective fidelity score
        composite_score = 0.55 * cos_sim + 0.45 * euclid_sim
        match_score_pct = round(max(0.0, min(100.0, composite_score * 100.0)), 1)
        return match_score_pct, cosine_dist, round(norm_euclid, 4)

    else:
        # 2D matching fallback: [min_temp_c, slope_deg]
        target_temp = float(query_vector[0])
        target_slope = float(query_vector[1])

        analog_temp = float(analog["min_temp_c"])
        analog_slope = float(analog["slope_deg"])

        t_k = target_temp + 273.15
        a_k = analog_temp + 273.15

        t_scaled = [t_k / 100.0, target_slope / 10.0]
        a_scaled = [a_k / 100.0, analog_slope / 10.0]
        weights = [0.55, 0.45]
        sigmas = [50.0, 8.0]

        dot = sum(w * t * a for w, t, a in zip(weights, t_scaled, a_scaled))
        mag_t = math.sqrt(sum(w * (t**2) for w, t in zip(weights, t_scaled)))
        mag_a = math.sqrt(sum(w * (a**2) for w, a in zip(weights, a_scaled)))

        if mag_t * mag_a > 0:
            cos_sim = max(-1.0, min(1.0, dot / (mag_t * mag_a)))
        else:
            cos_sim = 0.0

        cosine_dist = round(max(0.0, 1.0 - cos_sim), 4)

        diffs = [
            (target_temp - analog_temp) / sigmas[0],
            (target_slope - analog_slope) / sigmas[1],
        ]
        norm_euclid = math.sqrt(sum(w * (d**2) for w, d in zip(weights, diffs)))
        euclid_sim = math.exp(-norm_euclid / 4.0)

        composite_score = 0.55 * cos_sim + 0.45 * euclid_sim
        match_score_pct = round(max(0.0, min(100.0, composite_score * 100.0)), 1)
        return match_score_pct, cosine_dist, round(norm_euclid, 4)


def get_local_analog_matches(
    query_vector: list[float],
    match_count: int | None = None,
    novelty_only: bool = False,
    country_filter: str | None = None,
    status_filter: str | None = None,
) -> list[dict[str, Any]]:
    """Compute multi-objective matches against the Earth analog database."""
    analogs = get_all_earth_analogs()
    if not analogs:
        return []

    # Optional filter: novelty_only (unvisited candidate sites with no documented prior NASA usage)
    if novelty_only:
        analogs = [
            a for a in analogs
            if a.get("prior_nasa_use_status") == "NO_DOCUMENTED_PRIOR_NASA_USE_FOUND"
        ]

    # Optional country filter
    if country_filter:
        c_low = country_filter.strip().lower()
        analogs = [a for a in analogs if c_low in a.get("country", "").lower()]

    # Optional access status filter
    if status_filter:
        s_low = status_filter.strip().lower()
        analogs = [a for a in analogs if s_low == a.get("access_status", "").lower()]

    matches: list[dict[str, Any]] = []
    for item in analogs:
        match_score_pct, cosine_dist, norm_euclid = compute_multi_objective_match(
            query_vector, item
        )

        match_record = dict(item)
        match_record["cosine_distance"] = cosine_dist
        match_record["normalized_euclidean_distance"] = norm_euclid
        match_record["match_score_pct"] = match_score_pct
        matches.append(match_record)

    # Rank by match_score_pct descending, then cosine_distance ascending
    matches.sort(key=lambda x: (-x["match_score_pct"], x["cosine_distance"]))

    # Assign rank numbers
    for rank_idx, record in enumerate(matches, 1):
        record["ranking"] = rank_idx

    if match_count and match_count > 0:
        return matches[:match_count]
    return matches


class FindAnalogView(APIView):
    """
    Multi-objective ML matching endpoint returning Earth candidate sites closest to
    the lunar target vector (terrain slope, temperature extrema, and mineralogical composition).
    Supports novelty_only filtering for undiscovered sites with no documented prior NASA use.
    """

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        return self._handle_query(request)

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        return self._handle_query(request)

    def _handle_query(self, request: Request) -> Response:
        data = getattr(request, "data", None)
        if not isinstance(data, dict):
            data = {}
        params = request.query_params

        def get_val(key: str) -> Any:
            if key in data and data[key] is not None:
                return data[key]
            if key in params and params[key] is not None:
                return params[key]
            return None

        target_id = get_val("target_id") or get_val("target")
        lunar_temp = get_val("lunar_temp_c") or get_val("temp_c") or get_val("temp")
        lunar_slope = get_val("lunar_slope_deg") or get_val("slope_deg") or get_val("slope")
        sulfur_ppm = get_val("sulfur_ppm") or get_val("lunar_sulfur_ppm")
        plagioclase_pct = get_val("plagioclase_pct") or get_val("lunar_plagioclase_pct")
        target_vector = get_val("target_vector") or get_val("vector")
        match_count = get_val("match_count") or get_val("count") or get_val("limit")

        # Novelty only filter parameter
        novelty_raw = get_val("novelty_only") or get_val("novelty")
        novelty_only = False
        if novelty_raw is not None:
            if isinstance(novelty_raw, bool):
                novelty_only = novelty_raw
            else:
                novelty_only = str(novelty_raw).strip().lower() in ("true", "1", "yes", "t")

        country_filter = get_val("country")
        status_filter = get_val("status") or get_val("access_status")

        selected_target = None
        vector = None

        if target_id:
            cleaned_id = str(target_id).strip().lower()
            selected_target = TARGETS_BY_ID.get(cleaned_id)
            if not selected_target:
                for t in ARTEMIS_TARGETS:
                    if cleaned_id in t["id"].lower() or cleaned_id in t["name"].lower():
                        selected_target = t
                        break

            if selected_target:
                vector = list(selected_target["lunar_target_vector"])

        if vector is None and target_vector is not None:
            if isinstance(target_vector, (list, tuple)):
                try:
                    vector = [float(v) for v in target_vector]
                except (ValueError, TypeError):
                    pass
            elif isinstance(target_vector, str) and "," in target_vector:
                try:
                    parts = target_vector.split(",")
                    vector = [float(p.strip()) for p in parts]
                except (ValueError, TypeError):
                    pass

        if vector is None and (lunar_temp is not None or lunar_slope is not None):
            try:
                t_val = float(lunar_temp) if lunar_temp is not None else DEFAULT_LUNAR_VECTOR[0]
                s_val = float(lunar_slope) if lunar_slope is not None else DEFAULT_LUNAR_VECTOR[1]
                if sulfur_ppm is not None or plagioclase_pct is not None:
                    su_val = float(sulfur_ppm) if sulfur_ppm is not None else DEFAULT_LUNAR_VECTOR[2]
                    pl_val = float(plagioclase_pct) if plagioclase_pct is not None else DEFAULT_LUNAR_VECTOR[3]
                    vector = [t_val, s_val, su_val, pl_val]
                else:
                    vector = [t_val, s_val]
            except (ValueError, TypeError):
                pass

        if vector is None:
            selected_target = TARGETS_BY_ID.get("moon_shackleton_rim")
            vector = list(selected_target["lunar_target_vector"]) if selected_target else list(DEFAULT_LUNAR_VECTOR)

        parsed_count = None
        if match_count is not None:
            try:
                parsed_count = int(match_count)
            except (ValueError, TypeError):
                parsed_count = None

        matches = None

        # Supabase RPC integration when credentials are active
        if os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_SERVICE_ROLE_KEY"):
            try:
                response = get_supabase_client().rpc(
                    "match_earth_analogs",
                    {
                        "query_embedding": vector,
                        "match_count": parsed_count or 30,
                    },
                ).execute()
                matches = [
                    {
                        "id": match.get("id"),
                        "analog_id": match.get("id"),
                        "name": match.get("name") or match.get("location_name"),
                        "location_name": match.get("location_name") or match.get("name"),
                        "country": match.get("country"),
                        "lat": match.get("lat"),
                        "lng": match.get("lng"),
                        "min_temp_c": match.get("min_temp_c"),
                        "slope_deg": match.get("slope_deg"),
                        "match_score_pct": round(
                            max(0.0, min(100.0, (1.0 - float(match.get("cosine_distance", 0))) * 100)),
                            1,
                        ),
                        "cosine_distance": match.get("cosine_distance"),
                        "sulfur_ppm": match.get("sulfur_ppm", 500.0),
                        "status": match.get("status", "CLEARED"),
                        "access_status": match.get("status", "CLEARED"),
                        "reason": match.get("reason", "Field access cleared."),
                        "permit_authority": match.get("reason", "Field access cleared."),
                        "prior_nasa_use_status": match.get(
                            "prior_nasa_use_status", "DOCUMENTED_ACADEMIC_ANALOG_SITE"
                        ),
                        "is_novel": match.get("prior_nasa_use_status") == "NO_DOCUMENTED_PRIOR_NASA_USE_FOUND",
                    }
                    for match in response.data
                ]
                if novelty_only:
                    matches = [m for m in matches if m.get("is_novel")]
            except (APIError, OSError, RuntimeError, ValueError):
                matches = None

        if matches is None:
            try:
                matches = get_local_analog_matches(
                    vector,
                    match_count=parsed_count,
                    novelty_only=novelty_only,
                    country_filter=country_filter,
                    status_filter=status_filter,
                )
            except Exception as exc:
                return Response(
                    {"error": f"Could not query Earth analogs: {exc}"},
                    status=HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response(
            {
                "target_id": selected_target["id"] if selected_target else None,
                "target_name": selected_target["name"] if selected_target else None,
                "lunar_target_vector": vector,
                "novelty_only": novelty_only,
                "matches": matches,
                "count": len(matches),
            }
        )


find_analog = FindAnalogView.as_view()


class TargetsView(APIView):
    """Return the verified Artemis IV lunar targets with multi-parameter vectors."""

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        target_id = request.query_params.get("id") or request.query_params.get("target_id")
        if target_id:
            cleaned_id = str(target_id).strip().lower()
            target = TARGETS_BY_ID.get(cleaned_id)
            if not target:
                for t in ARTEMIS_TARGETS:
                    if cleaned_id in t["id"].lower() or cleaned_id in t["name"].lower():
                        target = t
                        break
            if not target:
                return Response({"error": f"Target '{target_id}' not found."}, status=404)
            return Response({"target": target})

        return Response(
            {
                "targets": ARTEMIS_TARGETS,
                "count": len(ARTEMIS_TARGETS),
            }
        )


targets = TargetsView.as_view()


class AnalogsView(APIView):
    """Return the full list of verified Earth analog sites from earth_analogs.csv."""

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        analogs_list = get_all_earth_analogs()

        country = request.query_params.get("country")
        status = request.query_params.get("status") or request.query_params.get("access_status")
        novelty_raw = request.query_params.get("novelty_only") or request.query_params.get("novelty")
        prior_status = request.query_params.get("prior_nasa_use_status")

        if country:
            c_low = country.strip().lower()
            analogs_list = [
                a for a in analogs_list if c_low in a.get("country", "").lower()
            ]
        if status:
            s_low = status.strip().lower()
            analogs_list = [
                a for a in analogs_list if s_low == a.get("access_status", "").lower()
            ]
        if prior_status:
            p_low = prior_status.strip().lower()
            analogs_list = [
                a for a in analogs_list if p_low == a.get("prior_nasa_use_status", "").lower()
            ]
        if novelty_raw is not None:
            if str(novelty_raw).strip().lower() in ("true", "1", "yes", "t"):
                analogs_list = [
                    a for a in analogs_list
                    if a.get("prior_nasa_use_status") == "NO_DOCUMENTED_PRIOR_NASA_USE_FOUND"
                ]

        return Response(
            {
                "analogs": analogs_list,
                "count": len(analogs_list),
            }
        )


analogs = AnalogsView.as_view()


class SimulateWearView(APIView):
    """Predict sulfur-corrosion degradation for the Virtual Lab."""

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        try:
            sulfur_ppm = float(request.data["sulfur_ppm"])
            exposure_days = float(request.data["exposure_days"])
        except (KeyError, TypeError, ValueError):
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
