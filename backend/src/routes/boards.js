const { Router } = require('express');
const auth = require('../middleware/auth');
const {
  getBoards,
  createBoard,
  getBoardById,
  updateBoard,
  deleteBoard,
  reorderBoards,
} = require('../controllers/boardController');

const router = Router();

router.get('/', auth, getBoards);
router.post('/', auth, createBoard);
// IMPORTANT: /reorder must be registered BEFORE /:id to avoid param conflict
router.patch('/reorder', auth, reorderBoards);
router.get('/:id', auth, getBoardById);
router.put('/:id', auth, updateBoard);
router.delete('/:id', auth, deleteBoard);

module.exports = router;