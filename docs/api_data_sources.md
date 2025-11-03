# API Data Source Resolution

The Nexus API surfaces live operational data from multiple backend services. Because every endpoint may fetch values from different subsystems, responses can arrive asynchronously and with varying freshness. This guide explains how those sources are prioritized so that client integrations can anticipate latency and data staleness.

## Asynchronous Responses

The API system is asynchronous, so some delay in the response is normal and expected. Most calls return immediately with whatever data is currently available, and additional fields may continue streaming in once upstream services respond. A short delay between request and final payload is therefore normal and not considered an error condition.

## Data Source Priority

Each endpoint declares the data sources it consults. Sources are evaluated from left to right; if the first source does not contain the requested datum, the resolver cascades to the next one. The hierarchy is:

1. **Matching Engine** — Lowest latency. Direct feed from the Nexus Matching Engine that produces the response in-line, yielding the freshest view of state.
2. **Memory** — Low latency. Values retrieved from the API server's local or external cache, ideal for recent lookups with minimal overhead.
3. **Database** — Moderate latency. Authoritative record from persistent storage that guarantees completeness at the cost of higher access latency.

Some endpoints reference multiple sources (for example, `Memory ⇒ Database`). In those cases the endpoint first checks the left-most entry and only continues when no value is found, ensuring the latest available data is returned while still providing a fallback for completeness. In the `Memory ⇒ Database` chain that means the cache is queried first, and only if it misses does the system pull from the database.

## Implementation Notes

- Prefer endpoints that include the Matching Engine when low-latency insights are required.
- Expect slight delays when an endpoint falls back to Memory or Database, especially under load.
- When designing client-side retries, allow for the asynchronous completion window before triggering duplicate requests.

Understanding this hierarchy lets integrators build resilient consumers that balance speed and consistency across the Nexus data plane.
