# Codebase Structure

**Analysis Date:** 2026-03-01

## Directory Layout

```
trello-clone/                     # Monorepo root
├── docker-compose.yml            # Orchestrates db + backend + frontend containers
├── README.md
├── backend/                      # Node.js / Express REST API
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js              # Server entry point
│       ├── config/
│       │   └── database.js       # Sequelize connection setup
│       ├── controllers/          # Route handler functions (one file per resource)
│       │   ├── authController.js
│       │   ├── boardController.js
│       │   ├── cardController.js
│       │   ├── checklistController.js
│       │   ├── labelController.js
│       │   └── listController.js
│       ├── middleware/           # Express middleware
│       │   ├── auth.js           # JWT cookie guard → attaches req.user
│       │   └── errorHandler.js   # Global error-to-HTTP-status mapper
│       ├── models/               # Sequelize ORM models (one file per table)
│       │   ├── index.js          # Init + associate all models
│       │   ├── Board.js
│       │   ├── Card.js
│       │   ├── CardLabel.js      # Join table for Card ↔ Label M:N
│       │   ├── Checklist.js
│       │   ├── ChecklistItem.js
│       │   ├── Label.js
│       │   ├── List.js
│       │   └── User.js
│       └── routes/               # Express Router definitions (one file per resource)
│           ├── index.js          # Root router — mounts all sub-routers under /api
│           ├── auth.js
│           ├── boards.js
│           ├── cards.js
│           ├── checklists.js
│           ├── labels.js
│           └── lists.js
└── frontend/                     # React SPA (Vite build, served by nginx)
    ├── Dockerfile
    ├── index.html
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx               # Route declarations + ProtectedRoute guard
        ├── main.jsx              # React root — wraps App with providers
        ├── theme.js              # MUI theme customization
        ├── api/                  # Thin Axios wrappers for each resource
        │   ├── axios.js          # Shared Axios instance + 401 interceptor
        │   ├── auth.js
        │   ├── boards.js
        │   ├── cards.js
        │   ├── checklists.js
        │   ├── labels.js
        │   └── lists.js
        ├── components/           # Reusable UI components
        │   ├── AddCardForm.jsx
        │   ├── AddListForm.jsx
        │   ├── BoardCard.jsx
        │   ├── CardItem.jsx
        │   ├── CardModal.jsx
        │   ├── ChecklistSection.jsx
        │   ├── CreateBoardModal.jsx
        │   ├── DueDatePicker.jsx
        │   ├── LabelPicker.jsx
        │   ├── ListColumn.jsx
        │   └── Navbar.jsx
        ├── hooks/                # React Query data-fetching hooks
        │   ├── useBoardDetail.js # Board + lists + cards + mutations
        │   ├── useBoards.js      # Boards list + CRUD mutations
        │   └── useCardDetail.js  # Card detail + checklist mutations
        ├── pages/                # Route-level page components
        │   ├── BoardPage.jsx     # /boards/:boardId — full kanban board
        │   ├── DashboardPage.jsx # /dashboard — boards grid
        │   ├── LoginPage.jsx     # /login
        │   └── RegisterPage.jsx  # /register
        └── store/
            └── AuthContext.jsx   # Auth React Context + useAuth() hook
```

## Directory Purposes

**`backend/src/config/`:**

- Purpose: Infrastructure-level singletons
- Contains: Database connection (`database.js`)
- Key files: `backend/src/config/database.js` — exports a single Sequelize instance configured from env vars

**`backend/src/models/`:**

- Purpose: ORM model definitions and inter-model associations
- Contains: One class per database table; association logic co-located with each model via `associate(models)` static
- Key files: `backend/src/models/index.js` — calls `Model.init(sequelize)` and `Model.associate(models)` for every model; must be imported before `sequelize.sync()`

**`backend/src/controllers/`:**

- Purpose: Business logic for each REST resource
- Contains: Named async handler functions; each function typically validates → queries Sequelize → returns JSON
- Key files: `backend/src/controllers/authController.js` (bcrypt + JWT), `backend/src/controllers/boardController.js`

**`backend/src/routes/`:**

- Purpose: Express Router wiring — maps HTTP verbs + paths to `auth` middleware + controller functions
- Contains: One router file per resource; `index.js` mounts them all under `/api`
- Note: List, card, label, checklist routers are mounted at root (`/`) to enable nested URL patterns such as `/api/boards/:boardId/lists` and `/api/lists/:id`

**`backend/src/middleware/`:**

- Purpose: Express middleware shared across routes
- `auth.js` — authentication guard; attach before any protected route handler
- `errorHandler.js` — last middleware registered; converts thrown/forwarded errors to HTTP responses

**`frontend/src/api/`:**

- Purpose: HTTP client layer; isolates Axios calls from UI code
- Pattern: Each file exports named functions that call the shared `api` instance and return `r.data`
- `axios.js` — single configured Axios instance; all other api files import from here

**`frontend/src/hooks/`:**

- Purpose: Data-fetching abstraction; components never call `api/` directly
- Pattern: Wraps React Query `useQuery`/`useMutation` with domain-specific query keys and cache invalidation
- All board-related mutations (create list, move card) live in `useBoardDetail.js` to co-locate with the board query key

