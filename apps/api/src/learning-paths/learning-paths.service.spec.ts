/**
 * Tests de integración del LearningPathsService
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { LearningPathsService } from './learning-paths.service';
import { PrismaService } from '../prisma/prisma.service';
import { RagService } from '../rag/rag.service';

const MOCK_USER_ID  = 'user-001';
const MOCK_PATH_ID  = 'path-001';
const MOCK_MODULE_ID = 'module-001';

const mockPath = {
  id: MOCK_PATH_ID,
  userId: MOCK_USER_ID,
  title: 'Introducción a Python',
  topic: 'Python',
  level: 'BEGINNER',
  objectives: ['Aprender variables'],
  timeAvailable: 10,
  format: 'MIXED',
  status: 'ACTIVE',
  totalModules: 3,
  estimatedHours: 10,
  version: 1,
  modules: [
    { id: MOCK_MODULE_ID, progress: { completed: true } },
    { id: 'module-002', progress: { completed: false } },
    { id: 'module-003', progress: null },
  ],
};

const mockPrisma = {
  user: { findUnique: jest.fn().mockResolvedValue({ name: 'Juan' }) },
  learningPath: {
    create:  jest.fn().mockResolvedValue({ ...mockPath }),
    findMany: jest.fn().mockResolvedValue([mockPath]),
    findUnique: jest.fn().mockResolvedValue(mockPath),
    update:  jest.fn().mockResolvedValue(mockPath),
    delete:  jest.fn(),
    count:   jest.fn().mockResolvedValue(1),
  },
  module: {
    create:  jest.fn(),
    findFirst: jest.fn().mockResolvedValue({
      id: MOCK_MODULE_ID,
      pathId: MOCK_PATH_ID,
      path: { userId: MOCK_USER_ID },
      progress: { timeSpent: 0, completedAt: null },
    }),
    findMany: jest.fn().mockResolvedValue(mockPath.modules),
  },
  moduleProgress: {
    upsert: jest.fn().mockResolvedValue({ id: 'prog-001', completed: true }),
    aggregate: jest.fn().mockResolvedValue({ _sum: { timeSpent: 120 } }),
  },
  $transaction: jest.fn((fn: any) => fn(mockPrisma)),
};

const mockRag = {
  generateLearningPath: jest.fn().mockResolvedValue({
    title: 'Ruta generada por IA',
    description: 'Descripción',
    estimatedHours: 10,
    modules: [
      {
        order: 1,
        title: 'Módulo 1',
        objective: 'Obj 1',
        description: 'Desc',
        content: 'Contenido del módulo',
        estimatedTime: 60,
        tips: ['Tip 1'],
        resources: [],
        activities: [],
      },
    ],
    ragSources: [],
    generationMeta: { model: 'llama-3.3-70b-versatile', chunksRetrieved: 5, generationMs: 3000 },
  }),
};

describe('LearningPathsService', () => {
  let service: LearningPathsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearningPathsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RagService,    useValue: mockRag },
      ],
    }).compile();

    service = module.get<LearningPathsService>(LearningPathsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('debe retornar rutas con progreso calculado', async () => {
      mockPrisma.learningPath.findMany.mockResolvedValueOnce([mockPath]);
      const result = await service.findAll(MOCK_USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0].progress).toBeDefined();
      expect(result[0].progress!.totalModules).toBe(3);
      expect(result[0].progress!.completedModules).toBe(1);
      expect(result[0].progress!.percent).toBe(33);
    });
  });

  describe('findOne', () => {
    it('debe lanzar NotFoundException si la ruta no existe', async () => {
      mockPrisma.learningPath.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('id-inexistente', MOCK_USER_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ForbiddenException si la ruta pertenece a otro usuario', async () => {
      mockPrisma.learningPath.findUnique.mockResolvedValueOnce({
        ...mockPath,
        userId: 'otro-usuario',
        modules: [],
      });
      await expect(service.findOne(MOCK_PATH_ID, MOCK_USER_ID))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateProgress', () => {
    it('debe actualizar el progreso de un módulo', async () => {
      const result = await service.updateProgress(
        MOCK_PATH_ID, MOCK_MODULE_ID, MOCK_USER_ID,
        { completed: true, score: 95, timeSpent: 60 },
      );
      expect(mockPrisma.moduleProgress.upsert).toHaveBeenCalledTimes(1);
    });

    it('debe lanzar NotFoundException si el módulo no pertenece al usuario', async () => {
      mockPrisma.module.findFirst.mockResolvedValueOnce(null);
      await expect(
        service.updateProgress(MOCK_PATH_ID, 'modulo-ajeno', MOCK_USER_ID, { completed: true })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserStats', () => {
    it('debe retornar estadísticas del usuario', async () => {
      mockPrisma.learningPath.count
        .mockResolvedValueOnce(3)   // total
        .mockResolvedValueOnce(1)   // completed
        .mockResolvedValueOnce(2);  // active

      const stats = await service.getUserStats(MOCK_USER_ID);
      expect(stats.totalPaths).toBe(3);
      expect(stats.completedPaths).toBe(1);
      expect(stats.activePaths).toBe(2);
    });
  });
});
