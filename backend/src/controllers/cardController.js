const { Card, List, Board, Label, Checklist, ChecklistItem } = require('../models/index');

// ── Helper ────────────────────────────────────────────────────────────────────
/**
 * Load a card by primary key, joining List → Board so ownership can be
 * verified. Returns null when the card does not exist.
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

// ── POST /api/lists/:listId/cards ─────────────────────────────────────────────
/**
 * Create a new card at the end of a list.
 * Body: { title: string }
 * Position is calculated as max(existing card positions) + 1000, or 1000 when
 * the list has no cards yet.
 */
async function createCard(req, res, next) {
  try {
    const { listId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(422).json({ message: 'title is required' });
    }

    // Verify the list exists and belongs to the authenticated user.
    const list = await List.findOne({
      where: { id: listId },
      include: [{ model: Board, as: 'board' }],
    });

    if (!list || list.board.user_id !== req.user.id) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Determine position: max position in the list + 1000.
    const lastCard = await Card.findOne({
      where: { list_id: listId },
      order: [['position', 'DESC']],
    });
    const position = lastCard ? lastCard.position + 1000 : 1000;

    const card = await Card.create({
      title: title.trim(),
      list_id: listId,
      position,
    });

    return res.status(201).json(card);
  } catch (err) {
    next(err);
  }
}

// ── GET /api/cards/:id ────────────────────────────────────────────────────────
/**
 * Return a single card with its Labels, Checklists, and ChecklistItems.
 * Returns 404 when the card does not exist or is not reachable by the caller.
 */
async function getCardById(req, res, next) {
  try {
    const card = await Card.findOne({
      where: { id: req.params.id },
      include: [
        { model: Label, as: 'labels' },
        {
          model: Checklist,
          as: 'checklists',
          include: [{ model: ChecklistItem, as: 'items' }],
        },
        {
          model: List,
          as: 'list',
          include: [{ model: Board, as: 'board' }],
        },
      ],
    });

    if (!card || card.list.board.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Card not found' });
    }

    return res.status(200).json(card);
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/cards/:id ────────────────────────────────────────────────────────
/**
 * Update a card's title, description, and/or due_date.
 * All body fields are optional; only provided fields are updated.
 * Returns 404 when the card does not exist or is not owned by the caller.
 */
async function updateCard(req, res, next) {
  try {
    const card = await findCardWithOwnership(req.params.id);

    if (!card || card.list.board.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Card not found' });
    }

    const { title, description, due_date } = req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(422).json({ message: 'title cannot be empty' });
      }
      card.title = title.trim();
    }

    if (description !== undefined) {
      card.description = description;
    }

    if (due_date !== undefined) {
      card.due_date = due_date;
    }

    await card.save();
    return res.status(200).json(card);
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/cards/:id ─────────────────────────────────────────────────────
/**
 * Delete a card.
 * Returns 404 when the card does not exist or is not owned by the caller.
 */
async function deleteCard(req, res, next) {
  try {
    const card = await findCardWithOwnership(req.params.id);

    if (!card || card.list.board.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Card not found' });
    }

    await card.destroy();
    return res.status(200).json({ message: 'Card deleted' });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/cards/:id/move ─────────────────────────────────────────────────
/**
 * Move a card to a (possibly different) list and set its position.
 * Body: { listId: string, position: number }
 *
 * Both the source and target lists must belong to the authenticated user.
 * The caller supplies the final position value directly (the client computes
 * midpoint positions for drag-and-drop reordering).
 */
async function moveCard(req, res, next) {
  try {
    const card = await findCardWithOwnership(req.params.id);

    if (!card || card.list.board.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Card not found' });
    }

    const { listId, position } = req.body;

    if (!listId) {
      return res.status(422).json({ message: 'listId is required' });
    }

    if (position === undefined || position === null) {
      return res.status(422).json({ message: 'position is required' });
    }

    // Verify the target list exists and also belongs to the same user.
    const targetList = await List.findOne({
      where: { id: listId },
      include: [{ model: Board, as: 'board' }],
    });

    if (!targetList || targetList.board.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Target list not found' });
    }

    card.list_id = listId;
    card.position = position;
    await card.save();

    return res.status(200).json(card);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createCard,
  getCardById,
  updateCard,
  deleteCard,
  moveCard,
};