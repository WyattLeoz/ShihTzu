import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth } from './hooks/useAuth';
import { useToasts, Toast } from './components/Toast';
import { User } from './types';
import { authStore } from './stores/authStore';

// Direct imports for debugging
import { GovPortal } from './features/gov/GovPortal';
import { PublicPortal } from './features/public/PublicPortal';
import { LoginPage } from './features/public/LoginPage';
import ResponderRouter from './features/responder';
import GovRouter from './features/gov';
import { RoleRedirect } from './components/RoleRedirect';

// Auth guard component
function ProtectedRoute({ allowedRoles }: { allowedRoles: User['role'][] }) {
  const { isAuthenticated, isLoading, user } = authStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-ink-muted">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user!.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

function App() {
  const { toasts } = useToasts();

  return (
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/public/*" element={<PublicPortal />} />

          {/* Role-based redirect */}
          <Route path="/" element={<RoleRedirect />} />

          {/* Responder portal */}
          <Route
            path="/responder/*"
            element={
              <ProtectedRoute allowedRoles={['responder', 'supervisor', 'gov_admin']} />
            }
          >
            <Route path="*" element={<ResponderRouter />} />
          </Route>

          {/* Government portal */}
          <Route
            path="/gov/*"
            element={<ProtectedRoute allowedRoles={['gov_admin']} />}
          >
            <Route path="*" element={<GovRouter />} />
          </Route>

          {/* Default redirect for non-authenticated users */}
          <Route path="/home" element={<Navigate to="/public" replace />} />

          {/* Unauthorized */}
          <Route
            path="/unauthorized"
            element={
              <div className="min-h-screen flex items-center justify-center bg-paper">
                <div className="text-center">
                  <h1 className="text-2xl font-semibold text-ink mb-2">Unauthorized</h1>
                  <p className="text-ink-muted mb-4">
                    You don't have permission to access this page.
                  </p>
                  <button
                    onClick={() => (window.location.href = '/public')}
                    className="text-teal hover:text-teal-dark"
                  >
                    Go to Public Portal
                  </button>
                </div>
              </div>
            }
          />
        </Routes>

        {/* Toast notifications */}
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              type={toast.type}
              message={toast.message}
              onClose={toast.onClose}
            />
          ))}
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;