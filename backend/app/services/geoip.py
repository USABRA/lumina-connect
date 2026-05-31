from __future__ import annotations

from typing import Optional, Tuple

import httpx

LOCAL_IPS = {"127.0.0.1", "::1", "localhost", "unknown"}


def lookup_geo(ip: str) -> Tuple[Optional[str], Optional[str]]:
    if ip in LOCAL_IPS or ip.startswith("192.168.") or ip.startswith("10."):
        return "Local", "DEV"

    try:
        response = httpx.get(
            f"http://ip-api.com/json/{ip}",
            params={"fields": "status,city,countryCode"},
            timeout=2.0,
        )
        response.raise_for_status()
        data = response.json()
        if data.get("status") != "success":
            return None, None
        return data.get("city"), data.get("countryCode")
    except Exception:
        return None, None