**`frontend/src/components/`:**

- Purpose: Reusable, composable UI pieces; do not fetch data themselves — receive it via props or call hooks from `frontend/src/hooks/`
- Key files: `CardModal.jsx` (full card detail overlay), `ListColumn.jsx` (single Kanban column with drag-drop), `BoardCard.jsx` (board preview card on dashboard)

**`frontend/src/pages/`:**

- Purpose: Route-level container components; each maps 1:1 to a React Router `<Route>`
- Responsible for calling hooks, handling loading/error states, and composing component trees

**`frontend/src/store/`:**

- Purpose: Client-only global state (currently only auth)
- `AuthContext.jsx` exports `AuthProvider` (wraps `main.jsx`) and `useAuth()` hook

## Key File Locations

**Entry Points:**

- `backend/src/index.js`: Express app bootstrap, DB connect, server listen
- `frontend/src/main.jsx`: React root render with `<AuthProvider>` and `<QueryClientProvider>`
- `frontend/src/App.jsx`: Client-side route declarations, `ProtectedRoute` wrapper

**Configuration:**

- `backend/src/config/database.js`: Sequelize instance (reads `DB_*` env vars)
- `frontend/vite.config.js`: Vite build config, dev server proxy
- `docker-compose.yml`: Service definitions for `db`, `backend`, `frontend`
- `frontend/nginx.conf`: Static file serving + reverse proxy to backend in production

**Core Logic:**

- `backend/src/models/index.js`: Model initialization registry — edit when adding a new model
- `backend/src/routes/index.js`: API route mount registry — edit when adding a new resource router
- `frontend/src/api/axios.js`: Shared HTTP client — set default headers/interceptors here

**Data Fetching:**

- `frontend/src/hooks/useBoardDetail.js`: All board page data and card/list mutations
- `frontend/src/hooks/useBoards.js`: Dashboard board list and CRUD
- `frontend/src/hooks/useCardDetail.js`: Card modal data and checklist mutations

## Naming Conventions

**Backend Files:**

- Controllers: `{resource}Controller.js` (camelCase resource, e.g., `cardController.js`)
- Models: PascalCase singular noun matching the class name (e.g., `Card.js`, `ChecklistItem.js`)
- Routes: lowercase plural noun (e.g., `boards.js`, `checklists.js`)
- Middleware: camelCase descriptive (e.g., `auth.js`, `errorHandler.js`)

**Frontend Files:**

- Pages: PascalCase with `Page` suffix (e.g., `BoardPage.jsx`, `DashboardPage.jsx`)
- Components: PascalCase noun (e.g., `CardModal.jsx`, `ListColumn.jsx`)
- Hooks: camelCase `use` prefix (e.g., `useBoardDetail.js`, `useBoards.js`)
- API modules: lowercase singular noun matching backend resource (e.g., `boards.js`, `cards.js`)
- Context: PascalCase with `Context` suffix (e.g., `AuthContext.jsx`)

**Identifiers:**

- Database columns: `snake_case`
- JavaScript/JSX variables and functions: `camelCase`
- React components: `PascalCase`
- React Query keys: string arrays, e.g., `['boards']`, `['board', boardId]`, `['card', cardId]`

## Where to Add New Code

**New REST Resource (e.g., `comments`):**

1. Create model: `backend/src/models/Comment.js` (extend `Model`, add `static associate()`)
2. Register model: add `init` and `associate` calls in `backend/src/models/index.js`
3. Create controller: `backend/src/controllers/commentController.js`
4. Create route file: `backend/src/routes/comments.js`
5. Mount router: add `router.use('/...', commentsRouter)` in `backend/src/routes/index.js`
6. Create API module: `frontend/src/api/comments.js`
7. Create hook: `frontend/src/hooks/useComments.js`
8. Use hook in the relevant component or page

**New Page:**

- Add page component: `frontend/src/pages/{Name}Page.jsx`
- Register route: `frontend/src/App.jsx` — add `<Route>` inside `<Routes>`; wrap with `<ProtectedRoute>` if auth required

**New Reusable Component:**

- Add to: `frontend/src/components/{ComponentName}.jsx`
- Import from pages or other components as needed

**Shared Utilities:**

- Backend: no `utils/` directory currently; add helpers inline in controllers or create `backend/src/utils/`
- Frontend: no `utils/` directory currently; create `frontend/src/utils/` for shared helpers

## Special Directories

**`frontend/dist/`:**

- Purpose: Vite production build output
- Generated: Yes (by `vite build`)
- Committed: No (in `.gitignore`)
- Served by nginx container in production

**`.gsd/`:**

- Purpose: GSD workflow documents (codebase analysis, plans, roadmap)
- Generated: Yes (by GSD Copilot commands)
- Committed: Yes

**`.github/`:**

- Purpose: GSD skills, agent prompts, Copilot instructions
- Contains: `.github/skills/`, `.github/prompts/`, `.github/instructions/`, `.github/agents/`

---

_Structure analysis: 2026-03-01_
