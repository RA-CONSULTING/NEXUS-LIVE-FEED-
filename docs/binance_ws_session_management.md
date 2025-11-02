# Binance WebSocket Session Management

This reference outlines how to authenticate and manage a WebSocket connection when
interacting with the Binance-style session layer used by the Nexus tooling. Only
**Ed25519** API keys are accepted by this flow. Each method below includes the
canonical request envelope, response shape, request weight, and parameter
contract.

## Log in with API key — `session.logon`

Authenticate the current WebSocket connection with an API key signed request.
After a successful login subsequent signed calls may omit the `apiKey` and
`signature` fields; the session stays bound to the authenticated key until it is
replaced or explicitly cleared.

- **Weight:** 2
- **Data source:** Memory

| Parameter | Type | Mandatory | Description |
|-----------|------|-----------|-------------|
| `apiKey` | string | Yes | Public API key encoded as base64. |
| `signature` | string | Yes | Ed25519 signature of the request payload. |
| `timestamp` | long | Yes | Millisecond timestamp when the signature was produced. |
| `recvWindow` | decimal | No | Optional grace period (≤ `60000`). Supports three decimal places to express microseconds. |

```json
{
  "id": "c174a2b1-3f51-4580-b200-8528bd237cb7",
  "method": "session.logon",
  "params": {
    "apiKey": "vmPUZE6mv9SD5VNHk4HlWFsOr6aKE2zvsw0MuIgwCIPy6utIco14y7Ju91duEh8A",
    "signature": "1cf54395b336b0a9727ef27d5d98987962bc47aca6e13fe978612d0adee066ed",
    "timestamp": 1649729878532
  }
}
```

```json
{
  "id": "c174a2b1-3f51-4580-b200-8528bd237cb7",
  "status": 200,
  "result": {
    "apiKey": "vmPUZE6mv9SD5VNHk4HlWFsOr6aKE2zvsw0MuIgwCIPy6utIco14y7Ju91duEh8A",
    "authorizedSince": 1649729878532,
    "connectedSince": 1649729873021,
    "returnRateLimits": false,
    "serverTime": 1649729878630,
    "userDataStream": false
  }
}
```

## Query session status — `session.status`

Inspect the authorization state associated with the live connection. The `apiKey`
and `authorizedSince` fields return `null` when the socket is unauthenticated.

- **Weight:** 2
- **Data source:** Memory
- **Parameters:** none

```json
{
  "id": "b50c16cd-62c9-4e29-89e4-37f10111f5bf",
  "method": "session.status"
}
```

```json
{
  "id": "b50c16cd-62c9-4e29-89e4-37f10111f5bf",
  "status": 200,
  "result": {
    "apiKey": "vmPUZE6mv9SD5VNHk4HlWFsOr6aKE2zvsw0MuIgwCIPy6utIco14y7Ju91duEh8A",
    "authorizedSince": 1649729878532,
    "connectedSince": 1649729873021,
    "returnRateLimits": false,
    "serverTime": 1649730611671,
    "userDataStream": true
  }
}
```

## Log out of the session — `session.logout`

Unbind the previously authenticated API key without closing the socket. Future
requests that need authorization must once again include `apiKey` and `signature`
parameters.

- **Weight:** 2
- **Data source:** Memory
- **Parameters:** none

```json
{
  "id": "c174a2b1-3f51-4580-b200-8528bd237cb7",
  "method": "session.logout"
}
```

```json
{
  "id": "c174a2b1-3f51-4580-b200-8528bd237cb7",
  "status": 200,
  "result": {
    "apiKey": null,
    "authorizedSince": null,
    "connectedSince": 1649729873021,
    "returnRateLimits": false,
    "serverTime": 1649730611671,
    "userDataStream": false
  }
}
```

Multiple `session.logon` calls on the same connection replace the active API key.
A subsequent `session.logout` only clears the binding; the socket itself remains
open for continued use.
