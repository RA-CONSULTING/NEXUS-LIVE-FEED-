# Binance Spot FIX API Reference

This document captures the Binance Spot FIX API contract, including session types, authentication, operational safeguards, and the order and market data messages available to clients. It is intended as a quick reference when implementing or troubleshooting FIX connectivity alongside the existing REST/WebSocket tooling.

## 1. General Requirements

- **Transport:** All FIX connections must be established over TLS. Use a native TCP+TLS client or tunnel the session through a TLS proxy such as `stunnel`.
- **Timeouts:** Requests time out after 10 seconds if the matching engine has not responded. The server returns `-1007 TIMEOUT` and the final order state must be resolved by checking the User Data Stream or querying the order.
- **Keys:** Only Ed25519 API keys are supported. Generate a dedicated FIX key pair and keep the private key secure.

## 2. Session Types and Endpoints

| Session | Endpoint | Capabilities | Eligible Permissions |
|---------|----------|--------------|----------------------|
| Order Entry | `tcp+tls://fix-oe.binance.com:9000` | Submit, cancel, and amend orders. Query message and order rate limits. Receives all `ExecutionReport <8>` and `List Status <N>` events. | `FIX_API` |
| Drop Copy | `tcp+tls://fix-dc.binance.com:9000` | Receive `ExecutionReport <8>` and `List Status <N>` for the account. | `FIX_API`, `FIX_API_READ_ONLY` |
| Market Data | `tcp+tls://fix-md.binance.com:9000` | Subscribe to market data streams and query active instruments. No order placement. | `FIX_API`, `FIX_API_READ_ONLY` |

## 3. Connection Lifecycle

1. Establish the TLS socket.
2. Send a `Logon <A>` message immediately after connecting. The server confirms with its own `Logon <A>` response.
3. Maintain the negotiated heartbeat interval (`HeartBtInt (108)`, 5–60 seconds). If either side detects silence for one interval it must send `TestRequest <1>` and expect a `Heartbeat <0>` carrying the same `TestReqID (112)`.
4. Respond to `News <B>` messages announcing maintenance by establishing a new connection and gracefully logging out of the old one.
5. Always send `Logout <5>` before disconnecting. Failure to do so renders the `SenderCompID (49)` unusable for twice the heartbeat interval.

## 4. Message Ordering and Responses

- `MessageHandling (25035)` in the initial logon determines matching engine ordering:
  - `UNORDERED (1)`: Allows the server to route client messages out of sequence for higher throughput.
  - `SEQUENTIAL (2)`: Enforces strict `MsgSeqNum (34)` order when forwarding to the engine.
- `ResponseMode (25036)` controls downstream notifications:
  - `EVERYTHING (1)`: Default. Every session receives all successful execution reports and list updates for the account.
  - `ONLY_ACKS (2)`: Sessions receive only synchronous acknowledgements.

## 5. Timing Security

Include `SendingTime (52)` in every message. Optionally set `RecvWindow (25000)`—in milliseconds, up to 60,000—to limit how long the server will accept the request. Messages are processed only when:

```text
SendingTime < serverTime + 1 second
serverTime - SendingTime <= RecvWindow
```

## 6. Authenticating the Logon

The logon payload is signed with the Ed25519 private key associated with the API key. Construct the signature string by concatenating the following fields in order, separated with the SOH character:

1. `MsgType (35)`
2. `SenderCompId (49)`
3. `TargetCompId (56)`
4. `MsgSeqNum (34)`
5. `SendingTime (52)`

Sign the ASCII payload, base64-encode the signature, and place it in `RawData (96)`. `RawDataLength (95)` must match the length of the encoded signature. `Username (553)` carries the API key.

### Sample Python Helper

```python
import base64
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import load_pem_private_key

def logon_raw_data(private_key: Ed25519PrivateKey,
                   sender_comp_id: str,
                   target_comp_id: str,
                   msg_seq_num: str,
                   sending_time: str) -> str:
    payload = chr(1).join([
        "A",  # MsgType for Logon
        sender_comp_id,
        target_comp_id,
        msg_seq_num,
        sending_time,
    ])
    signature = private_key.sign(payload.encode("ASCII"))
    return base64.b64encode(signature).decode("ASCII")

with open("private_key.pem", "rb") as fp:
    private_key = load_pem_private_key(fp.read(), password=None)

raw_data = logon_raw_data(
    private_key,
    sender_comp_id="5JQmUOsm",
    target_comp_id="SPOT",
    msg_seq_num="1",
    sending_time="20240612-08:52:21.613",
)
```

