import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStore } from '../stores/authStore';

export function RoleRedirect() {
  const navigate = useNavigate();
  const user = authStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Redirect based on role (handle legacy supervisor role)
    switch (user.role) {
      case 'gov_admin':
        navigate('/gov', { replace: true });
        break;
      case 'supervisor':  // Legacy support for supervisor role
      case 'responder':
        navigate('/responder', { replace: true });
        break;
      case 'citizen':
      default:
        navigate('/public', { replace: true });
        break;
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
        <p className="text-ink-muted mt-2">Redirecting...</p>
      </div>
    </div>
  );
}