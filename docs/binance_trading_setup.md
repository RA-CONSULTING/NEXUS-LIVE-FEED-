# Binance Autonomous Trading Setup

This guide explains how to prepare Binance credentials, verify connectivity,
and run the QGITA autonomous trading bot that ships with this repository.

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

## 5. Risk Controls

The implementation enforces several safeguards:

- Daily loss cap (`QGITA_MAX_DAILY_LOSS`) stops trading after sustained losses.
- Daily trade limit (`QGITA_MAX_TRADES`) prevents runaway loops.
- Maximum exposure (`QGITA_MAX_POSITION_SIZE`) ensures each position stays
  within a predefined USDT budget.
- Stop-loss and take-profit levels are calculated immediately when a position
  opens and are monitored on every price update.

These values should be tuned for your account size and risk tolerance before
live deployment.

## 6. Binance API Rate Limits

Binance enforces rate limits at multiple layers. Every response includes the
`X-MBX-USED-WEIGHT-(intervalNum)(intervalLetter)` headers that report the
request weight accumulated by your IP for each defined interval. The interval
letter values follow the mapping `SECOND → S`, `MINUTE → M`, `HOUR → H`, and
`DAY → D`; the `intervalNum` represents how many of those units make up the
window. For example, an interval of `5M` means a five-minute window.

The [`/api/v3/exchangeInfo`](https://binance-docs.github.io/apidocs/spot/en/#exchange-information)
endpoint returns a `rateLimits` array that enumerates the
`RAW_REQUESTS`, `REQUEST_WEIGHT`, and `ORDERS` constraints. Each REST route has
an associated request weight. Endpoints that operate on multiple symbols often
carry higher weights.

If you exceed a limit you will receive an HTTP `429` response. You are expected
to back off before retrying. Ignoring the limit and continuing to send
requests can escalate to an automatic IP ban signalled by HTTP `418`. Binance
includes a `Retry-After` header alongside 429 and 418 responses. For 429s the
value indicates how long to wait before retrying; for 418s it specifies how
long the ban will last. Repeated violations cause bans to lengthen from two
minutes up to three days. The limits are tied to the IP address, not to API
keys.

Successful order responses also include `X-MBX-ORDER-COUNT-(intervalNum)(intervalLetter)`
headers so you can monitor the number of active orders against the account
limits. If you surpass the allowed count you will receive a 429 without a
`Retry-After` header. Failed or rejected orders are not guaranteed to include
these headers.

To check the current thresholds programmatically, query the
`GET /api/v3/rateLimit/order` endpoint. The tracking is account-specific, so
once orders fill you can place additional orders even within the same window.
