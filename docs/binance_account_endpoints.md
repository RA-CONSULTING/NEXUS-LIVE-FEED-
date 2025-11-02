# Binance Account REST Endpoints

The following reference consolidates the signed account endpoints that the trading tooling in this repository relies on. Every request must include a valid `timestamp` (in milliseconds) and a signature generated with your API secret. Optional `recvWindow` parameters accept up to three decimal places to express microseconds and cannot exceed `60000`.

> **Note:** All endpoints listed below live under the `/api/v3/` path on `https://api.binance.com`. A `401`/`-1022` response usually indicates a missing or invalid signature.

## Account Information — `GET /account`

Returns the current account profile along with balances. Use the `omitZeroBalances` flag to filter out assets that have zero free and locked amounts. Balances originate from in-memory caches backed by the database.

**Weight:** 20 (memory → database)

```json
{
  "makerCommission": 15,
  "takerCommission": 15,
  "buyerCommission": 0,
  "sellerCommission": 0,
  "commissionRates": {
    "maker": "0.00150000",
    "taker": "0.00150000",
    "buyer": "0.00000000",
    "seller": "0.00000000"
  },
  "canTrade": true,
  "canWithdraw": true,
  "canDeposit": true,
  "brokered": false,
  "requireSelfTradePrevention": false,
  "preventSor": false,
  "updateTime": 123456789,
  "accountType": "SPOT",
  "balances": [
    {
      "asset": "BTC",
      "free": "4723846.89208129",
      "locked": "0.00000000"
    },
    {
      "asset": "LTC",
      "free": "4763368.68006011",
      "locked": "0.00000000"
    }
  ],
  "permissions": ["SPOT"],
  "uid": 354937868
}
```

## Query Order — `GET /order`

Checks the status of a single order by `orderId` or `origClientOrderId`. When both identifiers are supplied Binance resolves the `orderId` first and validates the original client ID against that record. Historical orders may omit the cumulative quote quantity (`cummulativeQuoteQty < 0`).

**Weight:** 4 (memory → database)

```json
{
  "symbol": "LTCBTC",
  "orderId": 1,
  "orderListId": -1,
  "clientOrderId": "myOrder1",
  "price": "0.1",
  "origQty": "1.0",
  "executedQty": "0.0",
  "cummulativeQuoteQty": "0.0",
  "status": "NEW",
  "timeInForce": "GTC",
  "type": "LIMIT",
  "side": "BUY",
  "stopPrice": "0.0",
  "icebergQty": "0.0",
  "time": 1499827319559,
  "updateTime": 1499827319559,
  "isWorking": true,
  "workingTime": 1499827319559,
  "origQuoteOrderQty": "0.000000",
  "selfTradePreventionMode": "NONE"
}
```

## Current Open Orders — `GET /openOrders`

Lists outstanding orders for a symbol or (if no symbol is supplied) for the entire account. When omitting the symbol the response weight jumps from 6 to 80 due to the broader query scope.

**Weight:** 6 per symbol (memory → database); 80 when `symbol` is omitted

```json
[
  {
    "symbol": "LTCBTC",
    "orderId": 1,
    "orderListId": -1,
    "clientOrderId": "myOrder1",
    "price": "0.1",
    "origQty": "1.0",
    "executedQty": "0.0",
    "cummulativeQuoteQty": "0.0",
    "status": "NEW",
    "timeInForce": "GTC",
    "type": "LIMIT",
    "side": "BUY",
    "stopPrice": "0.0",
    "icebergQty": "0.0",
    "time": 1499827319559,
    "updateTime": 1499827319559,
    "isWorking": true,
    "origQuoteOrderQty": "0.000000",
    "workingTime": 1499827319559,
    "selfTradePreventionMode": "NONE"
  }
]
```

## All Orders — `GET /allOrders`

Retrieves historical and active orders for a symbol with optional pagination via `orderId` or time windows (`startTime`/`endTime`). The time window cannot span more than 24 hours.

**Weight:** 20 (database)

```json
[
  {
    "symbol": "LTCBTC",
    "orderId": 1,
    "orderListId": -1,
    "clientOrderId": "myOrder1",
    "price": "0.1",
    "origQty": "1.0",
    "executedQty": "0.0",
    "cummulativeQuoteQty": "0.0",
    "status": "NEW",
    "timeInForce": "GTC",
    "type": "LIMIT",
    "side": "BUY",
    "stopPrice": "0.0",
    "icebergQty": "0.0",
    "time": 1499827319559,
    "updateTime": 1499827319559,
    "isWorking": true,
    "origQuoteOrderQty": "0.000000",
    "workingTime": 1499827319559,
    "selfTradePreventionMode": "NONE"
  }
]
```

