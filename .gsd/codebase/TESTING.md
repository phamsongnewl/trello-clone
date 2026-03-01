# Testing Patterns

**Analysis Date:** 2026-03-01

## Test Framework

**Runner:** None configured

No test framework is installed in either `backend/package.json` or `frontend/package.json`. There are no `jest.config.*`, `vitest.config.*`, or equivalent config files anywhere in the workspace. No test scripts are defined under `"scripts"` in either package manifest.

**Test Files:** Zero test files exist in the codebase. No `*.test.*` or `*.spec.*` files were found under any directory.

## Current Test Coverage

**Coverage:** 0% — no automated tests of any kind exist.

This applies to:
- `backend/src/controllers/` — all seven controllers untested
- `backend/src/middleware/` — `auth.js` and `errorHandler.js` untested
- `backend/src/models/` — all nine Sequelize models untested
- `backend/src/routes/` — all route definitions untested
- `frontend/src/api/` — all seven API modules untested
- `frontend/src/hooks/` — all three custom hook files untested
- `frontend/src/components/` — all eleven components untested
- `frontend/src/pages/` — all four pages untested
- `frontend/src/store/AuthContext.jsx` — untested

## Recommended Test Framework Setup

### Backend

```bash
npm install --save-dev jest supertest @jest/globals
```

Recommended `jest.config.js` for the backend:

```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js'],
};
```

### Frontend

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Recommended addition to `frontend/vite.config.js`:

```javascript
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: './src/test/setup.js',
}
```

## Recommended Test File Organization

**Backend — co-located `__tests__/` directories:**

```
backend/src/
├── controllers/
│   ├── __tests__/
│   │   ├── authController.test.js
│   │   ├── boardController.test.js
│   │   ├── cardController.test.js
│   │   └── ...
│   └── authController.js
├── middleware/
│   ├── __tests__/
│   │   ├── auth.test.js
│   │   └── errorHandler.test.js
│   └── auth.js
└── models/
    └── __tests__/
        └── Board.test.js
```

**Frontend — co-located `__tests__/` directories:**

```
frontend/src/
├── components/
│   └── __tests__/
│       ├── CardModal.test.jsx
│       └── BoardCard.test.jsx
├── hooks/
│   └── __tests__/
│       └── useBoardDetail.test.js
└── pages/
    └── __tests__/
        └── BoardPage.test.jsx
```

## Recommended Test Structure

**Backend controller (supertest integration test):**

```javascript
import request from 'supertest';
import app from '../../index.js';

describe('POST /api/boards', () => {
  it('returns 422 when title is missing', async () => {
    const res = await request(app)
      .post('/api/boards')
      .set('Cookie', 'token=valid_test_token')
      .send({});
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('message');
  });

  it('returns 201 with created board', async () => {
    const res = await request(app)
      .post('/api/boards')
      .set('Cookie', 'token=valid_test_token')
      .send({ title: 'My Board' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'My Board' });
  });
});
```

**Frontend hook (React Query + Testing Library):**

```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBoardDetail } from '../useBoardDetail';
import * as boardsApi from '../../api/boards';

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useBoardDetail', () => {
  it('returns board data on success', async () => {
    vi.spyOn(boardsApi, 'getBoardById').mockResolvedValue({ id: '1', title: 'Board' });
    const { result } = renderHook(() => useBoardDetail('1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: '1', title: 'Board' });
  });
});
```

## Mocking Guidance

**Backend:**
- Mock Sequelize model methods (`Board.findAll`, `User.findOne`, etc.) with `jest.spyOn` or `jest.mock('../models/index')`
- Mock `bcryptjs` for auth tests to avoid real hashing overhead
- Mock `jsonwebtoken` to control token validation in auth middleware tests
- Use a test database (SQLite in-memory via `sequelize-mock` or a real Postgres test DB) for integration tests

**Frontend:**
- Mock `src/api/axios.js` at the module level: `vi.mock('../api/axios')`
- Mock individual API functions with `vi.spyOn` (as shown above)
- Use `msw` (Mock Service Worker) for realistic fetch/axios interception in integration tests
- Do NOT mock React Query internals — wrap components in a real `QueryClientProvider` with `retry: false`
- Do NOT mock child MUI components; test behavior, not implementation

## Priority Test Areas

Given zero coverage, prioritize in this order:

1. **`backend/src/middleware/auth.js`** — Gates all protected routes; unit test token absent, valid, expired, and user-not-found cases
2. **`backend/src/middleware/errorHandler.js`** — Unit test each error type mapping (UniqueConstraintError, JWTError, generic)
3. **`backend/src/controllers/authController.js`** — Integration test register (success, duplicate email, validation failure) and login (success, wrong password)
4. **`backend/src/controllers/boardController.js`** — CRUD happy paths plus 404 ownership guard
5. **`frontend/src/store/AuthContext.jsx`** — Unit test `login`, `logout`, and loading state
6. **`frontend/src/hooks/useBoardDetail.js`** — Unit test each mutation's cache invalidation behavior
7. **`frontend/src/components/CardModal.jsx`** — Render test: loading skeleton, error state, and title auto-save on blur

## Test Run Commands (Once Configured)

**Backend (Jest):**

```bash
cd backend
npm test                        # Run all tests
npm test -- --watch             # Watch mode
npm test -- --coverage          # Coverage report
```

**Frontend (Vitest):**

```bash
cd frontend
npx vitest                      # Run all tests
npx vitest --watch              # Watch mode
npx vitest --coverage           # Coverage report
```

---

*Testing analysis: 2026-03-01*
