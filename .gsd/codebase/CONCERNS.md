# Codebase Concerns

**Analysis Date:** 2026-03-01

---

## Tech Debt

**List title rename not wired to API:**
- Issue: `ListColumn.jsx` shows an inline title editor on click but `handleTitleBlur` has a `// TODO (future): call updateList mutation here` comment and never calls the backend. Edits are silently discarded.
- Files: `frontend/src/components/ListColumn.jsx` (line 57)
- Impact: Users can click list titles and type but changes never persist — silent data loss.
- Fix approach: Call `useUpdateList(boardId)` mutation with `{ title: titleValue }` inside `handleTitleBlur` before `setEditingTitle(false)`.

**Card click does not open CardDetailModal:**
- Issue: `BoardPage.jsx` passes `onCardClick={(card) => console.log('Card clicked:', card.id)}` to every `ListColumn`, so clicking a card logs to console instead of opening the modal. `CardModal.jsx` (343 lines) and `useCardDetail.js` are fully built but never mounted.
- Files: `frontend/src/pages/BoardPage.jsx` (line 210), `frontend/src/components/CardModal.jsx`, `frontend/src/hooks/useCardDetail.js`
- Impact: The entire card detail feature (labels, checklists, due dates, description) is unreachable from the UI.
- Fix approach: Add `selectedCard` state to `BoardPage`, set it in `onCardClick`, render `<CardModal cardId={selectedCard?.id} boardId={boardId} onClose={() => setSelectedCard(null)} />`.

**Duplicated `findCardWithOwnership` helper:**
- Issue: The identical async helper function (Card → List → Board join for ownership check) is copy-pasted in three separate controller files.
- Files: `backend/src/controllers/cardController.js`, `backend/src/controllers/checklistController.js`, `backend/src/controllers/labelController.js`
- Impact: Bug fixes or schema changes must be applied in three places; risk of drift between copies.
- Fix approach: Extract to `backend/src/utils/ownership.js` and import in all three controllers.

**Inconsistent list position formula:**
- Issue: `listController.createList` computes new position as `(lastList.position + 1) * 1000` (multiplicative), while `cardController.createCard` uses `lastCard.position + 1000` (additive). The list formula causes positions to grow exponentially with each new list.
- Files: `backend/src/controllers/listController.js` (line 35), `backend/src/controllers/cardController.js` (line 52)
- Impact: After ~10 lists, positions exceed 10^30, causing potential numeric overflow in Postgres `FLOAT` columns and inconsistent frontend sort behavior.
- Fix approach: Align both to the additive `max + 1000` strategy used by cards.

**No list drag-and-drop reordering:**
- Issue: `DragDropContext` in `BoardPage.jsx` only handles `type="CARD"` droppables. There is no `Droppable` for list columns and no `reorderList` API endpoint.
- Files: `frontend/src/pages/BoardPage.jsx`, `frontend/src/hooks/useBoardDetail.js`, `backend/src/controllers/listController.js`
- Impact: Users cannot reorder lists by dragging — a core Trello feature.
- Fix approach: Add `PUT /api/lists/:id/move` endpoint, add `useReorderList` mutation, wrap columns in a list-level `Droppable` in `BoardPage`.

---

## Security Considerations

**No rate limiting on authentication endpoints:**
- Risk: `POST /api/auth/login` and `POST /api/auth/register` have no request rate limiting. An attacker can brute-force passwords or spam registrations.
- Files: `backend/src/index.js`, `backend/src/routes/auth.js`
- Current mitigation: None.
- Recommendations: Add `express-rate-limit` with a strict window on `/api/auth/login` (e.g., 10 attempts per 15 minutes per IP).

**No HTTP security headers (missing `helmet`):**
- Risk: The Express server sends no security headers: no `Content-Security-Policy`, no `X-Frame-Options`, no `X-Content-Type-Options`, etc.
- Files: `backend/src/index.js`
- Current mitigation: None.
- Recommendations: Add `helmet()` as first middleware in `backend/src/index.js`.

