# Coding Conventions

**Analysis Date:** 2026-03-01

## Naming Patterns

**Files:**
- Backend controllers: camelCase + role suffix (`authController.js`, `boardController.js`)
- Backend models: PascalCase matching the model name (`Board.js`, `CardLabel.js`)
- Backend middleware: camelCase (`auth.js`, `errorHandler.js`)
- Backend routes: lowercase plural resource name (`boards.js`, `lists.js`)
- Frontend components: PascalCase `.jsx` (`CardModal.jsx`, `ListColumn.jsx`, `BoardPage.jsx`)
- Frontend hooks: camelCase `use`-prefixed `.js` (`useBoardDetail.js`, `useCardDetail.js`)
- Frontend API modules: lowercase resource name `.js` (`boards.js`, `cards.js`, `axios.js`)
- Frontend store/context: PascalCase `.jsx` (`AuthContext.jsx`)

**Functions:**
- Backend controller handlers: named `async function` declarations (`async function getBoards(req, res, next)`)
- Backend helper utilities: named `function` declarations (`function signToken(userId)`, `function safeUser(user)`)
- Frontend React components: `const` arrow function (`const CardModal = ({ open, onClose, cardId, boardId }) => {}`)
- Frontend hooks: exported `const` arrow function (`export const useBoardDetail = (boardId) => {}`)
- Frontend API functions: exported `const` arrow function (`export const getBoards = () => api.get('/boards').then(r => r.data)`)
- Exception: `AuthProvider` uses named `export function AuthProvider({ children })` instead of arrow

**Variables:**
- JavaScript/JSX: camelCase throughout (`boardId`, `localTitle`, `queryClient`)
- Database column names and Sequelize field names: snake_case (`user_id`, `board_id`, `password_hash`, `background_color`)
- React state setters: `set` prefix matching the state name (`setUser`, `setLocalTitle`, `setAddingChecklist`)
- Destructured props/data: camelCase matching the shape (`const { data: board, isPending, isError }`)

**Types / Classes:**
- Sequelize models: PascalCase ES6 class extending `Model` (`class Board extends Model`)
- Context values: plain objects with camelCase keys (`{ user, setUser, isLoading, login, logout }`)
- No TypeScript; no PropTypes; interfaces documented via JSDoc only

## Module System

**Backend:** CommonJS (`require` / `module.exports`)
- Single named export per file: `module.exports = functionName` or `module.exports = router`
- Controller files export a plain object of handler functions:
  ```javascript
  module.exports = { getBoards, createBoard, getBoardById, updateBoard, deleteBoard };
  ```

**Frontend:** ES Modules (`import` / `export`) — `"type": "module"` in `package.json`
- React components: default export (`export default` or component const)
- Custom hooks: named exports (`export const useBoardDetail = ...`)
- API functions: named exports (`export const getBoards = ...`)
- Context: named exports for both Provider and hook (`export function AuthProvider`, `export const useAuth`)
- No barrel (`index.js`) files used in frontend; all imports use direct paths

## Code Style

**Indentation:** 2 spaces (no tabs)

**Quotes:** Single quotes for JS/JSX strings; double quotes inside JSX attribute values

**Semicolons:** Present at end of statements

**Trailing commas:** Used in multi-line objects, arrays, and parameter lists

**Arrow function bodies:**
- Single-expression API functions use implicit return: `api.get('/boards').then(r => r.data)`
- Components and hooks use explicit block body `{}`

**Formatting tools:** No Prettier or ESLint config files detected. One `// eslint-disable-line no-unused-vars` comment in `backend/src/middleware/errorHandler.js` implies ESLint is considered but not formally configured.

## Import Organization

**Frontend order (observed):**
1. React core and built-in hooks (`import { useState, useRef, useEffect } from 'react'`)
2. Third-party UI libraries (`@mui/material`, `@mui/icons-material`, `@hello-pangea/dnd`)
3. State management / data-fetching libraries (`@tanstack/react-query`, `react-router-dom`)
4. Internal hooks (`'../hooks/useBoardDetail'`)
5. Internal API modules (`'../api/boards'`)
6. Internal components (`'./DueDatePicker'`, `'./LabelPicker'`)

**Backend order (observed):**
1. Third-party packages (`const bcrypt = require('bcryptjs')`)  
2. Internal modules (`const { User } = require('../models/index')`)

## Error Handling

**Backend pattern — async controller handlers:**
```javascript
async function getBoards(req, res, next) {
  try {
    // ... business logic
    return res.status(200).json(result);
  } catch (err) {
    next(err); // delegate to global error handler
  }
}
```
- Every async handler wraps logic in `try/catch` and calls `next(err)`
- Input validation via `express-validator` middleware arrays; validation errors return `422` with `errors.array()`
- Business rule errors return inline JSON responses (e.g., `res.status(404).json({ message: '...' })`)
- Global error handler in `backend/src/middleware/errorHandler.js` handles:
  - `SequelizeUniqueConstraintError` → 409
  - `JsonWebTokenError` / `TokenExpiredError` → 401
  - Everything else → 500

**Frontend pattern — React Query:**
- Data loading states handled via `isPending` / `isError` flags from `useQuery`
- Skeleton placeholders rendered when `isPending` is true
- Alert component displayed when `isError` is true
- Global 401 handling via Axios response interceptor in `frontend/src/api/axios.js` (redirects to `/login`)

## Logging

**Framework:** `console.error` only — no structured logging library

**Patterns:**
- Error log with `[Scope]` prefix: `console.error('[ErrorHandler]', err.name, err.message)`
- No request-level access logging
- No logging in controllers or other middleware

## Comments

**Section dividers:** Used consistently in longer files to separate logical blocks:
```javascript
// ── Section Name ─────────────────────────────────────────────────────────────
```

**JSDoc blocks:** Used for all public functions in API, hooks, and utilities:
```javascript
/**
 * Fetch all boards belonging to the authenticated user.
 * @returns {Promise<Array>}
 */
export const getBoards = () => api.get('/boards').then((r) => r.data);
```

**Component-level JSDoc:** Components include a block comment documenting props and behavior above the function:
```jsx
/**
 * CardModal
 *
 * Full-screen card editor dialog.
 *
 * Props:
 *   open    — boolean
 *   onClose — () => void
 *   cardId  — string
 *   boardId — string
 */
```

**Inline comments:** Used to explain non-obvious logic (e.g., midpoint position strategy in drag-and-drop)

**TODO markers:** Sparingly used to flag deferred work:
- `frontend/src/components/ListColumn.jsx:57` — `// TODO (future): call updateList mutation here`
- `frontend/src/pages/BoardPage.jsx:210` — `// TODO: wire up card-click → open Card`

## Function Design

**Controller size:** 10–30 lines each; one HTTP operation per function

**Parameters:**
- Backend controllers always receive `(req, res, next)` 
- Backend helpers receive specific typed arguments (`signToken(userId)`)
- Frontend hooks accept minimal params (single ID string: `useBoardDetail(boardId)`)
- React components receive destructured prop objects

**Return values:**
- Backend controllers always `return res.json(...)` to prevent implicit fallthrough
- Hooks return the `useQuery` or `useMutation` result object directly
- API functions return `promise.then(r => r.data)` to unwrap the Axios envelope

## Validation

- Backend input validation uses `express-validator` chain arrays defined as `const xyzValidation = [...]`
- Validation arrays are composed with route handlers: `router.post('/', registerValidation, register)`
- Validation results checked at the top of handler with `validationResult(req).isEmpty()` guard

---

_Convention analysis: 2026-03-01_
