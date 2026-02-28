import api from './axios';

/**
 * Create a card inside a list.
 * POST /lists/:listId/cards
 * Body: { title, description?, due_date? }
 */
export const createCard = async (listId, data) => {
  const response = await api.post(`/lists/${listId}/cards`, data);
  return response.data;
};

/**
 * Get a single card by ID.
 * GET /cards/:id
 */
export const getCard = async (id) => {
  const response = await api.get(`/cards/${id}`);
  return response.data;
};

/**
 * Update a card's fields.
 * PUT /cards/:id
 * Body: { title?, description?, due_date?, is_archived? }
 */
export const updateCard = async (id, data) => {
  const response = await api.put(`/cards/${id}`, data);
  return response.data;
};

/**
 * Delete a card permanently.
 * DELETE /cards/:id
 */
export const deleteCard = async (id) => {
  const response = await api.delete(`/cards/${id}`);
  return response.data;
};

/**
 * Move a card to a different list and/or position.
 * PATCH /cards/:id/move
 * Body: { listId: string, position: number }
 *
 * The position is a float calculated from the midpoint of surrounding cards,
 * allowing insertion without renumbering the entire list.
 */
export const moveCard = async (id, data) => {
  const response = await api.patch(`/cards/${id}/move`, data);
  return response.data;
};
