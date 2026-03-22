## 2024-03-15 - Uncaught Database Errors Exposing Internal Stack/Message
**Vulnerability:** A catch block in `src/app/api/auth/login/route.ts` returned `error.message` directly to the client in a 500 response, exposing internal server error details (like "Database explosion" or connection strings) to the client.
**Learning:** Even seemingly harmless `error.message` attributes can leak sensitive infrastructure details, such as database type, schema internals, or internal system configurations when an exception bubbles up from an ORM like Prisma. This is a common pattern when generic error handlers are not properly scrubbed.
**Prevention:** Never pass raw exception messages or stack traces in HTTP responses to the client. Always wrap server-side errors and return generic placeholder messages like "An unexpected error occurred. Please try again later." while logging the detailed exception server-side.

## 2025-02-28 - Missing Rate Limiting on Dashboard Login Endpoint
**Vulnerability:** The `/api/auth/dashboard` endpoint allowed password brute-forcing because it was grouped under the default `api` rate limit (100 requests per minute) instead of the stricter `login` rate limit (5 requests per 15 minutes).
**Learning:** Security policies defined via URL patterns in middleware can easily miss critical endpoints if path matching isn't exhaustive or if new endpoints are added without updating the security middleware.
**Prevention:** Always ensure sensitive endpoints, especially those handling authentication or authorization, are explicitly included in strict rate limiting policies. Regularly audit security middleware routing logic against all available API endpoints.

## 2024-05-19 - Privilege Escalation via Missing Dashboard Session Prefix
**Vulnerability:** The dashboard login endpoint `src/app/api/auth/dashboard/route.ts` created a generic session token using `createSession(user.id, sessionDurationHours)` without prefixing it with 'dash_'. Since `verifyAuth` in `src/lib/auth.ts` did not enforce the `dash_` prefix check before using a token as a full admin session, an attacker could log in to the less-secure dashboard and then use the resulting session token to access fully protected admin endpoints, thus escalating privileges.
**Learning:** Security mechanisms that rely on implicit conventions (like token prefixing) must be explicitly enforced at both the token creation and validation phases. Otherwise, tokens meant for lower-privilege access can bypass security controls for higher-privilege paths.
**Prevention:** Always enforce token structure conventions at the validation layer. E.g., reject any token in the high-privilege `verifyAuth` if it has the lower-privilege `dash_` prefix. Add optional parameter support to token generation functions to ensure the prefix is always consistently applied at creation.
## 2026-03-21 - Prevent Sensitive Data Exposure in Traffic Settings API
**Vulnerability:** The GET `/api/settings/traffic` endpoint was exposing the admin's `trafficHomeAddress` and `trafficWorkAddress` to unauthenticated users.
**Learning:** API endpoints returning settings/configuration data must filter sensitive fields (like PII, home/work addresses, API keys) based on the user's authentication status, even if the endpoint requires no auth for public consumption.
**Prevention:** Ensure fields returned by configuration API endpoints are conditionally exposed using ternary operators checking the auth context (e.g. `auth ? settings.address : ''`).
## 2026-03-22 - Memory Exhaustion / Denial of Service in Rate Limiting
**Vulnerability:** The in-memory rate limiting mechanism in `src/app/api/auth/login/route.ts` tracked failed attempts using a `Map` keyed by username, but failed to clean up old entries unless the same username was attempted again after the lockout duration.
**Learning:** In-memory tracking structures (like Maps or Arrays) that store data based on unvalidated user input (like a username) can grow indefinitely if not explicitly capped or cleared, leading to an Out-Of-Memory (OOM) crash (Denial of Service) when an attacker sends requests with many unique identifiers.
**Prevention:** Always implement a size cap or a proactive cleanup strategy (like LRU cache or periodic pruning) for in-memory data structures that store state per user/IP/identifier, especially on unauthenticated endpoints.
