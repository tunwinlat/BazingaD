## 2025-02-18 - Prevent Bcrypt Denial of Service (DoS)
**Vulnerability:** Decentralized validation schemas in API routes (`src/app/api/auth/dashboard/route.ts` and `src/app/api/auth/totp/disable/route.ts`) lacked a maximum length constraint on password fields.
**Learning:** Without a string length bound, attackers can send extremely long inputs to `bcrypt.compare`, causing CPU exhaustion because Bcrypt's computational cost increases linearly with input size during hashing and comparison.
**Prevention:** Always enforce a `.max(128)` constraint on all password inputs in Zod schemas (matching standard authentication limits) to mitigate application-layer DoS vulnerabilities.
