# Project Milestones: Trello Clone

[Entries in reverse chronological order — newest first]

## v1.1 List Drag-and-Drop (Shipped: 2026-03-01)

**Delivered:** Horizontal drag-and-drop reordering of list columns on the board, with optimistic updates, server persistence, and automatic rollback on error.

**Phases completed:** 1 (Phase 1: Enable List Drag-and-Drop — 3 plans)

**Key accomplishments:**

- Fixed `reorderLists()` body key mismatch (`items → lists`) to match backend PATCH /api/lists/reorder contract
- Added `useMoveList` hook with full optimistic update / rollback / cache-invalidate lifecycle (mirrors `useMoveCard`)
- Extended `ListColumn` with `dragHandleProps` and `isDragging` props — header-only grab handle
- Extended `AddListForm` with `disabled` prop — gates form while a list drag is in flight
- Wired `BoardPage.jsx`: outer `Droppable type="LIST"` horizontal, per-column `Draggable`, LIST branch in `handleDragEnd`
- Card DnD preserved with zero regression — confirmed 10/10 UAT tests passed

**Stats:**

- Files modified: 5 (lists.js, useBoardDetail.js, ListColumn.jsx, AddListForm.jsx, BoardPage.jsx)
- Phases: 1, Plans: 3, Tasks: 6
- Timeline: 1 day (2026-03-01)
- Git range: `fix(01-01)` → `feat(01-03)`

**What's next:** TBD — start with `/new-milestone.md`

---

## v1.0 MVP (Baseline: 2026-03-01)

**Delivered:** Full-stack Trello-like Kanban app with auth, boards, lists, cards,
drag-and-drop (cards), checklists, labels, due dates, and Docker Compose deployment.

**Phases completed:** — (codebase bootstrapped outside GSD workflow)

**Key accomplishments:**

- User auth with JWT HttpOnly cookies (register / login)
- Full CRUD for boards, lists, and cards
- Card drag-and-drop between lists using @hello-pangea/dnd (optimistic update)
- Card detail: checklists with items, colour labels, due date picker
- One-command Docker Compose setup (frontend + backend + PostgreSQL)

**Stats:**

- Stack: React 18 + MUI v5 + Node.js 20 + Express + Sequelize + PostgreSQL 16
- Key files: 35+ source files across frontend and backend

**What's next:** v1.1 — Enable drag-and-drop reordering of list columns

---
