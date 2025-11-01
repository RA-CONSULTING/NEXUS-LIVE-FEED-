# HTTP Return Codes

- **HTTP 4XX** return codes indicate malformed requests; the issue resides on the sender's side.
- **HTTP 403** return code is returned when the Web Application Firewall (WAF) limit has been violated.
- **HTTP 409** return code is returned when a cancel/replace order partially succeeds (e.g., the cancellation fails but the new order placement succeeds).
- **HTTP 429** return code is returned when a request rate limit is broken.
- **HTTP 418** return code is returned when an IP address has been auto-banned for continuing to send requests after receiving 429 codes.
- **HTTP 5XX** return codes indicate internal errors where the issue is on Binance's side. Do **not** treat this as a failed operation; the execution status is unknown and may have succeeded.