## Query Order List — `GET /orderList`

Fetches the state of an OCO (One Cancels the Other) order list by `orderListId` or `origClientOrderId`. One of the identifiers is mandatory.

**Weight:** 4 (database)

```json
{
  "orderListId": 27,
  "contingencyType": "OCO",
  "listStatusType": "EXEC_STARTED",
  "listOrderStatus": "EXECUTING",
  "listClientOrderId": "h2USkA5YQpaXHPIrkd96xE",
  "transactionTime": 1565245656253,
  "symbol": "LTCBTC",
  "orders": [
    {
      "symbol": "LTCBTC",
      "orderId": 4,
      "clientOrderId": "qD1gy3kc3Gx0rihm9Y3xwS"
    },
    {
      "symbol": "LTCBTC",
      "orderId": 5,
      "clientOrderId": "ARzZ9I00CPM8i3NhmU9Ega"
    }
  ]
}
```

## Query All Order Lists — `GET /allOrderList`

Returns paginated OCO order lists. Provide `fromId` **or** a time window (`startTime`/`endTime`). Time spans longer than 24 hours are rejected.

**Weight:** 20 (database)

```json
[
  {
    "orderListId": 29,
    "contingencyType": "OCO",
    "listStatusType": "EXEC_STARTED",
    "listOrderStatus": "EXECUTING",
    "listClientOrderId": "amEEAXryFzFwYF1FeRpUoZ",
    "transactionTime": 1565245913483,
    "symbol": "LTCBTC",
    "orders": [
      {
        "symbol": "LTCBTC",
        "orderId": 4,
        "clientOrderId": "oD7aesZqjEGlZrbtRpy5zB"
      },
      {
        "symbol": "LTCBTC",
        "orderId": 5,
        "clientOrderId": "Jr1h6xirOxgeJOUuYQS7V3"
      }
    ]
  },
  {
    "orderListId": 28,
    "contingencyType": "OCO",
    "listStatusType": "EXEC_STARTED",
    "listOrderStatus": "EXECUTING",
    "listClientOrderId": "hG7hFNxJV6cZy3Ze4AUT4d",
    "transactionTime": 1565245913407,
    "symbol": "LTCBTC",
    "orders": [
      {
        "symbol": "LTCBTC",
        "orderId": 2,
        "clientOrderId": "j6lFOfbmFMRjTYA7rRJ0LP"
      },
      {
        "symbol": "LTCBTC",
        "orderId": 3,
        "clientOrderId": "z0KCjOdditiLS5ekAFtK81"
      }
    ]
  }
]
```

## Query Open Order Lists — `GET /openOrderList`

Retrieves currently executing OCO order lists.

**Weight:** 6 (database)

```json
[
  {
    "orderListId": 31,
    "contingencyType": "OCO",
    "listStatusType": "EXEC_STARTED",
    "listOrderStatus": "EXECUTING",
    "listClientOrderId": "wuB13fmulKj3YjdqWEcsnp",
    "transactionTime": 1565246080644,
    "symbol": "LTCBTC",
    "orders": [
      {
        "symbol": "LTCBTC",
        "orderId": 4,
        "clientOrderId": "r3EH2N76dHfLoSZWIUw1bT"
      },
      {
        "symbol": "LTCBTC",
        "orderId": 5,
        "clientOrderId": "Cv1SnyPD3qhqpbjpYEHbd2"
      }
    ]
  }
]
```

## Account Trade List — `GET /myTrades`

Returns fills for a symbol. Weight drops from 20 to 5 when an `orderId` filter is provided. Only specific parameter combinations are accepted (e.g., `symbol + orderId`, `symbol + startTime + endTime`). Time windows must not exceed 24 hours.

**Weight:** 20 without `orderId`; 5 with `orderId` (memory → database)

```json
[
  {
    "symbol": "BNBBTC",
    "id": 28457,
    "orderId": 100234,
    "orderListId": -1,
    "price": "4.00000100",
    "qty": "12.00000000",
    "quoteQty": "48.000012",
    "commission": "10.10000000",
    "commissionAsset": "BNB",
    "time": 1499865549590,
    "isBuyer": true,
    "isMaker": false,
    "isBestMatch": true
  }
]
```

## Query Unfilled Order Count — `GET /rateLimit/order`

Exposes the order rate-limit usage for each window. Useful for proactive throttling in automation.

