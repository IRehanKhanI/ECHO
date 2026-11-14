from __future__ import annotations

from typing import Any

from postgrest.exceptions import APIError
from rest_framework.response import Response
from rest_framework.status import HTTP_500_INTERNAL_SERVER_ERROR
from rest_framework.views import APIView

from api.supabase import get_supabase_client


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

        return Response(
            {
                "lunar_target_vector": LUNAR_TARGET_VECTOR,
                "matches": response.data,
            }
        )


find_analog = FindAnalogView.as_view()
