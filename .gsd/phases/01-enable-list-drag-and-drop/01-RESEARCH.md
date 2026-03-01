# Phase 01: Enable List Drag-and-Drop - Research

**Researched:** 2026-03-01  
**Domain:** @hello-pangea/dnd — nested Droppable types, horizontal drag, optimistic mutation  
**Confidence:** HIGH (primary source: direct codebase inspection + library source knowledge verified against v18 API)

---

## Summary

The v1.0 codebase already wires `@hello-pangea/dnd` for card drag-and-drop.
The library's type system (`type="CARD"` vs `type="LIST"`) is already in place
(`ListColumn.jsx` uses `type="CARD"` on its Droppable, specifically noting in a
comment that this is done to allow a future `type="LIST"` wrapper). The
scaffolding for list DnD is essentially pre-planned.

The work is:
1. Fix the `reorderLists()` API body key mismatch (FIX-01).
2. Add a `<Droppable droppableId="board" direction="horizontal" type="LIST">`
   around the columns container in `BoardPage.jsx`.
3. Wrap each `<ListColumn>` in a `<Draggable>`.
4. Forward `dragHandleProps` to the column header inside `ListColumn`.
5. Add a `useMoveList` hook (mirror of `useMoveCard`) with optimistic update +
   rollback + position rebalancing.
6. Track global drag state via `onDragStart`/`onDragEnd` on `DragDropContext` to
   disable `AddListForm` during a drag.

**Primary recommendation:** Mirror the `useMoveCard` pattern exactly.
The optimistic update, rollback, and invalidation structure is already proven
in the codebase — just apply it to lists.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---|---|---|---|
| @hello-pangea/dnd | ^18.0.1 | Drag-and-drop | **Already installed and used** — forked from react-beautiful-dnd, same API |
| @tanstack/react-query | ^5.90.21 | Mutation + cache | **Already installed** — useMoveCard pattern proven |

No new dependencies required for this phase.

---

## Architecture Patterns

### How the Existing Card DnD Works (source of truth)

```
DragDropContext (BoardPage.jsx)
  └─ Box (horizontal flex scroll container)
       ├─ ListColumn (list A)
       │    └─ Droppable droppableId={list.id} type="CARD"
       │         └─ Draggable draggableId={card.id} index={i} (each card)
       ├─ ListColumn (list B) …
       └─ AddListForm
```

`handleDragEnd` in BoardPage reads `result.type` — currently ignores anything
except implicit CARD behaviour. The `type` field is available on the result
object and must be used to branch between LIST and CARD drag handlers.

### Target Structure After Phase 1

```
DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}
  └─ Droppable droppableId="board" direction="horizontal" type="LIST"
       └─ Box (horizontal flex scroll container — becomes the Droppable's ref)
            ├─ Draggable draggableId={list.id} index={i} (wraps each column)
            │    └─ ListColumn (header area binds dragHandleProps)
            │         └─ Droppable droppableId={list.id} type="CARD"
            │              └─ Draggable … (cards)
            ├─ Draggable …
            └─ provided.placeholder  ← mandatory
```

### Pattern 1: Nested Droppable Type Separation

`@hello-pangea/dnd` uses the `type` prop to scope which Draggables belong to
which Droppable. A Draggable can only be dropped into a Droppable of the same
type.

```jsx
// Outer: list reordering
<Droppable droppableId="board" direction="horizontal" type="LIST">
  {(provided) => (
    <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ display: 'flex', ... }}>
      {sortedLists.map((list, index) => (
        // List Draggable
        <Draggable key={list.id} draggableId={list.id} index={index}>
          {(provided, snapshot) => (
            <Box
              ref={provided.innerRef}
              {...provided.draggableProps}
              // dragHandleProps are forwarded to ListColumn header, NOT here
            >
              <ListColumn
                list={list}
                boardId={boardId}
                dragHandleProps={provided.dragHandleProps}
                isDragging={snapshot.isDragging}
                onDelete={deleteList}
                onCardClick={...}
              />
            </Box>
          )}
        </Draggable>
      ))}
      {provided.placeholder}
      <AddListForm boardId={boardId} disabled={isDraggingList} />
    </Box>
  )}
</Droppable>
```

