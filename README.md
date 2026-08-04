<div align="center">

# BazingaD

**A self-hosted browser start page with categorized links, service monitoring, live sports, news, weather, and commute traffic.**

Built with Next.js, TypeScript, Prisma, and SQLite.

[![Version](https://img.shields.io/badge/version-2.3.7-6366f1)](package.json)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma 6](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Self-hosted](https://img.shields.io/badge/deployment-self--hosted-6f42c1)](#docker-deployment)

[Features](#features) · [Quick start](#quick-start) · [Configuration](#configuration) · [Architecture](#architecture) · [Development](#development)

</div>

BazingaD replaces your browser's new-tab page with a personal dashboard. Organize links into categorized blocks, watch the health of your self-hosted services, follow live scores from a dozen sports leagues, skim AI-summarized news from your own RSS feeds, and check the weather and your commute—all from a single page, with your data staying on your own server.

## Features

| Area | What is included |
| --- | --- |
| Link dashboard | Categorized blocks with custom icons or auto-fetched favicons, alphabetical sorting, category reordering and disabling, four layout views (comfortable, compact, dense, list), and optional open-in-new-tab behavior. |
| Unified search | Search across all blocks with full keyboard navigation (`/` to focus, arrow keys, Enter, Esc) and an accessible combobox pattern. |
| Service monitoring | Per-block health checks with online/offline status indicators and a status dock for monitored services. |
| Sports | Live scores from 12 leagues (NFL, NBA, MLB, NHL, Premier League, La Liga, Bundesliga, Serie A, Ligue 1, MLS, Champions League, FIFA World Cup) via the public ESPN API—no API key required. Pin matches (persisted in the browser), view match facts with team stats, leaders, and event timelines, per-league collapsing, and auto-refresh when the tab becomes visible. |
| News | RSS feed aggregation with AI-generated titles and summaries (MiniMax), topic filtering, read/unread state with configurable retention, a news ticker, a dedicated `/news` page, and a cron-protected refresh job. |
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
| Integrations | ESPN (sports), Open-Meteo (weather/geocoding), Google Routes or TomTom (traffic), MiniMax (news AI), RSS via `rss-parser` |
| UI | Lucide icons, `sonner` toasts, `rate-limiter-flexible` |
| Testing | Node.js test runner (`node --test`) |
| Deployment | Docker (multi-stage, non-root), Docker Compose |

## Quick start

### Prerequisites

- Docker (recommended), or
- Node.js 20.9 or newer (the Docker image uses Node.js 22) and npm

### Using Docker Compose (recommended)

The easiest way to run BazingaD is the pre-built image from Docker Hub:

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

All other credentials—Google Routes / TomTom traffic keys and the MiniMax news key—are entered in the admin UI and stored in the database, not in environment variables. They are never exposed back to the client in full.

### Admin settings

Visit `/admin` to manage:

- **Blocks & Categories** — links, icons, monitoring, ordering
- **General** — site title, favicon, theme, default view, link behavior, navigation transitions
- **Security** — password change, TOTP 2FA enrollment, active sessions, dashboard protection
- **Integrations** — weather location/units, traffic provider and addresses, news feeds and AI key
- **Gadgets** — left/right gadget bar composition

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
    Services --> MiniMax[MiniMax AI]
    Services --> Feeds[RSS feeds]
```

External responses are cached in memory (sports scores, weather, traffic) to respect provider quotas, and mutations to settings or content invalidate their caches. Third-party API keys are stored server-side only.

### Repository layout

```text
BazingaD/
├── prisma/                 # Schema, migrations, and seed data
├── public/                 # Static assets
├── scripts/                # CLI utilities (password reset, news seeding)
├── src/
│   ├── app/                # Dashboard, /news, /admin, /setup, and /api routes
│   ├── components/         # Dashboard, sports, news, gadget, and admin UI
│   ├── lib/                # Auth, cache, rate limiting, sports, news, themes, validation
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
| `npm run test` | Run the test suite (`node --test`). |
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

## License

MIT License.
