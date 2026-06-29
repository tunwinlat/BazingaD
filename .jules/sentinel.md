## 2026-05-24 - DoS Vulnerability in Custom Rate Limiting Map
**Vulnerability:** CPU exhaustion Denial of Service (DoS) vulnerability in the login endpoint (`/api/auth/login` and `/api/auth/dashboard`).
**Learning:** Manual rate limiting using an in-memory `Map` with custom O(N) cleanup logic (iterating through thousands of map entries on each failure) creates a massive CPU bottleneck. Attackers could spam requests to intentionally fill the map and trigger expensive cleanup cycles, hanging the Node.js event loop.
**Prevention:** Never write custom O(N) cleanup logic for rate limiters. Use established, optimized libraries like `rate-limiter-flexible` which use Redis or efficient memory structures under the hood, and ensure their asynchronous operations (like `get` and `consume`) are properly awaited to avoid race conditions.

## 2026-10-24 - SSRF Bypass via Octal IP Representation
**Vulnerability:** A Server-Side Request Forgery (SSRF) bypass in the `isSafeUrl` utility where IP addresses like `0177.0.0.1` were treated as public addresses because standard `Number()` parsing in JavaScript evaluates `"0177"` as base-10 `177`.
**Learning:** Node.js HTTP clients (like `fetch` / Undici) conform to URL parsing standards that treat IP address octets with a leading zero as base-8 (octal). Therefore, `0177` resolves to `127`, causing the request to hit `127.0.0.1` (localhost), bypassing naïve dotted-quad validation logic.
**Prevention:** Always sanitize or explicitly reject IP components containing leading zeros in custom dotted-quad parsers before evaluating their numerical values, to prevent mismatched interpretations between the validator and the network request dispatcher.
