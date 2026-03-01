# Codebase Concerns

**Analysis Date:** 2026-03-01

---

## Tech Debt

**List title inline editing not persisted:**
- Issue: `ListColumn.jsx` has a click-to-edit title field that silently reverts on blur; the `updateList` API mutation is never called. Changes are lost without feedback.
- Files: `frontend/src/components/ListColumn.jsx` (line 57 — `// TODO (future): call updateList mutation here`)
- Impact: Users cannot rename lists; any title edit is silently discarded.
- Fix approach: Import `useUpdateList` mutation (or similar) in `ListColumn`, call it in `handleTitleBlur` when the trimmed value differs from `list.title`.

**Card click handler not wired:**
- Issue: Clicking a card tile in the board view performs no action. The `onCardClick` prop is threaded through but the `CardModal` open call is a TODO comment.
- Files: `frontend/src/pages/BoardPage.jsx` (line 210 — `// TODO: wire up card-click → open CardDetailModal`)
- Impact: Card detail view (labels, checklists, description, due dates) is inaccessible from the board view.
- Fix approach: Lift `CardModal` state into `BoardPage`, pass `onCardClick` down to `ListColumn` → `CardItem`, open the modal with the selected card.

**No database migrations — relying on `sequelize.sync()`:**
- Issue: Production startup runs `sequelize.sync({ alter: false, force: false })`. Schema changes require manual column additions or a destructive force-sync. There is no migration history.
- Files: `backend/src/index.js`, `backend/src/config/database.js`
- Impact: Schema changes in development cannot be safely applied to production without risk of data loss or drift.
- Fix approach: Introduce Sequelize migrations (via `sequelize-cli`). Replace the `sync()` call with `sequelize.authenticate()` only; run migrations via a separate startup step.

**List position formula causes exponential position growth:**
- Issue: `createList` calculates `position = (lastList.position + 1) * 1000` instead of the consistent `lastList.position + 1000` used for cards. After the 2nd list the values become 1001000, then 1002001000, and so on.
- Files: `backend/src/controllers/listController.js` (lines 33–36)
- Impact: Position numbers overflow float range after a modest number of list-create cycles, breaking correct ordering and the midpoint reorder strategy.
- Fix approach: Change to `position = lastList.position + 1000` to match the card positioning strategy.

**`@tanstack/react-query-devtools` shipped in production bundle:**
- Issue: Listed under `dependencies` in `frontend/package.json` rather than `devDependencies`. Vite will bundle the devtools panel into the production build, increasing bundle size unnecessarily.
- Files: `frontend/package.json`
- Impact: Unnecessary ~40 KB addition to the production bundle; the devtools floating panel may appear in production builds.
- Fix approach: Move `@tanstack/react-query-devtools` to `devDependencies` and wrap the `<ReactQueryDevtools>` JSX in a development-only conditional (e.g., `import.meta.env.DEV`).

**`findCardWithOwnership` helper duplicated across three controllers:**
- Issue: An identical `findCardWithOwnership` function is copy-pasted into `cardController.js`, `checklistController.js`, and `labelController.js`.
- Files: `backend/src/controllers/cardController.js`, `backend/src/controllers/checklistController.js`, `backend/src/controllers/labelController.js`
- Impact: Divergence risk if one copy is updated and others are not; increases maintenance surface.
- Fix approach: Extract into `backend/src/utils/ownershipHelpers.js` and import where needed.

---

## Known Bugs

**List title edit silently discarded:**
- Symptoms: User clicks a list title, types a new name, presses Enter or clicks away — the title reverts to the original without any error message or API call.
- Files: `frontend/src/components/ListColumn.jsx`
- Trigger: Any attempt to rename a list through the UI.
- Workaround: None currently available.

**Card click does nothing on the board view:**
- Symptoms: Clicking a `CardItem` tile on `BoardPage` produces no response — no modal, no navigation.
- Files: `frontend/src/pages/BoardPage.jsx`, `frontend/src/components/ListColumn.jsx`
- Trigger: Clicking any card on any board.
- Workaround: None currently available.

**List position formula creates exponentially large position values:**
- Symptoms: After creating several lists, position values become astronomically large (e.g., 1001000, 1002001000). Reordering lists produces midpoints that rapidly exhaust float precision.
- Files: `backend/src/controllers/listController.js`
- Trigger: Creating more than 2–3 lists on a board.
- Workaround: Stop and manually recreate lists via direct DB update.

---

## Security Considerations

**No rate limiting on authentication endpoints:**
- Risk: `POST /api/auth/register` and `POST /api/auth/login` accept unlimited requests, enabling brute-force attacks against passwords.
- Files: `backend/src/routes/auth.js`, `backend/src/controllers/authController.js`
- Current mitigation: None.
- Recommendations: Add `express-rate-limit` to authentication routes (e.g., 10 requests per IP per 15 minutes for login).

