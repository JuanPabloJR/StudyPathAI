/**
 * Cliente HTTP centralizado para la API de StudyPath AI
 * Maneja: autenticación JWT, interceptores, manejo de errores
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://studypathai-production.up.railway.app/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60s para generación de rutas (puede tardar por LLM)
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Interceptor: adjuntar JWT ─────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('studypath_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Interceptor: manejar respuestas ──────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    // Token expirado → limpiar sesión y redirigir al login
    if (error.response?.status === 401) {
      // Limpiar AMBAS claves: la manual y la que usa Zustand persist
      localStorage.removeItem('studypath_token');
      localStorage.removeItem('studypath_auth'); // ← clave real del store de Zustand
      // Solo redirigir si no estamos ya en login/register (evita loop)
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// ─── Helper para extraer mensaje de error ─────────────────────────────────────
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data?.message === 'string') return data.message;
    if (Array.isArray(data?.message)) return data.message[0];
    if (typeof data?.error === 'string') return data.error;
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Error desconocido';
}

// ─── Servicios de API ──────────────────────────────────────────────────────────

import type {
  AuthResponse,
  User,
  LearningPath,
  CreateLearningPathDto,
  UpdateProgressDto,
  ModuleProgress,
  UserStats,
} from '../types';

// Auth
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/login', data),

  me: () =>
    apiClient.get<{ success: boolean; data: User }>('/auth/me'),
};

// Usuarios
export const usersApi = {
  getProfile: () =>
    apiClient.get<{ success: boolean; data: User }>('/users/profile'),

  updateProfile: (data: Partial<User & { name: string; bio: string; occupation: string; weeklyHours: number }>) =>
    apiClient.patch<{ success: boolean; data: User }>('/users/profile', data),
};

// Rutas de aprendizaje
export const pathsApi = {
  create: (data: CreateLearningPathDto) =>
    apiClient.post<{ success: boolean; data: LearningPath }>('/learning-paths', data),

  list: () =>
    apiClient.get<{ success: boolean; data: LearningPath[] }>('/learning-paths'),

  get: (id: string) =>
    apiClient.get<{ success: boolean; data: LearningPath }>(`/learning-paths/${id}`),

  updateProgress: (pathId: string, moduleId: string, data: UpdateProgressDto) =>
    apiClient.patch<{ success: boolean; data: ModuleProgress }>(
      `/learning-paths/${pathId}/modules/${moduleId}/progress`,
      data,
    ),

  regenerate: (id: string, adjustments?: string) =>
    apiClient.post<{ success: boolean; data: LearningPath }>(
      `/learning-paths/${id}/regenerate`,
      { adjustments },
    ),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean; data: { message: string } }>(`/learning-paths/${id}`),

  getStats: () =>
    apiClient.get<{ success: boolean; data: UserStats }>('/learning-paths/stats'),
};
