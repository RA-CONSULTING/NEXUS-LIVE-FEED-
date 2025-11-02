# Binance WebSocket API Rate Limits

This document summarizes the rate-limiting and connection management rules for the Binance WebSocket API, including how to interpret responses that report current usage and what happens when limits are exceeded.

## Connection Limits

- Each IP address can establish up to **300 connections within a 5-minute window**. Additional connection attempts within that period are rejected.
- Every connection attempt counts toward the limit, regardless of whether the WebSocket session is sustained or immediately closed.

## Rate Limit Types

Binance enforces multiple rate limit types that can appear simultaneously in API responses:

- `REQUEST_WEIGHT`: Tracks general request activity, including connection attempts.
- `ORDERS`: Tracks how many orders have been submitted.

Each rate limit type may have multiple active intervals, such as `SECOND`, `MINUTE`, `HOUR`, or `DAY`, each with its own limit and usage counter.

## Reading Rate Limit Responses

API responses may include a `rateLimits` array detailing the active limits. Each entry contains:

| Field | Description |
| --- | --- |
| `rateLimitType` | The rate limit category (`REQUEST_WEIGHT`, `ORDERS`, etc.). |
| `interval` | The time unit of the limit (`SECOND`, `MINUTE`, `HOUR`, `DAY`). |
| `intervalNum` | Multiplier applied to the interval (e.g., `10` seconds). |
| `limit` | Maximum number of requests or weight units allowed in the interval. |
| `count` | Current usage within the interval. |

Usage counters reset when the next interval begins (e.g., a 1-minute interval resets at the start of the next minute).

### Example Successful Response

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

This indicates 70 weight units have been used out of a 6000 limit for the current minute.

### Example Order Response with Multiple Limits

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

## Hiding Rate Limit Information

- By default, responses include the `rateLimits` field.
- Set `"returnRateLimits": false` in the request payload or append `returnRateLimits=false` to the WebSocket connection URL to omit the field.
- Individual requests can override the connection default by explicitly setting `"returnRateLimits": true`.
- Omitting the field only hides the information; rate limits still apply.

## Weight Accounting and IP Bans

- Each request consumes weight based on its complexity; opening a WebSocket connection costs **2 weight**.
- Weight usage accumulates per IP address across all concurrent connections.
- If usage exceeds the limit, responses return status `429` with a `retryAfter` timestamp indicating when the request can be retried.
- Continuing to exceed limits without backing off can trigger an automatic IP ban. Bans return status `418` and include `retryAfter` to indicate when access will be restored. Ban durations escalate from **2 minutes up to 3 days** for repeat offenses.

### Example Banned Response

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

## Unfilled Order Count Limits

- Successful order placements increment the `ORDERS` rate limit counters.
- Rejected orders may or may not consume the counter, so monitor usage via the `account.rateLimits.orders` endpoint.
- Exceeding order limits also returns status `429` with a `retryAfter` timestamp.
- Order limits are tracked per account and shared across all API keys tied to that account.

## Best Practices

1. **Monitor Usage**: Use `exchangeInfo` and `account.rateLimits.orders` to track current weight and order counts.
2. **Back Off on 429s**: Pause requests until the `retryAfter` timestamp to avoid bans.
3. **Reuse Connections**: Limit connection churn to stay within the 300 connections per 5-minute rule and conserve weight.
4. **Request Only Needed Data**: Reduce weight by narrowing queries to specific symbols or intervals.

Following these guidelines will help keep clients within Binance's limits and prevent service interruptions.
