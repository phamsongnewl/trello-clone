---
description: 'Trello-clone project development guidelines derived from codebase patterns. Covers full-stack conventions: Express/Sequelize backend and React/MUI/TanStack Query frontend.'
applyTo: '**'
---

# GitHub Copilot Instructions — Trello Clone

## Priority Guidelines

1. **Codebase consistency** — match the existing conventions in this file exactly before applying external best practices.
2. **Version compatibility** — respect the pinned versions; do not use APIs unavailable in those versions.
3. **Architectural boundaries** — keep layers separate: routes → controllers → models (backend), pages → hooks → api (frontend).

---

## Technology Versions

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend runtime | Node.js / Express | Express 4.x |
| ORM | Sequelize | 6.x |
| Database | PostgreSQL | (pg 8.x) |
| Auth | jsonwebtoken + bcryptjs | JWT 9.x |
| Validation | express-validator | 7.x |
| Frontend framework | React | 18.x |
| Build tool | Vite | 5.x |
| UI library | MUI (Material UI) | 5.x |
| Server state | TanStack Query | 5.x |
| HTTP client | axios | 1.x |
| DnD | @hello-pangea/dnd, @dnd-kit | latest |
| Routing | react-router-dom | 6.x |
| Date utils | date-fns | 3.x |

---

## Backend Conventions

### Module System

Use CommonJS throughout the backend.

```js
// Correct — CommonJS
const { Board, List } = require('../models/index');
module.exports = { getBoards, createBoard };

// Wrong — do NOT use ES module syntax in backend
import { Board } from '../models/index';
export default getBoards;
```

### Controller Pattern

Every controller is a named `async` function that follows try/catch/next:

```js
async function createBoard(req, res, next) {
  try {
    const { title } = req.body;
    if (!title || !title.trim())
      return res.status(422).json({ message: 'title is required' });

    const board = await Board.create({ ... });
    return res.status(201).json(board);
  } catch (err) {
    next(err); // always delegate to errorHandler middleware
  }
}
```

- Return early on validation errors with `res.status(422).json({ message: '...' })`.
- Return `res.status(404)` when a record is not found.
- Never `throw` inside a controller — pass to `next(err)`.
- Export all controller functions as a single `module.exports` object at the bottom of the file.

### Validation

Perform lightweight inline validation in the controller before touching the DB:

```js
if (!title || !title.trim())
  return res.status(422).json({ message: 'title is required' });
```

Use `express-validator` for more complex input schemas on POST routes.

### Routes

- One router file per resource in `src/routes/`.
- All routes require the `auth` middleware imported from `../middleware/auth`.
- Register static paths before param paths to avoid conflicts:

```js
router.patch('/reorder', auth, reorderBoards); // MUST come before /:id
router.get('/:id', auth, getBoardById);
```

- Export a single `Router` instance via `module.exports = router`.

### Models

Models extend Sequelize `Model` and expose two static methods:

```js
class Board extends Model {
  static init(sequelize) {
    return super.init({ /* columns */ }, {
      sequelize,
      modelName: 'Board',
      tableName: 'boards',
      timestamps: true,
    });
  }

  static associate(models) {
    Board.belongsTo(models.User, { foreignKey: 'user_id', as: 'owner' });
    Board.hasMany(models.List, { foreignKey: 'board_id', as: 'lists' });
  }
}
module.exports = Board;
```

- Use `DataTypes.UUID` with `defaultValue: DataTypes.UUIDV4` as primary key on every model.
- Use `snake_case` for all column/attribute names (`user_id`, `background_color`).
- Include `timestamps: true` on all models.
- Define all associations in `static associate()`.

### Authentication

- JWT is stored in an `httpOnly` cookie named `token`.
- The `auth` middleware reads the cookie, verifies it, fetches the user row (excluding `password_hash`), and attaches it to `req.user`.
- Never expose `password_hash` in any response — always `exclude: ['password_hash']` when querying users.

### Error Handling

The global `errorHandler` middleware (registered last in `src/index.js`) handles:

| Error type | HTTP code |
|-----------|-----------|
| `SequelizeUniqueConstraintError` | 409 |
| `JsonWebTokenError` / `TokenExpiredError` | 401 |
| Everything else | 500 |

Do not duplicate these mappings in controllers.

---

## Frontend Conventions

### Module System

Use ES modules throughout the frontend.

