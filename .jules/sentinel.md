## 2024-05-24 - DoS Vulnerability in Authentication Endpoints via Long Inputs
**Vulnerability:** Bcrypt Denial of Service (DoS) due to missing max length constraints on password and username fields in Zod validation schemas (e.g., `loginSchema`, `dashboardLoginSchema`, `disableTotpSchema`).
**Learning:** Bcrypt's computational cost increases with input length. Without maximum length constraints, an attacker could submit extremely large strings (e.g., millions of characters), exhausting CPU resources during hashing or comparison and causing a Denial of Service.
**Prevention:** Enforce a maximum length constraint (standard: `.max(128)`) on all password and username fields in validation schemas used for both creation and verification.
