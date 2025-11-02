# Binance Rate Limits Guide

Binance enforces multiple layers of rate limiting across its REST and WebSocket APIs. This guide consolidates the limits and patterns that are most relevant for trading bots and operational tooling in the NEXUS live feed stack.

## Connection Limits

- **WebSocket connection cap**: 300 concurrent connections per IP address in any rolling 5 minute window.
- The limit counts per source IP. Multiple applications behind the same NAT share the quota.
- Excess connections result in rejected handshakes or disconnected sockets. Stagger reconnects and pool WebSocket clients to stay under the cap.

## Rate Limit Types

Every REST and WebSocket API request consumes weight. Binance tracks usage by multiple intervals simultaneously. Requests that exceed a limit return HTTP status **429**. Severe or repeated violations escalate to HTTP **418** bans.

Each response can include a `rateLimits` array describing the active limits influenced by the request:

```json
{
  "id": "7069b743-f477-4ae3-81db-db9b8df085d2",
  "status": 200,
  "result": {
    "serverTime": 1656400526260
  },
  "rateLimits": [
    {
      "rateLimitType": "REQUEST_WEIGHT",
      "interval": "MINUTE",
      "intervalNum": 1,
      "limit": 6000,
      "count": 70
    }
  ]
}
```

| Field | Meaning |
| --- | --- |
| `rateLimitType` | Category being throttled (`REQUEST_WEIGHT` or `ORDERS`). |
| `interval` | Granularity of enforcement (`SECOND`, `MINUTE`, `HOUR`, `DAY`). |
| `intervalNum` | Multiplier applied to `interval` (e.g., 10 means a 10-second bucket). |
| `limit` | Maximum allowed requests/weight in the bucket. |
| `count` | Current usage accrued in the bucket. |

Intervals reset on natural boundaries (e.g., 1 minute resets at `HH:MM:00`, 1 day resets at `00:00 UTC`). Exhausting any interval blocks further requests until it resets, even if other intervals still have headroom.

## Request Weight Limits

- Most REST endpoints consume 1 weight, but heavy endpoints (such as multi-symbol queries) and WebSocket connections consume more. Opening a WebSocket API connection costs 2 weight.
- Weight is aggregated per IP address across all API keys and clients.
- Monitor `REQUEST_WEIGHT` usage with the `exchangeInfo` endpoint. When a response includes a `retryAfter` timestamp, pause until that time before retrying.
- Repeatedly ignoring 429 responses can result in an IP ban (status 418) that escalates from minutes to days. Banned responses include the timestamp when the ban lifts.

**Example ban response**

```json
{
  "id": "fc93a61a-a192-4cf4-bb2a-a8f0f0c51e06",
  "status": 418,
  "error": {
    "code": -1003,
    "msg": "Way too much request weight used; IP banned until 1659146400000. Please use WebSocket Streams for live updates to avoid bans.",
    "data": {
      "serverTime": 1659142907531,
      "retryAfter": 1659146400000
    }
  },
  "rateLimits": [
    {
      "rateLimitType": "REQUEST_WEIGHT",
      "interval": "MINUTE",
      "intervalNum": 1,
      "limit": 6000,
      "count": 2411
    }
  ]
}
```

## Order Count Limits

- The `ORDERS` rate limit type throttles how many new orders you can submit per interval.
- Limits are tracked per account across all API keys and include successfully placed orders. Rejects may or may not increment the counters.
- Use the `account.rateLimits.orders` endpoint to introspect your current counts.
- Violations return HTTP 429 with a `retryAfter` timestamp. Continue to respect backoff guidance to avoid bans.

**Sample response showing order usage**

```json
{
  "id": "e2a85d9f-07a5-4f94-8d5f-789dc3deb097",
  "status": 200,
  "result": {
    "symbol": "BTCUSDT",
    "orderId": 12510053279,
    "orderListId": -1,
    "clientOrderId": "a097fe6304b20a7e4fc436",
    "transactTime": 1655716096505,
    "price": "0.10000000",
    "origQty": "10.00000000",
    "executedQty": "0.00000000",
    "origQuoteOrderQty": "0.000000",
    "cummulativeQuoteQty": "0.00000000",
    "status": "NEW",
    "timeInForce": "GTC",
    "type": "LIMIT",
    "side": "BUY",
    "workingTime": 1655716096505,
    "selfTradePreventionMode": "NONE"
  },
  "rateLimits": [
    {
      "rateLimitType": "ORDERS",
      "interval": "SECOND",
      "intervalNum": 10,
      "limit": 50,
      "count": 12
    },
    {
      "rateLimitType": "ORDERS",
      "interval": "DAY",
      "intervalNum": 1,
      "limit": 160000,
      "count": 4043
    },
    {
      "rateLimitType": "REQUEST_WEIGHT",
      "interval": "MINUTE",
      "intervalNum": 1,
      "limit": 6000,
      "count": 321
    }
  ]
}
```

## Controlling Rate Limit Output

By default, Binance returns rate limit metadata on every response. If payload size matters, you can suppress or request the metadata explicitly:

- **Per request**: include `"returnRateLimits": false` (or `true`) in the JSON-RPC payload.
- **Per connection**: append `returnRateLimits=false` (or `true`) to the WebSocket API URL, for example `wss://ws-api.binance.com:443/ws-api/v3?returnRateLimits=false`.

Remember: hiding the field does not disable enforcement; always adhere to the limits even if the metadata is omitted.

## Operational Practices

- Cache weight consumption locally and throttle clients before Binance responds with 429 to avoid cascading bans.
- Spread load across multiple IPs only if they belong to the same account and comply with Binance terms of service.
- Prefer WebSocket streams for live market data instead of repeatedly polling REST endpoints.
- When ramping automated strategies, simulate both `REQUEST_WEIGHT` and `ORDERS` buckets to validate that the strategy stays below caps under peak throughput.