**`JWT_SECRET` is not validated at startup:**
- Risk: If `backend/.env` is missing or `JWT_SECRET` is unset, `process.env.JWT_SECRET` is `undefined`. `jsonwebtoken` accepts `undefined` as a secret and will sign/verify tokens — allows forged tokens if `undefined` is used consistently across restarts.
- Files: `backend/src/index.js`, `backend/src/controllers/authController.js`, `backend/src/middleware/auth.js`
- Current mitigation: `.env.example` documents the variable.
- Recommendations: Add a startup guard: `if (!process.env.JWT_SECRET) { console.error('FATAL: JWT_SECRET not set'); process.exit(1); }` in `backend/src/index.js`.

**`SequelizeUniqueConstraintError` leaks internal field names:**
- Risk: The error handler returns `{ message: "...", fields: err.fields }` for 409 conflicts, exposing DB column names to unauthenticated callers.
- Files: `backend/src/middleware/errorHandler.js`
- Current mitigation: None.
- Recommendations: Remove the `fields` property from the 409 response, or map it to user-friendly names before sending.

**`AuthContext` exposes `setUser` directly:**
- Risk: Any component can call `setUser(fakeUser)` without going through the actual auth (`login`/`logout` functions), bypassing any future auth-side effects (analytics, session cleanup, etc.).
- Files: `frontend/src/store/AuthContext.jsx`
- Current mitigation: Low practical risk in current codebase; becomes dangerous if auth side-effects are added.
- Recommendations: Remove `setUser` from the public context value; access user mutation only through `login` and `logout` functions.

**No input length validation on string fields:**
- Risk: `title`, `name`, `description`, and `color` fields in backend controllers only check for emptiness, not maximum length. A user can submit arbitrarily long strings, bloating the database.
- Files: `backend/src/controllers/boardController.js`, `backend/src/controllers/cardController.js`, `backend/src/controllers/listController.js`, `backend/src/controllers/labelController.js`
- Current mitigation: None.
- Recommendations: Add `body('title').isLength({ max: 255 })` validator (express-validator is already imported in `authController.js`) to all create/update routes.

**`position` field accepts NaN/Infinity in `moveCard`:**
- Risk: The `moveCard` endpoint only checks `position !== undefined && position !== null`. A client sending `position: NaN` or `position: Infinity` will persist that value to the database, corrupting sort order.
- Files: `backend/src/controllers/cardController.js` (lines 188–194)
- Current mitigation: None.
- Recommendations: Add `if (!Number.isFinite(position)) return res.status(422).json(...)` validation.

---

## Performance Bottlenecks

**Deep 4-level JOIN chain on every checklist item operation:**
- Problem: `findItemWithOwnership` joins ChecklistItem → Checklist → Card → List → Board on every checklist item read, update, or delete to verify ownership. This is 4 sequential JOIN levels.
- Files: `backend/src/controllers/checklistController.js` (lines 43–65)
- Cause: Ownership verification traverses the entire model hierarchy on every mutation.
- Improvement path: Cache board ownership on the JWT payload or use a dedicated SQL ownership check (`SELECT 1 FROM boards WHERE id = ? AND user_id = ?`) rather than loading full model trees.

**Board fetch loads all lists and all cards in one query without pagination:**
- Problem: `getBoardById` eagerly loads every list and every card for a board in a single Sequelize query with nested `include`. Large boards (50+ cards) receive all data at once.
- Files: `backend/src/controllers/boardController.js` (lines 48–75)
- Cause: No pagination or lazy loading implemented.
- Improvement path: Add pagination for cards per list, or implement virtualized card loading in the frontend.

**`reorderLists` issues N individual UPDATE queries:**
- Problem: Bulk list reorder sends one `List.update()` call per list ID using `Promise.all`, resulting in N round-trips to the database.
- Files: `backend/src/controllers/listController.js` (lines 141–145)
- Cause: No bulk UPDATE support in current implementation.
- Improvement path: Use a single `UPDATE ... SET position = CASE id WHEN ... THEN ... END` query, or wrap in a Sequelize transaction to at least make it atomic.

**`useMoveCard` causes double-render flash:**
- Problem: The mutation uses optimistic update (`onMutate`) to update cache immediately, then fires `invalidateQueries` on `onSettled` unconditionally, triggering a re-fetch and second render. If the server response matches the optimistic state, the UI re-renders twice for every drag.
- Files: `frontend/src/hooks/useBoardDetail.js` (lines 118–147)
- Cause: Always-invalidate pattern conflicts with the optimistic update.
- Improvement path: In `onSuccess`, update the cache with the server-verified card rather than invalidating; only invalidate on error (after rollback).

---

## Fragile Areas