**CRITICAL:** `provided.draggableProps` must go on the outermost element of the
Draggable render (the Box wrapper). `provided.dragHandleProps` goes only on the
drag-handle element (the column header inside ListColumn). Putting both on the
same element is fine for full-element dragging but wrong here since we want
header-only dragging.

### Pattern 2: Header-Only Drag Handle in ListColumn

ListColumn receives `dragHandleProps` as a prop and spreads it onto the header
`Box`:

```jsx
// ListColumn.jsx
const ListColumn = ({ list, boardId, dragHandleProps, isDragging, onDelete, onCardClick }) => {
  return (
    <Paper
      elevation={2}
      sx={{
        opacity: isDragging ? 0.8 : 1,
        transition: 'opacity 0.15s ease',
        // ... existing styles
      }}
    >
      {/* Column Header — drag handle */}
      <Box
        {...dragHandleProps}
        sx={{
          cursor: dragHandleProps ? 'grab' : 'default',
          '&:active': { cursor: 'grabbing' },
          // ... existing layout styles
        }}
      >
        {/* title + delete button */}
      </Box>

      {/* Droppable card area — unchanged */}
      <Droppable droppableId={list.id} type="CARD">
        ...
      </Droppable>

      {/* Add Card Form — unchanged */}
    </Paper>
  );
};
```