```js
// Correct
import { useQuery } from '@tanstack/react-query';
export const useBoardDetail = (id) => { ... };
export default function BoardPage() { ... }
```

### Component Rules

- Use functional components only — no class components.
- Default-export components and pages.
- Include a JSDoc block at the top of every component describing its purpose, sections, props, and any notable state:

```jsx
/**
 * CardModal
 *
 * Full-screen card editor dialog.
 *
 * Props:
 *   open    — boolean   — whether the dialog is visible
 *   onClose — () => void
 *   cardId  — string
 *   boardId — string
 */
const CardModal = ({ open, onClose, cardId, boardId }) => { ... };
export default CardModal;
```

- Use MUI components (`Box`, `Typography`, `Button`, `Dialog`, etc.) for all UI.
- Never use raw HTML elements for layout — prefer MUI `Box` / `Stack` / `Grid`.

### API Layer

- One module per resource in `src/api/` (`boards.js`, `cards.js`, …).
- Always import from the shared axios instance:

```js
import api from './axios';

export const getBoardById = (id) => api.get(`/boards/${id}`);
export const createBoard  = (data) => api.post('/boards', data);
```

- The axios instance (`api/axios.js`) has `withCredentials: true` and a 401 interceptor that redirects to `/login`.
- Do not configure `baseURL` or credentials in individual API modules.

### Server State — TanStack Query v5

- Put all `useQuery` / `useMutation` calls inside custom hooks in `src/hooks/`.
- Use a query key factory object:

```js
export const boardKeys = {
  all: ['boards'],
  detail: (id) => ['board', id],
};
```

- Invalidate the relevant query in `onSuccess`:

```js
useMutation({
  mutationFn: (data) => createList(boardId, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
  },
});
```

- Set `staleTime` explicitly on queries that do not need to be refetched constantly (e.g., `staleTime: 1000 * 30`).
- Pass `enabled: Boolean(id)` to any query that depends on a dynamic ID.

### Auth State

Access auth state through `useAuth()` from `src/store/AuthContext.jsx`:

```jsx
const { user, isLoading, login, logout } = useAuth();
```

- Guard protected routes with `<ProtectedRoute>` (defined in `App.jsx`).
- While `isLoading` is true, render `null` — do not render placeholders or redirect prematurely.

### Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Variables / functions | `camelCase` | `boardId`, `createBoard` |
| React components | `PascalCase` default export | `CardModal.jsx` |
| Custom hooks | `use` prefix + `PascalCase` | `useBoardDetail` |
| DB-facing fields | `snake_case` (mirrors backend) | `background_color`, `user_id` |
| CSS-in-MUI `sx` props | object literals | `sx={{ mt: 2, color: 'text.secondary' }}` |

### Section Separator Comments

Use separator comments to divide logical sections within a file:

```js
// ── Section Name ─────────────────────────────────────────────────────────────
```

This pattern is used throughout the codebase for both `.jsx` and `.js` files. Use it whenever a file has clearly distinct concerns.

---

## Code Organization

```
backend/src/
  config/         # database connection
  controllers/    # async request handlers (one per resource)
  middleware/     # auth, errorHandler
  models/         # Sequelize model classes
  routes/         # Express Router instances (one per resource)
  index.js        # app entry point

frontend/src/
  api/            # axios functions (one module per resource)
  components/     # reusable UI components
  hooks/          # TanStack Query hooks
  pages/          # route-level components
  store/          # React Context (AuthContext)
  App.jsx         # router configuration
  main.jsx        # app entry point
  theme.js        # MUI theme
```

---

## Error Handling Patterns

### Backend

- Controllers: try/catch, delegate all errors to `next(err)`.
- Return structured JSON: `{ message: '...' }` (add `fields` for constraint errors).
- Never leak stack traces or internal error details to the client.

### Frontend

- Check `isError` from `useQuery` and render an `<Alert severity="error">` when it is true.
- Rely on the axios 401 interceptor for session expiry — do not duplicate redirect logic in components.
- Handle mutation errors in the component using the `error` field from `useMutation`.

---

## Docker & Environment

- Both services define a `Dockerfile`; the `docker-compose.yml` at the repo root wires them together.
- Backend environment variables (`JWT_SECRET`, `DB_*`) are loaded via `dotenv` from `.env`.
- Frontend nginx configuration uses an `nginx.conf.template` to support environment variable substitution at runtime.
- Do not hardcode environment-specific values in source files.
