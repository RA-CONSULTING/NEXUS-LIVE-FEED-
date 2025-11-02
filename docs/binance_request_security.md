# Binance Request Security Overview

Binance groups every API method under a specific security type. The security type dictates the permissions an API key must have and whether the request must be signed. Unless a method is labeled `NONE`, assume the request must be signed.

## Security Types

| Security Type | Description | Typical Use Cases |
| --- | --- | --- |
| `NONE` | Public market data. No authentication or signature is required. | Exchange information, order book depth, price tickers. |
| `TRADE` | Trading on the exchange, including placing and canceling orders. | New order placement, order cancellation, OCO management. |
| `USER_DATA` | Private account data. | Account balances, order status, trade history. |
| `USER_STREAM` | Managing User Data Stream subscriptions. | Creating, keeping alive, and closing listen keys. |

API keys are permission-scoped. For example, you can provision one key with `TRADE` enabled for order placement, and another with only `USER_DATA` to monitor orders. Trading permissions are disabled by default and must be enabled explicitly in the API Management console. Rotate keys regularly and revoke any that exhibit unusual activity.

## Signed Request Requirements

All methods other than `NONE` require signed requests (the User Data Stream listen key lifecycle is the one exception). A signed request adds two required parameters:

- `timestamp` — the current Unix timestamp in milliseconds or microseconds.
- `signature` — cryptographic proof derived from the request payload and your secret key.

Optionally you may pass `recvWindow` to control how long the request remains valid. The default is `5000` milliseconds and the maximum is `60000`. Values accept up to three decimal places for microsecond precision.

### Timing Validation

Binance validates timestamps twice: once before and once after a request reaches the matching engine. The simplified logic is:

```pseudo
serverTime = getCurrentTime()
if (timestamp < (serverTime + 1 second) && (serverTime - timestamp) <= recvWindow) {
  // begin processing request
  serverTime = getCurrentTime()
  if (serverTime - timestamp) <= recvWindow {
    // forward request to Matching Engine
  } else {
    // reject request
  }
  // finish processing request
} else {
  // reject request
}
```

Network latency can introduce jitter, so prefer a conservative `recvWindow` (≤ `5000`) and keep client clocks in sync with the `/api/v3/time` endpoint or an NTP source.

## HMAC Signature Workflow

1. **Prepare the payload.** Collect every request parameter except `signature`, sort them alphabetically by key, and format them as `key=value` pairs joined with `&`.
2. **Create the signature.** Treat the API secret as ASCII, compute the HMAC-SHA-256 digest of the payload, and hex-encode the result.
3. **Attach the signature.** Add the hex string as the `signature` parameter.

Example payload and signature using the illustrative credentials from the Binance documentation:

```text
apiKey=vmPUZE6mv9SD5VNHk4HlWFsOr6aKE2zvsw0MuIgwCIPy6utIco14y7Ju91duEh8A&newOrderRespType=ACK&price=52000.00&quantity=0.01000000&recvWindow=100&side=SELL&symbol=BTCUSDT&timeInForce=GTC&timestamp=1645423376532&type=LIMIT
```

```bash
echo -n 'apiKey=vmPUZE6mv9SD5VNHk4HlWFsOr6aKE2zvsw0MuIgwCIPy6utIco14y7Ju91duEh8A&newOrderRespType=ACK&price=52000.00&quantity=0.01000000&recvWindow=100&side=SELL&symbol=BTCUSDT&timeInForce=GTC&timestamp=1645423376532&type=LIMIT' \
  | openssl dgst -hex -sha256 -hmac 'NhqPtmdSJYdKjVHjA7PZj4Mge3R5YNiP1e3UZjInClVN65XAbvqqM6A7H5fATj0j'
# cc15477742bd704c29492d96c7ead9414dfd8e0ec4a00f947bb5bb454ddbd08a
```

Add the resulting signature to the request body:

