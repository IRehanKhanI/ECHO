from __future__ import annotations

import os
from typing import Any

try:
    from supabase import Client, create_client
except ImportError:
    Client = Any  # type: ignore
    create_client = None


def get_supabase_client() -> Any:
    """Create a Supabase client using server-side environment credentials."""
    if create_client is None:
        raise RuntimeError("The 'supabase' package is not installed.")
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured."
        )
    return create_client(url, key)

