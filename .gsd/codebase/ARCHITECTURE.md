# Architecture

**Analysis Date:** 2026-03-01

## Pattern Overview

**Overall:** Full-stack client-server SPA with layered REST API backend

**Key Characteristics:**

- Separated frontend (React SPA) and backend (Express REST API) services, each in its own Docker container
- Backend follows a strict four-layer pipeline: Routes → Middleware → Controllers → Models
- Frontend uses React Query for server-state management and React Context for auth state; no global Redux/Zustand store
- JWT authentication via httpOnly cookies — token is transparent to frontend JavaScript
- All API communication flows through a single Axios instance (`frontend/src/api/axios.js`)

## Layers

**Routing Layer (Backend):**

- Purpose: Declare HTTP endpoints and attach middleware chains
- Location: `backend/src/routes/`
- Contains: Express Router instances per resource (`boards.js`, `lists.js`, `cards.js`, `labels.js`, `checklists.js`, `auth.js`), aggregated in `backend/src/routes/index.js`
- Depends on: Middleware layer, Controller layer
- Used by: Express app entry point (`backend/src/index.js`) via `app.use('/api', apiRouter)`

**Middleware Layer (Backend):**

- Purpose: Cross-cutting concerns — authentication guard and global error handling
- Location: `backend/src/middleware/`
- Contains: `auth.js` (JWT cookie verification, attaches `req.user`), `errorHandler.js` (maps errors to HTTP status codes)
- Depends on: Models layer (auth reads `User`)
- Used by: Route definitions (per-route `auth` guard) and app entry point (global `errorHandler`)

**Controller Layer (Backend):**

- Purpose: Handle HTTP request/response cycle, invoke ORM queries, return JSON
- Location: `backend/src/controllers/`
- Contains: `authController.js`, `boardController.js`, `cardController.js`, `checklistController.js`, `labelController.js`, `listController.js`
- Depends on: Models layer
- Used by: Routing layer

**Model Layer (Backend):**

- Purpose: Define database schema and inter-model associations via Sequelize ORM classes
- Location: `backend/src/models/`
- Contains: `User.js`, `Board.js`, `List.js`, `Card.js`, `Label.js`, `CardLabel.js` (join table), `Checklist.js`, `ChecklistItem.js`; `index.js` initialises all models and wires associations
- Depends on: `backend/src/config/database.js` (Sequelize instance)
- Used by: Controller layer and auth middleware

**API Client Layer (Frontend):**

- Purpose: Encapsulate all HTTP calls; single point for base URL and credential config
- Location: `frontend/src/api/`
- Contains: `axios.js` (configured Axios instance with 401 interceptor), per-resource modules: `auth.js`, `boards.js`, `cards.js`, `lists.js`, `labels.js`, `checklists.js`
- Depends on: `axios.js` instance
- Used by: Custom hooks layer

**Custom Hooks Layer (Frontend):**

- Purpose: Bind React Query queries and mutations to API calls; own server-state cache keys
- Location: `frontend/src/hooks/`
- Contains: `useBoardDetail.js`, `useBoards.js`, `useCardDetail.js`
- Depends on: API client layer, React Query
- Used by: Page and component layers

**Page Layer (Frontend):**

- Purpose: Route-level components; compose layout, invoke hooks, handle top-level logic
- Location: `frontend/src/pages/`
- Contains: `LoginPage.jsx`, `RegisterPage.jsx`, `DashboardPage.jsx`, `BoardPage.jsx`
- Depends on: Custom hooks layer, component layer, React Router
- Used by: Router in `frontend/src/App.jsx`

**Component Layer (Frontend):**

- Purpose: Reusable UI building blocks; receive props and mutations from pages or hooks
- Location: `frontend/src/components/`
- Contains: `Navbar.jsx`, `BoardCard.jsx`, `ListColumn.jsx`, `CardItem.jsx`, `CardModal.jsx`, `AddListForm.jsx`, `AddCardForm.jsx`, `ChecklistSection.jsx`, `LabelPicker.jsx`, `DueDatePicker.jsx`, `CreateBoardModal.jsx`
- Depends on: MUI components, API client layer (direct for simple mutations)
- Used by: Page layer

## Data Flow

**Authenticated API Request:**

