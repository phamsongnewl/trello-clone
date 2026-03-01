# Codebase Structure

**Analysis Date:** 2026-03-01

## Directory Layout

```
trello-clone/                     # Monorepo root
├── docker-compose.yml            # Orchestrates backend, frontend, postgres services
├── README.md
├── backend/                      # Node.js/Express REST API service
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js              # App entry point (Express setup + DB connect)
│       ├── config/
│       │   └── database.js       # Sequelize instance (PostgreSQL)
│       ├── middleware/
│       │   ├── auth.js           # JWT cookie verification; attaches req.user
│       │   └── errorHandler.js   # Global Express error handler
│       ├── models/
│       │   ├── index.js          # Initialises all models + wires associations
│       │   ├── User.js
│       │   ├── Board.js
│       │   ├── List.js
│       │   ├── Card.js
│       │   ├── Label.js
│       │   ├── CardLabel.js      # Many-to-many join table (Card ↔ Label)
│       │   ├── Checklist.js
│       │   └── ChecklistItem.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── boardController.js
│       │   ├── listController.js
│       │   ├── cardController.js
│       │   ├── labelController.js
│       │   └── checklistController.js
│       └── routes/
│           ├── index.js          # Aggregates all resource routers under /api
│           ├── auth.js
│           ├── boards.js
│           ├── lists.js
│           ├── cards.js
│           ├── labels.js
│           └── checklists.js
└── frontend/                     # React SPA (Vite build, served by Nginx)
    ├── Dockerfile
    ├── nginx.conf
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx              # React root: providers + app mount
        ├── App.jsx               # Router + ProtectedRoute + RootRedirect
        ├── theme.js              # MUI theme configuration
        ├── api/
        │   ├── axios.js          # Configured Axios instance; 401 interceptor
        │   ├── auth.js
        │   ├── boards.js
        │   ├── lists.js
        │   ├── cards.js
        │   ├── labels.js
        │   └── checklists.js
        ├── store/
        │   └── AuthContext.jsx   # Auth React Context + useAuth hook
        ├── hooks/
        │   ├── useBoardDetail.js # Board + list + card queries and mutations
        │   ├── useBoards.js      # Dashboard board list queries and mutations
        │   └── useCardDetail.js  # Card detail query and mutations
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── DashboardPage.jsx
        │   └── BoardPage.jsx
        └── components/
            ├── Navbar.jsx
            ├── BoardCard.jsx
            ├── ListColumn.jsx
            ├── CardItem.jsx
            ├── CardModal.jsx
            ├── AddListForm.jsx
            ├── AddCardForm.jsx
            ├── ChecklistSection.jsx
            ├── LabelPicker.jsx
            ├── DueDatePicker.jsx
            └── CreateBoardModal.jsx
```

## Directory Purposes

**`backend/src/config/`:**

- Purpose: Singleton infrastructure clients
- Contains: Sequelize connection instance
- Key files: `backend/src/config/database.js`

**`backend/src/middleware/`:**

- Purpose: Express middleware that runs before or after every (or specific) route handlers
- Contains: Auth guard (`auth.js`), global error mapper (`errorHandler.js`)
- New middleware files belong here

**`backend/src/models/`:**

- Purpose: Sequelize ORM model classes; one file per database table
- Contains: Schema definition (`Model.init`) + association declaration (`Model.associate`)
- Key files: `backend/src/models/index.js` (must be required before `sequelize.sync`)

**`backend/src/controllers/`:**

- Purpose: Business logic and HTTP request/response handlers
- Contains: Async functions exported by name, imported in router files
- Naming: `<resource>Controller.js`

**`backend/src/routes/`:**

- Purpose: Express Router instances mapping HTTP verbs + paths to controller functions
- Key files: `backend/src/routes/index.js` aggregates all sub-routers under `/api`

**`frontend/src/api/`:**

- Purpose: Thin HTTP client functions — one module per REST resource
- Contains: Named exports wrapping the shared Axios instance; all unwrap `.data`
- Key files: `frontend/src/api/axios.js` (single Axios instance, must be imported by all other modules here)

**`frontend/src/store/`:**

- Purpose: Global client-side state that is not server-derived
- Contains: `AuthContext.jsx` providing `user`, `isLoading`, `login`, `logout`
- Add new contexts here if needed; keep server state in React Query hooks instead

