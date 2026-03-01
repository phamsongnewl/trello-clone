---
phase: 01-enable-list-drag-and-drop
verified: 2026-03-01T00:00:00Z
status: passed
score: 13/13 must-haves verified
gaps: []
human_verification:
  - test: "Drag a list column left/right on the board"
    expected: "Column moves in real time, order saved after drop"
    why_human: "Visual/interactive behavior"
    result: PASSED (user confirmed)
  - test: "Refresh after reordering"
    expected: "New order persists"
    why_human: "Requires live server round-trip"
    result: PASSED (user confirmed)
  - test: "Simulate server failure during reorder"
    expected: "Board reverts to original order automatically"
    why_human: "Requires network manipulation"
    result: PASSED (user confirmed)
  - test: "Drag a card between lists while list-drag feature is present"
    expected: "Card drag still works normally"
    why_human: "Regression test on interactive behavior"
    result: PASSED (user confirmed)
  - test: "Start dragging a list, observe Add List button"
    expected: "Add List form/button is disabled during list drag"
    why_human: "Visual + interactive"
    result: PASSED (user confirmed)
  - test: "Drop a list, observe Add List button"
    expected: "Add List form/button re-enables after drop"
    why_human: "Interactive state reset"
    result: PASSED (user confirmed)
---

# Phase 01: Enable List Drag-and-Drop — Verification Report

**Phase Goal:** Users can grab any list column by its header and drag it left or right to reorder it. The new order is visible immediately (optimistic update), is saved to the server, and survives a page refresh. If the server call fails the board reverts to the pre-drag order automatically.

**Verified:** 2026-03-01T00:00:00Z
**Status:** ✅ PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `reorderLists()` sends `{ lists:` key (not `{ items:`) | ✓ VERIFIED | `lists.js:37` — `api.patch('/lists/reorder', { lists })` |
| 2 | `useMoveList` optimistically reorders cached list columns | ✓ VERIFIED | `useBoardDetail.js` — `onMutate` cancels queries, snapshots, sets new order |
| 3 | `useMoveList` rolls back cached order on API failure | ✓ VERIFIED | `onError` restores `context.previousBoard` via `setQueryData` |
| 4 | `useMoveList` invalidates board query after settling | ✓ VERIFIED | `onSettled` calls `invalidateQueries({ queryKey })` |
| 5 | `ListColumn` header Box spreads `dragHandleProps` | ✓ VERIFIED | `ListColumn.jsx:106` — `<Box {...dragHandleProps} ...>` |
| 6 | `ListColumn` reduces opacity when `isDragging` is true | ✓ VERIFIED | `ListColumn.jsx:101` — `opacity: isDragging ? 0.8 : 1` |
| 7 | `AddListForm` renders disabled/non-interactive when `disabled` prop is true | ✓ VERIFIED | All interactive elements (Button, TextField, IconButton) gated on `disabled` prop |
| 8 | `BoardPage` outer Droppable has `type="LIST"` and `direction="horizontal"` | ✓ VERIFIED | `BoardPage.jsx:229` — `<Droppable droppableId="board" direction="horizontal" type="LIST">` |
| 9 | Reorder API is wired — `moveList({ lists })` fires on drag end | ✓ VERIFIED | `BoardPage.jsx` — LIST branch in `handleDragEnd` calls `moveList({ lists })` |
| 10 | UI updates immediately via optimistic update in `useMoveList` | ✓ VERIFIED | `onMutate` in `useMoveList` applies new order to cache before API resolves |
| 11 | Board reverts if API fails (onError rollback) | ✓ VERIFIED | `useMoveList.onError` restores snapshot (same pattern as `useMoveCard`) |
| 12 | CARD drag-and-drop still works (CARD branch in `handleDragEnd` preserved) | ✓ VERIFIED | `BoardPage.jsx:106` — `// ── CARD drag ──` branch intact with full logic |
| 13 | Add List form is disabled while a list drag is in progress | ✓ VERIFIED | `isDraggingList` set in `handleDragStart` for LIST type, reset in `handleDragEnd`, passed as `disabled={isDraggingList}` to `AddListForm` |

**Score:** 13/13 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `frontend/src/api/lists.js` | `reorderLists()` with `{ lists:` body | ✓ VERIFIED | Line 37: `api.patch('/lists/reorder', { lists })` |
| `frontend/src/hooks/useBoardDetail.js` | Exports `useMoveList` with optimistic update, onError rollback, onSettled invalidation | ✓ VERIFIED | Full implementation present, 30+ lines |
| `frontend/src/components/ListColumn.jsx` | Accepts `dragHandleProps` + `isDragging`, spreads on header | ✓ VERIFIED | Props destructured in signature, spread on header Box, opacity applied |
| `frontend/src/components/AddListForm.jsx` | `disabled` prop disables all interactive elements | ✓ VERIFIED | `disabled` applied to Button, TextField, IconButton (5 usages) |
| `frontend/src/pages/BoardPage.jsx` | Outer Droppable `type="LIST"`, `isDraggingList` state, `useMoveList` wired | ✓ VERIFIED | All three present and wired correctly |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `BoardPage.handleDragEnd` | `useMoveList` | `moveList({ lists })` call | ✓ WIRED | LIST branch builds reordered array, assigns clean positions, fires mutation |
| `useMoveList.mutationFn` | `reorderLists()` | `lists.map(id + position)` | ✓ WIRED | Passes `{ id, position }` pairs to API |
| `reorderLists()` | `PATCH /lists/reorder` | `api.patch` with `{ lists }` body | ✓ WIRED | Correct key, correct endpoint |
| `ListColumn` header | drag handle | `{...dragHandleProps}` spread | ✓ WIRED | Header Box is the drag grab target |
| `isDraggingList` state | `AddListForm` | `disabled={isDraggingList}` | ✓ WIRED | Disables form during list drag |
| `useMoveList.onMutate` | query cache | `setQueryData` with reordered lists | ✓ WIRED | Optimistic update applied before API returns |
| `useMoveList.onError` | query cache | `setQueryData(previousBoard)` | ✓ WIRED | Rollback restores snapshot |
| `useMoveList.onSettled` | query cache | `invalidateQueries` | ✓ WIRED | Server sync after mutation settles |

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `ListColumn.jsx:67` | `// TODO (future): call updateList mutation here` | ℹ️ Info | List title rename is a future feature, not part of this phase goal |

No blockers found. The single TODO is unrelated to drag-and-drop functionality.

---

### Human Verification

All 6 human verification items were tested against the running application and confirmed PASSED by the user:

1. **Drag list left/right** — column moves in real time, order persists after drop
2. **Refresh after reorder** — new order survives page reload (server-persisted)
3. **Simulated API failure** — board reverts to pre-drag order automatically
4. **Card drag regression** — card drag-and-drop between lists unaffected
5. **Add List disabled during drag** — button/form non-interactive while dragging a list
6. **Add List re-enables after drop** — form returns to normal after drag completes

---

## Summary

Phase 01 fully achieves its goal. All 13 must-haves verified at all three levels (exists, substantive, wired). The implementation follows the same optimistic-update + rollback pattern established by `useMoveCard`, applied consistently to list reordering. No gaps, no blockers. Human verification completed and approved.

---

_Verified: 2026-03-01T00:00:00Z_
_Verifier: Copilot (gsd-verifier)_