1. Component or hook calls an API client function (e.g., `getBoards()` in `frontend/src/api/boards.js`)
2. Axios instance (`frontend/src/api/axios.js`) sends request with `withCredentials: true`, attaching the httpOnly cookie
3. Express routes in `backend/src/routes/` match the path and invoke `auth` middleware
4. `auth.js` reads `req.cookies.token`, verifies JWT, fetches `User`, sets `req.user`
5. Controller function executes Sequelize queries and returns JSON response
6. React Query caches the response; React re-renders consuming components

**Authentication Flow:**

1. `LoginPage` calls `useAuth().login()` from `frontend/src/store/AuthContext.jsx`
2. `AuthContext` calls `apiLogin()` → `POST /api/auth/login`
3. Backend `authController.register/login` validates credentials, signs JWT, sets httpOnly cookie via `res.cookie()`
4. On success, `AuthContext` updates `user` state, triggering protected route re-render
5. On 401 from any subsequent request, the Axios interceptor hard-redirects to `/login`

**Drag-and-Drop Card Move:**

1. `BoardPage` wraps columns in `<DragDropContext onDragEnd={handleDragEnd}>`
2. `handleDragEnd` calculates new float position using midpoint of neighbouring card positions
3. `useMoveCard` mutation fires `PATCH /api/cards/:id` with `{ list_id, position }`
4. React Query optimistically updates cache; backend persists the change

**State Management:**

- Server state: React Query (`@tanstack/react-query`) — queries cached by key factories in hook files (e.g., `boardKeys.detail(boardId)`)
- Auth state: React Context (`frontend/src/store/AuthContext.jsx`) — `user`, `isLoading`, `login`, `logout`
- No global client-side store for UI state; local `useState` used inside components

## Key Abstractions

**Sequelize Model Class:**

- Purpose: Represents a database table with schema definition and associations
- Examples: `backend/src/models/Board.js`, `backend/src/models/Card.js`
- Pattern: Each model exports a class extending `Model` with a static `init(sequelize)` method and an optional `static associate(models)` method for foreign-key relationships

**React Query Hook:**

- Purpose: Bespoke hook that wraps `useQuery` or `useMutation` for a given resource/action
- Examples: `frontend/src/hooks/useBoardDetail.js`, `frontend/src/hooks/useBoards.js`
- Pattern: Exports named query-key factory (`boardKeys`) plus one exported hook per operation; mutations call `queryClient.invalidateQueries` on success

**API Module:**

- Purpose: Thin wrapper around a single resource's REST endpoints
- Examples: `frontend/src/api/boards.js`, `frontend/src/api/cards.js`
- Pattern: Named exports (`getBoards`, `createBoard`, etc.) each calling the shared Axios instance and unwrapping `.data`

## Entry Points

**Backend:**

- Location: `backend/src/index.js`
- Triggers: `node src/index.js` (or Docker CMD)
- Responsibilities: Loads env vars, configures Express middleware stack, mounts API router, starts Sequelize authentication and sync, binds HTTP server

**Frontend:**

- Location: `frontend/src/main.jsx`
- Triggers: Vite dev server or Nginx-served `index.html`
- Responsibilities: Creates React root, wraps app in `ThemeProvider`, `QueryClientProvider`, and `AuthProvider`, mounts `<App />`

**Frontend Router:**

- Location: `frontend/src/App.jsx`
- Triggers: Browser navigation / React Router
- Responsibilities: Declares all routes, guards protected routes with `ProtectedRoute`, redirects `/` based on auth state

## Error Handling

**Strategy:** Centralised global handler on the backend; Axios interceptor redirect on the frontend

**Patterns:**

- Backend: All controller functions pass errors to `next(err)`; `backend/src/middleware/errorHandler.js` maps specific Sequelize and JWT error names to HTTP status codes
- Frontend: Axios response interceptor in `frontend/src/api/axios.js` catches 401 globally and redirects to `/login`; per-query errors surface as `isError`/`error` in React Query hooks

## Cross-Cutting Concerns

**Logging:** `console.error` in `errorHandler.js`; Sequelize query logging enabled in development via `process.env.NODE_ENV`
**Validation:** `express-validator` decorators defined inside controller files (e.g., `registerValidation`, `loginValidation` in `authController.js`)
**Authentication:** JWT in httpOnly cookie; `auth` middleware applied per route in router files

---

_Architecture analysis: 2026-03-01_
