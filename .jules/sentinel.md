## 2026-03-13 - [Information Leakage in Login API]
**Vulnerability:** The login API route was leaking the original Error's `error.message` to the client during unexpected errors in the catch block (`/api/auth/login`).
**Learning:** This could expose internal stack traces, architecture details, or sensitive database messages. Error messages must always fail securely.
**Prevention:** Replace direct exposure of `error.message` with a generic fallback message like 'An unexpected error occurred', while logging the original error server-side.