**JWT secret not validated at startup:**
- Risk: `process.env.JWT_SECRET` is used directly in `signToken()` with no null/undefined check. If the env var is missing (e.g., misconfigured deployment), `jwt.sign` silently uses `undefined` as the secret, and all tokens signed with `undefined` become valid against each other.
- Files: `backend/src/controllers/authController.js` (line 6), `backend/src/middleware/auth.js` (line 19)
- Current mitigation: None.
- Recommendations: Add a startup guard: `if (!process.env.JWT_SECRET) { console.error('JWT_SECRET is required'); process.exit(1); }` in `backend/src/index.js`.

**`sameSite: 'lax'` on auth cookies (not `strict`):**
- Risk: `lax` allows the auth cookie to be sent on top-level cross-site navigations (e.g., a link from an attacker's page). `strict` would prevent this.
- Files: `backend/src/controllers/authController.js` (lines 11–16)
- Current mitigation: `httpOnly: true` prevents JS access; CORS `credentials: true` limits which origins can make credentialed requests.
- Recommendations: Change `sameSite: 'lax'` to `sameSite: 'strict'` for both `setCookieToken` and `clearCookie` calls.

**No input validation on non-auth routes:**
- Risk: Only the auth controller uses `express-validator`. All other controllers (`boardController`, `listController`, `cardController`, etc.) rely on manual `if (!title || !title.trim())` checks with no schema validation. Fields like `background_color`, `due_date`, `description`, and `color` go to the database with minimal or no validation, risking unexpected data shapes.
- Files: `backend/src/controllers/boardController.js`, `backend/src/controllers/cardController.js`, `backend/src/controllers/labelController.js`
- Current mitigation: Sequelize model validations enforce type at the ORM level, but error messages are generic.
- Recommendations: Extend `express-validator` middleware chains to all routes that accept body input.

---

## Performance Bottlenecks

**Deep join chains on every ownership verification:**
- Problem: Mutations on checklists and checklist items traverse 4-level joins (ChecklistItem → Checklist → Card → List → Board) on every single write operation to verify ownership.
- Files: `backend/src/controllers/checklistController.js` (`findItemWithOwnership`, `findChecklistWithOwnership`)
- Cause: Authorization is embedded inside data fetching rather than being a separate lightweight check.
- Improvement path: Cache board ownership per request, or add a `board_id` denormalized column to `cards` for a single-join ownership check.

**No pagination on any list endpoint:**
- Problem: `GET /api/boards` returns all boards; `GET /api/boards/:id` returns all lists with all cards embedded. As data grows, response payloads become unbounded.
- Files: `backend/src/controllers/boardController.js`, `backend/src/controllers/cardController.js`
- Cause: Simple `findAll` / `findOne` with no `limit`/`offset` parameters.
- Improvement path: Add cursor-based or offset pagination to board listing; lazy-load cards per list rather than embedding them all in the board response.

**Float position precision exhaustion:**
- Problem: The midpoint strategy for card positioning (new position = `(before + after) / 2`) will eventually produce positions that are equal due to IEEE 754 float precision limits. After ~50 repeated insertions into the same slot, the gap between consecutive positions falls below machine epsilon.
- Files: `frontend/src/pages/BoardPage.jsx` (`handleDragEnd`), `backend/src/models/Card.js`
- Cause: Floats have only 53 bits of mantissa; repeated halving exhausts precision.
- Improvement path: Add a background "rebalance" job that renumbers positions to multiples of 1000 when the minimum gap drops below a threshold (e.g., 1.0). The `BoardPage.jsx` comment acknowledges this but no implementation exists.

---

## Fragile Areas

**`window.confirm()` for destructive actions:**
- Files: `frontend/src/components/ListColumn.jsx` (line 78)
- Why fragile: `window.confirm()` is a blocking browser dialog that is suppressed in iframes, browser extensions, and some mobile browsers. It also blocks the JavaScript thread.
- Safe modification: Replace with a MUI `<Dialog>` confirmation component.
- Test coverage: No tests cover this interaction.

**Hard navigation in 401 interceptor:**
- Files: `frontend/src/api/axios.js` (line 17)
- Why fragile: `window.location.href = '/login'` triggers a full page reload, discarding all React Query cache, React state, and any in-progress form data. It also fires for every concurrent request that returns 401 (e.g., 3 parallel fetches → 3 redirects).
- Safe modification: Use `react-router-dom`'s `navigate('/login')` from a context-accessible router reference, and add a guard flag to prevent duplicate redirects.
- Test coverage: None.

**Optimistic update deeply coupled to board data shape:**
- Files: `frontend/src/hooks/useBoardDetail.js` (`useMoveCard`, lines 95–135)
- Why fragile: The optimistic update manually removes a card from its source list and inserts it into the destination list by mutating the cached board JSON. Any change to the board API response shape (adding new fields, renaming `cards` → `items`, etc.) will silently break drag-and-drop.
- Safe modification: Add integration tests for the optimistic update logic, or use a normalized cache structure (e.g., `normalizr`) to decouple the update from the exact response shape.
- Test coverage: None.

**`sequelize.sync({ alter: false, force: false })` in production code path:**
- Files: `backend/src/index.js` (line 42)
- Why fragile: Calling `sequelize.sync()` on every startup is acceptable in development but risky in production — it can silently fail to apply schema changes (when `alter: false`) or cause data races in multi-instance deployments where several processes sync simultaneously.
- Safe modification: Remove `sync()` from the startup path entirely and use proper migration tooling (e.g., `sequelize-cli` migrations) managed outside application startup.
- Test coverage: None.

---

## Test Coverage Gaps

**Zero test files in the project:**
- What's not tested: Every backend controller, every middleware, every frontend hook, every component interaction.
- Files: All of `backend/src/` and `frontend/src/`
- Risk: Any refactor or bug fix has no regression safety net. The position arithmetic, ownership verification, optimistic update, and auth flow are all untested.
- Priority: High

**No test framework configured:**
- What's not tested: N/A — tests cannot be written without a configured runner.
- Files: `backend/package.json`, `frontend/package.json` (no test script, no Jest/Vitest dependency)
- Risk: Developers have no automated way to verify correctness.
- Priority: High — add Vitest to frontend, Jest or Vitest to backend before adding features.

**`CardModal` / `useCardDetail` integration never exercised:**
- What's not tested: The card detail modal, label assignment, checklist creation/update, due date picker are all implemented but disconnected from the UI (see Tech Debt above). They could have regressions without detection.
- Files: `frontend/src/components/CardModal.jsx`, `frontend/src/hooks/useCardDetail.js`
- Risk: Silent breakage between hook API and modal component.
- Priority: High — fix the wiring (Tech Debt item) and add integration tests together.

---

## Dependencies at Risk

**`@mui/material` v5 (v6 released):**
- Risk: MUI v6 introduced breaking changes to the theming API and component APIs. The project is pinned to `^5.18.0`. Staying on v5 means eventual end-of-support.
- Impact: Future MUI ecosystem packages (v6 plugins, icon packs) may be incompatible.
- Migration plan: Follow the MUI v5→v6 migration guide; primary changes are in `ThemeProvider` and `CssBaseline` setup in `frontend/src/theme.js`.

**`@hello-pangea/dnd` fork dependency:**
- Risk: `@hello-pangea/dnd` is a community-maintained fork of the abandoned `react-beautiful-dnd`. It has a smaller adoption base and no official corporate backing.
- Impact: Future React versions may break the library with no upstream fix.
- Migration plan: Consider migrating to `@dnd-kit/core` which is actively maintained and supports React 19+.

**No lockfile committed for backend:**
- Risk: `backend/package.json` uses `^` semver ranges with no `package-lock.json` visible in the workspace listing.
- Impact: `npm install` in CI or production may pull different patch versions than what was tested locally.
- Migration plan: Commit `package-lock.json` and use `npm ci` in Dockerfiles instead of `npm install`.

---

*Concerns audit: 2026-03-01*
