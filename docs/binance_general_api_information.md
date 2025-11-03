# Binance General API Information

This document summarizes the key operational details for interacting with the Binance Spot Testnet REST API.

## Base Endpoint
- **Base URL:** `https://testnet.binance.vision/api`
- Responses are JSON by default; SBE responses are available via the SBE FAQ guidance.

## Data Ordering
- Data is returned in chronological order unless explicitly documented otherwise.
- When no `startTime` or `endTime` is provided, the API returns the most recent items up to the specified `limit`.
- With `startTime`, the response contains the oldest items from that timestamp forward, capped by the `limit`.
- With `endTime`, the response contains the most recent items up to that timestamp, capped by the `limit`.
- With both `startTime` and `endTime`, the behavior matches `startTime`-only queries but will not exceed the specified `endTime`.

## Time Units
- All time and timestamp fields are expressed in milliseconds by default.
- To receive timestamps in microseconds, include the header `X-MBX-TIME-UNIT: MICROSECOND` (case-insensitive).
- Timestamp parameters (`startTime`, `endTime`, `timestamp`, etc.) may be supplied in milliseconds or microseconds.

## Security and Authentication
- Supported API key algorithms: **HMAC**, **RSA**, and **Ed25519**. See the Binance API Key Types documentation for additional details.

## Request Behavior
- API request timeout: **10 seconds**.
  - If the matching engine takes longer than 10 seconds, the API responds with: `Timeout waiting for response from backend server. Send status unknown; execution status unknown. (-1007 TIMEOUT)`.
  - This timeout response does **not** guarantee that the underlying matching engine request failed. If a request status does not appear in the User Data Stream, query the API to confirm its execution state.

## Pagination Summary
- Without explicit timestamps, fetches the most recent items (up to `limit`).
- With `startTime`, fetches oldest items from the start time forward (up to `limit`).
- With `endTime`, fetches most recent items up to the end time (up to `limit`).
- With both timestamps, behaves like a `startTime` query without crossing the `endTime` boundary.

## Additional References
- For clarifications on enums and terminology, consult the **SPOT Glossary**.
- Refer to the **Binance Spot Testnet Changelog** for API updates.

