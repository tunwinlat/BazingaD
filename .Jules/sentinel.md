## 2024-03-15 - Uncaught Database Errors Exposing Internal Stack/Message
**Vulnerability:** A catch block in `src/app/api/auth/login/route.ts` returned `error.message` directly to the client in a 500 response, exposing internal server error details (like "Database explosion" or connection strings) to the client.
**Learning:** Even seemingly harmless `error.message` attributes can leak sensitive infrastructure details, such as database type, schema internals, or internal system configurations when an exception bubbles up from an ORM like Prisma. This is a common pattern when generic error handlers are not properly scrubbed.
**Prevention:** Never pass raw exception messages or stack traces in HTTP responses to the client. Always wrap server-side errors and return generic placeholder messages like "An unexpected error occurred. Please try again later." while logging the detailed exception server-side.

## 2025-02-28 - Missing Rate Limiting on Dashboard Login Endpoint
**Vulnerability:** The `/api/auth/dashboard` endpoint allowed password brute-forcing because it was grouped under the default `api` rate limit (100 requests per minute) instead of the stricter `login` rate limit (5 requests per 15 minutes).
**Learning:** Security policies defined via URL patterns in middleware can easily miss critical endpoints if path matching isn't exhaustive or if new endpoints are added without updating the security middleware.
**Prevention:** Always ensure sensitive endpoints, especially those handling authentication or authorization, are explicitly included in strict rate limiting policies. Regularly audit security middleware routing logic against all available API endpoints.
