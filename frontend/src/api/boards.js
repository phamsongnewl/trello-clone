import api from './axios';

export const getBoards    = ()            => api.get('/boards').then((r) => r.data);
export const getBoardById = (id)          => api.get(`/boards/${id}`).then((r) => r.data);
export const createBoard  = (data)        => api.post('/boards', data).then((r) => r.data);
export const updateBoard  = (id, data)    => api.put(`/boards/${id}`, data).then((r) => r.data);
export const deleteBoard  = (id)          => api.delete(`/boards/${id}`).then((r) => r.data);
export const reorderBoards = (boards)     => api.patch('/boards/reorder', { boards }).then((r) => r.data);
