const { Card, List, Board, Checklist, ChecklistItem } = require('../models/index');

// ── Helpers ───────────────────────────────────────────────────────────────────
/**
 * Load a card by primary key, joining List → Board.
 * Returns null when the card does not exist.
 */
async function findCardWithOwnership(cardId) {
  return Card.findOne({
    where: { id: cardId },
    include: [
      {
        model: List,
        as: 'list',
        include: [{ model: Board, as: 'board' }],
      },
    ],
  });
}

/**
 * Load a checklist by primary key, joining Card → List → Board.
 * Returns null when the checklist does not exist.
 */
async function findChecklistWithOwnership(checklistId) {
  return Checklist.findOne({
    where: { id: checklistId },
    include: [
      {
        model: Card,
        as: 'card',
        include: [
          {
            model: List,
            as: 'list',
            include: [{ model: Board, as: 'board' }],
          },
        ],
      },
    ],
  });
}

/**
 * Load a checklist item by primary key, joining Checklist → Card → List → Board.
 * Returns null when the item does not exist.
 */
async function findItemWithOwnership(itemId) {
  return ChecklistItem.findOne({
    where: { id: itemId },
    include: [
      {
        model: Checklist,
        as: 'checklist',
        include: [
          {
            model: Card,
            as: 'card',
            include: [
              {
                model: List,
                as: 'list',
                include: [{ model: Board, as: 'board' }],
              },
            ],
          },
        ],
      },
    ],
  });
}

// ── POST /api/cards/:cardId/checklists ────────────────────────────────────────
/**
 * Create a checklist on a card.
 * Body: { title: string }
 * Returns 201 with the created checklist.
 */
async function createChecklist(req, res, next) {
  try {
    const { cardId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(422).json({ message: 'title is required' });
    }

    const card = await findCardWithOwnership(cardId);
    if (!card || card.list.board.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Card not found' });
    }

    const checklist = await Checklist.create({
      title: title.trim(),
      card_id: cardId,
    });

    return res.status(201).json(checklist);
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/checklists/:id ─────────────────────────────────────────────────
/**
 * Delete a checklist and all its items (cascade must be configured on the
 * Checklist → ChecklistItem association, or items are destroyed here).
 * Returns 200 with a confirmation message.
 */
async function deleteChecklist(req, res, next) {
  try {
    const checklist = await findChecklistWithOwnership(req.params.id);

    if (!checklist || checklist.card.list.board.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    await checklist.destroy();
    return res.status(200).json({ message: 'Checklist deleted' });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/checklists/:checklistId/items ───────────────────────────────────
/**
 * Create an item in a checklist.
 * Body: { content: string }
 * Position is max(existing item positions) + 1, or 1 when the checklist has
 * no items yet.
 * Returns 201 with the created item.
 */
async function createChecklistItem(req, res, next) {
  try {
    const { checklistId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(422).json({ message: 'content is required' });
    }

    const checklist = await findChecklistWithOwnership(checklistId);
    if (!checklist || checklist.card.list.board.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    // Determine next position.
    const lastItem = await ChecklistItem.findOne({
      where: { checklist_id: checklistId },
      order: [['position', 'DESC']],
    });
    const position = lastItem ? lastItem.position + 1 : 1;

    const item = await ChecklistItem.create({
      content: content.trim(),
      is_checked: false,
      position,
      checklist_id: checklistId,
    });

    return res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/checklist-items/:id ──────────────────────────────────────────────
/**
 * Update a checklist item's content and/or is_checked state.
 * Body: { content?: string, is_checked?: boolean }
 * Both fields are optional; only provided fields are updated.
 * Returns 200 with the updated item.
 */
async function updateChecklistItem(req, res, next) {
  try {
    const item = await findItemWithOwnership(req.params.id);

    if (!item || item.checklist.card.list.board.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Checklist item not found' });
    }

    const { content, is_checked } = req.body;

    if (content !== undefined) {
      if (!content.trim()) {
        return res.status(422).json({ message: 'content cannot be empty' });
      }
      item.content = content.trim();
    }

    if (is_checked !== undefined) {
      if (typeof is_checked !== 'boolean') {
        return res.status(422).json({ message: 'is_checked must be a boolean' });
      }
      item.is_checked = is_checked;
    }

    await item.save();
    return res.status(200).json(item);
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/checklist-items/:id ──────────────────────────────────────────
/**
 * Delete a checklist item.
 * Returns 200 with a confirmation message.
 */
async function deleteChecklistItem(req, res, next) {
  try {
    const item = await findItemWithOwnership(req.params.id);

    if (!item || item.checklist.card.list.board.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Checklist item not found' });
    }

    await item.destroy();
    return res.status(200).json({ message: 'Checklist item deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createChecklist,
  deleteChecklist,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
};