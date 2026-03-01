---
status: complete
phase: 01-enable-list-drag-and-drop
source:
  - 01-01-SUMMARY.md
  - 01-02-SUMMARY.md
  - 01-03-SUMMARY.md
started: 2026-03-01T00:00:00Z
updated: 2026-03-01T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Drag list column visually

expected: Grabbing a list header and dragging left or right moves the column in real time with a ghost; other columns shift to fill the gap
result: pass

### 2. Header-only drag handle

expected: Grabbing the body/content area of a column (cards, scroll area — NOT the header) does NOT start a drag; only holding the header initiates one
result: pass

### 3. Column opacity during drag

expected: While you are dragging a list column, that column becomes slightly faded/transparent (~80% opacity); other columns remain fully visible
result: pass

### 4. AddListForm disabled during drag

expected: While a list column is being dragged, the "Add another list" button at the end of the board is disabled and cannot be clicked
result: pass

### 5. Drop order persists on refresh

expected: After dropping a list in a new position and pressing F5 (page refresh), the board shows the same column order you left it in
result: pass

### 6. UI updates immediately (no spinner)

expected: The board reflects the new column order instantly the moment you drop — no loading spinner or visible delay appears before the UI updates
result: pass

### 7. Rollback on API error

expected: If the server call fails (e.g. go offline, then drag a list), the columns snap back to their pre-drag positions automatically
result: pass

### 8. Card drag within a list still works

expected: Dragging a card up or down within the same list column still works correctly; list drag-and-drop does not interfere with card drag-and-drop
result: pass

### 9. Card drag between lists still works

expected: Dragging a card from one list column and dropping it into a different list column still works correctly
result: pass

### 10. Multiple sequential list reorders work

expected: Reordering lists multiple times in a row (drag column A, then B, then C) all work correctly without any drift or incorrect positioning
result: pass

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0

## Gaps

## Gaps
