# Board Drag and Drop (Dashboard Reorder)

**Branch:** `feature/board-drag-and-drop`
**Description:** Cho phép người dùng kéo thả để sắp xếp lại thứ tự các board trên trang Dashboard.

## Goal

Trang Dashboard hiện tại hiển thị boards theo thứ tự `createdAt DESC` và không có khả năng sắp xếp. Tính năng này thêm drag-and-drop để người dùng tự do sắp xếp thứ tự boards, lưu vị trí xuống backend bằng trường `position` (float, midpoint strategy).

> **Lưu ý:** Drag-and-drop cho *lists* và *cards* bên trong một board **đã được triển khai đầy đủ** (`@hello-pangea/dnd`, `PATCH /lists/reorder`, `PATCH /cards/:id/move`, optimistic updates). Plan này chỉ bổ sung tính năng tương tự cho các **board tiles trên Dashboard**.

---

## Context / Patterns

| Pattern | Source |
|---------|--------|
| Drag-and-drop (Dashboard) | `@dnd-kit/core` + `@dnd-kit/sortable` — hỗ trợ grid nhiều cột |
| Drag-and-drop (Board columns/cards) | `@hello-pangea/dnd` (đã có sẵn, giữ nguyên) |
| Position strategy | Float midpoint — `(before + after) / 2` (xem `BoardPage.jsx`) |
| List reorder pattern | `PATCH /api/lists/reorder` → `{ lists: [{id, position}] }` |
| Optimistic update pattern | `useMoveCard` / `useMoveList` trong `useBoardDetail.js` |
| State management | TanStack React Query v5 — query invalidation + optimistic cache |

---

## Implementation Steps

### Step 1: Database Migration — Thêm cột `position` vào bảng `boards`

**Files:**
- `backend/scripts/db/add_board_position.sql`

**What:**

Tạo file migration SQL riêng:
```sql
-- Migration: add position column to boards
ALTER TABLE boards ADD COLUMN IF NOT EXISTS position FLOAT;

-- Back-fill existing boards: assign evenly-spaced positions based on createdAt order
UPDATE boards
SET position = sub.new_pos
FROM (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY "createdAt" ASC) * 1000 AS new_pos
  FROM boards
) AS sub
WHERE boards.id = sub.id;
```

**Testing:**
```bash
psql $DATABASE_URL -f backend/scripts/db/add_board_position.sql
# SELECT id, title, position FROM boards ORDER BY user_id, position;
# → mỗi user có boards với position 1000, 2000, 3000 ...
```

---

### Step 2: Backend — Cập nhật Board model và API

**Files:**
- `backend/src/models/Board.js`
- `backend/src/controllers/boardController.js`
- `backend/src/routes/boards.js`

**What:**

1. Thêm trường `position` kiểu `FLOAT` vào `Board.init()` (nullable, default `null` để migrate smooth).
2. Trong `createBoard`, tự động gán `position` = `(số board hiện tại + 1) * 1000` (cuối danh sách).
3. Cập nhật `getBoards` để `ORDER BY position ASC NULLS LAST, createdAt DESC` (boards cũ chưa có position vẫn hiển thị đúng).
4. Thêm endpoint `PATCH /api/boards/reorder`:
   - Body: `{ boards: [{ id, position }] }`
   - Dùng `Promise.all` để bulk-update positions, chỉ cho boards thuộc `req.user.id`.
   - Đặt route `/reorder` **trước** `/:id` để tránh conflict param matching.

**Testing:**
```bash
# Tạo 3 boards → GET /api/boards → thứ tự position tăng dần
# PATCH /api/boards/reorder { boards: [{id:A, position:3000},{id:B, position:1000}] }
# GET /api/boards → B xuất hiện trước A
```

---

### Step 3: Frontend — Cài đặt `@dnd-kit`

**Files:**
- `frontend/package.json`

**What:**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

| Package | Vai trò |
|---------|----------|
| `@dnd-kit/core` | DndContext, sensors (pointer/keyboard) |
| `@dnd-kit/sortable` | SortableContext, useSortable hook, arrayMove helper |
| `@dnd-kit/utilities` | CSS.Transform.toString() cho inline style |

`@hello-pangea/dnd` **không bị xóa** — vẫn dùng cho lists/cards bên trong BoardPage.

**Testing:**
```bash
npm install  # no peer-dep conflicts
```

---

