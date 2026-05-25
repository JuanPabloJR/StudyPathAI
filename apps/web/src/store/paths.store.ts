import { create } from 'zustand';
import type { LearningPath, UserStats } from '../types';
import { pathsApi, getErrorMessage } from '../api/client';

interface PathsState {
  paths:        LearningPath[];
  currentPath:  LearningPath | null;
  stats:        UserStats | null;
  loading:      boolean;
  generating:   boolean;  // true mientras Claude genera la ruta
  error:        string | null;

  fetchPaths:   () => Promise<void>;
  fetchPath:    (id: string) => Promise<void>;
  fetchStats:   () => Promise<void>;
  createPath:   (data: any) => Promise<LearningPath>;
  updateProgress: (pathId: string, moduleId: string, data: any) => Promise<void>;
  regeneratePath: (id: string, adjustments?: string) => Promise<LearningPath>;
  deletePath:   (id: string) => Promise<void>;
  clearError:   () => void;
}

export const usePathsStore = create<PathsState>((set, get) => ({
  paths:       [],
  currentPath: null,
  stats:       null,
  loading:     false,
  generating:  false,
  error:       null,

  fetchPaths: async () => {
    set({ loading: true, error: null });
    try {
      const res = await pathsApi.list();
      set({ paths: res.data.data, loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  fetchPath: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await pathsApi.get(id);
      set({ currentPath: res.data.data, loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const res = await pathsApi.getStats();
      set({ stats: res.data.data });
    } catch (err) {
      // stats son opcionales, no bloquear la UI
    }
  },

  createPath: async (data) => {
    set({ generating: true, error: null });
    try {
      const res = await pathsApi.create(data);
      const newPath = res.data.data;
      set((state) => ({
        paths: [newPath, ...state.paths],
        generating: false,
      }));
      return newPath;
    } catch (err) {
      set({ error: getErrorMessage(err), generating: false });
      throw err;
    }
  },

  updateProgress: async (pathId, moduleId, data) => {
    try {
      await pathsApi.updateProgress(pathId, moduleId, data);
      // Refrescar la ruta actual para actualizar el progreso
      await get().fetchPath(pathId);
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },

  regeneratePath: async (id, adjustments) => {
    set({ generating: true, error: null });
    try {
      const res = await pathsApi.regenerate(id, adjustments);
      const newPath = res.data.data;
      set((state) => ({
        paths: [newPath, ...state.paths.filter((p) => p.id !== id)],
        generating: false,
      }));
      return newPath;
    } catch (err) {
      set({ error: getErrorMessage(err), generating: false });
      throw err;
    }
  },

  deletePath: async (id) => {
    try {
      await pathsApi.delete(id);
      set((state) => ({
        paths: state.paths.filter((p) => p.id !== id),
        currentPath: state.currentPath?.id === id ? null : state.currentPath,
      }));
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },

  clearError: () => set({ error: null }),
}));
