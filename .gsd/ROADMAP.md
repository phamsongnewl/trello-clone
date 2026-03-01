# Roadmap: Trello Clone v1.1 — List Drag-and-Drop

**Milestone:** v1.1  
**Scope:** Enable horizontal drag-and-drop reordering of list columns on the board.  
**Phase count:** 1 of 1  
**Requirements covered:** LIST-04, LIST-05, LIST-06, FIX-01  

---

## Overview

v1.0 shipped full card drag-and-drop (within lists and between lists) using
`@hello-pangea/dnd`. List columns are already `Droppable type="CARD"` containers
but are not yet `Draggable` themselves. The backend reorder endpoint
(`PATCH /api/lists/reorder`) is already implemented and accepts
`{ lists: [{ id, position }] }` — a frontend body-key mismatch is the only
server-side fix needed.

v1.1 wires up the remaining DnD layer: wrapping the columns container in a
horizontal `Droppable`, each column in a `Draggable`, dispatching list moves
through a new `useMoveList` hook (modelled after `useMoveCard`), and fixing the
frontend API helper.

---

## Phase 1: Enable List Drag-and-Drop

### Goal

Users can grab any list column by its header and drag it left or right to
reorder it. The new order is visible immediately (optimistic update), is saved
to the server, and survives a page refresh. If the server call fails the board
reverts to the pre-drag order automatically.

### Success Criteria

Observable behaviors that prove the phase is complete:

1. **Drag works visually** — grabbing a list header and dragging left/right moves
   the column in real time with a drag ghost; other columns shift to fill the gap.
2. **Order persists on refresh** — after dropping a list in a new position,
   refreshing the page (`F5`) shows the same order.
3. **UI updates immediately** — the board reflects the dropped order before the
   server responds (optimistic update — no spinner or delay visible to the user).
4. **Rollback on error** — if the API call fails (e.g. network offline) the
   columns snap back to their pre-drag positions.
5. **Card DnD still works** — cards can still be dragged within and between lists
   without regression; the two drag types do not interfere.

### Requirements Covered

| Req ID  | Description                                                        | Status     |
| ------- | ------------------------------------------------------------------ | ---------- |
| LIST-04 | User can drag a list column left/right to reorder it on the board  | ✅ done    |
| LIST-05 | Reordered position persists after page refresh (saved to server)   | ✅ done    |
| LIST-06 | Board UI updates immediately after drop (optimistic + rollback)    | ✅ done    |
| FIX-01  | `reorderLists()` body key corrected from `items` to `lists`        | ✅ done    |

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Fix reorderLists body key + add useMoveList hook (API/hook layer)
- [x] 01-02-PLAN.md — Update ListColumn + AddListForm component props
- [x] 01-03-PLAN.md — Wire BoardPage.jsx for list drag-and-drop (board orchestration)

### Task Breakdown

All tasks are in dependency order. Tasks 1–2 can be executed independently;
Tasks 3–6 form a single connected change set.

---

#### Task 1 — Fix `reorderLists()` request body key (FIX-01)

**File:** `frontend/src/api/lists.js`

**Change:**

```js
// BEFORE
export const reorderLists = async (items) => {
  const response = await api.patch('/lists/reorder', { items });
  return response.data;
};

// AFTER
export const reorderLists = async (lists) => {
  const response = await api.patch('/lists/reorder', { lists });
  return response.data;
};
```

The PATCH body key must be `lists` (not `items`) to match the backend
`reorderLists` controller, which destructures `const { lists } = req.body` and
validates with `if (!Array.isArray(lists) || lists.length === 0)`.

The parameter is renamed from `items` to `lists` for clarity; the call site
(`useMoveList`) will pass `[{ id, position }]` objects directly.

**Verify:** `grep -n 'items' frontend/src/api/lists.js` returns no matches in
the `reorderLists` function body.

---

#### Task 2 — Add `useMoveList` hook to `useBoardDetail.js` (LIST-05, LIST-06)

**File:** `frontend/src/hooks/useBoardDetail.js`

**Model:** Follow `useMoveCard` exactly — same optimistic-update / rollback /
invalidate-on-settled pattern.

**Steps:**

1. Add `reorderLists` to the import from `'../api/lists'`:
   ```js
   import { createList, deleteList, reorderLists } from '../api/lists';
   ```

2. Export a new `useMoveList(boardId)` hook after `useMoveCard`:

```js
// ─── useMoveList ─────────────────────────────────────────────────────────────
/**
 * Mutation: reorder a list to a new position on the board.
 *
 * Optimistic update:
 * 1. Snapshot current board data.
 * 2. Immediately rewrite cached lists order so UI reflects the drop.
 * 3. On error, roll back to the snapshot.
 * 4. On settled, refetch to sync with server.
 */
export const useMoveList = (boardId) => {
  const queryClient = useQueryClient();
  const queryKey = boardKeys.detail(boardId);

  return useMutation({
    mutationFn: ({ listId, position }) =>
      reorderLists([{ id: listId, position }]),

    onMutate: async ({ listId, position }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousBoard = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;
        const updatedLists = old.lists.map((list) =>
          list.id === listId ? { ...list, position } : list,
        );
        return { ...old, lists: updatedLists };
      });

      return { previousBoard };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(queryKey, context.previousBoard);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};
```

