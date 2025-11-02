# Binance Market Data REST Endpoints

This reference condenses the Binance REST market data surface that the Nexus trading tooling
interacts with most frequently. Each section summarizes the request weight, parameters, and
canonical response structure so you can design cache lifetimes, polling cadence, and
fallback behaviour without leaving the repo. The Spot JSON-RPC gateway mirrors the REST
contracts; example payloads below show both the HTTPS route and the corresponding `method`
name, along with the envelope (`id`, `status`, `result`, `rateLimits`) returned by the
gateway.

## Order Book – `GET /api/v3/depth` / `method: "depth"`

- **Weight:** 5–250 depending on the `limit` request parameter.
  - `1–100` → 5
  - `101–500` → 25
  - `501–1000` → 50
  - `1001–5000` → 250
- **Parameters:**
  - `symbol` (string, required)
  - `limit` (int, optional, default `100`, maximum `5000`)
  - `symbolStatus` (enum, optional: `TRADING`, `HALT`, `BREAK`)
- **Notes:** Requests asking for more than 5000 levels are silently capped. A symbol/status
  mismatch raises `-1220 SYMBOL_DOES_NOT_MATCH_STATUS`. Bid levels are sorted highest-first,
  ask levels lowest-first.
- **RPC request:**

  ```json
  {
    "id": "<uuid>",
    "method": "depth",
    "params": {
      "symbol": "BNBBTC",
      "limit": 5
    }
  }
  ```

- **Response payload:**

  ```json
  {
    "id": "…",
    "status": 200,
    "result": {
      "lastUpdateId": 2731179239,
      "bids": [["0.01379900", "3.43200000"]],
      "asks": [["0.01380000", "5.91700000"]]
    },
    "rateLimits": [
      {
        "rateLimitType": "REQUEST_WEIGHT",
        "interval": "MINUTE",
        "intervalNum": 1,
        "limit": 6000,
        "count": 2
      }
    ]
  }
  ```

## Recent Trades – `GET /api/v3/trades` / `method: "trades.recent"`

- **Weight:** 25
- **Parameters:**
  - `symbol` (string, required)
  - `limit` (int, optional, default `500`, maximum `1000`)
- **Data source:** Memory
- **RPC request:**

  ```json
  {
    "id": "<uuid>",
    "method": "trades.recent",
    "params": {
      "symbol": "BNBBTC",
      "limit": 1
    }
  }
  ```

- **Response payload:** array of trade objects matching the REST schema. Sample:

  ```json
  {
    "id": "…",
    "status": 200,
    "result": [
      {
        "id": 194686783,
        "price": "0.01361000",
        "qty": "0.01400000",
        "quoteQty": "0.00019054",
        "time": 1660009530807,
        "isBuyerMaker": true,
        "isBestMatch": true
      }
    ]
  }
  ```

## Historical Trades – `GET /api/v3/historicalTrades` / `method: "trades.historical"`

- **Weight:** 25
- **Parameters:**
  - `symbol` (string, required)
  - `limit` (int, optional, default `500`, maximum `1000`)
  - `fromId` (long, optional) – start trade ID, inclusive
- **Data source:** Database
- **RPC request:**

  ```json
  {
    "id": "<uuid>",
    "method": "trades.historical",
    "params": {
      "symbol": "BNBBTC",
      "fromId": 0,
      "limit": 1
    }
  }
  ```

- **Response:** matches the recent trades schema with historical ordering.

## Aggregate Trades – `GET /api/v3/aggTrades` / `method: "trades.aggregate"`

- **Weight:** 4
- **Parameters:**
  - `symbol` (string, required)
  - `fromId` (long, optional) – aggregate trade ID, inclusive
  - `startTime`/`endTime` (long, optional, milliseconds, inclusive)
  - `limit` (int, optional, default `500`, maximum `1000`)
- **Notes:** If no pagination parameters are supplied the latest aggregate trades are returned.
- **Data source:** Database
- **RPC request:**

  ```json
  {
    "id": "<uuid>",
    "method": "trades.aggregate",
    "params": {
      "symbol": "BNBBTC",
      "fromId": 50000000,
      "limit": 1
    }
  }
  ```

- **Response:** array of aggregate trade objects identical to the REST shape.

## Kline & UIKline Candles – `GET /api/v3/klines`, `GET /api/v3/uiKlines` / `method: "klines"`, `"uiKlines"`

- **Weight:** 2
- **Parameters:**
  - `symbol` (string, required)
  - `interval` (enum, required) – `1s`, `1m`, `3m`, `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`,
    `8h`, `12h`, `1d`, `3d`, `1w`, `1M`
  - `startTime`/`endTime` (long, optional)
  - `timeZone` (string, optional, default `0` for UTC)
  - `limit` (int, optional, default `500`, maximum `1000`)