**`reorderLists` is non-transactional:**
- Files: `backend/src/controllers/listController.js` (lines 137–147)
- Why fragile: If one `List.update()` call fails mid-batch, earlier updates are already committed. Positions are left in a partially-updated inconsistent state with no rollback.
- Safe modification: Wrap all `List.update()` calls in a Sequelize transaction; use `t.LOCK.UPDATE` to prevent concurrent reorder races.
- Test coverage: None.

**Float position precision will eventually degrade:**
- Files: `frontend/src/pages/BoardPage.jsx` (midpoint logic lines 84–89), `backend/src/controllers/cardController.js`
- Why fragile: The midpoint strategy halves the gap between adjacent positions with every insertion. After ~52 insertions between the same two cards, IEEE 754 double precision runs out of bits and positions become identical, breaking sort order. No renormalization job exists.
- Safe modification: Add a backend maintenance endpoint or job that detects when sibling positions are within a threshold (e.g., < 0.001) and renumbers the entire list with integer spacing.
- Test coverage: None.

**Axios 401 interceptor forces a full-page navigation:**
- Files: `frontend/src/api/axios.js`
- Why fragile: On any 401 response, `window.location.href = '/login'` discards the React tree and React Query cache, losing in-progress state and pending mutations. If a background query returns 401 while the user is filling a form, all form data is lost.
- Safe modification: Use React Router's `navigate('/login')` hook passed through a module-level callback, or dispatch to an auth state manager that triggers a conditional redirect at the router level.
- Test coverage: None.

**`CardModal` / card detail is completely unlinked from board navigation:**
- Files: `frontend/src/pages/BoardPage.jsx`, `frontend/src/hooks/useCardDetail.js`
- Why fragile: `useCardDetail` hook and `CardModal` component exist but are not connected to anything, meaning the full card editing surface (labels, checklists, due dates) cannot be reached in production.
- Safe modification: Implement the card-click handler (see Tech Debt section).
- Test coverage: None.

---

## Scaling Limits

**Single-user board model:**
- Current capacity: Each board belongs to exactly one user (`user_id` FK on boards). No sharing, collaboration, or roles table.
- Limit: Multi-user access to boards is architecturally impossible without a schema change.
- Scaling path: Introduce a `board_members` join table with role column before any collaboration feature is added.

**Connection pool ceiling:**
- Current capacity: Sequelize pool configured with `max: 10` connections.
- Files: `backend/src/config/database.js`
- Limit: Under heavy concurrent load (>10 simultaneous requests awaiting a DB result), new requests queue or time out after the 30-second `acquire` timeout.
- Scaling path: Increase pool size for high-traffic environments, or add a PgBouncer connection pooler in front of Postgres.

---

## Dependencies at Risk

**`express` v4 (legacy major version):**
- Risk: Express v4 is in long-term maintenance mode; v5 is the active development branch. Security patches may slow.
- Files: `backend/package.json`
- Impact: Future security advisories may not be backported.
- Migration plan: Upgrade to Express v5 when stable; review breaking changes in error handler signatures.

**`@mui/material` v5 with `@emotion` peer deps:**
- Risk: MUI v6/v7 introduces breaking API changes. Current v5 pins `@mui/icons-material@^5.18.0` which will need coordinated upgrade.
- Files: `frontend/package.json`
- Impact: Upgrading MUI requires simultaneous upgrade of emotion and icons packages.
- Migration plan: Pin to exact MUI v5 version rather than caret range to avoid accidental minor-version breaking changes.

---

## Test Coverage Gaps

**Zero test files in the entire codebase:**
- What's not tested: Every controller, middleware, model, hook, component, and utility — everything.
- Files: `backend/src/`, `frontend/src/`
- Risk: Any refactor or dependency upgrade can introduce silent regressions with no safety net.
- Priority: High

**Auth middleware has no test:**
- What's not tested: JWT verification logic, missing-cookie path, invalid-token path, user-not-found path.
- Files: `backend/src/middleware/auth.js`
- Risk: A regression in the auth guard silently exposes all API routes.
- Priority: High

**Card move / position calculation has no test:**
- What's not tested: Midpoint calculation in `handleDragEnd`, optimistic update logic in `useMoveCard`, server-side position validation in `moveCard` controller.
- Files: `frontend/src/pages/BoardPage.jsx`, `frontend/src/hooks/useBoardDetail.js`, `backend/src/controllers/cardController.js`
- Risk: Position ordering bugs are invisible until a user reports misplaced cards after a drag.
- Priority: High

**No integration or e2e tests:**
- What's not tested: Full request/response cycle for any API endpoint; no browser-level smoke tests.
- Files: Entire project
- Risk: API contract drift between frontend and backend goes undetected.
- Priority: Medium

---

*Concerns audit: 2026-03-01*
