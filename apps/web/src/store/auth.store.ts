/**
 * Store de autenticación con Zustand
 * Maneja: usuario actual, token JWT, login/logout
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authApi, getErrorMessage } from '../api/client';

interface AuthState {
  user:    User | null;
  token:   string | null;
  loading: boolean;
  error:   string | null;

  // Acciones
  login:    (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout:   () => void;
  setUser:  (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:    null,
      token:   null,
      loading: false,
      error:   null,

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const res = await authApi.login({ email, password });
          const { user, accessToken } = res.data.data;
          localStorage.setItem('studypath_token', accessToken);
          set({ user, token: accessToken, loading: false });
        } catch (err) {
          set({ error: getErrorMessage(err), loading: false });
          throw err;
        }
      },

      register: async (name, email, password) => {
        set({ loading: true, error: null });
        try {
          const res = await authApi.register({ name, email, password });
          const { user, accessToken } = res.data.data;
          localStorage.setItem('studypath_token', accessToken);
          set({ user, token: accessToken, loading: false });
        } catch (err) {
          set({ error: getErrorMessage(err), loading: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('studypath_token');
        localStorage.removeItem('studypath_auth'); // limpiar también la clave de Zustand persist
        set({ user: null, token: null, error: null });
      },

      setUser: (user) => set({ user }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'studypath_auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);
