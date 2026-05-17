import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authStore } from '../stores/authStore';
import { User } from '../types';

export function useAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, accessToken, isLoading, isAuthenticated, login, logout, checkAuth } = authStore();

  useEffect(() => {
    // Only check auth if not on login page
    if (!location.pathname.includes('/login')) {
      checkAuth();
    }
  }, [location.pathname]);

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
    const role = authStore.getState().user?.role;

    // Redirect based on role
    if (role === 'gov_admin') {
      navigate('/gov');
    } else if (role === 'responder' || role === 'supervisor') {
      navigate('/responder');
    } else {
      navigate('/public');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return {
    user,
    accessToken,
    isLoading,
    isAuthenticated,
    login: handleLogin,
    logout: handleLogout,
    checkAuth,
  };
}