**`frontend/src/hooks/`:**

- Purpose: React Query query/mutation hooks binding API calls to cache keys
- Contains: One file per primary resource or page; each file exports a query-key factory and one hook per operation
- Naming: `use<Resource>.js` or `use<Resource>Detail.js`

**`frontend/src/pages/`:**

- Purpose: Route-level components; map 1-to-1 with routes declared in `frontend/src/App.jsx`
- Naming: `<Name>Page.jsx`

**`frontend/src/components/`:**

- Purpose: Reusable presentational and composite UI components
- Naming: `PascalCase.jsx`

## Key File Locations

**Entry Points:**

- `backend/src/index.js`: Express app factory, DB connection, server start
- `frontend/src/main.jsx`: React DOM root, global providers
- `frontend/src/App.jsx`: React Router routes

**Configuration:**

- `backend/src/config/database.js`: PostgreSQL / Sequelize config (reads env vars)
- `frontend/src/theme.js`: MUI theme tokens
- `frontend/vite.config.js`: Vite + dev proxy config
- `docker-compose.yml`: Service orchestration (ports, volumes, env vars)

**Core Logic:**

- `backend/src/models/index.js`: All model registration and associations
- `backend/src/routes/index.js`: All API route aggregation
- `backend/src/middleware/auth.js`: Authentication gate for protected routes
- `frontend/src/api/axios.js`: Shared HTTP client with 401 redirect interceptor
- `frontend/src/store/AuthContext.jsx`: Auth state and session rehydration

**Testing:**

- No test directory detected in the current codebase

## Naming Conventions

**Files (Backend):**

- Controllers: `camelCase` with `Controller` suffix — e.g., `boardController.js`
- Models: `PascalCase` matching the Sequelize model name — e.g., `Board.js`, `CardLabel.js`
- Routes: `camelCase` resource name — e.g., `boards.js`, `checklists.js`
- Middleware: `camelCase` descriptor — e.g., `auth.js`, `errorHandler.js`

**Files (Frontend):**

- Pages: `PascalCase` with `Page` suffix — e.g., `BoardPage.jsx`, `DashboardPage.jsx`
- Components: `PascalCase` — e.g., `ListColumn.jsx`, `CardModal.jsx`
- Hooks: `camelCase` with `use` prefix — e.g., `useBoardDetail.js`, `useCardDetail.js`
- API modules: `camelCase` resource name — e.g., `boards.js`, `checklists.js`

**Directories:**

- `backend/src/` subdirs: `camelCase` plural noun — `controllers/`, `models/`, `routes/`, `middleware/`
- `frontend/src/` subdirs: `camelCase` plural noun — `pages/`, `components/`, `hooks/`, `api/`, `store/`

## Where to Add New Code

**New REST Resource (e.g., `attachments`):**

1. Model: `backend/src/models/Attachment.js` — extend `Model`, add `init` + `associate`
2. Register: add `require` + `init` + include in `models` object in `backend/src/models/index.js`
3. Controller: `backend/src/controllers/attachmentController.js` — export handler functions
4. Router: `backend/src/routes/attachments.js` — declare routes with `auth` middleware
5. Mount: add `router.use('/', attachmentsRouter)` in `backend/src/routes/index.js`
6. API client: `frontend/src/api/attachments.js` — export named functions using `axios.js`
7. Hook: `frontend/src/hooks/useAttachments.js` — wrap API calls in `useQuery`/`useMutation`

**New Page:**

- Implementation: `frontend/src/pages/<Name>Page.jsx`
- Register route: add `<Route>` in `frontend/src/App.jsx`; wrap in `<ProtectedRoute>` if auth-required

**New Component:**

- Implementation: `frontend/src/components/<Name>.jsx`
- No barrel/index file required; import directly by path

**New Utility/Helper:**

- Backend shared helpers: `backend/src/utils/` (directory does not yet exist; create as needed)
- Frontend shared helpers: `frontend/src/utils/` (directory does not yet exist; create as needed)

## Special Directories

**`.gsd/codebase/`:**

- Purpose: GSD agent-generated analysis documents (STACK.md, ARCHITECTURE.md, etc.)
- Generated: Yes (by GSD mapper agents)
- Committed: Optional — useful as living documentation

**`node_modules/` (both services):**

- Generated: Yes (by npm install)
- Committed: No

---

_Structure analysis: 2026-03-01_
