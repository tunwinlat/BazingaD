## 2025-04-25 - Bcrypt DoS Mitigation
**Vulnerability:** Missing maximum length constraints on password and username fields in authentication-related validation schemas (e.g., login, setup, password change, dashboard login, totp disable).
**Learning:** Bcrypt's computational cost increases with input length. Without a maximum length limit, extremely large strings can exhaust CPU resources during the initial hashing or comparison phase, leading to a Denial of Service (DoS) vulnerability.
**Prevention:** Enforce a maximum length constraint (standard: `.max(128)`) on all password and username fields in validation schemas used for both creation and verification.
