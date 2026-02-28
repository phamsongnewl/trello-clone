const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getBoardLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  addLabelToCard,
  removeLabelFromCard,
} = require('../controllers/labelController');

// ── /boards/:boardId/labels ───────────────────────────────────────────────────
router.get('/boards/:boardId/labels', auth, getBoardLabels);
router.post('/boards/:boardId/labels', auth, createLabel);

// ── /labels/:id ───────────────────────────────────────────────────────────────
router.put('/labels/:id', auth, updateLabel);
router.delete('/labels/:id', auth, deleteLabel);

// ── /cards/:cardId/labels/:labelId ────────────────────────────────────────────
router.post('/cards/:cardId/labels/:labelId', auth, addLabelToCard);
router.delete('/cards/:cardId/labels/:labelId', auth, removeLabelFromCard);

module.exports = router;