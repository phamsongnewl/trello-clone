const { Board, List, Card } = require('../models/index');

async function getBoards(req, res, next) {
  try {
    const boards = await Board.findAll({
      where: { user_id: req.user.id },
      order: [
        ['position', 'ASC NULLS LAST'],
        ['createdAt', 'DESC'],
      ],
    });
    return res.status(200).json(boards);
  } catch (err) {
    next(err);
  }
}

async function createBoard(req, res, next) {
  try {
    const { title, background_color } = req.body;
    if (!title || !title.trim())
      return res.status(422).json({ message: 'title is required' });

    // Auto-assign position at the end of the user's board list
    const count = await Board.count({ where: { user_id: req.user.id } });
    const position = (count + 1) * 1000;

    const board = await Board.create({
      user_id: req.user.id,
      title: title.trim(),
      background_color: background_color || '#0052CC',
      position,
    });
    return res.status(201).json(board);
  } catch (err) {
    next(err);
  }
}

async function getBoardById(req, res, next) {
  try {
    const board = await Board.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        {
          model: List,
          as: 'lists',
          order: [['position', 'ASC']],
          include: [{ model: Card, as: 'cards', order: [['position', 'ASC']] }],
        },
      ],
      order: [[{ model: List, as: 'lists' }, 'position', 'ASC']],
    });
    if (!board) return res.status(404).json({ message: 'Board not found' });
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

async function updateBoard(req, res, next) {
  try {
    const board = await Board.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!board) return res.status(404).json({ message: 'Board not found' });
    const { title, background_color } = req.body;
    if (title !== undefined) {
      if (!title.trim())
        return res.status(422).json({ message: 'title cannot be empty' });
      board.title = title.trim();
    }
    if (background_color !== undefined) board.background_color = background_color;
    await board.save();
    return res.status(200).json(board);
  } catch (err) {
    next(err);
  }
}

async function deleteBoard(req, res, next) {
  try {
    const board = await Board.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!board) return res.status(404).json({ message: 'Board not found' });
    await board.destroy();
    return res.status(200).json({ message: 'Board deleted successfully' });
  } catch (err) {
    next(err);
  }
}

async function reorderBoards(req, res, next) {
  try {
    const { boards } = req.body;
    if (!Array.isArray(boards) || boards.length === 0)
      return res.status(422).json({ message: 'boards array is required' });

    await Promise.all(
      boards.map(({ id, position }) =>
        Board.update(
          { position },
          { where: { id, user_id: req.user.id } }
        )
      )
    );

    return res.status(200).json({ message: 'Boards reordered successfully' });
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
  reorderBoards,
};