# Technology Stack

**Analysis Date:** 2026-03-01

## Languages

**Primary:**

- JavaScript (ES2022+) - All backend source code (`backend/src/`)
- JavaScript (ESM) - All frontend source code (`frontend/src/`), uses `"type": "module"`

**Secondary:**

- None detected

## Runtime

**Environment:**

- Node.js 20 (Alpine) - specified in both `backend/Dockerfile` and `frontend/Dockerfile` via `node:20-alpine`

**Package Manager:**

- npm — used in both `backend/package.json` and `frontend/package.json`
- Lockfile: `package-lock.json` present (referenced in Dockerfiles via `package-lock.json*`)

## Frameworks

**Core (Backend):**

- Express 4.21 - HTTP server and REST API framework (`backend/src/index.js`)
- Sequelize 6.37 - ORM for PostgreSQL (`backend/src/config/database.js`, `backend/src/models/`)

**Core (Frontend):**

- React 18.3 - UI framework (`frontend/src/App.jsx`, `frontend/src/main.jsx`)
- React Router DOM 6.30 - Client-side routing (`frontend/src/pages/`)
- MUI (Material UI) 5.18 - Component library (`frontend/src/components/`)
- @tanstack/react-query 5.90 - Server state management and data fetching (`frontend/src/hooks/`)
- @hello-pangea/dnd 18 - Drag-and-drop for boards (`frontend/src/components/`)

**Build/Dev:**

- Vite 5.4 - Frontend dev server and build tool (`frontend/vite.config.js`)
- @vitejs/plugin-react 4.7 - Vite plugin for React JSX transform
- nodemon 3.1 - Backend auto-reload in development

**Serving (Production):**

- nginx (Alpine) - Serves the built frontend SPA and proxies `/api/` to backend (`frontend/nginx.conf`, `frontend/Dockerfile`)

## Key Dependencies

**Critical (Backend):**

- `jsonwebtoken` 9.0 - JWT signing and verification (`backend/src/middleware/auth.js`, `backend/src/controllers/authController.js`)
- `bcryptjs` 3.0 - Password hashing with salt rounds of 10 (`backend/src/controllers/authController.js`)
- `express-validator` 7.3 - Request body validation (`backend/src/controllers/authController.js`)
- `cors` 2.8 - Cross-origin resource sharing configured via `CORS_ORIGIN` env var (`backend/src/index.js`)
- `cookie-parser` 1.4 - Parses httpOnly JWT cookie (`backend/src/index.js`)
- `pg` 8.19 + `pg-hstore` 2.3 - PostgreSQL driver used by Sequelize
- `dotenv` 16.4 - Loads `backend/.env` into `process.env` (`backend/src/index.js`)

**Critical (Frontend):**

- `axios` 1.13 - HTTP client with a shared instance and 401 interceptor (`frontend/src/api/axios.js`)
- `@emotion/react` + `@emotion/styled` 11.14 - CSS-in-JS runtime required by MUI
- `date-fns` 3.6 - Date formatting utilities (`frontend/src/components/DueDatePicker.jsx`)

## Configuration

**Environment (Backend):**

- Configured via `backend/.env` (loaded by `dotenv` at startup)
- Required vars:
  - `DB_NAME` — PostgreSQL database name
  - `DB_USER` — PostgreSQL username
  - `DB_PASSWORD` — PostgreSQL password
  - `DB_HOST` — Database host (defaults to `localhost`)
  - `DB_PORT` — Database port (defaults to `5432`)
  - `JWT_SECRET` — Secret key for JWT signing
  - `PORT` — Server port (defaults to `5000`)
  - `CORS_ORIGIN` — Allowed CORS origin (defaults to `http://localhost:3000`)
  - `NODE_ENV` — Controls SQL logging and cookie `secure` flag

**Build (Frontend):**

- `frontend/vite.config.js` — minimal config; no dev proxy (nginx handles routing in Docker)
- No `.env` files used in frontend; API base URL is `/api` (relative, proxied by nginx)

## Platform Requirements

**Development:**

- Node.js 20+, npm
- Docker + Docker Compose for full-stack local run (`docker-compose.yml`)
- PostgreSQL 16 (provided by Docker service `db`)

**Production:**

- Docker containers: `db` (postgres:16-alpine), `backend` (node:20-alpine), `frontend` (nginx:alpine)
- Backend exposed on port `5000`, frontend on port `3000` (mapped from nginx port 80)
- Persistent volume `postgres_data` for database storage

---

_Stack analysis: 2026-03-01_
