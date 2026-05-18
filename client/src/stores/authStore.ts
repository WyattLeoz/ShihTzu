import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthResponse } from '../types';
import apiClient from '../api/client';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  setAccessToken: (token: string) => void;
  checkAuth: () => Promise<void>;
}

export const authStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post<AuthResponse>('/auth/login', {
            email,
            password,
          });

          set({
            user: response.user,
            accessToken: response.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        // Call logout endpoint
        apiClient.post('/auth/logout').catch(console.error);

        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },

      refreshToken: async () => {
        try {
          const response = await apiClient.post<{ accessToken: string }>('/auth/refresh');
          set({
            accessToken: response.accessToken,
            isAuthenticated: true,
          });
        } catch (error) {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      setAccessToken: (token: string) => {
        set({ accessToken: token, isAuthenticated: true });
      },

      checkAuth: async () => {
        const { user, accessToken } = get();

        // If no user and no access token, nothing to check
        if (!user && !accessToken) {
          return;
        }

        // If no user but we have a token, try to get user data
        if (!user && accessToken) {
          try {
            const me = await apiClient.get<User>('/auth/me');
            set({ user: me, isAuthenticated: true });
          } catch (error) {
            // Token is invalid, clear state
            set({ user: null, accessToken: null, isAuthenticated: false });
          }
        }
      },
    }),
    {
      name: 'quickaid-auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }), // Persist user and token
    }
  )
);