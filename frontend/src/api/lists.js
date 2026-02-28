import api from './axios';

/**
 * Create a new list inside a board.
 * POST /boards/:boardId/lists
 * Body: { title }
 */
export const createList = async (boardId, data) => {
  const response = await api.post(`/boards/${boardId}/lists`, data);
  return response.data;
};

/**
 * Update a list (e.g. rename).
 * PUT /lists/:id
 * Body: { title }
 */
export const updateList = async (id, data) => {
  const response = await api.put(`/lists/${id}`, data);
  return response.data;
};

/**
 * Delete a list and all its cards.
 * DELETE /lists/:id
 */
export const deleteList = async (id) => {
  const response = await api.delete(`/lists/${id}`);
  return response.data;
};

/**
 * Reorder lists on a board.
 * PATCH /lists/reorder
 * Body: { items: [{ id, position }] }
 */
export const reorderLists = async (items) => {
  const response = await api.patch('/lists/reorder', { items });
  return response.data;
};