### Step 4: Frontend — API + Hook

**Files:**
- `frontend/src/api/boards.js`
- `frontend/src/hooks/useBoards.js`

**What:**

1. Thêm `reorderBoards` vào `api/boards.js`:
   ```js
   export const reorderBoards = (boards) =>
     api.patch('/boards/reorder', { boards }).then((r) => r.data);
   ```
2. Thêm `useReorderBoards` hook vào `hooks/useBoards.js` với **optimistic update** theo cùng pattern `useMoveList`:
   - `onMutate`: snapshot + cập nhật cache query `['boards']` ngay lập tức (sort lại theo position mới).
   - `onError`: rollback về snapshot.
   - `onSettled`: `invalidateQueries(['boards'])`.

**Testing:**
- Unit test hook với `@tanstack/react-query` test utils (nếu có).
- Kiểm tra optimistic update trong browser DevTools (Network throttle Slow 3G).

---

### Step 5: Frontend — DnD trên DashboardPage

**Files:**
- `frontend/src/pages/DashboardPage.jsx`
- `frontend/src/components/BoardCard.jsx`

**What:**

**`BoardCard.jsx`** — Chuyển thành sortable item dùng `useSortable` hook:
```jsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const BoardCard = ({ board, onDelete, onUpdate }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: board.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };
  // render board tile như cũ, bọc trong <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
};
```

**`DashboardPage.jsx`** — Bọc grid bằng `DndContext` + `SortableContext`:
```jsx
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';

// Inside component:
const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

const handleDragEnd = ({ active, over }) => {
  if (!over || active.id === over.id) return;
  const oldIndex = sortedBoards.findIndex((b) => b.id === active.id);
  const newIndex = sortedBoards.findIndex((b) => b.id === over.id);
  const reordered = arrayMove(sortedBoards, oldIndex, newIndex);
  // Midpoint positions:
  const updates = reordered.map((b, i) => ({
    id: b.id,
    position: (i + 1) * 1000,
  }));
  reorderBoards({ boards: updates });
};

// JSX:
<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={sortedBoards.map((b) => b.id)} strategy={rectSortingStrategy}>
    <Grid container spacing={2}>
      {sortedBoards.map((board) => <BoardCard key={board.id} board={board} ... />)}
      {/* Create new board tile — outside SortableContext, không bị DnD */}
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <CreateBoardTile onClick={() => setCreateModalOpen(true)} />
      </Grid>
    </Grid>
  </SortableContext>
</DndContext>
```

`rectSortingStrategy` xử lý grid wrap nhiều cột — cards tự nhảy vào đúng ô khi kéo qua các row khác nhau.

**Testing:**
- Kéo board "aaa" đặt trước "ccc" trong grid nhiều cột → reload trang → thứ tự giữ nguyên.
- Kéo thả rồi mạng lỗi (Network block) → UI rollback về thứ tự cũ.
- "+ Create new board" không bị ảnh hưởng bởi DnD.
- Keyboard navigation (Tab + Space/Enter) hoạt động nhờ `attributes` spread.

---

## File Changes Summary

| File | Loại thay đổi |
|------|---------------|
| `backend/scripts/db/add_board_position.sql` | **Mới** — SQL migration thêm cột `position`, back-fill dữ liệu cũ |
| `backend/src/models/Board.js` | Thêm trường `position` |
| `backend/src/controllers/boardController.js` | Auto-position khi create; `getBoards` sort mới; thêm `reorderBoards` |
| `backend/src/routes/boards.js` | Thêm `PATCH /reorder` route |
| `frontend/package.json` | Thêm `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| `frontend/src/api/boards.js` | Thêm `reorderBoards()` |
| `frontend/src/hooks/useBoards.js` | Thêm `useReorderBoards` với optimistic update |
| `frontend/src/pages/DashboardPage.jsx` | DndContext + SortableContext + handleDragEnd (dnd-kit) |
| `frontend/src/components/BoardCard.jsx` | Dùng `useSortable` hook; visual feedback khi dragging |

---

## Decisions

| Quyết định | Lựa chọn |
|------------|----------|
| Layout | **Grid nhiều cột** — dùng `@dnd-kit/sortable` + `rectSortingStrategy` |
| Migration | **File SQL riêng** — `backend/scripts/db/add_board_position.sql` |
| Scope position | Per-user — `WHERE user_id = req.user.id` trong reorder endpoint |
