# Trello Clone

## What This Is

A full-stack Trello-inspired project management app. Users create boards, add
lists (columns) to each board, and manage cards inside lists — complete with
checklists, labels, and due dates. The app runs entirely in Docker Compose with
no local Node.js or PostgreSQL installation required.

## Core Value

Users can organise and move tasks across a Kanban board visually.

## Requirements

### Validated

<!-- Shipped in v1.0 baseline. Confirmed working. -->

- ✓ User can register and log in with email + password (JWT cookie sessions) — v1.0
- ✓ User can create, rename, and delete boards — v1.0
- ✓ User can add, rename, and delete lists inside a board — v1.0
- ✓ User can add, edit, and delete cards inside a list — v1.0
- ✓ User can drag cards between lists and within a list (optimistic update) — v1.0
- ✓ User can add checklists with items to a card — v1.0
- ✓ User can assign colour labels to cards — v1.0
- ✓ User can set a due date on a card — v1.0
- ✓ App runs via `docker compose up --build` — v1.0
- ✓ User can drag a list column left/right to reorder it on the board (optimistic update) — v1.1
- ✓ Reordered list position persists after page refresh (saved to server) — v1.1
- ✓ Board UI reflects new list order immediately; rolls back on server error — v1.1
- ✓ `reorderLists()` body key corrected to `lists` matching backend contract — v1.1

### Active

<!-- Next milestone requirements — defined via /new-milestone.md -->

(None — start next milestone with `/new-milestone.md`)

### Out of Scope

| Feature | Reason |
| ------- | ------- |
| Real-time collaboration / WebSockets | Scope deferred to a later milestone |
| Card attachments / file upload | Requires object storage; deferred |
| Board sharing / team members | Auth model is single-user; deferred |
| Mobile native app | Web-only for now |

## Context

- **Stack:** React 18 + MUI v5 + @hello-pangea/dnd (frontend) / Node.js 20 +
  Express + Sequelize + PostgreSQL 16 (backend) / Docker Compose (infra)
- **DnD:** The app already uses `@hello-pangea/dnd`. Card drag-and-drop (within
  and between lists) is fully implemented with optimistic updates. Lists are
  rendered as `Droppable type="CARD"` containers but are not yet `Draggable`.
- **Backend:** `PATCH /api/lists/reorder` already exists and accepts
  `{ lists: [{ id, position }] }`. The frontend `reorderLists()` API helper
  currently sends `{ items }` — this mismatch must be fixed.

## Constraints

- **Tech stack:** Locked to current stack — no new major dependencies for v1.1
- **Docker:** All features must work within the existing Docker Compose setup
- **Auth model:** Single-user (boards are owned by one user); no multi-tenancy

## Key Decisions

| Decision | Rationale | Outcome |
| -------- | --------- | ------- |
| Midpoint position algorithm for ordering | Avoids bulk renumbering on every move; gaps narrow only after many moves | ✓ Good |
| JWT stored in HttpOnly cookie | Prevents XSS token theft | ✓ Good |
| @hello-pangea/dnd over react-dnd | Active fork of react-beautiful-dnd; simpler API for Kanban | ✓ Good |
| `type="CARD"` on list Droppables | Explicitly scopes card drops; enables future `type="LIST"` droppable wrapper | ✓ Good |

---

_Last updated: 2026-03-01 — v1.1 milestone complete (list drag-and-drop shipped)_