```json
{
  "id": "4885f793-e5ad-4c3b-8f6c-55d891472b71",
  "method": "order.place",
  "params": {
    "symbol": "BTCUSDT",
    "side": "SELL",
    "type": "LIMIT",
    "timeInForce": "GTC",
    "quantity": "0.01000000",
    "price": "52000.00",
    "newOrderRespType": "ACK",
    "recvWindow": 100,
    "timestamp": 1645423376532,
    "apiKey": "vmPUZE6mv9SD5VNHk4HlWFsOr6aKE2zvsw0MuIgwCIPy6utIco14y7Ju91duEh8A",
    "signature": "cc15477742bd704c29492d96c7ead9414dfd8e0ec4a00f947bb5bb454ddbd08a"
  }
}
```

## RSA Signature Workflow

1. **Construct the payload.** Follow the same alphabetical sorting and `key=value` concatenation as with HMAC.
2. **Sign with RSA.** Use the `RSASSA-PKCS1-v1_5` algorithm with SHA-256 and base64-encode the output.
3. **Attach the signature.** Place the base64 string in the `signature` field.

```bash
echo -n 'apiKey=CAvIjXy3F44yW6Pou5k8Dy1swsYDWJZLeoK2r8G4cFDnE9nosRppc2eKc1T8TRTQ&newOrderRespType=ACK&price=52000.00&quantity=0.01000000&recvWindow=100&side=SELL&symbol=BTCUSDT&timeInForce=GTC&timestamp=1645423376532&type=LIMIT' \
  | openssl dgst -sha256 -sign test-prv-key.pem \
  | openssl enc -base64 -A
# OJJaf8C/3VGrU4ATTR4GiUDqL2FboSE1Qw7UnnoYNfXTXHubIl1iaePGuGyfct4NPu5oVEZCH4Q6ZStfB1w4ssgu0uiB/Bg+fBrRFfVgVaLKBdYHMvT+ljUJzqVaeoThG9oXlduiw8PbS9U8DYAbDvWN3jqZLo4Z2YJbyovyDAvDTr/oC0+vssLqP7NmlNb3fF3Bj7StmOwJvQJTbRAtzxK5PP7OQe+0mbW+D7RqVkUiSswR8qJFWTeSe4nXXNIdZdueYhF/Xf25L+KitJS5IHdIHcKfEw3MQzHFb2ZsGWkjDQwxkwr7Noi0Zaa+gFtxCuatGFm9dFIyx217pmSHtA==
```

## Ed25519 Signature Workflow

Ed25519 keys offer strong security and excellent performance. The overall process mirrors HMAC and RSA workflows: sort parameters, build the payload string, sign it, and attach the base64-encoded signature. The Python snippet below demonstrates the flow:

```python
#!/usr/bin/env python3
import base64
import json
import time
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from websocket import create_connection

API_KEY = "put your own API Key here"
PRIVATE_KEY_PATH = "test-prv-key.pem"

with open(PRIVATE_KEY_PATH, "rb") as fh:
    private_key = load_pem_private_key(data=fh.read(), password=None)

params = {
    "apiKey": API_KEY,
    "symbol": "BTCUSDT",
    "side": "SELL",
    "type": "LIMIT",
    "timeInForce": "GTC",
    "quantity": "1.0000000",
    "price": "0.20",
}

params["timestamp"] = int(time.time() * 1000)
payload = "&".join(f"{key}={value}" for key, value in sorted(params.items()))
params["signature"] = base64.b64encode(private_key.sign(payload.encode("ASCII"))).decode("ASCII")

request = {
    "id": "my_new_order",
    "method": "order.place",
    "params": params,
}

ws = create_connection("wss://ws-api.binance.com:443/ws-api/v3")
ws.send(json.dumps(request))
print(ws.recv())
ws.close()
```

Keep private keys encrypted at rest and never share either the public API key or secret credentials. Immediately revoke compromised keys and notify Binance support if you detect suspicious activity.
