# Project Milestones: Trello Clone

[Entries in reverse chronological order — newest first]

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
