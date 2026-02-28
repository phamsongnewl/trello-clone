const { Board, List, Card } = require('../models/index');
const { Op } = require('sequelize');

// ── POST /api/boards/:boardId/lists ───────────────────────────────────────────
/**
 * Create a new list inside a board.
 * Appends the list by assigning position = (max existing position + 1) * 1000,
 * or 1000 when the board has no lists yet.
 * Body: { title: string }
 */
async function createList(req, res, next) {
  try {
    const { boardId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(422).json({ message: 'title is required' });
    }

    // Verify board ownership
    const board = await Board.findOne({
      where: { id: boardId, user_id: req.user.id },
    });

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Find the highest current position to append after it
    const lastList = await List.findOne({
      where: { board_id: boardId },
      order: [['position', 'DESC']],
    });

    const position = lastList ? (lastList.position + 1) * 1000 : 1000;

    const list = await List.create({
      board_id: boardId,
      title: title.trim(),
      position,
    });

    return res.status(201).json(list);
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/lists/:id ────────────────────────────────────────────────────────
/**
 * Update a list's title.
 * Returns 404 if the list does not exist or does not belong to a board owned
 * by the authenticated user.
 * Body: { title: string }
 */
async function updateList(req, res, next) {
  try {
    const list = await List.findByPk(req.params.id, {
      include: [{ model: Board, as: 'board' }],
    });

    if (!list || list.board.user_id !== req.user.id) {
      return res.status(404).json({ message: 'List not found' });
    }

    const { title } = req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(422).json({ message: 'title cannot be empty' });
      }
      list.title = title.trim();
    }

    await list.save();
    return res.status(200).json(list);
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/lists/:id ─────────────────────────────────────────────────────
/**
 * Delete a list. The database CASCADE constraint removes all child cards.
 * Returns 200 on success, 404 if not found or not owned.
 */
async function deleteList(req, res, next) {
  try {
    const list = await List.findByPk(req.params.id, {
      include: [{ model: Board, as: 'board' }],
    });

    if (!list || list.board.user_id !== req.user.id) {
      return res.status(404).json({ message: 'List not found' });
    }

    await list.destroy();
    return res.status(200).json({ message: 'List deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/lists/reorder ──────────────────────────────────────────────────
/**
 * Bulk-update list positions (used for drag-and-drop reordering).
 *
 * The client calculates new midpoint positions and sends an array:
 *   [{ id: string, position: number }, ...]
 *
 * All lists must belong to boards owned by the authenticated user.
 * Returns 200 with a success message on completion.
 * Body: { lists: [{ id: string, position: number }] }
 */
async function reorderLists(req, res, next) {
  try {
    const { lists } = req.body;

    if (!Array.isArray(lists) || lists.length === 0) {
      return res.status(422).json({ message: 'lists array is required' });
    }

    // Verify every list id belongs to a board owned by this user
    const ids = lists.map((l) => l.id);
    const existingLists = await List.findAll({
      where: { id: { [Op.in]: ids } },
      include: [{ model: Board, as: 'board' }],
    });

    const unauthorised = existingLists.find(
      (l) => l.board.user_id !== req.user.id,
    );

    if (unauthorised || existingLists.length !== ids.length) {
      return res.status(404).json({ message: 'One or more lists not found' });
    }

    // Bulk update positions in parallel
    await Promise.all(
      lists.map(({ id, position }) =>
        List.update({ position }, { where: { id } }),
      ),
    );

    return res.status(200).json({ message: 'Lists reordered successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createList,
  updateList,
  deleteList,
  reorderLists,
};