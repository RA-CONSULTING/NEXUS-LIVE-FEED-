"""QGITA Autonomous Binance trading bot.

This module implements a minimal-but-complete version of the architecture
outlined in the repository docs for driving a Binance spot trading strategy.
The bot listens to kline data over a WebSocket feed, detects
Fibonacci-Tightened Curvature Points (FTCPs), validates them with a simplified
Lighthouse consensus routine, and places trades when the consensus passes a
configurable threshold.

The default configuration keeps the bot in paper-trading mode so it can be
safely experimented with. Live trading can be enabled via the command line or
environment variables after carefully reviewing the risk controls.
"""
from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import logging
import os
import signal
import sys
import time
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Deque, Dict, Iterable, List, Optional

import numpy as np
import requests

try:  # pragma: no cover - optional dependency for live streaming
    import websocket
except ImportError:  # pragma: no cover - websocket support is optional
    websocket = None  # type: ignore


LOGGER = logging.getLogger("qgita.bot")

DEFAULT_WS_URL = "wss://stream.binance.com:9443/ws"
DEFAULT_REST_URL = "https://api.binance.com"


def _timestamp_ms() -> int:
    """Return the current timestamp in milliseconds."""

    return int(time.time() * 1000)


def _hmac_signature(secret: str, params: Dict[str, str]) -> str:
    """Return the Binance-compatible HMAC SHA256 signature."""

    message = "&".join(f"{key}={value}" for key, value in params.items())
    return hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()


@dataclass
class TradingConfig:
    """Runtime configuration for the trading bot."""

    api_key: str = ""
    api_secret: str = ""
    symbol: str = "BTCUSDT"
    base_url: str = DEFAULT_REST_URL
    ws_url: str = DEFAULT_WS_URL
    position_size_usdt: float = 100.0
    max_position_size_usdt: float = 500.0
    stop_loss_percent: float = 2.0
    take_profit_percent: float = 4.0
    window_size: int = 144
    curvature_threshold: float = 0.75
    lighthouse_threshold: float = 0.7
    max_daily_loss_usdt: float = 200.0
    max_trades_per_day: int = 10
    paper_trading: bool = True
    price_precision: int = 2
    quantity_precision: int = 6
    momentum_window: int = 20
    volatility_window: int = 20

    @classmethod
    def from_env(cls) -> "TradingConfig":
        """Create a configuration instance using environment variables."""

        def _bool(value: Optional[str], default: bool) -> bool:
            if value is None:
                return default
            lowered = value.lower()
            if lowered in {"1", "true", "yes", "on"}:
                return True
            if lowered in {"0", "false", "no", "off"}:
                return False
            return default

        return cls(
            api_key=os.getenv("BINANCE_API_KEY", ""),
            api_secret=os.getenv("BINANCE_API_SECRET", ""),
            symbol=os.getenv("QGITA_SYMBOL", "BTCUSDT").upper(),
            base_url=os.getenv("QGITA_BINANCE_URL", DEFAULT_REST_URL),
            ws_url=os.getenv("QGITA_BINANCE_WS", DEFAULT_WS_URL),
            position_size_usdt=float(os.getenv("QGITA_POSITION_SIZE", "100")),
            max_position_size_usdt=float(
                os.getenv("QGITA_MAX_POSITION_SIZE", "500")
            ),
            stop_loss_percent=float(os.getenv("QGITA_STOP_LOSS", "2")),
            take_profit_percent=float(os.getenv("QGITA_TAKE_PROFIT", "4")),
            window_size=int(os.getenv("QGITA_WINDOW_SIZE", "144")),
            curvature_threshold=float(
                os.getenv("QGITA_CURVATURE_THRESHOLD", "0.75")
            ),
            lighthouse_threshold=float(
                os.getenv("QGITA_LIGHTHOUSE_THRESHOLD", "0.7")
            ),
            max_daily_loss_usdt=float(os.getenv("QGITA_MAX_DAILY_LOSS", "200")),
            max_trades_per_day=int(os.getenv("QGITA_MAX_TRADES", "10")),
            paper_trading=_bool(os.getenv("QGITA_PAPER_TRADING"), True),
            price_precision=int(os.getenv("QGITA_PRICE_PRECISION", "2")),
            quantity_precision=int(os.getenv("QGITA_QUANTITY_PRECISION", "6")),
            momentum_window=int(os.getenv("QGITA_MOMENTUM_WINDOW", "20")),
            volatility_window=int(os.getenv("QGITA_VOLATILITY_WINDOW", "20")),
        )


