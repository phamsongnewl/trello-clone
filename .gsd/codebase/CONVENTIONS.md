# Coding Conventions

**Analysis Date:** 2026-03-01

## Naming Patterns

**Files:**
- Backend: `camelCase.js` for all source files (e.g., `authController.js`, `errorHandler.js`, `boardController.js`)
- Frontend components: `PascalCase.jsx` (e.g., `CardModal.jsx`, `BoardPage.jsx`, `ListColumn.jsx`)
- Frontend non-component files: `camelCase.js` or `camelCase.jsx` (e.g., `axios.js`, `useBoardDetail.js`, `AuthContext.jsx`)
- Models: `PascalCase.js` matching the model class name (e.g., `Board.js`, `CardLabel.js`)

**Functions:**
- Regular functions: `camelCase` (e.g., `getBoards`, `createBoard`, `findCardWithOwnership`)
- React components: `PascalCase` (e.g., `CardModal`, `BoardPage`, `ProtectedRoute`)
- React hooks: `use` prefix + `PascalCase` (e.g., `useBoardDetail`, `useCreateList`, `useAuth`)
- Express middleware functions: `camelCase` single-word description (e.g., `auth`, `errorHandler`)
- Helper/utility functions: descriptive `camelCase` (e.g., `signToken`, `setCookieToken`, `safeUser`)
- Validation arrays: noun + `Validation` (e.g., `registerValidation`, `loginValidation`)

**Variables:**
- `camelCase` throughout both backend and frontend
- Database column references use `snake_case` to match Sequelize field names (e.g., `user_id`, `background_color`, `password_hash`, `list_id`)
- Boolean flags: `is` or `has` prefix (e.g., `isLoading`, `isPending`, `isError`, `addingChecklist`)

**Types / Classes:**
- Sequelize models: `PascalCase` class extending `Model` (e.g., `class Board extends Model`)
- Context objects: `PascalCase` with `Context` suffix (e.g., `AuthContext`)
- React Query key factories: `camelCase` object with descriptive key names (e.g., `boardKeys`, `cardKeys`)

## Code Style

**Formatting:**
- No formatter config file present (no `.prettierrc`, `biome.json`, or `eslint.config.*`)
- Observed style: 2-space indentation, single quotes in backend (`require`), double quotes avoided
- Trailing commas on multi-line object/array literals (ES2017+ style)
- Arrow functions for callbacks and short API wrappers; named `function` declarations for controllers and middleware

**Linting:**
- No `.eslintrc` or `eslint.config.*` file; one `// eslint-disable-line no-unused-vars` comment in `src/middleware/errorHandler.js` indicates ESLint is expected but not formally configured

## Import Organization

**Backend (CommonJS):**
1. Third-party packages (`require('bcryptjs')`, `require('express')`)
2. Internal modules (`require('../models/index')`, `require('../middleware/auth')`)
3. Destructured named imports follow the require call on the same or next lines

**Frontend (ES Modules):**
1. React core (`import { useState, useRef, useEffect } from 'react'`)
2. Third-party UI / utility libraries (`@mui/material`, `@hello-pangea/dnd`, `react-router-dom`)
3. Internal hooks (`../hooks/useBoardDetail`)
4. Internal components (`./DueDatePicker`, `./LabelPicker`)
5. Internal API functions (`../api/boards`)
6. Internal context/store (`../store/AuthContext`)

**Path Aliases:**
- None configured; all imports use relative paths (`../`, `./`)

## Section Header Comments

A consistent visual divider style is used throughout to separate logical sections:

**Backend:**
```javascript
// ── Section Name ─────────────────────────────────────────────────────────────
```

**Frontend (same pattern):**
```javascript
// ── Section Name ───────────────────────────────────────────────────────────
```

This pattern appears in controllers, hooks, components, and middleware. Every logical grouping (remote data, local state, handlers) gets a divider.

## JSDoc / Inline Comments

- Every exported function in `src/api/*.js` has a `/** ... */` JSDoc block with `@param` and `@returns` tags
- Every controller function has a JSDoc block describing the HTTP method, path, body schema, and error responses
- Every React component and hook has a JSDoc block listing props or parameters
- Complex algorithms (e.g., drag-and-drop midpoint strategy in `BoardPage.jsx`) get multiline inline explanatory comments

## Error Handling

**Backend:**
- All async controller and middleware functions use `try/catch` → `next(err)` to forward errors to the centralized `errorHandler` middleware in `src/middleware/errorHandler.js`
- Validation errors return `422` with `{ errors: errors.array() }` from `express-validator`
- Not found responses return `404` with `{ message: '...' }`
- Conflict responses return `409` with `{ message: '...' }`
- `errorHandler` maps `SequelizeUniqueConstraintError` → `409`, JWT errors → `401`, everything else → `500`
- Pattern: always `return res.status(...).json(...)` (explicit `return` to stop execution)

**Frontend:**
- API layer (`src/api/*.js`) functions return raw `.then((r) => r.data)` and let consumers handle errors
- The axios instance in `src/api/axios.js` has a global response interceptor that redirects to `/login` on `401`
- React Query `isError` / `isLoading` states are checked in component render paths (e.g., `BoardPage.jsx`, `CardModal.jsx`) to display `<Alert>` or `<Skeleton>` components

## Module Design

**Backend exports:**
- Controllers export named functions individually: `module.exports = { getBoards, createBoard, ... }`
- Middleware exports a single default function: `module.exports = auth`
- Models export the class: `module.exports = Board`
- Routes export the `Router` instance: `module.exports = router`

**Frontend exports:**
- API functions: named arrow function exports (`export const getBoards = () => ...`)
- Hooks: named arrow function exports (`export const useBoardDetail = (boardId) => ...`)
- Components: default exports (`export default function App()` or `const CardModal = ...; export default CardModal`)
- Context provider and hook: named exports from the same file (`export function AuthProvider`, `export const useAuth`)

## React Patterns

**Component structure order (observed in `CardModal.jsx`, `BoardPage.jsx`):**
1. Remote data (React Query hooks)
2. Local state (`useState`, `useRef`)
3. `useEffect` hooks (sync, reset)
4. Event handlers
5. JSX return

**State management:**
- Global auth state: React Context (`AuthContext.jsx`)
- Server state: React Query v5 (`@tanstack/react-query`) with explicit `queryKey` factories
- Local component state: `useState` / `useRef`

**React Query key factories:**
```javascript
export const boardKeys = {
  detail: (boardId) => ['board', boardId],
};
```
All mutations call `queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) })` on success.

## Backend Patterns

**Ownership verification:**
- Every write route resolves the resource and checks `resource.board.user_id !== req.user.id` before mutating
- Helper function pattern: `findCardWithOwnership(cardId)` joins through relational chain to attach ownership context

**Validation:**
- Input validation uses `express-validator` `body()` chains grouped into `*Validation` arrays applied as route middleware
- Manual guards (`if (!title || !title.trim())`) supplement validator for simple required checks in controllers

**Position arithmetic:**
- List and card positions use integer spacing of `1000` (e.g., `lastCard.position + 1000`)
- Card drag-and-drop uses floating-point midpoint strategy: `newPos = (before + after) / 2`

---

*Convention analysis: 2026-03-01*
