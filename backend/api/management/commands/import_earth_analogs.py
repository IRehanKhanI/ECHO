"""Import Earth analog locations from a CSV file into Supabase."""

from __future__ import annotations

import csv
from pathlib import Path
from typing import Any

from django.core.management.base import BaseCommand, CommandError
from postgrest.exceptions import APIError

from api.supabase import get_supabase_client


REQUIRED_COLUMNS = {
    "location_name",
    "country",
    "lat",
    "lng",
    "min_temp_c",
    "slope_deg",
}
BATCH_SIZE = 500


def _read_rows(csv_path: Path) -> list[dict[str, Any]]:
    try:
        with csv_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
            reader = csv.DictReader(csv_file)
            columns = set(reader.fieldnames or [])
            missing = REQUIRED_COLUMNS - columns
            if missing:
                raise CommandError(
                    f"CSV is missing required columns: {', '.join(sorted(missing))}"
                )

            rows = []
            for line_number, row in enumerate(reader, start=2):
                try:
                    min_temp_c = float(row["min_temp_c"])
                    slope_deg = float(row["slope_deg"])
                    lat = float(row["lat"])
                    lng = float(row["lng"])
                except (TypeError, ValueError) as exc:
                    raise CommandError(
                        f"Invalid numeric value on CSV line {line_number}."
                    ) from exc

                rows.append(
                    {
                        "location_name": row["location_name"].strip(),
                        "country": row["country"].strip(),
                        "lat": lat,
                        "lng": lng,
                        "min_temp_c": min_temp_c,
                        "slope_deg": slope_deg,
                        "feature_vector": [min_temp_c, slope_deg],
                    }
                )
    except FileNotFoundError as exc:
        raise CommandError(f"CSV file not found: {csv_path}") from exc
    except OSError as exc:
        raise CommandError(f"Could not read CSV file {csv_path}: {exc}") from exc

    if not rows:
        raise CommandError("CSV file contains no data rows.")
    return rows


class Command(BaseCommand):
    help = "Upload Earth analog CSV rows to Supabase."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument(
            "csv_path",
            nargs="?",
            default="earth_analogs.csv",
            help="Path to the Earth analog CSV file.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        rows = _read_rows(Path(options["csv_path"]))
        try:
            client = get_supabase_client()
            for start in range(0, len(rows), BATCH_SIZE):
                client.table("earth_analogs").upsert(
                    rows[start : start + BATCH_SIZE],
                    on_conflict="location_name,country",
                ).execute()
        except (APIError, OSError, RuntimeError, ValueError) as exc:
            raise CommandError(f"Supabase import failed: {exc}") from exc

        self.stdout.write(
            self.style.SUCCESS(f"Uploaded {len(rows)} Earth analog rows.")
        )
