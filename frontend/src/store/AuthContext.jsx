import { createContext, useContext, useEffect, useState } from 'react';
import { getMe, login as apiLogin, logout as apiLogout } from '../api/auth';

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────
/**
 * Wrap the component tree with AuthProvider to make authentication state
 * available everywhere via the useAuth() hook.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true until getMe() resolves

  // Rehydrate session from the httpOnly cookie on first render.
  useEffect(() => {
    getMe()
      .then((res) => setUser(res.data))
      .catch(() => setUser(null)) // 401 → not authenticated; interceptor handles redirect
      .finally(() => setIsLoading(false));
  }, []);

  /**
   * Log in and update the user state.
   * @param {{ email: string, password: string }} credentials
   */
  const login = async ({ email, password }) => {
    const res = await apiLogin(email, password);
    setUser(res.data);
    return res.data;
  };

  /**
   * Log out and clear the user state.
   */
  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  const value = { user, setUser, isLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
/**
 * Access authentication state from any component inside AuthProvider.
 *
 * @returns {{ user: object|null, setUser: Function, isLoading: boolean, login: Function, logout: Function }}
 */
export const useAuth = () => useContext(AuthContext);