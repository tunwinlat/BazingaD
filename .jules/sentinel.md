## 2023-10-27 - Bcrypt Denial of Service (DoS) Vulnerability
**Vulnerability:** Usernames and passwords provided during authentication or change operations did not have upper length limits enforced.
**Learning:** Bcrypt's computational cost grows with input string length. An attacker could send extremely long strings to trigger high CPU usage, leading to a Denial of Service.
**Prevention:** Enforce strict maximum length limits (e.g., `.max(128)`) on all password and username validation schemas across the codebase before hashing or comparison functions are called.
