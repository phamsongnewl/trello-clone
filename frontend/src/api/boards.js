import api from './axios';

/**
 * Fetch all boards belonging to the authenticated user.
 * @returns {Promise<Array>}
 */
export const getBoards = () => api.get('/boards').then((r) => r.data);

/**
 * Create a new board.
 * @param {{ title: string, background_color: string }} data
 * @returns {Promise<Object>}
 */
export const createBoard = (data) => api.post('/boards', data).then((r) => r.data);

/**
 * Update an existing board.
 * @param {string|number} id
 * @param {{ title?: string, background_color?: string }} data
 * @returns {Promise<Object>}
 */
export const updateBoard = (id, data) =>
  api.put(`/boards/${id}`, data).then((r) => r.data);

/**
 * Delete a board.
 * @param {string|number} id
 * @returns {Promise<void>}
 */
export const deleteBoard = (id) =>
  api.delete(`/boards/${id}`).then((r) => r.data);
