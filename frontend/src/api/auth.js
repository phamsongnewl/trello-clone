import api from './axios';

/**
 * Authenticate an existing user.
 * POST /api/auth/login
 * Body: { email, password }
 * Success: sets the JWT httpOnly cookie; returns { id, name, email }.
 */
export const login = (email, password) =>
  api.post('/auth/login', { email, password });

/**
 * Create a new user account.
 * POST /api/auth/register
 * Body: { name, email, password }
 * Success: returns { id, name, email }.
 */
export const register = (name, email, password) =>
  api.post('/auth/register', { name, email, password });

/**
 * Invalidate the current session.
 * POST /api/auth/logout
 * Success: clears the JWT cookie on the server.
 */
export const logout = () => api.post('/auth/logout');

/**
 * Return the currently authenticated user.
 * GET /api/auth/me
 * Success: returns { id, name, email }.
 * 401 when no valid session exists (interceptor will redirect to /login).
 */
export const getMe = () => api.get('/auth/me');