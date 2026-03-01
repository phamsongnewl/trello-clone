# External Integrations

**Analysis Date:** 2026-03-01

## APIs & External Services

**None detected.** The application is entirely self-hosted. No third-party SaaS APIs (payment, email, SMS, analytics, etc.) are integrated. All functionality is served by the custom REST API in `backend/src/`.

## Data Storage

**Databases:**

- PostgreSQL 16 (Alpine)
  - Used for all persistent application data
  - Schema managed by Sequelize ORM with `sequelize.sync()` (alter/force both `false` — additive sync only)
  - Connection: environment variables `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
  - Client: `pg` 8.19 + `pg-hstore` 2.3 (native PostgreSQL driver used by Sequelize)
  - ORM config: `backend/src/config/database.js`
  - Connection pool: max 10 connections, acquire timeout 30 s, idle timeout 10 s
  - Models: `User`, `Board`, `List`, `Card`, `Label`, `CardLabel`, `Checklist`, `ChecklistItem` — all in `backend/src/models/`
  - Associations registered in `backend/src/models/index.js`

**File Storage:**

- Not applicable — no file or image uploads are implemented.

**Caching:**

- None — no Redis or in-memory caching layer exists. TanStack React Query provides client-side cache in the browser only (`frontend/src/` hooks).

## Authentication & Identity

**Auth Provider:**

- Custom (self-hosted) — no third-party identity provider (Auth0, Firebase, Cognito, etc.)
  - Implementation: Username/password login; passwords hashed with `bcryptjs` in `backend/src/controllers/authController.js`
  - Session token: JWT signed with `JWT_SECRET` env var using `jsonwebtoken`; delivered and stored as an httpOnly cookie named `token`
  - Token verification: `backend/src/middleware/auth.js` reads the cookie, calls `jwt.verify()`, and attaches the `User` model instance to `req.user`
  - Frontend session: `AuthContext` (`frontend/src/store/AuthContext.jsx`) bootstraps session by calling `GET /api/auth/me` on mount; exposes `login()` and `logout()` hooks
  - Axios client (`frontend/src/api/axios.js`) sends `withCredentials: true` on every request so the cookie is included automatically
  - 401 responses trigger a redirect to `/login` via an Axios response interceptor

## Monitoring & Observability

**Error Tracking:**

- None — no Sentry, Datadog, or similar service is integrated.

**Logs:**

- Backend: `console.error` in `backend/src/middleware/errorHandler.js` and `console.log` for DB connection status in `backend/src/index.js`
- Sequelize query logging: enabled only when `NODE_ENV=development` (see `backend/src/config/database.js`)
- No structured logging library (e.g., Winston, Pino) is in use.

## CI/CD & Deployment

**Hosting:**

- Self-hosted Docker Compose stack; no cloud provider is configured.
- Services defined in `docker-compose.yml`: `db`, `backend`, `frontend`
- Health checks: `pg_isready` for db; `wget /api/health` for backend; `frontend` depends on backend being healthy

**CI Pipeline:**

- None — no GitHub Actions, GitLab CI, or other pipeline configuration files are present.

## Environment Configuration

**Required env vars (backend):**

```
DB_HOST        # PostgreSQL hostname (default: db — the Docker Compose service name)
DB_PORT        # PostgreSQL port (default: 5432)
DB_NAME        # Database name (default: trellodb)
DB_USER        # PostgreSQL user (default: postgres)
DB_PASSWORD    # PostgreSQL password
PORT           # Backend HTTP port (default: 5000)
NODE_ENV       # Application environment (development | production)
JWT_SECRET     # HMAC secret for JWT signing — CHANGE IN PRODUCTION
CORS_ORIGIN    # Allowed CORS origin (default: http://localhost:3000)
```

**Secrets location:**

- `backend/.env` — loaded at runtime via `env_file` directive in `docker-compose.yml`
- `backend/.env.example` — safe template committed to the repo with placeholder values

## Webhooks & Callbacks

**Incoming:**

- None — no webhook endpoints are defined.

**Outgoing:**

- None — the backend makes no outbound HTTP calls to external services.

---

_Integration audit: 2026-03-01_
