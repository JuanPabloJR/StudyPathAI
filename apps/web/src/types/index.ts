// ─── Enumeraciones ─────────────────────────────────────────────────────────────

export type KnowledgeLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
export type LearningFormat  = 'VIDEO' | 'TEXT' | 'INTERACTIVE' | 'MIXED' | 'PROJECT_BASED';
export type PathStatus      = 'GENERATING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'FAILED';
export type ResourceType    = 'VIDEO' | 'ARTICLE' | 'BOOK' | 'COURSE' | 'EXERCISE' | 'DOCUMENTATION' | 'TUTORIAL';
export type ActivityType    = 'READING' | 'PRACTICE' | 'PROJECT' | 'QUIZ' | 'EXERCISE' | 'DISCUSSION';

// ─── Entidades ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
  createdAt: string;
  profile?: UserProfile;
  _count?: { learningPaths: number };
}

export interface UserProfile {
  id: string;
  userId: string;
  bio?: string;
  occupation?: string;
  preferredFormats: LearningFormat[];
  learningStyle?: string;
  weeklyHours: number;
  avatarUrl?: string;
}

export interface Resource {
  id: string;
  title: string;
  url?: string;
  type: ResourceType;
  description?: string;
  author?: string;
  isFree: boolean;
  order: number;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  durationMin: number;
  order: number;
}

export interface ModuleProgress {
  id: string;
  moduleId: string;
  completed: boolean;
  completedAt?: string;
  score?: number;
  timeSpent: number;
  notes?: string;
}

export interface LearningModule {
  id: string;
  order: number;
  title: string;
  objective: string;
  description: string;
  content: string;
  estimatedTime: number;
  tips: string[];
  resources: Resource[];
  activities: Activity[];
  progress?: ModuleProgress;
}

export interface PathStats {
  totalModules: number;
  completedModules: number;
  percent: number;
  totalTimeSpentMin: number;
  estimatedRemainingMin: number;
}

export interface LearningPath {
  id: string;
  title: string;
  topic: string;
  level: KnowledgeLevel;
  objectives: string[];
  timeAvailable: number;
  format: LearningFormat;
  specialNeeds?: string;
  status: PathStatus;
  totalModules: number;
  estimatedHours: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  modules?: LearningModule[];
  stats?: PathStats;
  progress?: { totalModules: number; completedModules: number; percent: number };
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateLearningPathDto {
  topic: string;
  level: KnowledgeLevel;
  objectives: string[];
  timeAvailable: number;
  format: LearningFormat;
  specialNeeds?: string;
}

export interface UpdateProgressDto {
  completed?: boolean;
  score?: number;
  timeSpent?: number;
  notes?: string;
}

// ─── Respuestas API ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, any>;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface UserStats {
  totalPaths: number;
  completedPaths: number;
  activePaths: number;
  totalTimeSpentMin: number;
}

// ─── Labels de UI ─────────────────────────────────────────────────────────────

export const LEVEL_LABELS: Record<KnowledgeLevel, string> = {
  BEGINNER:     'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED:     'Avanzado',
  EXPERT:       'Experto',
};

export const FORMAT_LABELS: Record<LearningFormat, string> = {
  VIDEO:         'Videos',
  TEXT:          'Lectura',
  INTERACTIVE:   'Interactivo',
  MIXED:         'Mixto',
  PROJECT_BASED: 'Proyectos',
};

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  VIDEO:         'Video',
  ARTICLE:       'Artículo',
  BOOK:          'Libro',
  COURSE:        'Curso',
  EXERCISE:      'Ejercicio',
  DOCUMENTATION: 'Documentación',
  TUTORIAL:      'Tutorial',
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  READING:    'Lectura',
  PRACTICE:   'Práctica',
  PROJECT:    'Proyecto',
  QUIZ:       'Evaluación',
  EXERCISE:   'Ejercicio',
  DISCUSSION: 'Discusión',
};