- **Notes:** `uiKlines` mirror the `klines` contract but return pre-smoothed payloads for charting.
  Time zone offsets apply only to candle bucketing; start/end time filters remain UTC.
- **Data source:** Database
- **RPC request:**

  ```json
  {
    "id": "<uuid>",
    "method": "klines",
    "params": {
      "symbol": "BNBBTC",
      "interval": "1h",
      "startTime": 1655969280000,
      "limit": 1
    }
  }
  ```

- **Response:** array `[openTime, open, high, low, close, volume, closeTime, quoteVolume,
  numTrades, takerBuyBaseVolume, takerBuyQuoteVolume, unused]`. `uiKlines` use the same contract
  but with presentation-smoothed values.

## Current Average Price – `GET /api/v3/avgPrice` / `method: "avgPrice"`

- **Weight:** 2
- **Parameters:** `symbol` (string, required)
- **Data source:** Memory
- **RPC request:**

  ```json
  { "id": "<uuid>", "method": "avgPrice", "params": { "symbol": "BNBBTC" } }
  ```

- **Response:**

  ```json
  {
    "id": "…",
    "status": 200,
    "result": {
      "mins": 5,
      "price": "9.35751834",
      "closeTime": 1694061154503
    }
  }
  ```

## 24h Ticker Statistics – `GET /api/v3/ticker/24hr` / `method: "ticker.24hr"`

- **Weight:** depends on payload type:
  - single `symbol`: 2
  - omit `symbol` (all symbols) or `symbols` query: 80
  - `symbols` array: 2 (≤20), 40 (21–100), 80 (>100)
- **Parameters:** `symbol`, `symbols`, `type` (`FULL` or `MINI`), `symbolStatus`
- **Data source:** Memory
- **RPC request:**

  ```json
  {
    "id": "<uuid>",
    "method": "ticker.24hr",
    "params": {
      "symbol": "BNBBTC"
    }
  }
  ```

- **Response:** returns either a single ticker object or an array, matching the selected `type`.

## Trading Day Ticker – `GET /api/v3/ticker/tradingDay` / `method: "ticker.tradingDay"`

- **Weight:** 4 per symbol, capped at 200 for >50 symbols
- **Parameters:** `symbol` **or** `symbols` (max 100), optional `timeZone`, `type`, `symbolStatus`
- **Data source:** Database
- **RPC request:**

  ```json
  {
    "id": "<uuid>",
    "method": "ticker.tradingDay",
    "params": {
      "symbols": ["BNBBTC", "BTCUSDT"],
      "timeZone": "00:00"
    }
  }
  ```

- **Response:** same shapes as the 24h ticker in `FULL` or `MINI` modes.

## Symbol Price Ticker – `GET /api/v3/ticker/price` / `method: "ticker.price"`

- **Weight:**
  - single `symbol`: 2
  - omit `symbol`/`symbols`: 4
  - `symbols` array: 4
- **Parameters:** `symbol`, `symbols`, optional `symbolStatus`
- **Data source:** Memory
- **RPC request:**

  ```json
  {
    "id": "<uuid>",
    "method": "ticker.price",
    "params": {
      "symbol": "BNBBTC"
    }
  }
  ```

- **Response:** `{ "symbol": "LTCBTC", "price": "4.00000200" }` or an array of such objects.

## Order Book Ticker – `GET /api/v3/ticker/bookTicker` / `method: "ticker.book"`

- **Weight:** follows the same rules as `/api/v3/ticker/price`
- **Parameters:** `symbol`, `symbols`, optional `symbolStatus`
- **Data source:** Memory
- **RPC request:**

  ```json
  {
    "id": "<uuid>",
    "method": "ticker.book",
    "params": {
      "symbols": ["BNBBTC", "BTCUSDT"]
    }
  }
  ```

- **Response:** best bid/ask levels per symbol.

## Rolling Window Ticker – `GET /api/v3/ticker` / `method: "ticker"`

- **Weight:** 4 per symbol, capped at 200 for >50 symbols
- **Parameters:** `symbol` **or** `symbols` (max 100), optional `windowSize`, `type`, `symbolStatus`
- **Notes:** Window start always aligns to the minute. `windowSize` accepts discrete minutes (`1m`…`59m`),
  hours (`1h`…`23h`), or days (`1d`…`7d`). The effective window may extend up to 59 999 ms beyond
  `windowSize` because the close time is the request timestamp.
- **Data source:** Database
- **RPC request:**

  ```json
  {
    "id": "<uuid>",
    "method": "ticker",
    "params": {
      "symbols": ["BNBBTC", "BTCUSDT"],
      "windowSize": "7d"
    }
  }
  ```

- **Response:** `FULL` and `MINI` ticker shapes, similar to `/api/v3/ticker/24hr`.
