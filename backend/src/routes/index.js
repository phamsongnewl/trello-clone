const { Router } = require('express');
const authRouter   = require('./auth');
const boardsRouter = require('./boards');
const listsRouter  = require('./lists');
const cardsRouter  = require('./cards');
const labelsRouter = require('./labels');
const checklistsRouter = require('./checklists');

const router = Router();

// Auth routes: /api/auth/*
router.use('/auth', authRouter);

// Board routes: /api/boards/*
router.use('/boards', boardsRouter);

// List routes: mounted at root so paths like /api/boards/:boardId/lists
// and /api/lists/:id work correctly.
router.use('/', listsRouter);

// Card routes: mounted at root so paths like /api/lists/:listId/cards
// and /api/cards/:id work correctly.
router.use('/', cardsRouter);
router.use('/', labelsRouter);
router.use('/', checklistsRouter);

module.exports = router;
