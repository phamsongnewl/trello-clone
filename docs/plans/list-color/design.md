# List Color Feature — Design Document

**Date:** 2026-03-03  
**Status:** Approved  
**Scope:** Allow users to set a background color for individual list columns.

---

## Problem Statement

Currently, all list columns are rendered with a fixed gray background (`#ebecf0`). Users cannot personalize or visually distinguish lists by color.

---

## Approach

**Icon button + Popover (Approach 1)**

Add a `PaletteIcon` button to the list column header (next to the existing delete button). Clicking it opens a MUI `Popover` with a preset palette of 12 colors plus a "clear color" option. Selecting a color calls the backend `PATCH /api/lists/:id` endpoint. The chosen color persists on the `List` DB record and is reflected immediately in the UI.

---

## Design

### 1. Data Layer (Backend)

**Migration:** `backend/scripts/db/add_list_color.sql`
```sql
ALTER TABLE lists ADD COLUMN IF NOT EXISTS color VARCHAR(20) NULL DEFAULT NULL;
```

**Model — `backend/src/models/List.js`**  
Add a new column definition:
```js
color: {
  type: DataTypes.STRING(20),
  allowNull: true,
  defaultValue: null,
},
```

**Controller — `backend/src/controllers/listController.js` → `updateList`**  
Accept `color` from `req.body`. Validate it is either `null` or a valid 7-character hex string (`#rrggbb`). Apply to the list record before `save()`.

---

### 2. API & Hooks (Frontend)

**`frontend/src/api/lists.js`**  
Add:
```js
export const updateList = (listId, data) => api.put(`/lists/${listId}`, data);
```

**`frontend/src/hooks/useBoardDetail.js`**  
Add `useUpdateList(boardId)` hook:
```js
export const useUpdateList = (boardId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, data }) => updateList(listId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
  });
};
```

---

### 3. UI Layer (Frontend)

**`frontend/src/components/ListColumn.jsx`**

Changes:
- Import `PaletteIcon`, `Popover`, and MUI theme utilities.
- Add constants for 12 preset colors (Trello-style palette) + transparent/clear option.
- Add state: `colorAnchorEl` (null | HTMLElement) — controls Popover visibility.
- Add `PaletteIcon` `IconButton` in the header row, between title area and delete button.
- `Paper` `backgroundColor` reads from `list.color ?? '#ebecf0'`.
- Text/icon contrast automatically adjusted: if the background luminance is below 0.3, use white text; otherwise use default dark text.
- Popover renders a `Box` grid of colored swatches (28×28 px each, 6 per row, 2 rows) plus one "clear" swatch.
- Clicking a swatch calls the `useUpdateList` mutation and closes the Popover.

**Preset palette (12 colors):**

| Name | Hex |
|------|-----|
| Green | `#61bd4f` |
| Yellow | `#f2d600` |
| Orange | `#ff9f1a` |
| Red | `#eb5a46` |
| Purple | `#c377e0` |
| Blue | `#0079bf` |
| Sky | `#00c2e0` |
| Lime | `#51e898` |
| Pink | `#ff78cb` |
| Black | `#344563` |
| Teal | `#4bbf6b` |
| Rose | `#e04055` |

---

## Data Flow

```
User clicks PaletteIcon
  → Popover opens (colorAnchorEl set)
    → User clicks a color swatch
      → useUpdateList mutation fires (PUT /api/lists/:id { color })
        → Backend validates & saves color to DB
          → invalidateQueries re-fetches board
            → ListColumn re-renders with new list.color
```

---

## Error Handling

- Backend returns 422 if `color` is provided but invalid format.
- Frontend shows no error UI for color save failures (silent retry on next refetch is acceptable for this low-stakes action).

---

## Out of Scope

- Per-card color (separate feature).
- Custom hex input (preset palette only).
- Color-based filtering or grouping.
