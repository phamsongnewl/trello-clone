# Technology Stack

**Analysis Date:** 2026-03-01

## Languages

**Primary:**

- JavaScript (ES2022+) — All backend source (`backend/src/**`) uses CommonJS (`require`/`module.exports`)
- JavaScript (ESM) — All frontend source (`frontend/src/**`) uses ES Modules (`import`/`export`); enforced by `"type": "module"` in `frontend/package.json`

**Markup/Style:**

- JSX — React component files (`.jsx`) throughout `frontend/src/`

## Runtime

**Environment:**

- Node.js 20 (Alpine) — Both backend and frontend build stage run on `node:20-alpine` per `backend/Dockerfile` and `frontend/Dockerfile`

**Package Manager:**

- npm — Used in both `backend/` and `frontend/`
- Lockfile: `package-lock.json` expected (referenced in Dockerfiles via `COPY package-lock.json* ./`)

## Frameworks

**Backend:**

- Express 4.21 — HTTP server and REST API framework; entry point `backend/src/index.js`
- Sequelize 6.37 — ORM for PostgreSQL; models in `backend/src/models/`, config in `backend/src/config/database.js`

**Frontend:**

- React 18.3 — UI library; entry `frontend/src/main.jsx`, root component `frontend/src/App.jsx`
- React Router DOM 6.30 — Client-side routing; pages in `frontend/src/pages/`
- MUI (Material UI) 5.18 — Component library (`@mui/material`, `@mui/icons-material`)
- Emotion 11.14 — CSS-in-JS engine required by MUI (`@emotion/react`, `@emotion/styled`)
- TanStack React Query 5.90 — Server-state caching and data fetching; devtools included
- @hello-pangea/dnd 18.0 — Drag-and-drop (fork of react-beautiful-dnd) for board card/list reordering

**Build/Dev:**

- Vite 5.4 — Frontend dev server and production bundler; config at `frontend/vite.config.js`
- @vitejs/plugin-react 4.7 — Babel-based React Fast Refresh plugin for Vite
- nodemon 3.1 — Backend file watcher for development (`npm run dev`)

**Serving (Production):**

- nginx (Alpine) — Serves the compiled React SPA and reverse-proxies `/api/` to the backend; config at `frontend/nginx.conf`

## Key Dependencies

**Backend — Critical:**

- `jsonwebtoken` 9.0 — Signs and verifies JWT tokens; secret read from `JWT_SECRET` env var; used in `backend/src/middleware/auth.js`
- `bcryptjs` 3.0 — Password hashing for user credentials; used in `backend/src/controllers/authController.js`
- `sequelize` 6.37 + `pg` 8.19 + `pg-hstore` 2.3 — Full PostgreSQL ORM stack
- `express-validator` 7.3 — Request body validation in route handlers
- `cors` 2.8 — CORS middleware; origin controlled by `CORS_ORIGIN` env var
- `cookie-parser` 1.4 — Parses httpOnly cookie that carries the JWT token
- `dotenv` 16.4 — Loads `.env` file into `process.env` at startup

**Frontend — Critical:**

- `axios` 1.13 — HTTP client; singleton configured in `frontend/src/api/axios.js` with `baseURL: '/api'` and `withCredentials: true`
- `@tanstack/react-query` 5.90 — All API data fetching and caching
- `@hello-pangea/dnd` 18.0 — Drag-and-drop interactions on the board
- `date-fns` 3.6 — Date formatting utilities (e.g., `DueDatePicker.jsx`)

## Configuration

**Environment (Backend):**

- Loaded via `dotenv` at `backend/src/index.js` startup
- Template: `backend/.env.example`
- Required variables:
  - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — PostgreSQL connection
  - `PORT` — Backend HTTP port (default `5000`)
  - `NODE_ENV` — Controls Sequelize query logging (`development` enables it)
  - `JWT_SECRET` — HMAC secret for signing JWTs (must be a long random string in production)
  - `CORS_ORIGIN` — Allowed origin for CORS (default `http://localhost:3000`)
- Runtime config file: `backend/.env` (loaded by `env_file` in `docker-compose.yml`)

**Build (Frontend):**

- `frontend/vite.config.js` — Minimal config; only the React plugin is registered. No proxy is needed because nginx handles `/api/` proxying in production.
- Production build output: `/app/dist` (copied to nginx image)

## Platform Requirements

**Development:**

- Docker + Docker Compose (for full stack via `docker-compose.yml`)
- Node.js 20+ (for running backend/frontend directly without Docker)
- PostgreSQL 16 (provided by Docker Compose `db` service or a local instance)

**Production:**

- Containerised: Docker Compose orchestrates three services — `db` (postgres:16-alpine), `backend` (node:20-alpine), `frontend` (nginx:alpine)
- Backend exposed on port `5000`; frontend exposed on port `3000` (mapped from nginx port `80`)
- Persistent storage: Docker named volume `postgres_data` for database files

---

_Stack analysis: 2026-03-01_
