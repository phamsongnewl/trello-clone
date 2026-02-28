const { Board, Card, List, Label, CardLabel } = require('../models/index');

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

// ── GET /api/boards/:boardId/labels ───────────────────────────────────────────
/**
 * Return all labels that belong to a board.
 * Returns 404 when the board does not exist or is not owned by the caller.
 */
async function getBoardLabels(req, res, next) {
  try {
    const { boardId } = req.params;

    const board = await Board.findOne({ where: { id: boardId, user_id: req.user.id } });
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const labels = await Label.findAll({ where: { board_id: boardId } });
    return res.status(200).json(labels);
  } catch (err) {
    next(err);
  }
}

// ── POST /api/boards/:boardId/labels ──────────────────────────────────────────
/**
 * Create a new label on a board.
 * Body: { name: string, color: string }
 * color must be a CSS hex colour string (e.g. "#FF5630").
 * Returns 201 with the created label.
 */
async function createLabel(req, res, next) {
  try {
    const { boardId } = req.params;
    const { name, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(422).json({ message: 'name is required' });
    }

    if (!color || !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)) {
      return res.status(422).json({ message: 'color must be a valid hex color string (e.g. #FF5630)' });
    }

    const board = await Board.findOne({ where: { id: boardId, user_id: req.user.id } });
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const label = await Label.create({
      name: name.trim(),
      color,
      board_id: boardId,
    });

    return res.status(201).json(label);
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/labels/:id ───────────────────────────────────────────────────────
/**
 * Update a label's name and/or color.
 * Ownership is verified by joining Label → Board.
 * Returns 200 with the updated label.
 */
async function updateLabel(req, res, next) {
  try {
    const label = await Label.findOne({
      where: { id: req.params.id },
      include: [{ model: Board, as: 'board' }],
    });

    if (!label || label.board.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Label not found' });
    }

    const { name, color } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(422).json({ message: 'name cannot be empty' });
      }
      label.name = name.trim();
    }

    if (color !== undefined) {
      if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)) {
        return res.status(422).json({ message: 'color must be a valid hex color string (e.g. #FF5630)' });
      }
      label.color = color;
    }

    await label.save();
    return res.status(200).json(label);
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/labels/:id ────────────────────────────────────────────────────
/**
 * Delete a label.
 * Ownership is verified by joining Label → Board.
 * Returns 200 with a confirmation message.
 */
async function deleteLabel(req, res, next) {
  try {
    const label = await Label.findOne({
      where: { id: req.params.id },
      include: [{ model: Board, as: 'board' }],
    });

    if (!label || label.board.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Label not found' });
    }

    await label.destroy();
    return res.status(200).json({ message: 'Label deleted' });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/cards/:cardId/labels/:labelId ───────────────────────────────────
/**
 * Attach a label to a card.
 * Verifies that:
 *   1. The card belongs to the authenticated user (via Card → List → Board).
 *   2. The label belongs to the same board as the card.
 * Uses findOrCreate so the operation is idempotent.
 * Returns 200 with a confirmation message.
 */
async function addLabelToCard(req, res, next) {
  try {
    const { cardId, labelId } = req.params;

    const card = await findCardWithOwnership(cardId);
    if (!card || card.list.board.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Card not found' });
    }

    const label = await Label.findOne({ where: { id: labelId } });
    if (!label) {
      return res.status(404).json({ message: 'Label not found' });
    }

    // Ensure the label belongs to the same board as the card.
    if (label.board_id !== card.list.board.id) {
      return res.status(422).json({ message: 'Label does not belong to the same board as the card' });
    }

    await CardLabel.findOrCreate({ where: { card_id: cardId, label_id: labelId } });

    return res.status(200).json({ message: 'Label added to card' });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/cards/:cardId/labels/:labelId ─────────────────────────────────
/**
 * Detach a label from a card.
 * Verifies card ownership before destroying the CardLabel record.
 * Returns 200 with a confirmation message.
 */
async function removeLabelFromCard(req, res, next) {
  try {
    const { cardId, labelId } = req.params;

    const card = await findCardWithOwnership(cardId);
    if (!card || card.list.board.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Card not found' });
    }

    await CardLabel.destroy({ where: { card_id: cardId, label_id: labelId } });

    return res.status(200).json({ message: 'Label removed from card' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBoardLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  addLabelToCard,
  removeLabelFromCard,
};