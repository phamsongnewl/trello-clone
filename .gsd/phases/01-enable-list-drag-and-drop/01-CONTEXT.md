# Phase 1: Enable List Drag-and-Drop - Context

**Gathered:** 2026-03-01  
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire up horizontal list column reordering on the board using the existing
`@hello-pangea/dnd` library (already used for card drag-and-drop). No backend
changes required — `PATCH /api/lists/reorder` is already correct; only the
frontend API helper body key needs fixing (FIX-01).

This phase delivers: drag a list column by its header → it reorders →
the new order persists after refresh → rollback if the server call fails.

</domain>

<decisions>
## Implementation Decisions

### Drag Handle

- **Header-only drag** — only the column header initiates a list drag.
  Clicking inside a card, the card list, or the add-card area does NOT
  trigger a list drag.
- Cursor style on the drag handle: **Copilot's discretion**.

### Visual Feedback During Drag

- **Dragged column**: reduced opacity (~0.8) — column ghosted but still
  readable while in flight.
- **Vacated slot placeholder**: ghost placeholder box — a faint grey box the
  same size as the column fills the gap while the user is mid-drag.
  (`@hello-pangea/dnd` renders this via `provided.placeholder`.)

### Add List Button During Drag

- The "Add a list" form/button stays **visible but disabled** while a drag is
  in progress. It should not hide; instead it should be non-interactive so the
  user can see where it is but cannot accidentally click it mid-drag.

### Position Collision Handling

- **Auto-rebalance after every save** — after each successful `reorderLists`
  API call, redistribute all list positions to clean integer values
  (e.g. 1000, 2000, 3000 …) so gaps never degrade over time.
- Implementation note: fetch the fresh list order from the server response (or
  from the invalidated query) and issue a follow-up reorder with
  evenly-spaced positions. Keep this transparent to the user (no spinner).

### Copilot's Discretion

- Cursor style on drag handle (grab/grabbing or pointer — Copilot decides
  the cleanest approach).

</decisions>

<specifics>
## Specific Ideas

No specific visual references provided — standard `@hello-pangea/dnd` drag
behaviour (matching the existing card drag UX) is expected.

The position rebalancing should be silent — same optimistic-update / settle
pattern used elsewhere in the app.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 01-enable-list-drag-and-drop_  
_Context gathered: 2026-03-01_
