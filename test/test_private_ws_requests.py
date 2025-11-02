"""Tests for the private WebSocket request helpers."""

from __future__ import annotations

import hmac
import hashlib
import json

from core.trading.private_ws import build_request_frame, sign_params


def _manual_signature(params: dict[str, object], secret: str) -> str:
    canonical = "&".join(f"{k}={params[k]}" for k in sorted(params))
    return hmac.new(secret.encode(), canonical.encode(), hashlib.sha256).hexdigest()


def test_sign_params_matches_manual_hmac() -> None:
    params = {
        "symbol": "BTCUSDT",
        "side": "BUY",
        "type": "LIMIT",
        "price": "0.1",
        "quantity": "10",
        "timeInForce": "GTC",
        "timestamp": 1655716096498,
    }
    secret = "super-secret"
    expected = _manual_signature(params, secret)
    assert sign_params(params, secret) == expected


def test_build_request_frame_returns_json_when_requested() -> None:
    params = {"symbol": "ETHUSDT", "side": "SELL", "type": "MARKET"}
    frame_text = build_request_frame(
        "order.place",
        params,
        api_key="api-key",
        api_secret="secret",
        request_id="42",
        timestamp_ms=1234567890000,
        as_text=True,
    )

    decoded = json.loads(frame_text)
    assert decoded["id"] == "42"
    assert decoded["method"] == "order.place"
    assert decoded["apiKey"] == "api-key"
    assert decoded["params"]["timestamp"] == 1234567890000
    # The helper should not mutate the original mapping.
    assert "timestamp" not in params

