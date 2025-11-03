"""Tests for the private WebSocket request helpers."""

from __future__ import annotations

import hmac
import hashlib
import json

import pytest

from core.trading.private_ws import (
    build_order_place_request,
    build_request_frame,
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


def test_build_order_place_request_normalises_and_validates_params() -> None:
    frame = build_order_place_request(
        symbol="BTCUSDT",
        side="buy",
        order_type="market",
        quantity="0.5",
        api_key="key",
        api_secret="secret",
        request_id="abc",
        timestamp_ms=999,
    )

    assert frame["id"] == "abc"
    assert frame["method"] == "order.place"
    assert frame["params"]["side"] == "BUY"
    assert frame["params"]["type"] == "MARKET"
    assert frame["params"]["quantity"] == "0.5"


def test_build_order_place_request_requires_limit_fields() -> None:
    with pytest.raises(ValueError, match="LIMIT order requires parameters"):
        build_order_place_request(
            symbol="ETHUSDT",
            side="BUY",
            order_type="LIMIT",
            price="1000",
            api_key="key",
            api_secret="secret",
        )


def test_build_order_place_request_requires_stop_conditions() -> None:
    with pytest.raises(ValueError, match="STOP_LOSS order requires at least one"):
        build_order_place_request(
            symbol="BNBUSDT",
            side="SELL",
            order_type="STOP_LOSS",
            quantity="1",
            api_key="key",
            api_secret="secret",
        )


def test_build_order_place_request_allows_stop_loss_limit_with_stop_price() -> None:
    frame = build_order_place_request(
        symbol="BNBUSDT",
        side="SELL",
        order_type="STOP_LOSS_LIMIT",
        quantity="1",
        price="300",
        timeInForce="GTC",
        stopPrice="295",
        api_key="key",
        api_secret="secret",
        timestamp_ms=1,
    )

    assert frame["params"]["stopPrice"] == "295"
    assert frame["params"]["timeInForce"] == "GTC"


def test_build_order_place_request_requires_quantity_for_market_orders() -> None:
    with pytest.raises(ValueError, match="MARKET order requires at least one"):
        build_order_place_request(
            symbol="BTCUSDT",
            side="BUY",
            order_type="MARKET",
            api_key="key",
            api_secret="secret",
        )