class BinanceRESTClient:
    """Lightweight REST client for interacting with Binance."""

    def __init__(self, config: TradingConfig):
        self.config = config

    def _headers(self) -> Dict[str, str]:
        return {"X-MBX-APIKEY": self.config.api_key}

    def _signed_request(self, method: str, path: str, params: Dict[str, str]) -> dict:
        if not self.config.api_secret:
            raise RuntimeError("API secret is required for signed requests")

        params = dict(params)
        params["timestamp"] = str(_timestamp_ms())
        params["signature"] = _hmac_signature(self.config.api_secret, params)

        response = requests.request(
            method,
            f"{self.config.base_url}{path}",
            params=params,
            headers=self._headers(),
            timeout=10,
        )
        response.raise_for_status()
        return response.json()

    def get_account(self) -> dict:
        """Return account information (signed endpoint)."""

        return self._signed_request("GET", "/api/v3/account", {})

    def get_price(self, symbol: Optional[str] = None) -> float:
        """Return the latest spot price for ``symbol``."""

        symbol = symbol or self.config.symbol
        response = requests.get(
            f"{self.config.base_url}/api/v3/ticker/price",
            params={"symbol": symbol},
            timeout=10,
        )
        response.raise_for_status()
        payload = response.json()
        return float(payload["price"])

    def place_order(
        self,
        *,
        symbol: Optional[str] = None,
        side: str,
        quantity: float,
        order_type: str = "MARKET",
    ) -> dict:
        """Place a live order. Paper mode is handled elsewhere."""

        symbol = symbol or self.config.symbol
        params = {
            "symbol": symbol,
            "side": side,
            "type": order_type,
            "quantity": f"{quantity:.{self.config.quantity_precision}f}",
        }
        return self._signed_request("POST", "/api/v3/order", params)


class PaperExchange:
    """Simple in-memory ledger that emulates fills for testing."""

    def __init__(self, config: TradingConfig):
        self.config = config
        self.fills: List[dict] = []

    def place_order(
        self, *, symbol: Optional[str] = None, side: str, quantity: float, price: float
    ) -> dict:
        symbol = symbol or self.config.symbol
        fill = {
            "symbol": symbol,
            "side": side,
            "quantity": round(quantity, self.config.quantity_precision),
            "price": round(price, self.config.price_precision),
            "timestamp": _timestamp_ms(),
            "orderId": f"PAPER_{len(self.fills) + 1}",
            "status": "FILLED",
        }
        self.fills.append(fill)
        LOGGER.info(
            "📝 PAPER TRADE – %s %s %s @ %s",
            side,
            fill["quantity"],
            symbol,
            fill["price"],
        )
        return fill


