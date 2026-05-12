## 2024-05-15 - Prevented Bcrypt Denial of Service in Validation Schemas
**Vulnerability:** The `dashboardLoginSchema` and `disableTotpSchema` lacked maximum length constraints on password fields.
**Learning:** This exposes the application to a Denial of Service (DoS) vulnerability. Because Bcrypt's computational cost scales linearly with password length, an attacker submitting extremely large password payloads could exhaust CPU resources, locking up the Node.js event loop during the `bcrypt.compare()` operation.
**Prevention:** Always enforce a reasonable `.max(128)` constraint on all password inputs in Zod schemas used prior to any cryptographic hash processing.
