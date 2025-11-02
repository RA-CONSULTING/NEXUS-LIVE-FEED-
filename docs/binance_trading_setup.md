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

## 6. Binance Request Security Primer

Binance assigns a **security type** to every REST method. If a method lists a
security type (for example, `New order (TRADE)`), the request must be
**SIGNED**, meaning that the query string requires an HMAC SHA256 signature and
the call must include a valid API key in the `X-MBX-APIKEY` header. When no
security type is specified, the endpoint is public and can be called without a
signature.

Key takeaways when preparing keys for the QGITA bot:

- **SIGNED endpoints need API keys.** Most trading and account methods fall into
  this category. A few legacy `listenKey` endpoints are currently exempt from
  signing, but you should still authenticate when possible.
- **Protect both key and secret.** Store them outside of source control,
  restrict their permissions (e.g., `TRADE`, `USER_DATA`) to the minimum needed
  for the bot, and rotate them if you observe unusual account activity.
- **Trading is opt-in.** Newly created keys cannot trade until you explicitly
  enable the `Enable Spot & Margin Trading` permission in Binance's API
  Management console.
- **Separate duties if needed.** You can create one key for trading operations
  and another with `USER_DATA` access for monitoring, limiting blast radius if a
  secret leaks.

Treat the keys like passwords: never share them, and revoke them immediately if
you suspect compromise.