class QGITADetector:
    """Detect FTCPs and derive Lighthouse consensus signals."""

    def __init__(self, config: TradingConfig):
        self.config = config
        self.price_buffer: Deque[float] = deque(maxlen=config.window_size)
        self.time_buffer: Deque[float] = deque(maxlen=config.window_size)
        self._fibonacci_lattice = self._build_fib_lattice()

    def _build_fib_lattice(self) -> List[int]:
        lattice = [1, 1]
        while lattice[-1] < self.config.window_size:
            lattice.append(lattice[-1] + lattice[-2])
        return [value for value in lattice if value < self.config.window_size]

    def add_price(self, price: float, timestamp: float) -> None:
        self.price_buffer.append(price)
        self.time_buffer.append(timestamp)

    def _curvature(self, prices: np.ndarray) -> np.ndarray:
        if prices.size < 3:
            return np.zeros_like(prices)
        dx = np.gradient(prices)
        ddx = np.gradient(dx)
        denominator = np.power(1 + np.square(dx), 1.5)
        denominator[denominator == 0] = np.finfo(float).eps
        return np.abs(ddx) / denominator

    def detect_ftcps(self) -> List[dict]:
        if len(self.price_buffer) < self.config.window_size:
            return []

        prices = np.asarray(self.price_buffer, dtype=float)
        curvature = self._curvature(prices)
        if not np.any(curvature):
            return []

        threshold = np.percentile(
            curvature, self.config.curvature_threshold * 100.0
        )
        ftcps: List[dict] = []
        for fib_idx in self._fibonacci_lattice:
            if fib_idx >= curvature.size:
                continue
            if curvature[fib_idx] <= threshold:
                continue
            ftcps.append(
                {
                    "index": fib_idx,
                    "curvature": float(curvature[fib_idx]),
                    "price": float(prices[fib_idx]),
                    "timestamp": float(self.time_buffer[fib_idx]),
                }
            )
        return ftcps

    def lighthouse_consensus(self, ftcps: Iterable[dict]) -> Optional[dict]:
        ftcps = list(ftcps)
        if not ftcps:
            return None

        prices = np.asarray(self.price_buffer, dtype=float)
        curvature = self._curvature(prices)
        latest = ftcps[-1]
        curvature_strength = float(latest["curvature"] / (np.max(curvature) or 1.0))

        momentum_window = min(self.config.momentum_window, len(prices) - 1)
        if momentum_window < 2:
            return None
        momentum = (prices[-1] - prices[-momentum_window]) / prices[-momentum_window]
        momentum_score = min(abs(momentum) * 10.0, 1.0)

        vol_window = min(self.config.volatility_window, len(prices))
        if vol_window < 3:
            return None
        window_slice = prices[-vol_window:]
        volatility = float(np.std(window_slice))
        mean_price = float(np.mean(window_slice)) or 1.0
        volatility_score = min(volatility / mean_price * 100.0, 1.0)

        consensus = (curvature_strength + momentum_score + volatility_score) / 3.0
        if consensus < self.config.lighthouse_threshold:
            return None

        signal_side = "BUY" if momentum >= 0 else "SELL"
        return {
            "signal": signal_side,
            "consensus": float(consensus),
            "price": float(prices[-1]),
            "timestamp": float(self.time_buffer[-1]),
        }


class Position:
    """Container tracking an open position."""

    def __init__(self, *, side: str, entry_price: float, quantity: float, config: TradingConfig):
        self.side = side
        self.entry_price = entry_price
        self.quantity = quantity
        self.stop_loss = (
            entry_price * (1 - config.stop_loss_percent / 100.0)
            if side == "LONG"
            else entry_price * (1 + config.stop_loss_percent / 100.0)
        )
        self.take_profit = (
            entry_price * (1 + config.take_profit_percent / 100.0)
            if side == "LONG"
            else entry_price * (1 - config.take_profit_percent / 100.0)
        )


