const { Board, List, Card } = require('../models/index');

// ── GET /api/boards ───────────────────────────────────────────────────────────
/**
 * Return all boards owned by the authenticated user, ordered newest-first.
 */
async function getBoards(req, res, next) {
  try {
    const boards = await Board.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    return res.status(200).json(boards);
  } catch (err) {
    next(err);
  }
}

// ── POST /api/boards ──────────────────────────────────────────────────────────
/**
 * Create a new board for the authenticated user.
 * Body: { title: string, background_color?: string }
 */
async function createBoard(req, res, next) {
  try {
    const { title, background_color } = req.body;

    if (!title || !title.trim()) {
      return res.status(422).json({ message: 'title is required' });
    }

    const board = await Board.create({
      user_id: req.user.id,
      title: title.trim(),
      background_color: background_color || '#0052CC',
    });

    return res.status(201).json(board);
  } catch (err) {
    next(err);
  }
}

// ── GET /api/boards/:id ───────────────────────────────────────────────────────
/**
 * Return a single board with its nested lists and cards.
 * Lists are ordered by position ASC; cards within each list are ordered by
 * position ASC.
 * Returns 404 when the board does not exist or is not owned by the caller.
 */
async function getBoardById(req, res, next) {
  try {
    const board = await Board.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        {
          model: List,
          as: 'lists',
          order: [['position', 'ASC']],
          include: [
            {
              model: Card,
              as: 'cards',
              order: [['position', 'ASC']],
            },
          ],
        },
      ],
      order: [[{ model: List, as: 'lists' }, 'position', 'ASC']],
    });

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Build a plain object so we can guarantee sort order regardless of
    // whether Sequelize applies the nested order clause.
    const boardJson = board.toJSON();
    boardJson.lists = (boardJson.lists || []).sort((a, b) => a.position - b.position);
    boardJson.lists.forEach((list) => {
      list.cards = (list.cards || []).sort((a, b) => a.position - b.position);
    });

    return res.status(200).json(boardJson);
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/boards/:id ───────────────────────────────────────────────────────
/**
 * Update a board's title and/or background_color.
 * Returns 404 if the board does not exist or is not owned by the caller.
 */
async function updateBoard(req, res, next) {
  try {
    const board = await Board.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const { title, background_color } = req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(422).json({ message: 'title cannot be empty' });
      }
      board.title = title.trim();
    }

    if (background_color !== undefined) {
      board.background_color = background_color;
    }

    await board.save();
    return res.status(200).json(board);
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/boards/:id ────────────────────────────────────────────────────
/**
 * Delete a board. The database CASCADE constraint removes all child lists
 * and cards automatically.
 * Returns 404 if the board does not exist or is not owned by the caller.
 */
async function deleteBoard(req, res, next) {
  try {
    const board = await Board.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    await board.destroy();
    return res.status(200).json({ message: 'Board deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBoards,
  createBoard,
  getBoardById,
  updateBoard,
  deleteBoard,
};