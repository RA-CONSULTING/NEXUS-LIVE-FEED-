"""Nexus field layer: the latest public planetary K-index.

This module reads one NOAA space-weather product. It does not simulate
coherence, and it does not authorize an action.
"""

from __future__ import annotations

import hashlib
import json
import re
import urllib.request
from datetime import datetime, timezone
from typing import Callable
from urllib.parse import urlparse

SOURCE = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json"
_HOST = "services.swpc.noaa.gov"
_TIME = r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$"


def _default_transport(url: str) -> bytes:
    if url != SOURCE or urlparse(url).hostname != _HOST:
        raise ValueError("public_field_source_rejected")
    request = urllib.request.Request(
        url,
        headers={"Accept": "application/json", "User-Agent": "nexus-public-field/1"},
    )
    with urllib.request.urlopen(request, timeout=8) as response:
        if response.status != 200:
            raise ValueError("public_field_status_rejected")
        body = response.read(1_000_000)
    if len(body) >= 1_000_000:
        raise ValueError("public_field_body_rejected")
    return body


def observe_planetary_k_index(transport: Callable[[str], bytes] | None = None) -> dict:
    """Return the newest measured Kp row, with the raw payload hash."""

    raw = (transport or _default_transport)(SOURCE)
    if not isinstance(raw, bytes) or not raw:
        raise ValueError("public_field_body_required")
    payload = json.loads(raw)
    if not isinstance(payload, list) or len(payload) < 2:
        raise ValueError("public_field_rows_required")
    latest = payload[-1]
    if not isinstance(latest, dict):
        raise ValueError("public_field_row_required")
    time_tag = latest.get("time_tag")
    kp = latest.get("Kp")
    running = latest.get("a_running")
    stations = latest.get("station_count")
    if not isinstance(time_tag, str) or re.fullmatch(_TIME, time_tag) is None:
        raise ValueError("public_field_time_required")
    if isinstance(kp, bool) or not isinstance(kp, (int, float)) or not 0 <= float(kp) <= 9:
        raise ValueError("public_field_kp_required")
    if isinstance(running, bool) or not isinstance(running, int) or running < 0:
        raise ValueError("public_field_a_running_required")
    if isinstance(stations, bool) or not isinstance(stations, int) or not 1 <= stations <= 20:
        raise ValueError("public_field_station_count_required")
    return {
        "schema": "nexus.public-field.v1",
        "source": SOURCE,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "time_tag": time_tag,
        "kp": float(kp),
        "a_running": running,
        "station_count": stations,
        "payload_sha256": hashlib.sha256(raw).hexdigest(),
        "generated_values": False,
        "may_act": False,
    }
