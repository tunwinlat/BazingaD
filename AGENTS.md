# Repository guidance

- This is a Next.js App Router / React / TypeScript app with Prisma 6 and SQLite. The standalone offline browser extension under `extension/` is separate from the server app.
- Use `npm ci`, `npm run db:generate`, `npm test` (Vitest), `npm run lint`, `npx tsc --noEmit`, and `npm run build` to install/check changes. Set `DATABASE_URL` when applying or checking migrations.
- Schema changes need a committed migration under `prisma/migrations/`. Preserve existing settings/data and keep migration defaults aligned with application defaults.
- News AI transport lives in `src/lib/ai.ts`; browser-safe defaults, endpoint resolution, and format types live in `src/lib/ai-config.ts`. Support OpenAI Chat Completions and Anthropic Messages, including compatible gateways. Existing installations default to MiniMax.
- News settings writes require admin authentication and Zod validation. Use `serializeNewsSettings` for responses: never return stored keys, preserve the `********` sentinel on updates, and hide private AI configuration from unauthenticated callers.
- Local/private HTTP AI endpoints are intentionally allowed for admin-configured self-hosted inference. Reject URL credentials/fragments and redirects; keep request timeouts and do not log provider response bodies or keys.
- Preserve the news processor's existing prompt/cleanup, five-second AI request spacing, deduplication, retention, and background/cron entry points when changing providers.
- Extension smoke tests use Selenium 4.52.0 and real browsers under Xvfb (`extension/tests/smoke.py`). Keep Chrome for Testing paired with its exact driver, enable GeckoDriver system access for privileged extension pages, and keep sandbox disabling confined to disposable CI sessions. See extension/README.md for commands and diagnostic artifacts.
- Update README.md, .env.example, and extension/README.md when relevant configuration or behavior changes. Keep the shared news settings type aligned with API responses.
