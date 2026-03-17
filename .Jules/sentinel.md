## 2024-05-24 - Privilege Escalation via Dashboard Tokens
**Vulnerability:** A standard dashboard token (e.g. `dashboard-token`) could be used as an `auth-token` to bypass admin authentication. `verifyAuth` in `src/lib/auth.ts` simply queried the database for the token, regardless of the token's type, meaning a valid dashboard session granted full admin API access.
**Learning:** Shared token tables without explicit type or scope columns can lead to privilege escalation if tokens from less-privileged contexts are used in high-privileged contexts.
**Prevention:** Implemented a unique prefix (`dash_`) for dashboard tokens and explicitly rejected any token starting with `dash_` in `verifyAuth` functions. In the future, explicitly define token scopes or types in the database schema.
