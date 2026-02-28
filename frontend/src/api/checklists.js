import api from './axios';

/**
 * Create a checklist attached to a card.
 * POST /cards/:cardId/checklists
 * Body: { title: string }
 * @param {string} cardId
 * @param {{ title: string }} data
 * @returns {Promise<Object>}
 */
export const createChecklist = (cardId, data) =>
  api.post(`/cards/${cardId}/checklists`, data).then((r) => r.data);

/**
 * Delete a checklist and all its items.
 * DELETE /checklists/:id
 * @param {string} id
 * @returns {Promise<void>}
 */
export const deleteChecklist = (id) =>
  api.delete(`/checklists/${id}`).then((r) => r.data);

/**
 * Create an item inside a checklist.
 * POST /checklists/:checklistId/items
 * Body: { content: string }
 * @param {string} checklistId
 * @param {{ content: string }} data
 * @returns {Promise<Object>}
 */
export const createChecklistItem = (checklistId, data) =>
  api.post(`/checklists/${checklistId}/items`, data).then((r) => r.data);

/**
 * Update a checklist item (toggle checked state or edit content).
 * PUT /checklist-items/:id
 * Body: { is_checked?: boolean, content?: string }
 * @param {string} id
 * @param {{ is_checked?: boolean, content?: string }} data
 * @returns {Promise<Object>}
 */
export const updateChecklistItem = (id, data) =>
  api.put(`/checklist-items/${id}`, data).then((r) => r.data);

/**
 * Delete a checklist item.
 * DELETE /checklist-items/:id
 * @param {string} id
 * @returns {Promise<void>}
 */
export const deleteChecklistItem = (id) =>
  api.delete(`/checklist-items/${id}`).then((r) => r.data);
