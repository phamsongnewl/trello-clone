import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// ── Placeholder pages (replaced in later steps) ───────────────────────────────
function DashboardPage() {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: 32 }}>
      <h2>Dashboard — Welcome, {user?.name}!</h2>
      <button onClick={logout}>Log out</button>
    </div>
  );
}

function BoardPage() {
  return <div style={{ padding: 32 }}>Board detail — coming soon.</div>;
}

// ── ProtectedRoute ─────────────────────────────────────────────────────────────
/**
 * Wrap any route that requires an authenticated user.
 * - While the auth state is loading → render nothing to avoid flash.
 * - No user after load → redirect to /login.
 * - Authenticated → render children.
 */
function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null; // wait for getMe() to resolve
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

// ── Root redirect ──────────────────────────────────────────────────────────────
/**
 * / → /boards when logged in, /login when not.
 * Defers until loading is complete so it does not flash /login for valid sessions.
 */
function RootRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  return <Navigate to={user ? '/boards' : '/login'} replace />;
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/boards"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/boards/:id"
          element={
            <ProtectedRoute>
              <BoardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
