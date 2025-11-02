"""Utilities for building signed private WebSocket requests.

The Binance private WebSocket API (and other exchange JSON-RPC endpoints)
expect each request frame to carry an ``id``, a method name, a ``params``
object, the API key, and an HMAC signature computed over the parameters.

This module provides a small helper that normalises the request parameters,
computes the signature deterministically, and optionally returns the payload
as a JSON encoded string ready to be sent as a text frame.

The implementation is intentionally dependency free so it can be imported
from both production code and tests without pulling in third‑party modules.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import time
import uuid
from typing import Any, Mapping, MutableMapping


def _stringify(value: Any) -> str:
    """Convert ``value`` to a string suitable for signature generation."""

    if isinstance(value, bool):
        return "true" if value else "false"
    if value is None:
        raise ValueError("Cannot sign parameters containing null values")
    if isinstance(value, (int, float)):
        # Normalise integers/floats to remove locale specific formatting.
        return ("%f" % value).rstrip("0").rstrip(".") if isinstance(value, float) else str(value)
    return str(value)


def _canonical_query(params: Mapping[str, Any]) -> str:
    """Return the canonical ``key=value`` string used for signing.

    The API specification notes that parameter order is not significant, so we
    sort keys lexicographically to guarantee a deterministic signature.
    """

    if not isinstance(params, Mapping):  # pragma: no cover - defensive guard
        raise TypeError("params must be a mapping")

    items = []
    for key in sorted(params):
        value = params[key]
        items.append(f"{key}={_stringify(value)}")
    return "&".join(items)


def sign_params(params: Mapping[str, Any], secret: str) -> str:
    """Return the HMAC SHA-256 signature for ``params`` using ``secret``."""

    if not secret:
        raise ValueError("API secret is required to sign WebSocket requests")
    canonical = _canonical_query(params)
    signature = hmac.new(secret.encode("utf-8"), canonical.encode("utf-8"), hashlib.sha256)
    return signature.hexdigest()


def build_request_frame(
    method: str,
    params: Mapping[str, Any] | None,
    *,
    api_key: str,
    api_secret: str,
    request_id: str | int | None = None,
    timestamp_ms: int | None = None,
    as_text: bool = False,
) -> dict[str, Any] | str:
    """Construct a signed WebSocket request frame.

    Parameters
    ----------
    method:
        API method name, e.g. ``"order.place"`` or ``"v3/order.place"``.
    params:
        Mapping with the method parameters. A shallow copy is taken so the
        original mapping remains untouched.
    api_key / api_secret:
        Credentials used to authenticate the request.
    request_id:
        Optional identifier echoed back by the server. A UUID4 string is used
        when omitted.
    timestamp_ms:
        Optional timestamp override. When omitted, the current time is used.
    as_text:
        When ``True`` the frame is returned as a JSON encoded string ready to
        send over a text WebSocket frame. Otherwise the Python ``dict`` is
        returned.
    """

    if not api_key:
        raise ValueError("API key is required for private WebSocket requests")
    if params is None:
        params = {}
    if not isinstance(params, Mapping):
        raise TypeError("params must be a mapping or None")

    payload: MutableMapping[str, Any] = dict(params)
    if timestamp_ms is None:
        timestamp_ms = int(time.time() * 1000)
    payload.setdefault("timestamp", timestamp_ms)

    frame = {
        "id": request_id if request_id is not None else str(uuid.uuid4()),
        "method": method,
        "params": dict(payload),
        "apiKey": api_key,
        "signature": sign_params(payload, api_secret),
    }

    if as_text:
        return json.dumps(frame, separators=(",", ":"))
    return frame


__all__ = ["build_request_frame", "sign_params"]

