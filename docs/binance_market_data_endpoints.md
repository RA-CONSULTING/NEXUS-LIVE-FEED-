# Binance Market Data REST Endpoints

This reference condenses the Binance REST market data surface that the Nexus trading tooling
interacts with most frequently. Each section summarizes the request weight, parameters, and
canonical response structure so you can design cache lifetimes, polling cadence, and
fallback behaviour without leaving the repo.

## Order Book – `GET /api/v3/depth`

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
  mismatch raises `-1220 SYMBOL_DOES_NOT_MATCH_STATUS`.
- **Response:**

```json
{
  "lastUpdateId": 1027024,
  "bids": [["4.00000000", "431.00000000"]],
  "asks": [["4.00000200", "12.00000000"]]
}
```

## Recent Trades – `GET /api/v3/trades`

- **Weight:** 25
- **Parameters:**
  - `symbol` (string, required)
  - `limit` (int, optional, default `500`, maximum `1000`)
- **Data source:** Memory
- **Response:**

```json
[
  {
    "id": 28457,
    "price": "4.00000100",
    "qty": "12.00000000",
    "quoteQty": "48.000012",
    "time": 1499865549590,
    "isBuyerMaker": true,
    "isBestMatch": true
  }
]
```

## Historical Trades – `GET /api/v3/historicalTrades`

- **Weight:** 25
- **Parameters:**
  - `symbol` (string, required)
  - `limit` (int, optional, default `500`, maximum `1000`)
  - `fromId` (long, optional) – start trade ID, inclusive
- **Data source:** Database
- **Response:** matches `GET /api/v3/trades`.

## Aggregate Trades – `GET /api/v3/aggTrades`

- **Weight:** 4
- **Parameters:**
  - `symbol` (string, required)
  - `fromId` (long, optional) – aggregate trade ID, inclusive
  - `startTime`/`endTime` (long, optional, milliseconds, inclusive)
  - `limit` (int, optional, default `500`, maximum `1000`)
- **Notes:** If no pagination parameters are supplied the latest aggregate trades are returned.
- **Data source:** Database
- **Response:**

```json
[
  {
    "a": 26129,
    "p": "0.01633102",
    "q": "4.70443515",
    "f": 27781,
    "l": 27781,
    "T": 1498793709153,
    "m": true,
    "M": true
  }
]
```

## Kline & UIKline Candles – `GET /api/v3/klines`, `GET /api/v3/uiKlines`

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
- **Response:** array `[openTime, open, high, low, close, volume, closeTime, quoteVolume,
  numTrades, takerBuyBaseVolume, takerBuyQuoteVolume, unused]`.

## Current Average Price – `GET /api/v3/avgPrice`

- **Weight:** 2
- **Parameters:** `symbol` (string, required)
- **Data source:** Memory
- **Response:**

```json
{
  "mins": 5,
  "price": "9.35751834",
  "closeTime": 1694061154503
}
```

## 24h Ticker Statistics – `GET /api/v3/ticker/24hr`

- **Weight:** depends on payload type:
  - single `symbol`: 2
  - omit `symbol` (all symbols) or `symbols` query: 80
  - `symbols` array: 2 (≤20), 40 (21–100), 80 (>100)
- **Parameters:** `symbol`, `symbols`, `type` (`FULL` or `MINI`), `symbolStatus`
- **Data source:** Memory
- **Response:** returns either a single ticker object or an array, matching the selected `type`.

## Trading Day Ticker – `GET /api/v3/ticker/tradingDay`

- **Weight:** 4 per symbol, capped at 200 for >50 symbols
- **Parameters:** `symbol` **or** `symbols` (max 100), optional `timeZone`, `type`, `symbolStatus`
- **Data source:** Database
- **Response:** same shapes as the 24h ticker in `FULL` or `MINI` modes.

## Symbol Price Ticker – `GET /api/v3/ticker/price`

- **Weight:**
  - single `symbol`: 2
  - omit `symbol`/`symbols`: 4
  - `symbols` array: 4
- **Parameters:** `symbol`, `symbols`, optional `symbolStatus`
- **Data source:** Memory
- **Response:** `{ "symbol": "LTCBTC", "price": "4.00000200" }` or an array of such objects.

## Order Book Ticker – `GET /api/v3/ticker/bookTicker`

- **Weight:** follows the same rules as `/api/v3/ticker/price`
- **Parameters:** `symbol`, `symbols`, optional `symbolStatus`
- **Data source:** Memory
- **Response:** best bid/ask levels per symbol.

## Rolling Window Ticker – `GET /api/v3/ticker`

- **Weight:** 4 per symbol, capped at 200 for >50 symbols
- **Parameters:** `symbol` **or** `symbols` (max 100), optional `windowSize`, `type`, `symbolStatus`
- **Notes:** Window start always aligns to the minute. `windowSize` accepts discrete minutes (`1m`…`59m`),
  hours (`1h`…`23h`), or days (`1d`…`7d`). The effective window may extend up to 59 999 ms beyond
  `windowSize` because the close time is the request timestamp.
- **Data source:** Database
- **Response:** `FULL` and `MINI` ticker shapes, similar to `/api/v3/ticker/24hr`.
