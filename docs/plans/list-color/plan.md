# List Color Feature

**Branch:** `feature/list-color`
**Description:** Add per-list background color selection via a preset palette popover.

## Goal
Allow users to set a background color for individual list columns by choosing from a 12-color preset palette. This improves visual organization and personalization of boards.

---

## Research Summary

| File | Relevant Finding |
|------|-----------------|
| `backend/src/controllers/listController.js` | `updateList` only destructs `title` from `req.body`; `color` handling is completely absent. Ownership check via `list.board.user_id !== req.user.id` already in place — no change there needed. |
| `backend/src/models/List.js` | Model defines `id`, `title`, `position`, `board_id` only. `color` column/attribute is missing entirely. |
| `backend/scripts/db/add_board_position.sql` | Migration pattern: bare `ALTER TABLE … ADD COLUMN IF NOT EXISTS`. No transaction wrapper. Follow same pattern. |
| `backend/src/routes/lists.js` | `PUT /lists/:id` already routes to `updateList`. **No route changes needed.** |
| `frontend/src/api/lists.js` | `updateList(id, data)` **already exported** — calls `api.put(\`/lists/${id}\`, data)`. No change needed in this file. |
| `frontend/src/hooks/useBoardDetail.js` | Imports `createList, deleteList, reorderLists` from `../api/lists`. `updateList` is missing from the import. All hooks follow the pattern: `useMutation` + `invalidateQueries({ queryKey: boardKeys.detail(boardId) })`. |
| `frontend/src/components/ListColumn.jsx` | Imports: `useState, useRef, useEffect`, `Droppable`, `Box, Paper, Typography, IconButton, TextField, Tooltip`, `DeleteOutlineIcon`. `PaletteIcon` and `Popover` are absent. Paper has hardcoded `backgroundColor: '#ebecf0'`. No color state exists. No hook is called inside the component — hook must be called here or passed via prop. Following codebase patterns, call `useUpdateList(boardId)` directly inside the component (same pattern as `AddCardForm` calls `useCreateCard` internally). |

---

## Implementation Steps

### Step 1: DB Migration & Backend Model

**Files:**
- `backend/scripts/db/add_list_color.sql`
- `backend/src/models/List.js`
- `backend/src/controllers/listController.js`

**What:**

**`backend/scripts/db/add_list_color.sql`** — Create new migration script:
```sql
-- Migration: add color column to lists
ALTER TABLE lists ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT NULL;
```

**`backend/src/models/List.js`** — Add `color` field inside the `super.init({...})` attributes object, after the `board_id` field:
```js
color: {
  type: DataTypes.STRING(20),
  allowNull: true,
  defaultValue: null,
},
```

**`backend/src/controllers/listController.js`** — In `updateList`, add a `color` validation + assignment block after the existing `title` block. Extract `color` from `req.body` alongside `title`:
```js
const { title, color } = req.body;
```
Then after the title block, add:
```js
if (color !== undefined) {
  if (color !== null && !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return res.status(422).json({ message: 'color must be null or a valid hex color (#rrggbb)' });
  }
  list.color = color;
}
```
`null` is the legal value for clearing a color; any non-null value must be a 7-character `#rrggbb` hex string. The regex rejects anything else.

**Testing:**
- Run the SQL script against the local database: `psql -d <db> -f backend/scripts/db/add_list_color.sql` and verify `\d lists` shows the new `color` column.
- `PUT /api/lists/:id` with `{ color: "#0079bf" }` → `200` with `color: "#0079bf"` in response body.
- `PUT /api/lists/:id` with `{ color: null }` → `200` with `color: null`.
- `PUT /api/lists/:id` with `{ color: "red" }` → `422` with message `color must be null or a valid hex color (#rrggbb)`.
- `PUT /api/lists/:id` with `{ color: "#gggggg" }` → `422` (invalid hex chars).
- `PUT /api/lists/:id` with `{ title: "New title" }` (no color key) → `200`, `color` unchanged — regression check.
- Unauthenticated request → `401` (existing auth middleware, no regression).

---

### Step 2: Frontend API & Hook

**Files:**
- `frontend/src/api/lists.js` *(no change — `updateList` already exported)*
- `frontend/src/hooks/useBoardDetail.js`

**What:**

**`frontend/src/api/lists.js`** — No changes required. `updateList` is already exported correctly:
```js
export const updateList = async (id, data) => {
  const response = await api.put(`/lists/${id}`, data);
  return response.data;
};
```

**`frontend/src/hooks/useBoardDetail.js`** — Two changes:

1. Add `updateList` to the existing named import from `'../api/lists'`:
```js
import { createList, deleteList, reorderLists, updateList } from '../api/lists';
```

