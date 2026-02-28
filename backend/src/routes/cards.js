const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createCard,
  getCardById,
  updateCard,
  deleteCard,
  moveCard,
} = require('../controllers/cardController');

// ── /lists/:listId/cards ──────────────────────────────────────────────────────
router.post('/lists/:listId/cards', auth, createCard);

// ── /cards/:id ────────────────────────────────────────────────────────────────
// PATCH /move must be declared before GET /:id so Express does not treat
// "move" as a card id.
router.patch('/cards/:id/move', auth, moveCard);

router.get('/cards/:id', auth, getCardById);
router.put('/cards/:id', auth, updateCard);
router.delete('/cards/:id', auth, deleteCard);

module.exports = router;