## 2025-05-03 - Bcrypt Denial of Service (DoS) Prevention
**Vulnerability:** Bcrypt CPU exhaustion via unbounded input lengths.
**Learning:** Authentication and verification schemas did not enforce maximum length constraints on strings passed to cryptographic functions like `bcrypt.compare` and `bcrypt.hash`. An attacker could submit extremely large strings, causing excessive CPU consumption and potentially blocking the Node.js event loop, leading to a Denial of Service.
**Prevention:** Always enforce a maximum length constraint (e.g., `.max(128)`) on all password, username, and token fields in validation schemas used for both creation and verification, limiting the maximum computational work bcrypt needs to perform.
