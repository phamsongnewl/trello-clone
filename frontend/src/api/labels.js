import api from './axios';

/**
 * Fetch all labels that belong to a board.
 * GET /boards/:boardId/labels
 * @param {string} boardId
 * @returns {Promise<Array<{ id: string, name: string, color: string }>>}
 */
export const getBoardLabels = (boardId) =>
  api.get(`/boards/${boardId}/labels`).then((r) => r.data);

/**
 * Create a new label on a board.
 * POST /boards/:boardId/labels
 * Body: { name: string, color: string }
 * @param {string} boardId
 * @param {{ name: string, color: string }} data
 * @returns {Promise<Object>}
 */
export const createLabel = (boardId, data) =>
  api.post(`/boards/${boardId}/labels`, data).then((r) => r.data);

/**
 * Attach an existing label to a card.
 * POST /cards/:cardId/labels/:labelId
 * @param {string} cardId
 * @param {string} labelId
 * @returns {Promise<Object>}
 */
export const addLabelToCard = (cardId, labelId) =>
  api.post(`/cards/${cardId}/labels/${labelId}`).then((r) => r.data);

/**
 * Detach a label from a card.
 * DELETE /cards/:cardId/labels/:labelId
 * @param {string} cardId
 * @param {string} labelId
 * @returns {Promise<void>}
 */
export const removeLabelFromCard = (cardId, labelId) =>
  api.delete(`/cards/${cardId}/labels/${labelId}`).then((r) => r.data);
