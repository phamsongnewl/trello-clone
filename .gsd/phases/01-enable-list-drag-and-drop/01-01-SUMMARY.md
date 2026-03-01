---
phase: 01-enable-list-drag-and-drop
plan: "01"
subsystem: api, ui
tags: [react-query, optimistic-update, axios, useMutation]

# Dependency graph
requires:
  - phase: v1.0-baseline
    provides: Backend PATCH /api/lists/reorder endpoint already implemented
provides:
  - reorderLists API helper sending correct { lists: [...] } body
  - useMoveList mutation hook with optimistic update, rollback, and invalidation
affects:
  - BoardPage (will call useMoveList on list drop)
  - Any future drag-and-drop orchestration layer

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Optimistic update pattern (cancel → snapshot → setQueryData → rollback on error → invalidate on settled)

key-files:
  created: []
  modified:
    - frontend/src/api/lists.js
    - frontend/src/hooks/useBoardDetail.js

key-decisions:
  - "Request body key corrected from `items` to `lists` to match backend PATCH /api/lists/reorder contract"
  - "useMoveList mirrors useMoveCard pattern exactly: optimistic update → rollback → invalidate"

patterns-established:
  - "useMoveList: accepts { boardId, lists } where lists is fully rebalanced ordered array"

# Metrics
duration: 5min
completed: 2026-03-01
---

# Phase 1 Plan 01: Fix reorderLists + useMoveList Summary

**Body-key mismatch fixed (items→lists) and useMoveList optimistic mutation hook added, unblocking list drag-and-drop on the board**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-01T00:00:00Z
- **Completed:** 2026-03-01T00:05:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Fixed `reorderLists()` request body from `{ items }` to `{ lists }` — aligns with backend contract
- Added `useMoveList(boardId)` export to `useBoardDetail.js` with full optimistic update lifecycle
- `useMoveList` mirrors `useMoveCard`: cancel → snapshot → setQueryData → rollback on error → invalidate on settled

## Task Commits

Each task was committed atomically:

1. **Task 1: FIX-01 correct reorderLists request body key** - `4ef17c5` (fix)
2. **Task 2: add useMoveList mutation hook** - `2159a5a` (feat)

**Plan metadata:** _(this commit)_ (docs: complete plan)

## Files Created/Modified

- `frontend/src/api/lists.js` - Fixed JSDoc and parameter name `items→lists`; request body now `{ lists: [...] }`
- `frontend/src/hooks/useBoardDetail.js` - Added `reorderLists` import; appended `useMoveList` export after `useMoveCard`

## Decisions Made

- No new decisions — followed the plan exactly. Body key correction is a bug fix matching the existing backend contract.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `reorderLists` and `useMoveList` are ready for consumption by `BoardPage`
- `BoardPage` can now wire `useMoveList` to the `onDragEnd` handler for list reordering
- No blockers

---

_Phase: 01-enable-list-drag-and-drop_
_Completed: 2026-03-01_