For validation, signing the canonical example below should yield `4MHXelVVcpkdwuLbl6n73HQUXUf1dse2PCgT1DYqW9w8AVZ1RACFGM+5UdlGPrQHrgtS3CvsRURC1oj73j8gCA==`:

| Field | Value |
|-------|-------|
| `MsgType (35)` | `A` |
| `SenderCompID (49)` | `EXAMPLE` |
| `TargetCompID (56)` | `SPOT` |
| `MsgSeqNum (34)` | `1` |
| `SendingTime (52)` | `20240627-11:17:25.223` |

## 7. Session Envelope

Every message starts with the header fields `BeginString (8)`, `BodyLength (9)`, `MsgType (35)`, `SenderCompID (49)`, `TargetCompID (56)`, `MsgSeqNum (34)`, `SendingTime (52)`, and optional `RecvWindow (25000)`. Messages end with `CheckSum (10)`. All tags use printable ASCII or SOH as separators, and client order identifiers must match the regex `^[a-zA-Z0-9-_]{1,36}$`.

## 8. Limits

- **Message throughput:**
  - Order Entry: 10,000 messages per 10 seconds
  - Drop Copy: 60 messages per 60 seconds
  - Market Data: 2,000 messages per 60 seconds
- **Connections per account:**
  - Order Entry/Drop Copy: Up to 10 concurrent TCP sessions, 15 connection attempts in 30 seconds
  - Market Data: Up to 100 concurrent TCP sessions, 300 connection attempts in 300 seconds
- **Unfilled orders:** Query `LimitQuery <XLQ>` for current usage. Exceeding the limit causes order rejections.

Use `LimitQuery <XLQ>` to monitor quotas. The `LimitResponse <XLR>` returns the current counts, maxima, and reset cadence for each tracked limit.

## 9. Administrative Messages

| MsgType | Name | Purpose |
|---------|------|---------|
| `0` | `Heartbeat` | Sent periodically or in response to `TestRequest <1>` to confirm liveness. |
| `1` | `TestRequest` | Triggers a heartbeat response when the peer is silent for one heartbeat interval. |
| `3` | `Reject` | Returned for syntactic errors, invalid fields, or exceeded connection limits. Details appear in `Text (58)` and `ErrorCode (25016)`. |
| `5` | `Logout` | Initiates or acknowledges session termination. |
| `B` | `News` | Announces maintenance windows and instructs clients to reconnect. |

Resend requests (`MsgType 2`) are not supported.

## 10. Order Entry Workflow

### 10.1 Placing Orders (`NewOrderSingle <D>`)

Supported order types align with Binance Spot semantics: market, limit, stop, stop-limit, take-profit, trailing, pegged, and limit-maker orders. Required fields vary by type:

| Order Type | Required Tags |
|------------|---------------|
| `LIMIT` | `OrdType=2`, `OrderQty (38)`, `Price (44)`, `TimeInForce (59)` |
| `MARKET` | `OrdType=1`, **either** `OrderQty (38)` **or** `CashOrderQty (152)` |
| `STOP_LOSS` / `TAKE_PROFIT` | `OrdType=3`, `OrderQty (38)`, trigger configuration (`TriggerPrice (1102)` or `TriggerTrailingDeltaBips (25009)`), plus `Trigger` fields (`1100`, `1101`, `1107`, `1109`) |
| `STOP_LOSS_LIMIT` / `TAKE_PROFIT_LIMIT` | `OrdType=4`, `OrderQty (38)`, `Price (44)`, `TimeInForce (59)`, trigger configuration |
| `LIMIT_MAKER` | `OrdType=2`, `ExecInst=6`, `OrderQty (38)`, `Price (44)` |

A successful placement returns an `ExecutionReport <8>` with `ExecType=0 (NEW)`; rejections use `ExecType=8 (REJECTED)` and may include `ErrorCode (25016)`.

### 10.2 Canceling Orders (`OrderCancelRequest <F>`)

Supply a new `ClOrdID (11)` alongside either `OrderID (37)` or `OrigClOrdID (41)`. If both identifiers are present, the server validates them in that order. Canceling any member of an order list cancels the entire list. The response is an `ExecutionReport <8>` (`ExecType=4`) or an `OrderCancelReject <9>` with details.

