import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // send httpOnly JWT cookie with every request
});

// ── Response interceptor ──────────────────────────────────────────────────────
// Redirect to /login on 401 so that expired or missing sessions are handled
// transparently regardless of which component triggered the request.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const alreadyOnLogin = window.location.pathname === '/login';

    if (status === 401 && !alreadyOnLogin) {
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);

export default api;