import os

from supabase import Client, create_client


def get_supabase_client() -> Client:
    """Create a Supabase client using server-side environment credentials."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured."
        )
    return create_client(url, key)
