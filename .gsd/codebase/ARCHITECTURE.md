# Architecture

**Analysis Date:** 2026-03-01

## Pattern Overview

**Overall:** Client-Server SPA with REST API backend and React frontend

**Key Characteristics:**

- Full-stack JavaScript: Node.js/Express backend + React (Vite) frontend
- Containerized via Docker Compose: three services (`db`, `backend`, `frontend`)
- JWT authentication via httpOnly cookies — stateless server, session rehydrated client-side on load
- Frontend communicates exclusively through a shared Axios instance (`frontend/src/api/axios.js`) with a `/api` base URL
- Backend uses Sequelize ORM with PostgreSQL; models define their own associations via a static `associate()` pattern

## Layers

**Database Layer:**

- Purpose: Persistent storage for all application data
- Runtime: PostgreSQL 16 (Docker service `db`)
- ORM: Sequelize 6
- Connection config: `backend/src/config/database.js`
- Models: `backend/src/models/` (one file per model class)

**Backend Layer (Node.js / Express):**

- Purpose: REST API serving data and enforcing business logic/auth
- Entry point: `backend/src/index.js`
- Routes: `backend/src/routes/` — one file per resource, registered via `backend/src/routes/index.js`
- Controllers: `backend/src/controllers/` — stateless async handlers; one file per resource
- Middleware: `backend/src/middleware/` — auth guard (`auth.js`) + global error handler (`errorHandler.js`)
- Models: `backend/src/models/` — Sequelize Model subclasses initialized and associated in `backend/src/models/index.js`
- Depends on: PostgreSQL DB
- Used by: React frontend (HTTP requests)

**Frontend Layer (React / Vite):**

- Purpose: SPA browser application
- Entry: `frontend/src/main.jsx` → `frontend/src/App.jsx`
- Pages: `frontend/src/pages/` — full route-level components
- Components: `frontend/src/components/` — reusable UI components
- Hooks: `frontend/src/hooks/` — data-fetching via TanStack React Query
- API clients: `frontend/src/api/` — thin wrappers around Axios
- State: `frontend/src/store/AuthContext.jsx` — React Context for auth user; React Query for server state
- Served by: nginx (Docker service `frontend`) in production; Vite dev server in development

## Data Flow

**Authenticated Request Flow:**

1. Component calls a custom hook (e.g., `useBoardDetail(boardId)`)
2. Hook uses React Query `useQuery` / `useMutation` targeting an API function
3. API function calls the shared Axios instance in `frontend/src/api/axios.js` with `withCredentials: true`
4. Axios sends the `token` httpOnly cookie automatically
5. Express `auth` middleware (`backend/src/middleware/auth.js`) reads the cookie, verifies JWT, attaches `req.user`
6. Controller performs Sequelize query and returns JSON
7. React Query caches the response; on mutation success, `queryClient.invalidateQueries()` triggers refetch

**Authentication Flow:**

1. User submits credentials → `POST /api/auth/login`
2. `authController.login` validates request with `express-validator`, checks bcrypt hash
3. Signs a 7-day JWT and sets it as an httpOnly `token` cookie
4. Frontend `AuthContext` calls `getMe()` on mount to rehydrate session from cookie
5. All subsequent requests automatically include the cookie
6. 401 responses trigger a redirect to `/login` via the Axios response interceptor

**Drag-and-Drop Card Move Flow:**

1. User drops card → `DragDropContext.onDragEnd` fires in `BoardPage`
2. New position calculated using midpoint strategy: `(positionBefore + positionAfter) / 2`
3. `useMoveCard` mutation fires `PATCH /api/cards/:id/move`
4. Backend saves updated `list_id` and `position` (stored as float)
5. Board query `boardKeys.detail(boardId)` invalidated, board refetched

**State Management:**

- **Auth state:** React Context (`AuthContext`) — user object, `isLoading`, `login()`, `logout()`
- **Server state:** TanStack React Query — boards list (`['boards']`), board detail (`['board', boardId]`), card detail
- **No global client-side state manager** (Redux, Zustand, etc.) — all server data goes through React Query

## Key Abstractions

**Sequelize Model:**

- Purpose: Represents a database table; encapsulates schema and associations
- Pattern: Class extending `Model`; static `init(sequelize)` and `associate(models)` methods
- Examples: `backend/src/models/Board.js`, `backend/src/models/Card.js`, `backend/src/models/User.js`
- All models initialized and associated in: `backend/src/models/index.js`

**Express Controller:**

- Purpose: Handles a single resource's CRUD operations
- Pattern: Named async functions exported individually; all errors forwarded via `next(err)`
- Examples: `backend/src/controllers/boardController.js`, `backend/src/controllers/cardController.js`

**Custom React Hook:**

- Purpose: Encapsulates data fetching, caching, and mutation for a domain entity
- Pattern: Thin wrapper around React Query `useQuery`/`useMutation` + API function
- Examples: `frontend/src/hooks/useBoards.js`, `frontend/src/hooks/useBoardDetail.js`, `frontend/src/hooks/useCardDetail.js`

**API Module:**

- Purpose: Typed HTTP helper functions for a single resource
- Pattern: Functions that call `api` (the configured Axios instance) and unwrap `r.data`
- Examples: `frontend/src/api/boards.js`, `frontend/src/api/cards.js`

## Entry Points

**Backend Server:**

- Location: `backend/src/index.js`
- Triggers: `node src/index.js` (from `backend/package.json` start script)
- Responsibilities: Configures Express middleware, mounts `/api` router, authenticates DB, starts HTTP server

**Frontend SPA:**

- Location: `frontend/src/main.jsx` → wraps `<App>` with `<AuthProvider>` and `<QueryClientProvider>`
- Triggers: nginx serves `frontend/dist/index.html`; browser loads JS bundle
- Responsibilities: Bootstraps React tree, provides auth context and React Query client

**Route Registry:**

- Location: `backend/src/routes/index.js`
- Mounts: `/auth`, `/boards`, and root-level routes for lists/cards/labels/checklists

## Error Handling

**Strategy:** Centralized global handler on the backend; Axios interceptor on the frontend

**Backend Patterns:**

- All controller functions wrap logic in `try/catch` and call `next(err)` on failure
- Global handler in `backend/src/middleware/errorHandler.js` maps error types to HTTP codes:
  - `SequelizeUniqueConstraintError` → 409
  - `JsonWebTokenError` / `TokenExpiredError` → 401
  - All others → 500
- Input validation errors (express-validator) → 422, returned from controllers directly

**Frontend Patterns:**

- Axios response interceptor in `frontend/src/api/axios.js` redirects to `/login` on any 401
- React Query surfacing: hooks return `isError` / `error` state; pages render `<Alert>` components

## Cross-Cutting Concerns

**Authentication:** httpOnly JWT cookie; all protected routes use `auth` middleware before controller

**Validation:** `express-validator` used in `authController.js`; most other controllers do inline checks

**CORS:** configured in `backend/src/index.js` with `CORS_ORIGIN` env var; `credentials: true`

**Position Ordering:** Lists and Cards use float `position` fields and midpoint insertion strategy to avoid renumbering on drag-and-drop reorder

---

_Architecture analysis: 2026-03-01_