**Weight:** 40 (memory)

```json
[
  {
    "rateLimitType": "ORDERS",
    "interval": "SECOND",
    "intervalNum": 10,
    "limit": 50,
    "count": 0
  },
  {
    "rateLimitType": "ORDERS",
    "interval": "DAY",
    "intervalNum": 1,
    "limit": 160000,
    "count": 0
  }
]
```

## Query Prevented Matches — `GET /myPreventedMatches`

Lists trades that were canceled by the self-trade prevention (STP) rules. Supports lookups by `preventedMatchId`, by `orderId`, or by an `orderId` combined with pagination via `fromPreventedMatchId` and `limit`.

**Weight:** 2 for invalid `symbol` or `preventedMatchId` queries; 20 when querying by `orderId` (database)

```json
[
  {
    "symbol": "BTCUSDT",
    "preventedMatchId": 1,
    "takerOrderId": 5,
    "makerSymbol": "BTCUSDT",
    "makerOrderId": 3,
    "tradeGroupId": 1,
    "selfTradePreventionMode": "EXPIRE_MAKER",
    "price": "1.100000",
    "makerPreventedQuantity": "1.300000",
    "transactTime": 1669101687094
  }
]
```

## Query Allocations — `GET /myAllocations`

Retrieves allocations produced by Smart Order Routing (SOR). Pagination is available through `fromAllocationId` and `limit`, and results can be filtered by order or time windows (≤ 24 hours).

**Weight:** 20 (database)

```json
[
  {
    "symbol": "BTCUSDT",
    "allocationId": 0,
    "allocationType": "SOR",
    "orderId": 1,
    "orderListId": -1,
    "price": "1.00000000",
    "qty": "5.00000000",
    "quoteQty": "5.00000000",
    "commission": "0.00000000",
    "commissionAsset": "BTC",
    "time": 1687506878118,
    "isBuyer": true,
    "isMaker": false,
    "isAllocator": false
  }
]
```

## Query Commission Rates — `GET /account/commission`

Returns the layered commission rates for a symbol, including special/tax rates and the optional BNB discount configuration.

**Weight:** 20 (database)

```json
{
  "symbol": "BTCUSDT",
  "standardCommission": {
    "maker": "0.00000010",
    "taker": "0.00000020",
    "buyer": "0.00000030",
    "seller": "0.00000040"
  },
  "specialCommission": {
    "maker": "0.01000000",
    "taker": "0.02000000",
    "buyer": "0.03000000",
    "seller": "0.04000000"
  },
  "taxCommission": {
    "maker": "0.00000112",
    "taker": "0.00000114",
    "buyer": "0.00000118",
    "seller": "0.00000116"
  },
  "discount": {
    "enabledForAccount": true,
    "enabledForSymbol": true,
    "discountAsset": "BNB",
    "discount": "0.75000000"
  }
}
```

## Query Order Amendments — `GET /order/amendments`

Lists the amendment history for a single order, optionally filtered from a specific execution ID.

**Weight:** 4 (database)

```json
[
  {
    "symbol": "BTCUSDT",
    "orderId": 9,
    "executionId": 22,
    "origClientOrderId": "W0fJ9fiLKHOJutovPK3oJp",
    "newClientOrderId": "UQ1Np3bmQ71jJzsSDW9Vpi",
    "origQty": "5.00000000",
    "newQty": "4.00000000",
    "time": 1741669661670
  },
  {
    "symbol": "BTCUDST",
    "orderId": 9,
    "executionId": 25,
    "origClientOrderId": "UQ1Np3bmQ71jJzsSDW9Vpi",
    "newClientOrderId": "5uS0r35ohuQyDlCzZuYXq2",
    "origQty": "4.00000000",
    "newQty": "3.00000000",
    "time": 1741672924895
  }
]
```

## Query Relevant Filters — `GET /myFilters`

Displays the exchange, symbol, and asset-level filters that apply to the account. This is the only endpoint that surfaces `MAX_ASSET` filter assignments.

**Weight:** 40 (memory)

```json
{
  "exchangeFilters": [
    {
      "filterType": "EXCHANGE_MAX_NUM_ORDERS",
      "maxNumOrders": 1000
    }
  ],
  "symbolFilters": [
    {
      "filterType": "MAX_NUM_ORDER_LISTS",
      "maxNumOrderLists": 20
    }
  ],
  "assetFilters": [
    {
      "filterType": "MAX_ASSET",
      "asset": "JPY",
      "limit": "1000000.00000000"
    }
  ]
}
```

