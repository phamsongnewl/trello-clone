# External Integrations

**Analysis Date:** 2026-03-01

## APIs & External Services

No third-party external APIs are integrated. All features are self-contained within the application stack. No SDKs for Stripe, SendGrid, AWS, Twilio, or similar services are present in either `backend/package.json` or `frontend/package.json`.

## Data Storage

**Databases:**

- PostgreSQL 16 (Alpine)
  - Connection: managed via Sequelize in `backend/src/config/database.js`
  - Env vars: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` (default: `localhost`), `DB_PORT` (default: `5432`)
  - Client/ORM: Sequelize 6 with `pg` + `pg-hstore` drivers
  - Connection pool: max 10, min 0, acquire timeout 30s, idle timeout 10s
  - Sync mode: `{ alter: false, force: false }` — no auto-migration on startup
  - In Docker: provided by the `db` service (`docker-compose.yml`), with health check before backend starts

**Models registered in `backend/src/models/index.js`:**
- `User` — `backend/src/models/User.js`
- `Board` — `backend/src/models/Board.js`
- `List` — `backend/src/models/List.js`
- `Card` — `backend/src/models/Card.js`
- `Label` — `backend/src/models/Label.js`
- `CardLabel` — `backend/src/models/CardLabel.js` (join table)
- `Checklist` — `backend/src/models/Checklist.js`
- `ChecklistItem` — `backend/src/models/ChecklistItem.js`

**File Storage:**

- Local filesystem only — no object storage (S3, GCS, etc.) detected

**Caching:**

- None — no Redis, Memcached, or in-memory cache layer detected

## Authentication & Identity

**Auth Provider:**

- Custom (self-hosted) — no OAuth providers (Google, GitHub, etc.) or identity services (Auth0, Clerk, Supabase) are used

**Implementation:**

- Registration/login handled in `backend/src/controllers/authController.js`
- Passwords hashed with `bcryptjs` (salt rounds: 10)
- Sessions implemented via signed JWT stored in an httpOnly cookie named `token`
  - Token signed with `JWT_SECRET` env var, expiry: 7 days
  - Cookie flags: `httpOnly: true`, `sameSite: 'lax'`, `secure: true` in production
- JWT validation middleware in `backend/src/middleware/auth.js` — verifies token from cookie, attaches `req.user`
- Frontend axios instance (`frontend/src/api/axios.js`) sends cookies on every request via `withCredentials: true`
- 401 responses trigger automatic redirect to `/login` via axios response interceptor

## Monitoring & Observability

**Error Tracking:**

- None — no Sentry, Datadog, or equivalent SDK detected

**Logs:**

- `console.log` / `console.error` only
- Sequelize SQL logging enabled in `development` mode (`NODE_ENV === 'development'`), disabled otherwise (`backend/src/config/database.js`)
- Health check endpoint: `GET /api/health` returns `{ status: 'ok' }` (used by Docker healthcheck)

## CI/CD & Deployment

**Hosting:**

- Docker Compose (`docker-compose.yml`) — three services: `db`, `backend`, `frontend`
- No cloud-specific deployment config detected (no Heroku Procfile, Render/Railway config, or Kubernetes manifests)

**CI Pipeline:**

- None detected — no `.github/workflows/` CI files, no CircleCI, no GitLab CI config

## Environment Configuration

**Required env vars (backend):**

- `DB_NAME` — PostgreSQL database name
- `DB_USER` — PostgreSQL username
- `DB_PASSWORD` — PostgreSQL password
- `DB_HOST` — Database host
- `DB_PORT` — Database port
- `JWT_SECRET` — JWT signing secret (keep secret)
- `PORT` — Backend server port (optional, defaults to `5000`)
- `CORS_ORIGIN` — Allowed frontend origin (optional, defaults to `http://localhost:3000`)
- `NODE_ENV` — `development` | `production`

**Secrets location:**

- `backend/.env` — loaded via `dotenv` (`backend/src/index.js`), referenced in `docker-compose.yml` via `env_file: ./backend/.env`
- No `.env.example` file detected

## Webhooks & Callbacks

**Incoming:**

- None — no webhook receiver endpoints detected

**Outgoing:**

- None — no outgoing HTTP calls to external services detected

---

_Integration audit: 2026-03-01_
