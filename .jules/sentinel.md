## 2024-05-24 - Rate Limiting DoS Prevention using RateLimiterMemory
**Vulnerability:** CPU exhaustion and memory leak (DoS) through unbounded in-memory `Map` arrays tracking failed attempts. Specifically, the manual `failedAttempts` map in authentication routes required manual cleanup sweeps (O(N)), leading to potential CPU spiking and map exhaustion.
**Learning:** Manual rate limiting structures must include hard-coded cleanup sweeps based on time/size or else they're vulnerable to resource exhaustion DoS over time.
**Prevention:** Use the `rate-limiter-flexible` library's `RateLimiterMemory` class with the `get` and `consume` methods (which must be strictly awaited) instead of manual Maps.