### 10.3 Cancel/Replace (`OrderCancelRequestAndNewOrderSingle <XCN>`)

Execute a cancel and immediate re-entry in a single request. Set `OrderCancelRequestAndNewOrderSingleMode (25033)` to:

- `STOP_ON_FAILURE (1)`: Abort if the cancel fails.
- `ALLOW_FAILURE (2)`: Attempt the new order even if cancellation is rejected.

`OrderRateLimitExceededMode (25038)` can instruct the server to cancel only when rate limits are exceeded. Responses include cancellation and new order `ExecutionReport <8>` messages.

### 10.4 Mass Cancel (`OrderMassCancelRequest <q>`)

Use `ClOrdID (11)`, `Symbol (55)`, and `MassCancelRequestType=1` to remove all open orders for a symbol. Each cancellation yields an `ExecutionReport <8>` with `ExecType=4`, and the aggregate result arrives in an `OrderMassCancelReport <r>`.

### 10.5 Order Lists (`NewOrderList <E>`)

Submit contingent OCO, OTO, or OTOCO structures with up to three legs. Define the list with `ClListID (25014)`, `NoOrders (73)`, and optional `ContingencyType (1385)`. Trigger relationships are expressed through the `ListTrigger` repeating group (`25010`–`25013`). The exchange acknowledges list state changes with `ListStatus <N>`.

### 10.6 Reduce-Only Amendments (`OrderAmendKeepPriorityRequest <XAK>`)

Reduce the working quantity without losing order priority by referencing the existing order via `OrderID (37)` or `OrigClOrdID (41)` and submitting the new `OrderQty (38)`. Failures are reported with `OrderAmendReject <XAR>`.

## 11. Execution Reports (`ExecutionReport <8>`)

Execution reports communicate every order state transition, including acknowledgements, fills, cancels, expirations, and rejections. Key tags include:

- `ExecType (150)` / `OrdStatus (39)` for the event type and aggregate status.
- `CumQty (14)` and `LeavesQty (151)` for fill tracking.
- `CumQuoteQty (25017)` for quote asset fills.
- `TradeID (1003)`, `AggressorIndicator (1057)`, and `MatchType (574)` on fills.
- Trigger and peg metadata when applicable.

By default all active sessions receive these reports; switch to `ONLY_ACKS (2)` in the logon to limit broadcast volume.

## 12. Market Data Interfaces

### 12.1 Instrument Directory (`InstrumentListRequest <x>` / `InstrumentList <y>`)

Request metadata for either a single trading pair or the full active instrument universe. The response enumerates trading constraints such as minimum lot size, market lot size, price increments, and valid price ranges.

### 12.2 Market Data Subscriptions (`MarketDataRequest <V>`)

Subscribe (`SubscriptionRequestType=1`) or unsubscribe (`=2`) using `MDReqID (262)` as a unique handle. Supported streams:

- **Trade Stream:** `MDEntryType=TRADE (2)`.
- **Book Ticker:** `MDEntryType=BID (0)` and `OFFER (1)` with `MarketDepth=1`.
- **Diff Depth:** `MDEntryType=BID/OFFER`, `MarketDepth` between 2 and 5000 (controls snapshot depth). Updates arrive every 100 ms.

Initial snapshots arrive as `MarketDataSnapshot <W>` messages; incremental updates use `MarketDataIncrementalRefresh <X>`. Fields `FirstBookUpdateID (25043)` and `LastBookUpdateID (25044)` enable reconciliation with REST/WebSocket feeds.

### 12.3 Rejects (`MarketDataRequestReject <Y>`)

Invalid subscriptions return a reject message detailing the issue through `MDReqRejReason (281)` and, when applicable, `ErrorCode (25016)`.

## 13. Error Handling

The exchange rejects malformed or unsupported messages via `Reject <3>` or type-specific rejects (`OrderCancelReject <9>`, `OrderAmendReject <XAR>`, etc.). Inspect `Text (58)` and `ErrorCode (25016)` for actionable diagnostics. Refer to Binance Spot error code documentation for enumerations.

---

**Reminder:** Always monitor the Limit Query interface and the User Data Stream (or REST fallbacks) to reconcile orders in the event of timeouts or disconnects.