**Note on mutationFn:** The backend accepts a full array so `reorderLists` is
called with a single-element array `[{ id: listId, position }]`. This is
correct — the backend bulk-updates in `Promise.all`, so a one-element array is
a valid call.

**Verify:** Import `useMoveList` in BoardPage.jsx and confirm TypeScript/JSDoc
is consistent; run `docker compose up` and confirm no console errors on load.

---

#### Task 3 — Wrap the columns container in a horizontal `Droppable` (LIST-04)

**File:** `frontend/src/pages/BoardPage.jsx`

**Change:** Inside the `<DragDropContext>`, the inner `<Box>` that renders
`sortedLists.map(...)` must become the droppable area for list drops.

```jsx
// Add to imports at top of file:
import { DragDropContext, Droppable } from '@hello-pangea/dnd';

// Also add useMoveList to the hook import line:
import { useBoardDetail, useMoveCard, useMoveList, useDeleteList }
  from '../hooks/useBoardDetail';

// Inside the component, add the mutation:
const { mutate: moveList } = useMoveList(boardId);

// Replace the inner <Box sx={{ flex: 1, display: 'flex', ... }}> wrapper
// with a <Droppable> that renders that same Box as its child:

<Droppable
  droppableId="board-lists"
  type="LIST"
  direction="horizontal"
>
  {(provided) => (
    <Box
      ref={provided.innerRef}
      {...provided.droppableProps}
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 2,
        px: 2,
        py: 2,
        overflowX: 'auto',
        overflowY: 'hidden',
        minHeight: 0,
        '&::-webkit-scrollbar': { height: 8 },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(255,255,255,0.35)',
          borderRadius: 4,
        },
        '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
      }}
    >
      {sortedLists.map((list, index) => (
        /* Task 4: each list wrapped in Draggable — see next task */
        <ListColumn
          key={list.id}
          list={list}
          boardId={boardId}
          onDelete={deleteList}
          onCardClick={(card) => console.log('Card clicked:', card.id)}
        />
      ))}
      {provided.placeholder}
      <AddListForm boardId={boardId} />
    </Box>
  )}
</Droppable>
```

**Critical:** `provided.placeholder` must be inside the `<Box>` but before
`<AddListForm>` so placeholder space is injected between columns, not at the end
of the Add List button.

**Verify:** Board renders without errors; card drag still works; inspecting
React DevTools shows `Droppable` wrapping the columns box.

---

#### Task 4 — Wrap each `ListColumn` in a `Draggable` (LIST-04)

**File:** `frontend/src/pages/BoardPage.jsx`

**Change:** In the `sortedLists.map(...)` call added in Task 3, wrap each
`<ListColumn>` with a `<Draggable>`:

```jsx
// Add to imports:
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Replace the ListColumn rendering inside sortedLists.map:
{sortedLists.map((list, index) => (
  <Draggable key={list.id} draggableId={list.id} index={index}>
    {(provided) => (
      <ListColumn
        key={list.id}
        list={list}
        boardId={boardId}
        onDelete={deleteList}
        onCardClick={(card) => console.log('Card clicked:', card.id)}
        draggableProvided={provided}
      />
    )}
  </Draggable>
))}
```

Pass the `provided` object as a **named prop** `draggableProvided` so
`ListColumn` can apply `ref`, `draggableProps`, and `dragHandleProps` in the
right places (see Task 5).

**Verify:** Dragging a column header causes a drag ghost to appear; columns are
reorderable visually (before `handleDragEnd` is wired up the drop will snap back
— that is expected at this stage).

---

#### Task 5 — Update `ListColumn.jsx` to consume `draggableProvided` (LIST-04)

**File:** `frontend/src/components/ListColumn.jsx`

**Change:** Accept the new `draggableProvided` prop and spread its refs/props
onto the column's root `<Paper>` and drag handle area.

```jsx
// Add draggableProvided to props destructuring:
const ListColumn = ({ list, boardId, onDelete, onCardClick, draggableProvided }) => {

  // ...existing state and handlers unchanged...

  return (
    <Paper
      ref={draggableProvided?.innerRef}
      {...(draggableProvided?.draggableProps ?? {})}
      sx={{
        // existing sx styles unchanged
        width: 272,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 120px)',
        backgroundColor: '#ebecf0',
      }}
    >
      {/* ── Column Header ──────────────────────────────────────────────────── */}
      {/* Apply dragHandleProps to the header so only the header initiates drag */}
      <Box
        {...(draggableProvided?.dragHandleProps ?? {})}
        sx={{
          // existing header sx styles unchanged
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 1,
          cursor: 'grab',
        }}
      >
        {/* ... existing title + delete icon JSX unchanged ... */}
      </Box>

      {/* ── Cards Droppable ── (unchanged: type="CARD") ──────────────────── */}
      {/* ... rest of component unchanged ... */}
    </Paper>
  );
};
```

