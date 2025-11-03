"""Tests for the private WebSocket request helpers."""

from __future__ import annotations

import hashlib
import json
import hmac

import pytest

from core.trading.private_ws import (
    build_public_request,
    build_request_frame,
    exchange_info_request,
    ping_request,
    server_time_request,
    sign_params,
)


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


def test_build_public_request_returns_json_when_requested() -> None:
    frame_text = build_public_request(
        "time",
        {"returnRateLimits": False},
        request_id="abc",
        as_text=True,
    )

    decoded = json.loads(frame_text)
    assert decoded == {
        "id": "abc",
        "method": "time",
        "params": {"returnRateLimits": False},
    }


def test_ping_and_time_helpers_apply_rate_limit_flag() -> None:
    ping = ping_request(return_rate_limits=False, request_id=1)
    server_time = server_time_request(return_rate_limits=True, request_id=2)

    assert ping == {
        "id": 1,
        "method": "ping",
        "params": {"returnRateLimits": False},
    }
    assert server_time == {
        "id": 2,
        "method": "time",
        "params": {"returnRateLimits": True},
    }


def test_exchange_info_request_with_symbols_and_options() -> None:
    frame = exchange_info_request(
        symbols=["BNBBTC"],
        show_permission_sets=False,
        return_rate_limits=False,
        request_id="ex-1",
    )

    assert frame == {
        "id": "ex-1",
        "method": "exchangeInfo",
        "params": {
            "symbols": ["BNBBTC"],
            "showPermissionSets": False,
            "returnRateLimits": False,
        },
    }


def test_exchange_info_request_rejects_conflicting_filters() -> None:
    with pytest.raises(ValueError):
        exchange_info_request(symbol="BNBBTC", symbols=["ETHBTC"])


def test_exchange_info_request_validates_status() -> None:
    with pytest.raises(ValueError):
        exchange_info_request(symbol_status="INVALID")

    # Valid status should pass without raising.
    assert exchange_info_request(symbol_status="HALT")["params"]["symbolStatus"] == "HALT"