class QGITATradingBot:
    """Trading bot that wraps the detector and exchange interface."""

    def __init__(self, config: TradingConfig):
        self.config = config
        self.detector = QGITADetector(config)
        self.rest_client = BinanceRESTClient(config)
        self.paper_exchange = PaperExchange(config) if config.paper_trading else None
        self.position: Optional[Position] = None
        self.daily_pnl = 0.0
        self.daily_trades = 0
        self.last_reset = datetime.now(timezone.utc).date()

    # ------------------------------------------------------------------
    # Risk management helpers
    # ------------------------------------------------------------------
    def _reset_daily_stats_if_needed(self) -> None:
        today = datetime.now(timezone.utc).date()
        if today != self.last_reset:
            LOGGER.info("📅 Daily stats reset for %s", today)
            self.daily_pnl = 0.0
            self.daily_trades = 0
            self.last_reset = today

    def _check_risk_limits(self) -> bool:
        self._reset_daily_stats_if_needed()
        if abs(self.daily_pnl) >= self.config.max_daily_loss_usdt:
            LOGGER.warning("🛑 Daily loss limit reached: %.2f", self.daily_pnl)
            return False
        if self.daily_trades >= self.config.max_trades_per_day:
            LOGGER.warning("🛑 Daily trade limit reached: %s", self.daily_trades)
            return False
        return True

    # ------------------------------------------------------------------
    # Exchange helpers
    # ------------------------------------------------------------------
    def _place_order(self, side: str, quantity: float, price: float) -> dict:
        if self.config.paper_trading:
            assert self.paper_exchange is not None
            return self.paper_exchange.place_order(
                side=side, quantity=quantity, price=price
            )
        return self.rest_client.place_order(side=side, quantity=quantity)

    def _current_price(self) -> float:
        return self.rest_client.get_price(self.config.symbol)

    # ------------------------------------------------------------------
    # Position management
    # ------------------------------------------------------------------
    def _position_value(self, price: float) -> float:
        if not self.position:
            return 0.0
        return price * self.position.quantity

    def _within_exposure_limits(self, price: float, quantity: float) -> bool:
        exposure = price * quantity
        if exposure > self.config.max_position_size_usdt:
            LOGGER.warning(
                "Exposure %.2f exceeds max %.2f", exposure, self.config.max_position_size_usdt
            )
            return False
        return True

    def _compute_quantity(self, price: float) -> float:
        quantity = self.config.position_size_usdt / price
        precision = self.config.quantity_precision
        return round(quantity, precision)

    def _record_trade(self, pnl: float) -> None:
        self.daily_pnl += pnl
        self.daily_trades += 1

    def _close_position(self, price: float) -> None:
        if not self.position:
            return
        exit_side = "SELL" if self.position.side == "LONG" else "BUY"
        self._place_order(exit_side, self.position.quantity, price)
        if self.position.side == "LONG":
            pnl = (price - self.position.entry_price) * self.position.quantity
        else:
            pnl = (self.position.entry_price - price) * self.position.quantity
        LOGGER.info(
            "🔒 Position closed: %s @ %.2f | PnL: %.2f",
            self.position.side,
            price,
            pnl,
        )
        self._record_trade(pnl)
        self.position = None

    def _open_position(self, signal: dict, price: float) -> None:
        quantity = self._compute_quantity(price)
        if not self._within_exposure_limits(price, quantity):
            return

        side = "BUY" if signal["signal"] == "BUY" else "SELL"
        self._place_order(side, quantity, price)

        side_label = "LONG" if side == "BUY" else "SHORT"
        self.position = Position(
            side=side_label, entry_price=price, quantity=quantity, config=self.config
        )
        LOGGER.info(
            "✅ %s opened: %s @ %.2f (consensus=%.2f)",
            side_label,
            quantity,
            price,
            signal["consensus"],
        )
        self.daily_trades += 1

    def _handle_stop_levels(self, price: float) -> None:
        if not self.position:
            return
        if self.position.side == "LONG":
            if price <= self.position.stop_loss:
                LOGGER.info("🛑 Stop loss triggered")
                self._close_position(price)
            elif price >= self.position.take_profit:
                LOGGER.info("🎯 Take profit hit")
                self._close_position(price)
        else:
            if price >= self.position.stop_loss:
                LOGGER.info("🛑 Stop loss triggered")
                self._close_position(price)
            elif price <= self.position.take_profit:
                LOGGER.info("🎯 Take profit hit")
                self._close_position(price)

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------
    def on_price(self, price: float, timestamp: float) -> None:
        self.detector.add_price(price, timestamp)
        self._handle_stop_levels(price)

        ftcps = self.detector.detect_ftcps()
        if not ftcps:
            return
        signal = self.detector.lighthouse_consensus(ftcps)
        if not signal:
            return

        if not self._check_risk_limits():
            return

        if self.position and self.position.side == "LONG" and signal["signal"] == "SELL":
            self._close_position(price)
        elif self.position and self.position.side == "SHORT" and signal["signal"] == "BUY":
            self._close_position(price)

        if not self.position:
            self._open_position(signal, price)

    def account_report(self) -> Optional[dict]:
        if self.config.paper_trading:
            LOGGER.info("Paper trading mode – account report not available")
            return None
        report = self.rest_client.get_account()
        balances = [
            f"{balance['asset']}:{balance['free']}"
            for balance in report.get("balances", [])
            if float(balance.get("free", 0)) > 0
        ]
        LOGGER.info(
            "Account type=%s | canTrade=%s | balances=%s",
            report.get("accountType"),
            report.get("canTrade"),
            ", ".join(balances),
        )
        return report


