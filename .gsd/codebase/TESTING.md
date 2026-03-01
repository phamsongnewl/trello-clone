# Testing Patterns

**Analysis Date:** 2026-03-01

## Test Framework

**Runner:** None installed

Neither `backend/package.json` nor `frontend/package.json` lists a test runner, assertion library, or any testing-related devDependency. No `jest.config.*`, `vitest.config.*`, or `mocha.*` config files exist in the repository.

**Assertion Library:** None

**Test Commands:**
```bash
# No test commands configured in either package.json
# backend/package.json scripts: { "start": "node src/index.js", "dev": "nodemon src/index.js" }
# frontend/package.json scripts: { "dev": "vite", "build": "vite build", "preview": "vite preview" }
```

## Test File Organization

**Location:** No test files exist in the repository

**Naming:** No convention established

**Structure:**
```
# No test directories found under:
# backend/src/
# frontend/src/
```

## Test Coverage

**Requirements:** None enforced — no coverage configuration

**Current coverage:** 0% — no tests exist

## Recommended Setup (when adding tests)

### Backend (Node/Express)

Suggested stack: **Jest** + **Supertest** for integration tests

```bash
npm install --save-dev jest supertest
```

Suggested `package.json` addition:
```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
},
"jest": {
  "testEnvironment": "node"
}
```

Suggested test file location: co-located under `backend/src/` or in `backend/tests/`:
```
backend/
  tests/
    controllers/
      boardController.test.js
    middleware/
      auth.test.js
    routes/
      boards.test.js
```

Pattern to follow (matches existing handler style):
```javascript
const request = require('supertest');
const app = require('../../src/index');

describe('GET /api/boards', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/boards');
    expect(res.status).toBe(401);
  });
});
```

### Frontend (React/Vite)

Suggested stack: **Vitest** + **React Testing Library** (aligns with Vite build tooling)

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Suggested `vite.config.js` addition:
```javascript
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: './src/test/setup.js',
}
```

Suggested test file location: co-located with component files:
```
frontend/src/
  components/
    CardModal.jsx
    CardModal.test.jsx
  hooks/
    useBoardDetail.js
    useBoardDetail.test.js
```

## Mocking Strategy (recommended)

**Framework:** `jest.fn()` (backend) / `vi.fn()` (frontend with Vitest)

**What to mock:**
- Sequelize model methods (`Board.findAll`, `Board.create`) in controller unit tests
- Axios API calls in hook tests using `vi.mock('../api/boards')`
- `useQueryClient` when testing mutation hooks

**What NOT to mock:**
- Business logic utilities (`signToken`, `safeUser`) — test these directly
- React Query state management — use a real `QueryClientProvider` wrapper in component tests

**Recommended React Query test wrapper:**
```jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

## Areas Requiring Test Coverage (Priority Order)

**High Priority — Core business logic:**
1. `backend/src/middleware/auth.js` — JWT verification, missing token, expired token
2. `backend/src/middleware/errorHandler.js` — Sequelize error mapping, JWT error mapping
3. `backend/src/controllers/authController.js` — register/login validation, duplicate email
4. `backend/src/controllers/boardController.js` — ownership checks, 404 behavior

**Medium Priority — Frontend state:**
1. `frontend/src/store/AuthContext.jsx` — login/logout state transitions
2. `frontend/src/hooks/useBoardDetail.js` — mutation invalidation behavior
3. `frontend/src/api/axios.js` — 401 interceptor redirect

**Lower Priority — UI components:**
1. `frontend/src/components/CardModal.jsx` — title/description auto-save on blur
2. `frontend/src/pages/BoardPage.jsx` — drag-and-drop position calculation logic

## Test Types

**Unit Tests:**
- Scope: Individual functions and utilities (validators, helpers, middleware)
- Backend examples: `signToken()`, `safeUser()`, `errorHandler()`, `auth()` middleware

**Integration Tests:**
- Scope: Full HTTP request/response cycle with in-memory or test database
- Backend examples: `POST /api/auth/register`, `GET /api/boards`, `PATCH /api/cards/:id`

**E2E Tests:**
- Framework: Not set up — Playwright or Cypress would be appropriate additions
- Scope: Full user flows (login → create board → add list → add card)

---

_Testing analysis: 2026-03-01_
