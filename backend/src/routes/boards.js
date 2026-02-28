const { Router } = require('express');
const auth = require('../middleware/auth');
const {
  getBoards,
  createBoard,
  getBoardById,
  updateBoard,
  deleteBoard,
} = require('../controllers/boardController');

const router = Router();

// GET  /api/boards        — list all boards for the current user
router.get('/', auth, getBoards);

// POST /api/boards        — create a new board
router.post('/', auth, createBoard);

// GET  /api/boards/:id    — get one board with nested lists + cards
router.get('/:id', auth, getBoardById);

// PUT  /api/boards/:id    — update board title / background_color
router.put('/:id', auth, updateBoard);

// DELETE /api/boards/:id  — delete board (cascades lists + cards)
router.delete('/:id', auth, deleteBoard);

module.exports = router;