2. Add the `useUpdateList` hook at the bottom of the file, following the section separator convention:
```js
// ─── useUpdateList ───────────────────────────────────────────────────────────

/**
 * Mutation: update a list's properties (title, color).
 * Invalidates board query on success so the list re-renders with new data.
 */
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

**Testing:**
- Import and call `useUpdateList('test-board-id')` in a temporary component; verify no console errors on mount.
- Trigger `mutate({ listId: '<id>', data: { color: '#eb5a46' } })` — confirm the board query is refetched and the list's color updates in the cached data.
- Verify existing hooks (`useCreateList`, `useDeleteList`, etc.) are unaffected by the import change.

---

### Step 3: UI — ListColumn Color Picker

**Files:**
- `frontend/src/components/ListColumn.jsx`

**What:**

**Imports** — Add to existing MUI named import:
- `Popover` from `'@mui/material'`

Add new icon import line:
```js
import PaletteIcon from '@mui/icons-material/Palette';
```

Import the new hook:
```js
import { useUpdateList } from '../hooks/useBoardDetail';
```

**State** — Add one new state variable after the existing `useState` declarations:
```js
const [colorAnchorEl, setColorAnchorEl] = useState(null);
```

**Hook call** — Call the mutation hook inside the component body (after state declarations):
```js
const updateListMutation = useUpdateList(boardId);
```

**Palette constants** — Define above the return statement:
```js
const PRESET_COLORS = [
  '#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46',
  '#c377e0', '#0079bf', '#00c2e0', '#51e898',
  '#ff78cb', '#344563', '#4bbf6b', '#e04055',
];

// Derive a contrast-safe text/icon color from the list's current background.
// Uses perceived-brightness formula: bright backgrounds → dark text, dark → white.
const getBgColor = () => list.color ?? '#ebecf0';
const getTextColor = () => {
  const hex = getBgColor().replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? 'rgba(0,0,0,0.7)' : '#ffffff';
};
```

**Paper `backgroundColor`** — Change the hardcoded `'#ebecf0'` to use the list color:
```js
backgroundColor: getBgColor(),
```

**Header row — PaletteIcon button** — Insert after the existing `DeleteOutlineIcon` `<Tooltip>` block (inside the header `<Box>`), keeping the same `flexShrink: 0` pattern:
```jsx
<Tooltip title="Change color" placement="top">
  <IconButton
    size="small"
    onClick={(e) => setColorAnchorEl(e.currentTarget)}
    sx={{ flexShrink: 0, color: getTextColor() }}
  >
    <PaletteIcon fontSize="small" />
  </IconButton>
</Tooltip>
```

Also update the existing `DeleteOutlineIcon` button's `color` to use `getTextColor()`:
```jsx
sx={{ flexShrink: 0, color: getTextColor() }}
```

And update the title `Typography` hover background for dark backgrounds:
```jsx
'&:hover': { backgroundColor: 'rgba(0,0,0,0.08)' },
```
Add `color: getTextColor()` to the Typography `sx`.

**Popover** — Insert just before the closing `</Paper>` tag:
```jsx
{/* ── Color Picker Popover ──────────────────────────────── */}
<Popover
  open={Boolean(colorAnchorEl)}
  anchorEl={colorAnchorEl}
  onClose={() => setColorAnchorEl(null)}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
>
  <Box sx={{ p: 1, display: 'grid', gridTemplateColumns: 'repeat(6, 28px)', gap: 0.5 }}>
    {PRESET_COLORS.map((c) => (
      <Box
        key={c}
        onClick={() => {
          updateListMutation.mutate({ listId: list.id, data: { color: c } });
          setColorAnchorEl(null);
        }}
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1,
          backgroundColor: c,
          cursor: 'pointer',
          border: list.color === c ? '2px solid #fff' : '2px solid transparent',
          boxShadow: list.color === c ? '0 0 0 2px #0079bf' : 'none',
          '&:hover': { opacity: 0.85 },
        }}
      />
    ))}
    {/* Clear swatch */}
    <Box
      onClick={() => {
        updateListMutation.mutate({ listId: list.id, data: { color: null } });
        setColorAnchorEl(null);
      }}
      sx={{
        width: 28,
        height: 28,
        borderRadius: 1,
        backgroundColor: '#ebecf0',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.6rem',
        color: 'text.secondary',
        border: !list.color ? '2px solid #0079bf' : '2px solid transparent',
        '&:hover': { opacity: 0.85 },
      }}
    >
      ✕
    </Box>
  </Box>
</Popover>
```

**Testing:**
- Render the board page; each list column header should show the `PaletteIcon` button.
- Clicking the icon opens a popover with 12 colored swatches and 1 clear swatch (13 total, 6-per-row grid = 3 rows).
- Clicking a color swatch closes the popover, sends `PUT /api/lists/:id` with `{ color: "#xxxxxx" }`, and after invalidation the list background updates.
- The currently selected color swatch is highlighted with a blue ring.
- Clicking the clear swatch sends `{ color: null }` and reverts the column to `#ebecf0`.
- On a dark-colored list (e.g. `#344563`), title text and icon buttons should appear white; on light colors they should appear dark.
- Existing drag-and-drop, title editing, card creation, and list deletion remain fully functional (no regression).
- Popover closes on outside click (MUI default behavior).

---

## File Change Summary

| File | Change Type |
|------|-------------|
| `backend/scripts/db/add_list_color.sql` | **New file** — one-line ALTER TABLE |
| `backend/src/models/List.js` | **Edit** — add `color` attribute |
| `backend/src/controllers/listController.js` | **Edit** — add `color` extraction + validation in `updateList` |
| `frontend/src/api/lists.js` | **No change** — `updateList` already exported |
| `frontend/src/hooks/useBoardDetail.js` | **Edit** — add `updateList` to import, add `useUpdateList` hook |
| `frontend/src/components/ListColumn.jsx` | **Edit** — add imports, state, hook call, dynamic colors, PaletteIcon button, Popover |
| `backend/src/routes/lists.js` | **No change** — `PUT /lists/:id` already registered |
