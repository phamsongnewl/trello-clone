const { Router } = require('express');
const auth = require('../middleware/auth');
const {
  createList,
  updateList,
  deleteList,
  reorderLists,
} = require('../controllers/listController');

const router = Router();

// POST   /api/boards/:boardId/lists   — create a list inside a board
router.post('/boards/:boardId/lists', auth, createList);

// PATCH  /api/lists/reorder           — bulk position update (must come before /:id)
router.patch('/lists/reorder', auth, reorderLists);

// PUT    /api/lists/:id               — rename a list
router.put('/lists/:id', auth, updateList);

// DELETE /api/lists/:id               — delete a list
router.delete('/lists/:id', auth, deleteList);

module.exports = router;