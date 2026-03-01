# Requirements: Trello Clone

**Defined:** 2026-03-01
**Core Value:** Users can organise and move tasks across a Kanban board visually.

## v1.0 Requirements (Validated — Baseline)

These shipped as the v1.0 codebase baseline and are confirmed working.

### Authentication

- ✓ **AUTH-01**: User can register with email and password
- ✓ **AUTH-02**: User can log in and receive a JWT HttpOnly cookie session
- ✓ **AUTH-03**: User session persists across browser refresh

### Boards

- ✓ **BOARD-01**: User can create a board with a title and background colour
- ✓ **BOARD-02**: User can rename a board
- ✓ **BOARD-03**: User can delete a board
- ✓ **BOARD-04**: User sees all their boards on the dashboard

### Lists

- ✓ **LIST-01-v1**: User can add a list (column) to a board
- ✓ **LIST-02-v1**: User can rename a list
- ✓ **LIST-03-v1**: User can delete a list (and all its cards)

### Cards

- ✓ **CARD-01**: User can add a card to a list
- ✓ **CARD-02**: User can edit a card's title and description
- ✓ **CARD-03**: User can delete a card
- ✓ **CARD-04**: User can drag a card within a list to reorder it (optimistic update)
- ✓ **CARD-05**: User can drag a card between lists (optimistic update)

### Card Details

- ✓ **DETAIL-01**: User can add checklists with items to a card
- ✓ **DETAIL-02**: User can assign colour labels to a card
- ✓ **DETAIL-03**: User can set a due date on a card

### Infrastructure

- ✓ **INFRA-01**: App runs via `docker compose up --build` on any machine

---

## v1.1 Requirements (Active — Current Milestone)

### List Reordering

- [ ] **LIST-04**: User can drag a list column left/right to reorder it on the board
- [ ] **LIST-05**: The reordered list column position persists after page refresh (saved to server)
- [ ] **LIST-06**: Board UI reflects the new list order immediately after drop (optimistic update, rolls back on error)

### Bug Fixes

- [ ] **FIX-01**: Frontend `reorderLists()` sends the correct request body (`lists` key, not `items`) matching backend expectations

---

## Future Requirements

Tracked but out of scope for v1.1.

### Collaboration

- **COLLAB-01**: Multiple users can share a board and see live updates (WebSockets)
- **COLLAB-02**: Users can invite others to a board by email

### Attachments

- **ATT-01**: User can attach files/images to a card (requires object storage)

### Activity

- **ACT-01**: Board shows an activity log of all changes

### Search

- **SEARCH-01**: User can search across boards, lists, and cards

---

## Out of Scope

| Feature | Reason |
| ------- | ------- |
| Real-time collaboration | Requires WebSocket layer; deferred |
| File attachments | Requires object storage (S3/R2); deferred |
| Mobile native app | Web-only for now |
| Multi-user board sharing | Auth model is single-user today |

---

## Traceability

| Requirement | Phase | Status |
| ----------- | ----- | ------ |
| LIST-04 | Phase 1 | Pending |
| LIST-05 | Phase 1 | Pending |
| LIST-06 | Phase 1 | Pending |
| FIX-01 | Phase 1 | Pending |

**Coverage:**

- v1.1 requirements: 4 total
- Mapped to phases: 4
- Unmapped: 0 ✓

---

_Requirements defined: 2026-03-01_
_Last updated: 2026-03-01 — v1.1 milestone started_
