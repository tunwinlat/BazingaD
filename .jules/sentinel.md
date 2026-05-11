## 2024-05-18 - Bcrypt Denial of Service (DoS) Prevention
**Vulnerability:** Bcrypt hashing/comparison endpoints lacked input length constraints on password, confirmation, and username fields in Zod schemas.
**Learning:** Bcrypt's computational cost increases with input size. Passing extremely large strings can cause severe CPU exhaustion during parsing/comparing, leading to DoS.
**Prevention:** Enforce a strict length limit (e.g., standard `.max(128)`) on all inputs that are validated or processed using bcrypt to prevent resource exhaustion attacks.
