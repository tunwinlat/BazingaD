<div align="center">

# BazingaD

**A self-hosted browser start page with categorized links, service monitoring, live sports, news, weather, and commute traffic.**

Built with Next.js, TypeScript, Prisma, and SQLite.

[![Version](https://img.shields.io/badge/version-2.3.7-6366f1)](package.json)
[![License: MPL-2.0](https://img.shields.io/badge/license-MPL--2.0-blue.svg)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma 6](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Self-hosted](https://img.shields.io/badge/deployment-self--hosted-6f42c1)](#docker-deployment)

[Features](#features) · [Quick start](#quick-start) · [Configuration](#configuration) · [Architecture](#architecture) · [Development](#development)

</div>

BazingaD replaces your browser's new-tab page with a personal dashboard. Organize links into categorized blocks, watch the health of your self-hosted services, follow live scores from a dozen sports leagues, skim AI-summarized news from your own RSS feeds, and check the weather and your commute—all from a single self-hosted page. Dashboard data stays in your database; enabled integrations send requests to their configured providers, including article titles and excerpts sent to your chosen AI endpoint.

## Features

| Area | What is included |
| --- | --- |
| Link dashboard | Categorized blocks with custom icons or auto-fetched favicons, alphabetical sorting, category reordering and disabling, four layout views (comfortable, compact, dense, list), and optional open-in-new-tab behavior. |
| Unified search | Search across all blocks with full keyboard navigation (`/` to focus, arrow keys, Enter, Esc) and an accessible combobox pattern. |
| Service monitoring | Per-block health checks with online/offline status indicators and a status dock for monitored services. |
| Sports | Live scores from 12 leagues (NFL, NBA, MLB, NHL, Premier League, La Liga, Bundesliga, Serie A, Ligue 1, MLS, Champions League, FIFA World Cup) via the public ESPN API—no API key required. Pin matches (persisted in the browser), view match facts with team stats, leaders, and event timelines, per-league collapsing, and auto-refresh when the tab becomes visible. |
| News | RSS feed aggregation with AI-generated titles and summaries through configurable OpenAI Chat Completions or Anthropic Messages endpoints (including MiniMax), topic filtering, read/unread state with configurable retention, a news ticker, a dedicated `/news` page, and a cron-protected refresh job. |
| Weather | Current conditions via Open-Meteo (free, no API key) with location search and metric/imperial units. |
| Traffic | Commute times between home and work via Google Routes or TomTom (bring your own API key), with travel-mode selection, color-coded status, 30-minute caching, and fetch-only-while-visible to conserve quota. |
| Gadget bar | Configurable left/right gadget bars, including a password generator and a sports scoreboard. |
| Customization | 20 built-in themes, custom site title, favicon upload, and a first-run setup wizard. |
| Security | Admin authentication with bcrypt hashing, TOTP two-factor authentication with recovery code, session management with revocation, optional dashboard password protection, rate limiting, and security headers. |
| Administration | Web UI at `/admin` for blocks, categories, general settings, security, integrations, and gadgets. CLI password reset for lockouts. |
| Deployment | Multi-stage Dockerfile (non-root user, health check) and Docker Compose, or any Node.js host with persistent storage. |

## Technology stack

| Layer | Technology |
| --- | --- |
| Application | Next.js 16 App Router (Turbopack), React 19, TypeScript 5 |
| Styling | Tailwind CSS 4, 20 theme definitions |
| Data | Prisma 6, SQLite |
| Authentication | bcryptjs password hashing, TOTP 2FA with `otpauth` and QR-code enrollment |
| Validation | Zod |
| Integrations | ESPN (sports), Open-Meteo (weather/geocoding), Google Routes or TomTom (traffic), OpenAI-/Anthropic-compatible endpoints including MiniMax (news AI), RSS via `rss-parser` |
| UI | Lucide icons, `sonner` toasts, `rate-limiter-flexible` |
| Testing | Vitest (unit, API settings, and news integration tests) |
| Deployment | Docker (multi-stage, non-root), Docker Compose |

## Quick start

### Prerequisites

- Docker (recommended), or
- Node.js 20.9 or newer (the Docker image uses Node.js 22) and npm

### Using Docker Compose (recommended)

The included Compose file uses the Docker Hub image by default. Set `BAZINGAD_IMAGE` to use a published GitHub Container Registry image instead:

```bash
BAZINGAD_IMAGE=ghcr.io/tunwinlat/bazingad:latest docker compose up -d
```

To write your own Compose file, use this example:

```yaml
services:
  startpage:
    image: twlatx/bazingad:latest
    container_name: bazingad
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/data/prod.db
    volumes:
      - bazingad-data:/app/data
    restart: unless-stopped

volumes:
  bazingad-data:
```

```bash
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000). The entrypoint runs database migrations and seeds starter content on first launch. Visit `/setup` to create the admin account, then manage everything from `/admin`.

### Building from source

```bash
git clone https://github.com/tunwinlat/BazingaD.git
cd BazingaD
npm ci
cp .env.example .env   # then edit DATABASE_URL if needed
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and complete the setup wizard.

## Configuration

### Environment variables

| Variable | Requirement | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Required | SQLite connection URL, e.g. `file:./data/dev.db` locally or `file:/app/data/prod.db` in Docker. |
| `CRON_SECRET` | Optional | Shared secret protecting the `POST /api/jobs/news` refresh endpoint. When set, callers must send it in the `x-cron-secret` header. |

All other credentials—Google Routes / TomTom traffic keys and the news AI key—are entered in the admin UI and stored in the database, not in environment variables. Saved keys are masked in settings responses, including for admins. Back up and restrict access to the database: provider keys are stored there, not encrypted at rest.

### Admin settings

Visit `/admin` to manage:

- **Blocks & Categories** — links, icons, monitoring, ordering
- **General** — site title, favicon, theme, default view, link behavior, navigation transitions
- **Security** — password change, TOTP 2FA enrollment, active sessions, dashboard protection
- **Integrations** — weather location/units, traffic provider and addresses, news feeds/topics, AI endpoint/key/model, and retention
- **Gadgets** — left/right gadget bar composition

### Configuring news AI

In `/admin`, open **Integrations**, expand **RSS News & Summarization**, enable news, and enter these three values under **AI API Configuration**:

1. **Endpoint URL** — a full API endpoint or API base URL reachable from the BazingaD server.
2. **API Key** — the key issued by that endpoint's provider.
3. **Model ID** — the exact model identifier supported by that endpoint and your account.

Save the news settings. Both automatic background refreshes and `POST /api/jobs/news` use this configuration. No provider SDK, environment variable, or code change is required.

| Service / protocol | Example endpoint | Model ID |
| --- | --- | --- |
| MiniMax (existing default) | `https://api.minimax.io/v1/chat/completions` | `MiniMax-M3` |
| OpenAI Chat Completions | `https://api.openai.com/v1/chat/completions` or `https://api.openai.com/v1` | A Chat Completions model available to your account |
| Anthropic Messages | `https://api.anthropic.com/v1/messages` or `https://api.anthropic.com` | A Messages model available to your account |
| OpenAI-compatible gateway / local server | `https://gateway.example/v1/chat/completions` or `http://localhost:11434/v1` | The gateway's exact model ID |
| Anthropic-compatible gateway | `https://gateway.example/v1/messages` | The gateway's exact model ID |

**API Format** is optional and defaults to **Auto-detect**. A full URL ending in `/messages`, the hostname `api.anthropic.com`, or a proxy path containing `/anthropic` selects Anthropic Messages. Other URLs select OpenAI Chat Completions. For an ambiguous custom Anthropic base URL, either use its full `/v1/messages` endpoint or select **Anthropic Messages** explicitly. An explicit format must match a full endpoint's path.

For base URLs, a bare origin gains `/v1`; OpenAI bases then gain `/chat/completions`. Anthropic bases gain `/v1/messages`, or just `/messages` if the base already ends in a version such as `/v1`. Full endpoints keep their path (with trailing slashes removed) and query string. OpenAI uses Bearer authentication; Anthropic uses `x-api-key` and `anthropic-version: 2023-06-01`. These are non-streaming text APIs; OpenAI Responses-only endpoints and services requiring a different authentication scheme are not supported.

Existing installations keep their saved MiniMax key and receive the previous endpoint/model as migration defaults. The saved key displays as `********`: leaving it unchanged preserves it, entering a new key replaces it, and clearing it removes it. Changing providers usually requires replacing all three values. Refreshing requires news to be enabled and a saved key; removing the key stops new AI summaries without deleting existing articles.

Only configure endpoints you trust: the server sends the key, article title, and up to 3,000 characters of article content there. Local/private HTTP endpoints are intentionally allowed for self-hosted inference; use HTTPS for remote services. In Docker, `localhost` refers to the BazingaD container, not your host. Requests time out after 30 seconds and redirects are rejected to avoid forwarding credentials. Provider HTTP failures are logged by status without their response bodies; check server logs for authentication, rate-limit, or model errors. AI requests remain spaced at least five seconds apart.

### Upgrading an existing installation

Back up the SQLite database first. Docker deployments apply migrations automatically on startup. For a source deployment, stop the app, install dependencies, apply migrations to the existing database, regenerate the client, and rebuild:

```bash
npm ci
npx prisma migrate deploy
npm run db:generate
npm run build
npm run start
```

Keep `DATABASE_URL` pointing to the same persistent database. The AI migration only adds settings columns; it does not reset keys, feeds, or articles.

### Resetting a forgotten admin password

Requires shell access to the server:

```bash
# Local development
DATABASE_URL=file:./data/dev.db npm run admin:reset-password

# Docker
docker exec -it bazingad node scripts/reset-admin-password.js
```

The script lists users, prompts for a new password with hidden input, and invalidates all sessions. Add `--clear-totp` to also disable 2FA if the authenticator is lost.

## Architecture

```mermaid
flowchart LR
    Browser[Browser] --> Pages[App Router pages: dashboard, /news, /admin, /setup]
    Browser --> API[Route handlers under /api]
    Cron[Cron scheduler] --> Jobs[/api/jobs/news]

    Pages --> API
    API --> Services[Auth, cache, rate limiting, validation]
    Services --> Prisma[Prisma 6]
    Prisma --> DB[(SQLite)]

    Services --> ESPN[ESPN scoreboard API]
    Services --> OpenMeteo[Open-Meteo weather & geocoding]
    Services --> Traffic[Google Routes / TomTom]
    Services --> AI[Configured OpenAI / Anthropic-compatible AI]
    Services --> Feeds[RSS feeds]
```

External responses are cached in memory (sports scores, weather, traffic) to respect provider quotas, and mutations to settings or content invalidate their caches. Third-party API keys are stored in the server-side database and masked in settings responses. News AI endpoint/model/format settings are available only to authenticated admins.

### Repository layout

```text
BazingaD/
├── extension/              # Standalone offline browser extension (see its README)
├── prisma/                 # Schema, migrations, and seed data
├── public/                 # Static assets
├── scripts/                # CLI utilities (password reset, news seeding)
├── src/
│   ├── app/                # Dashboard, /news, /admin, /setup, and /api routes
│   ├── components/         # Dashboard, sports, news, gadget, and admin UI
│   ├── lib/                # AI adapters/config, auth, cache, rate limiting, sports, news, themes, validation
│   └── types/              # Shared TypeScript types
├── Dockerfile              # Multi-stage production image
├── docker-compose.yml      # Compose deployment
└── package.json            # Scripts and dependency manifest
```

## Development

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Create a production build. |
| `npm run start` | Start the production server. |
| `npm run lint` | Run ESLint. |
| `npm run test` | Run the Vitest suite. |
| `npx tsc --noEmit` | Check TypeScript types (generate Prisma Client first). |
| `npx prisma migrate deploy` | Apply committed migrations to an existing database. |
| `npm run db:migrate` | Run Prisma migrations in development. |
| `npm run db:seed` | Seed starter categories, blocks, and news feeds. |
| `npm run db:generate` | Regenerate Prisma Client. |
| `npm run admin:reset-password` | Interactively reset an admin password. |

## Docker deployment

Pull and run the published image:

```bash
docker pull twlatx/bazingad:latest
docker run -d \
  --name bazingad \
  -p 3000:3000 \
  -v bazingad-data:/app/data \
  -e NODE_ENV=production \
  -e DATABASE_URL=file:/app/data/prod.db \
  --restart unless-stopped \
  twlatx/bazingad:latest
```

The SQLite database lives in the mounted volume at `/app/data/prod.db`. Migrations and first-run seeding happen automatically via the entrypoint. A built-in health check polls `/api/health`.

Useful commands:

```bash
docker compose logs -f     # follow logs
docker compose down        # stop
```

### Publishing a Docker release

1. Run `npm version <version> --no-git-tag-version`, commit the version bump in `package.json` and `package-lock.json`, and merge it into `master`.
2. Publish a [GitHub release](https://github.com/tunwinlat/BazingaD/releases/new) with a new tag `v<version>` targeting that commit.
3. Check the **Docker release** workflow in GitHub Actions. It builds the Linux x86-64 image, starts it against a fresh SQLite database, and publishes `ghcr.io/tunwinlat/bazingad:<version>` after the health check passes.

The stable release marked **Latest** on GitHub also publishes the `latest` image tag. Prereleases publish only their version tag. To validate the container without publishing, run **Docker release** manually from the Actions tab.

GitHub makes a new GHCR package private on first publish. For anonymous pulls, set the package visibility to **Public** in its package settings.

## License

BazingaD is licensed under the [Mozilla Public License 2.0](LICENSE). Modifications to MPL-covered files must remain available under the MPL when distributed.