**Cursor decision (Copilot's discretion):** Use `cursor: 'grab'` on the header
Box via its `sx` prop (not via dragHandleProps style override). Switch to
`'grabbing'` on `:active`. This is the cleanest approach because it keeps cursor
logic in the sx system rather than in inline style objects from dragHandleProps.

### Pattern 3: `handleDragEnd` branching on `result.type`

```jsx
const handleDragEnd = (result) => {
  const { draggableId, source, destination, type } = result;

  if (!destination) return;
  if (source.droppableId === destination.droppableId && source.index === destination.index) return;

  if (type === 'LIST') {
    moveList({
      listId: draggableId,
      sourceIndex: source.index,
      destinationIndex: destination.index,
    });
    return;
  }

  // existing CARD handling …
};
```

### Pattern 4: `useMoveList` Hook (mirror of `useMoveCard`)

```javascript
export const useMoveList = (boardId) => {
  const queryClient = useQueryClient();
  const queryKey = boardKeys.detail(boardId);

  return useMutation({
    mutationFn: ({ lists }) => reorderLists(lists),  // [{ id, position }]

    onMutate: async ({ listId, sourceIndex, destinationIndex }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousBoard = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;
        const sorted = [...old.lists].sort((a, b) => a.position - b.position);
        const [moved] = sorted.splice(sourceIndex, 1);
        sorted.splice(destinationIndex, 0, moved);
        // Assign evenly-spaced positions to the reordered array
        const rebalanced = sorted.map((l, i) => ({ ...l, position: (i + 1) * 1000 }));
        return { ...old, lists: rebalanced };
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

**Position payload construction** — build from optimistic state before sending:

```javascript
// In handleDragEnd, after computing the new order:
const sorted = [...board.lists].sort((a, b) => a.position - b.position);
const [moved] = sorted.splice(sourceIndex, 1);
sorted.splice(destinationIndex, 0, moved);
const payload = sorted.map((l, i) => ({ id: l.id, position: (i + 1) * 1000 }));

moveList({ listId: draggableId, sourceIndex, destinationIndex, lists: payload });
```

This means the optimistic update AND the API payload both use the same
evenly-spaced values, so after `onSettled` refetch the server state matches the
cache exactly — no flicker.

### Anti-Patterns to Avoid

- **Putting `dragHandleProps` on the Draggable root element** instead of the
  column header: this makes the entire column (including cards) a drag target,
  conflicting with card dragging.
- **Not passing `provided.placeholder`** inside the outer Droppable: the final
  AddListForm would jump when a column is picked up.
- **Sending midpoint positions to reorderLists** instead of clean evenly-spaced
  ones: the backend stores them fine but violates the auto-rebalance decision.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Drag state tracking | Custom event listeners | `onDragStart` / `onDragEnd` on DragDropContext | Library-provided, guaranteed to fire |
| Placeholder during drag | CSS tricks | `provided.placeholder` (already used for cards) | Without it, container collapses mid-drag |
| Draggable position during flight | Manual transforms | `provided.draggableProps` spread | Library manages transforms |

---

## Common Pitfalls

### Pitfall 1: `direction="horizontal"` Missing on Outer Droppable

**What goes wrong:** Without `direction="horizontal"`, @hello-pangea/dnd uses
vertical hit-testing. Dragging a column left/right will not register a valid
drop target change. The column snaps back to source.  
**How to avoid:** Always specify `direction="horizontal"` on a Droppable that
contains horizontally-laid-out Draggables.

### Pitfall 2: Droppable Ref on the Wrong Element

**What goes wrong:** `provided.innerRef` + `provided.droppableProps` must go
on the scrollable flex container (the existing `<Box>` with `overflowX: auto`).
If they go on an outer wrapper, hit-testing uses the wrong bounding rect.  
**How to avoid:** The outer Droppable replaces the plain `<Box>` — its
`ref={provided.innerRef}` and `{...provided.droppableProps}` go directly on
the `<Box>`.

### Pitfall 3: `isCombineEnabled` vs `type` confusion

**What goes wrong:** Combining `type="LIST"` with `type="CARD"` on nested
droppables is correct, but if `draggableId` values for lists and cards ever
overlap (both are UUIDs — unlikely but worth noting) there could be an edge
case in library internals.  
**How to avoid:** UUIDs are unique across tables in this app; no action needed,
but note it.

### Pitfall 4: AddListForm inside the Droppable but not a Draggable

**What goes wrong:** The `<AddListForm>` is a sibling of the Draggable list
columns inside the flex container. It should NOT be wrapped in a `<Draggable>`.
`@hello-pangea/dnd` allows non-Draggable elements as siblings inside a
Droppable — they are ignored by the library.  
**How to avoid:** Leave `<AddListForm>` as a plain sibling after all
`<Draggable>` wrappers. Pass a `disabled` prop to it to block interaction
during drags.

### Pitfall 5: FIX-01 — Body Key Mismatch

**What goes wrong (confirmed in codebase):**
`frontend/src/api/lists.js` line 37: `reorderLists` sends `{ items }`.  
Backend `listController.js` line 118: destructures `const { lists } = req.body`.  
With the wrong key, `lists` is `undefined`, the `!Array.isArray(lists)` guard
fires, and the server returns 422.  
**Fix:** Change `{ items }` to `{ lists }` in `reorderLists()`.

### Pitfall 6: Forgetting `onDragStart` to Track Drag State

**What goes wrong:** Without tracking whether a drag is in progress, `AddListForm`
remains interactive during a column drag, allowing a list to be created
mid-drag which can cause position conflicts.  
**How to avoid:** Add `useState(false)` for `isDraggingList` in `BoardPage`.
Set it `true` in `onDragStart` (filtering for `type === 'LIST'`), set it
`false` in `onDragEnd`.

---

## Code Examples

### FIX-01: Corrected `reorderLists`

```javascript
// frontend/src/api/lists.js
// Source: direct codebase inspection — listController.js expects { lists: [...] }
export const reorderLists = async (lists) => {
  const response = await api.patch('/lists/reorder', { lists });
  return response.data;
};
```

### Tracking Drag State in BoardPage

```jsx
// Source: @hello-pangea/dnd DragDropContext API
const [isDraggingList, setIsDraggingList] = useState(false);

const handleDragStart = (start) => {
  if (start.type === 'LIST') setIsDraggingList(true);
};

const handleDragEnd = (result) => {
  setIsDraggingList(false);
  // ... existing logic + LIST branch
};

// In JSX:
<DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
```

### Column Opacity from `snapshot.isDragging`

```jsx
// Source: @hello-pangea/dnd Draggable snapshot API
<Draggable key={list.id} draggableId={list.id} index={index}>
  {(provided, snapshot) => (
    <Box
      ref={provided.innerRef}
      {...provided.draggableProps}
    >
      <ListColumn
        isDragging={snapshot.isDragging}
        dragHandleProps={provided.dragHandleProps}
        ...
      />
    </Box>
  )}
</Draggable>

// Inside ListColumn, on the Paper root:
<Paper sx={{ opacity: isDragging ? 0.8 : 1, transition: 'opacity 0.15s ease', ... }}>
```

### AddListForm Disabled Prop

```jsx
// AddListForm currently has no disabled prop — needs to be added
// Props: boardId, disabled
const AddListForm = ({ boardId, disabled = false }) => {
  ...
  // on the trigger Button:
  <Button disabled={disabled} onClick={handleOpen} ...>
    Add list
  </Button>
  // If form is open when drag starts, it stays open but submit is disabled
  // (isPending check already exists — add || disabled to the submit button)
};
```

### Position Rebalancing (evenly-spaced)

```javascript
// After computing the new list order (sourceIndex → destinationIndex)
// Build payload with clean 1000-spaced positions
const reorderedSorted = [...currentSortedLists];
const [moved] = reorderedSorted.splice(sourceIndex, 1);
reorderedSorted.splice(destinationIndex, 0, moved);

const payload = reorderedSorted.map((l, i) => ({
  id: l.id,
  position: (i + 1) * 1000,   // 1000, 2000, 3000 …
}));
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|---|---|---|
| Midpoint float positions (card DnD) | Evenly-spaced integers for lists after each save | Gaps never degrade; no maintenance job needed |
| Single `onDragEnd` handler (card only) | Branching on `result.type` | Unified DragDropContext handles both LIST and CARD drags |

---

## Open Questions

1. **Should the Draggable outer `<Box>` maintain the 280px fixed width or should
   ListColumn's Paper handle that?**
   - What we know: `ListColumn` Paper has `width: 280, minWidth: 280, maxWidth: 280`.
   - The `<Box ref={provided.innerRef}>` wrapper added by Draggable should be
     `display: inline-block` or have no explicit size — ListColumn's Paper
     already constrains width.
   - Recommendation: add `display: 'inline-block'` to the Draggable wrapper Box
     so it doesn't interfere with flex sizing.

2. **Should `AddListForm` close itself if it's open when a drag starts?**
   - Context decision says "visible but disabled" — keep it open if already open,
     just disable interactions.
   - Recommendation: only `disabled` prop needed; no auto-close logic required.

---

## Sources

### Primary (HIGH confidence)

- Direct inspection: `frontend/src/pages/BoardPage.jsx` — DragDropContext, handleDragEnd, column rendering
- Direct inspection: `frontend/src/hooks/useBoardDetail.js` — useMoveCard optimistic pattern
- Direct inspection: `frontend/src/components/ListColumn.jsx` — existing Droppable/Draggable usage + CRITICAL NOTES in JSDoc
- Direct inspection: `frontend/src/api/lists.js` — FIX-01 body key mismatch confirmed
- Direct inspection: `backend/src/controllers/listController.js` — backend expects `{ lists }`, returns `{ message }`
- Direct inspection: `frontend/package.json` — `@hello-pangea/dnd ^18.0.1` confirmed

### Secondary (MEDIUM confidence)

- @hello-pangea/dnd v18 API (DragDropContext onDragStart, Droppable direction, Draggable snapshot.isDragging) — API is stable across v13–v18, consistent with library source patterns verified through existing usage in codebase

---

## Metadata

**Confidence breakdown:**

- FIX-01 body key: HIGH — confirmed by direct source inspection of both frontend and backend
- Standard stack: HIGH — no new dependencies needed
- Architecture (nested Droppable types): HIGH — pre-planned in codebase comments
- `useMoveList` optimistic pattern: HIGH — direct mirror of `useMoveCard`
- Position rebalancing implementation: HIGH — straightforward arithmetic, server response shape confirmed
- AddListForm disabled pattern: HIGH — component structure fully read

**Research date:** 2026-03-01  
**Valid until:** 2026-04-01 (stable library, internal codebase)
