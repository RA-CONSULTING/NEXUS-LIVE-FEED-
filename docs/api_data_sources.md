# API Data Source Resolution

The Nexus API surfaces live operational data from multiple backend services. Because every
endpoint may fetch values from different subsystems, responses can arrive asynchronously and
with varying freshness. This guide explains how those sources are prioritized so that client
integrations can anticipate latency and data staleness.

## Asynchronous Responses

Most API calls return immediately with whatever data is currently available. Additional fields
may continue streaming in once upstream services respond. A short delay between request and
final payload is therefore normal and not considered an error condition.

## Data Source Priority

Each endpoint declares the data sources it consults. Sources are evaluated from left to right;
if the first source does not contain the requested datum, the resolver cascades to the next one.

| Priority | Source          | Description |
| -------- | --------------- | ----------- |
| 1        | Matching Engine | Direct feed from the Nexus Matching Engine. Provides the most up-to-date real-time state but may omit historical context. |
| 2        | Memory          | Values cached in local or external in-memory stores. Useful for recent lookups with minimal latency. |
| 3        | Database        | Authoritative record pulled straight from persistent storage. Ensures completeness at the cost of higher access latency. |

Some endpoints reference multiple sources (e.g. `Memory ⇒ Database`). In those cases the endpoint
first checks the left-most entry and only continues when no value is found.

## Implementation Notes

- Prefer endpoints that include the Matching Engine when low-latency insights are required.
- Expect slight delays when an endpoint falls back to Memory or Database, especially under load.
- When designing client-side retries, allow for the asynchronous completion window before
triggering duplicate requests.

Understanding this hierarchy lets integrators build resilient consumers that balance speed and
consistency across the Nexus data plane.