class WebSocketRunner:
    """Wrapper around the Binance WebSocket stream."""

    def __init__(self, bot: QGITATradingBot):
        if websocket is None:  # pragma: no cover - runtime guard
            raise RuntimeError(
                "websocket-client is required for live streaming. Install it via "
                "`pip install websocket-client`."
            )
        self.bot = bot
        stream_symbol = bot.config.symbol.lower()
        self.url = f"{bot.config.ws_url}/{stream_symbol}@kline_1m"
        self._ws: Optional[websocket.WebSocketApp] = None

    def _on_open(self, ws: websocket.WebSocketApp) -> None:
        LOGGER.info("🔌 WebSocket connected: %s", self.url)

    def _on_close(self, ws: websocket.WebSocketApp, status_code: int, msg: str) -> None:
        LOGGER.warning("🔌 WebSocket closed (%s): %s", status_code, msg)

    def _on_error(self, ws: websocket.WebSocketApp, error: Exception) -> None:
        LOGGER.error("WebSocket error: %s", error)

    def _on_message(self, ws: websocket.WebSocketApp, message: str) -> None:
        payload = json.loads(message)
        kline = payload.get("k")
        if not kline:
            return
        if kline.get("x"):
            close_price = float(kline["c"])
            close_time = float(kline["T"]) / 1000.0
            self.bot.on_price(close_price, close_time)

    def start(self) -> None:
        self._ws = websocket.WebSocketApp(
            self.url,
            on_open=self._on_open,
            on_close=self._on_close,
            on_error=self._on_error,
            on_message=self._on_message,
        )
        LOGGER.info("Starting price stream for %s", self.bot.config.symbol)
        self._ws.run_forever(ping_interval=20, ping_timeout=10)


def configure_logging(verbose: bool) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the QGITA trading bot")
    parser.add_argument("--symbol", default=None, help="Trading pair, e.g., BTCUSDT")
    parser.add_argument("--live", action="store_true", help="Enable live trading")
    parser.add_argument(
        "--account-info",
        action="store_true",
        help="Fetch account info and exit (requires live credentials)",
    )
    parser.add_argument("--verbose", action="store_true", help="Verbose logging")
    parser.add_argument(
        "--once",
        action="store_true",
        help="Skip WebSocket streaming and fetch a single price update",
    )
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)
    configure_logging(args.verbose)

    config = TradingConfig.from_env()
    if args.symbol:
        config.symbol = args.symbol.upper()
    if args.live:
        config.paper_trading = False

    LOGGER.info("Starting QGITA bot | paper_trading=%s", config.paper_trading)
    bot = QGITATradingBot(config)

    if args.account_info:
        try:
            bot.account_report()
        except Exception as exc:  # pragma: no cover - network interaction
            LOGGER.error("Failed to fetch account info: %s", exc)
            return 1
        return 0

    if args.once:
        try:
            price = bot._current_price()
        except Exception as exc:  # pragma: no cover - network interaction
            LOGGER.error("Failed to fetch price: %s", exc)
            return 1
        now = datetime.now(timezone.utc).timestamp()
        bot.on_price(price, now)
        return 0

    runner: Optional[WebSocketRunner] = None

    def _handle_sigint(signum: int, frame) -> None:  # pragma: no cover - signal hook
        LOGGER.info("Received interrupt – shutting down")
        if runner and runner._ws is not None:
            try:
                runner._ws.close()
            except Exception:  # pragma: no cover - best effort close
                pass
        sys.exit(0)

    signal.signal(signal.SIGINT, _handle_sigint)

    runner = WebSocketRunner(bot)
    try:
        runner.start()
    except Exception as exc:  # pragma: no cover - runtime guard
        LOGGER.error("WebSocket runner stopped: %s", exc)
        return 1
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
