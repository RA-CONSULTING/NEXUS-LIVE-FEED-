# Binance Autonomous Trading Setup

This guide explains how to prepare Binance credentials, verify connectivity,
and run the QGITA autonomous trading bot that ships with this repository.

## General API Information

When integrating with Binance programmatically, keep the following service
characteristics in mind:

- **Base endpoints:** `https://api.binance.com`, `https://api-gcp.binance.com`,
  and the performance-optimised `https://api{1-4}.binance.com` hosts. The
  `api1`&ndash;`api4` variants typically respond faster but can be less stable.
- **Response format:** JSON by default. To receive SBE responses, consult the
  Binance SBE FAQ.
- **Result ordering:** Endpoints return data chronologically unless otherwise
  specified.
- **Time range parameters:**
  - Without `startTime`/`endTime`, endpoints return the most recent items up to
    `limit`.
  - With `startTime`, the API returns the oldest items from that timestamp up to
    `limit`.
  - With `endTime`, the API returns the most recent items up to that timestamp
    and `limit`.
  - Supplying both behaves like `startTime` but will not exceed `endTime`.
- **Timestamps:** All timestamps are milliseconds by default. Pass the header
  `X-MBX-TIME-UNIT:MICROSECOND` (case-insensitive) to receive microsecond
  precision.
- **Authentication:** HMAC, RSA, and Ed25519 keys are supported.
- **Timeouts:** Requests time out after 10 seconds. A timeout does not
  necessarily indicate that the matching engine rejected the request; confirm
  status via the User Data Stream or a follow-up REST query.
- **Public market data:** Use `https://data-api.binance.vision` for market-data
  only endpoints.
- **Terminology:** Consult the Binance SPOT Glossary for enum definitions.

Keep these details in mind when configuring the trading bot or extending the
client implementation. They help explain the behaviour of endpoints referenced
throughout this guide and the Binance REST/WebSocket helpers in
`scripts/binance_trading_bot.py`.

## 1. Create a Restricted API Key

Create an API key inside your Binance account and apply the following
permissions:

| Permission                        | Status | Notes |
|----------------------------------|:------:|-------|
| Enable Reading                   | ✅     | Required for balances and ticker data. |
| Enable Spot & Margin Trading     | ✅     | Required for order placement. |
| Enable Withdrawals               | ❌     | Leave disabled for security. |
| Enable IP Access Restrictions    | ✅     | Add the public IP address of the host that will run the bot. |
| Enable Universal Transfer        | Optional | Only needed if you plan to move funds between accounts programmatically. |

> **Security tip:** Rotate the key regularly and store the secret securely.

## 2. Verify the Key Permissions

Use the helper snippet below to confirm that the key can access the signed
account endpoint. Replace the placeholders with your credentials:

```python
import hashlib
import hmac
import time
from urllib.parse import urlencode

import requests

API_KEY = "your_api_key"
API_SECRET = "your_secret"
BASE_URL = "https://api.binance.com"


def _sign(params: dict) -> str:
    query = urlencode(params)
    return hmac.new(API_SECRET.encode(), query.encode(), hashlib.sha256).hexdigest()


def get_account_info() -> dict:
    params = {"timestamp": int(time.time() * 1000)}
    params["signature"] = _sign(params)
    headers = {"X-MBX-APIKEY": API_KEY}
    response = requests.get(f"{BASE_URL}/api/v3/account", params=params, headers=headers, timeout=10)
    response.raise_for_status()
    return response.json()


if __name__ == "__main__":
    account = get_account_info()
    print("Account Type:", account.get("accountType"))
    print("Can Trade:", account.get("canTrade"))
    balances = [
        (balance["asset"], balance["free"])
        for balance in account.get("balances", [])
        if float(balance.get("free", 0)) > 0
    ]
    print("Balances:", balances)
```

If the call succeeds, the credentials are ready for live trading. Any HTTP
error indicates that the key lacks permission or the IP restrictions do not
match.

## 3. Configure Environment Variables

The trading bot reads its configuration from environment variables, which makes
it easy to keep secrets out of source control. The most important variables are
listed below:

| Variable | Description | Default |
|----------|-------------|---------|
| `BINANCE_API_KEY` | Public API key. | Empty (required for live trading). |
| `BINANCE_API_SECRET` | API secret used for signatures. | Empty (required for live trading). |
| `QGITA_SYMBOL` | Trading pair. | `BTCUSDT` |
| `QGITA_POSITION_SIZE` | Notional position size in USDT. | `100` |
| `QGITA_MAX_POSITION_SIZE` | Maximum total exposure in USDT. | `500` |
| `QGITA_STOP_LOSS` | Stop loss percentage. | `2` |
| `QGITA_TAKE_PROFIT` | Take profit percentage. | `4` |
| `QGITA_PAPER_TRADING` | Enable paper trading (`true`/`false`). | `true` |
| `QGITA_SYMBOL_STATUS` | Optional trading phase guard that maps to Binance's new `symbolStatus` parameter (e.g. `TRADING`). | `TRADING` |

Additional variables exist for tuning the QGITA detector (window size,
curvature threshold, lighthouse consensus threshold, etc.). See the module
docstring in `scripts/binance_trading_bot.py` for the full list.

## 4. Run the Bot

Install the runtime dependencies:

```bash
pip install numpy requests websocket-client
```

Then launch the bot. It defaults to paper trading, so it can be run safely
without real funds:

```bash
python scripts/binance_trading_bot.py --symbol BTCUSDT
```

To fetch a single price update (without opening a WebSocket connection) use:

```bash
python scripts/binance_trading_bot.py --once
```

After verifying the behaviour, enable live trading explicitly. **This will
place real orders.**

```bash
python scripts/binance_trading_bot.py --live --symbol BTCUSDT
```

Use `--account-info` to print the account balances and confirm trading access:

```bash
python scripts/binance_trading_bot.py --live --account-info
```

## 5. Understand Exchange Filters

Binance enforces price, quantity, notional, and order-count filters across
symbols, the entire exchange, and specific assets. Consult the
[Binance Exchange Filters Reference](./binance_exchange_filters.md) for a
complete breakdown before promoting QGITA to production so every submission
conforms to those limits on the first attempt.

## 6. Risk Controls

The implementation enforces several safeguards:

- Daily loss cap (`QGITA_MAX_DAILY_LOSS`) stops trading after sustained losses.
- Daily trade limit (`QGITA_MAX_TRADES`) prevents runaway loops.
- Maximum exposure (`QGITA_MAX_POSITION_SIZE`) ensures each position stays
  within a predefined USDT budget.
- Stop-loss and take-profit levels are calculated immediately when a position
  opens and are monitored on every price update.

These values should be tuned for your account size and risk tolerance before
live deployment.