**Key decisions:**
- `draggableProvided` is optional (`?.`) so `ListColumn` still renders correctly
  in isolation / Storybook without a Draggable parent.
- `ref` goes on the root element (the `<Paper>`), **not** on the inner card area.
- `draggableProps` (position transforms) go on the root element.
- `dragHandleProps` (drag initiation listener) go on the **header `<Box>` only**
  so clicking inside a card or the add-card form does NOT trigger a list drag.

**Verify:** Hovering over the list header shows a `grab` cursor; hovering over
cards shows the default cursor.

---

#### Task 6 — Add list drag branch to `handleDragEnd` (LIST-04, LIST-05, LIST-06)

**File:** `frontend/src/pages/BoardPage.jsx`

**Change:** Add a `result.type === 'LIST'` branch at the top of `handleDragEnd`,
before the existing card logic. Use the same midpoint algorithm already used for
cards.

```js
const handleDragEnd = (result) => {
  const { draggableId, type, source, destination } = result;

  // No destination or dropped in same position → no-op
  if (!destination) return;
  if (
    source.droppableId === destination.droppableId &&
    source.index === destination.index
  ) {
    return;
  }

  if (!board) return;

  // ── List drag ─────────────────────────────────────────────────────────────
  if (type === 'LIST') {
    // sortedLists is already computed above in the render path;
    // re-derive here so the handler is self-contained.
    const lists = [...(board.lists ?? [])].sort(
      (a, b) => a.position - b.position,
    );

    // Remove the dragged list from the sorted array so index arithmetic
    // matches what the user sees after the drop.
    const listsWithout = lists.filter((l) => l.id !== draggableId);

    // Midpoint position calculation (same algorithm as cards)
    const before = listsWithout[destination.index - 1]?.position ?? 0;
    const after =
      listsWithout[destination.index]?.position ?? before + 2000;
    const newPosition = (before + after) / 2;

    moveList({ listId: draggableId, position: newPosition });
    return; // Don't fall through to card logic
  }

  // ── Card drag (existing logic — unchanged) ────────────────────────────────
  const destList = board.lists.find((l) => l.id === destination.droppableId);
  if (!destList) return;

  // ... rest of existing card drag code unchanged ...
};
```

**Why `return` after `moveList`:** Without it, the card drag logic below would
run and try to find a list with `id === "board-lists"` (the droppableId of the
list droppable), which would be `undefined` and silently no-op — but it is
cleaner to exit explicitly.

**Verify end-to-end:**
1. `docker compose up --build`
2. Open board with 3+ lists
3. Drag a list to a new position — columns reorder immediately
4. Refresh page — order is preserved
5. Drag a card between lists — no regression
6. Disconnect network (DevTools → Offline), drag a list, reconnect — columns
   snap back to pre-drag order

---

### Effort Estimate

| Task | Scope                                        | Copilot time |
| ---- | -------------------------------------------- | ------------ |
| 1    | Fix `reorderLists` body key                  | ~5 min       |
| 2    | Add `useMoveList` hook                       | ~20 min      |
| 3    | Wrap columns container in horizontal Droppable | ~15 min    |
| 4    | Wrap each ListColumn in Draggable            | ~10 min      |
| 5    | Update ListColumn to consume draggableProvided | ~20 min    |
| 6    | Add list drag branch to handleDragEnd        | ~20 min      |
| **Total** |                                         | **~90 min**  |

### Files Modified

| File                                        | Change summary                                        |
| ------------------------------------------- | ----------------------------------------------------- |
| `frontend/src/api/lists.js`                 | Rename param + body key: `items` → `lists`            |
| `frontend/src/hooks/useBoardDetail.js`      | Add `useMoveList` export; add `reorderLists` import   |
| `frontend/src/pages/BoardPage.jsx`          | Add Droppable wrapper, Draggable per column, list drag branch in handleDragEnd, import useMoveList |
| `frontend/src/components/ListColumn.jsx`    | Accept `draggableProvided` prop; spread ref + draggableProps on root, dragHandleProps on header |

### No Backend Changes Required

`PATCH /api/lists/reorder` is already correct. The only fix (`FIX-01`) is on
the frontend API helper alone.

---

## Milestone Completion Checklist

- [ ] All 4 requirements (LIST-04, LIST-05, LIST-06, FIX-01) implemented
- [ ] End-to-end drag test: 3-list board, drag each list, verify order post-refresh
- [ ] Card drag regression: cards still moveable within and between lists
- [ ] Offline rollback test: optimistic update reverts on network failure
- [ ] `docker compose up --build` passes clean with no console errors
