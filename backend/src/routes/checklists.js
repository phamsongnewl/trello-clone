const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createChecklist,
  deleteChecklist,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} = require('../controllers/checklistController');

// ── /cards/:cardId/checklists ─────────────────────────────────────────────────
router.post('/cards/:cardId/checklists', auth, createChecklist);

// ── /checklists/:id ───────────────────────────────────────────────────────────
router.delete('/checklists/:id', auth, deleteChecklist);

// ── /checklists/:checklistId/items ────────────────────────────────────────────
router.post('/checklists/:checklistId/items', auth, createChecklistItem);

// ── /checklist-items/:id ──────────────────────────────────────────────────────
router.put('/checklist-items/:id', auth, updateChecklistItem);
router.delete('/checklist-items/:id', auth, deleteChecklistItem);

module.exports = router;