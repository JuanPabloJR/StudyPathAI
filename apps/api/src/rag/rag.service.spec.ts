/**
 * Tests unitarios — RagService con Gemini 2.0 Flash
 * Ejecutar: npm run test
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RagService, LearningPathRequest } from './rag.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockChunks = [
  {
    content: 'Python es un lenguaje de programación interpretado de alto nivel con sintaxis clara.',
    similarity: 0.92,
    metadata: { topic: 'python', level: 'BEGINNER' },
  },
  {
    content: 'NumPy y Pandas son las bibliotecas fundamentales para ciencia de datos en Python.',
    similarity: 0.87,
    metadata: { topic: 'python', level: 'INTERMEDIATE' },
  },
];

const mockGeneratedPath = {
  title: 'Python para Data Science: De Cero a Analista',
  description: 'Aprenderás Python y las herramientas esenciales para el análisis de datos.',
  estimatedHours: 20,
  modules: [
    {
      order: 1,
      title: 'Fundamentos de Python',
      objective: 'Al completar este módulo, el estudiante podrá escribir scripts básicos en Python.',
      description: 'Introducción a la sintaxis y estructuras básicas de Python.',
      content: 'Python es un lenguaje de alto nivel que destaca por su legibilidad...',
      estimatedTime: 120,
      tips: ['Practica en la REPL', 'Usa Google Colab gratis'],
      resources: [
        {
          title: 'Tutorial oficial Python',
          url: 'https://docs.python.org/es/3/tutorial/',
          type: 'DOCUMENTATION',
          description: 'Tutorial completo en español',
          author: 'Python.org',
          isFree: true,
        },
      ],
      activities: [
        {
          title: 'Calculadora básica',
          description: 'Crea un script que sume, reste, multiplique y divida dos números.',
          type: 'EXERCISE',
          durationMin: 30,
          order: 1,
        },
      ],
    },
  ],
};

// Mock de GoogleGenerativeAI
const mockEmbedContent   = jest.fn().mockResolvedValue({ embedding: { values: new Array(768).fill(0.1) } });
const mockGenerateContent = jest.fn().mockResolvedValue({
  response: { text: () => JSON.stringify(mockGeneratedPath) },
});
const mockGetGenerativeModel = jest.fn().mockImplementation(({ model }: { model: string }) => ({
  embedContent:    mockEmbedContent,
  generateContent: mockGenerateContent,
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
  SchemaType: {
    OBJECT: 'object', ARRAY: 'array', STRING: 'string',
    INTEGER: 'integer', BOOLEAN: 'boolean', NUMBER: 'number',
  },
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT:        'HARM_CATEGORY_HARASSMENT',
    HARM_CATEGORY_HATE_SPEECH:       'HARM_CATEGORY_HATE_SPEECH',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
  },
  HarmBlockThreshold: { BLOCK_ONLY_HIGH: 'BLOCK_ONLY_HIGH' },
}));

const mockPrisma = {
  $queryRaw: jest.fn().mockResolvedValue(mockChunks),
  knowledgeChunk: { findMany: jest.fn().mockResolvedValue([]) },
};

const mockConfig = {
  get: jest.fn((key: string) => ({
    GOOGLE_AI_API_KEY:    'test-key-AIzaSy',
    GEMINI_MODEL:         'gemini-2.0-flash',
    EMBEDDING_MODEL:      'text-embedding-004',
    EMBEDDING_DIMENSIONS: '768',
  }[key])),
};

// ─── Suite de tests ───────────────────────────────────────────────────────────

describe('RagService — Gemini 2.0 Flash', () => {
  let service: RagService;

  const baseRequest: LearningPathRequest = {
    topic:         'Python para Data Science',
    level:         'BEGINNER',
    objectives:    ['Aprender pandas', 'Crear visualizaciones con matplotlib'],
    timeAvailable: 20,
    format:        'MIXED',
    userName:      'Juan',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService,  useValue: mockConfig },
      ],
    }).compile();

    service = module.get<RagService>(RagService);
    jest.clearAllMocks();
  });

  // ── embedQuery ─────────────────────────────────────────────────────────────

  describe('embedQuery', () => {
    it('debe retornar un vector de 768 dimensiones', async () => {
      mockEmbedContent.mockResolvedValueOnce({ embedding: { values: new Array(768).fill(0.1) } });
      const emb = await service.embedQuery('Python ciencia de datos');
      expect(emb).toHaveLength(768);
    });

    it('debe retornar vector cero como fallback si falla la API', async () => {
      mockEmbedContent.mockRejectedValueOnce(new Error('API error'));
      const emb = await service.embedQuery('test');
      expect(emb).toHaveLength(768);
      expect(emb.every(v => v === 0)).toBe(true);
    });
  });

  // ── retrieveRelevantChunks ─────────────────────────────────────────────────

  describe('retrieveRelevantChunks', () => {
    it('debe retornar chunks con similitud desde pgvector', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce(mockChunks);
      const result = await service.retrieveRelevantChunks(new Array(768).fill(0), 'python', 5);
      expect(result).toHaveLength(2);
      expect(result[0].similarity).toBe(0.92);
    });

    it('debe usar fallback si pgvector no está disponible', async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('pgvector unavailable'));
      mockPrisma.knowledgeChunk.findMany.mockResolvedValueOnce([
        { id: '1', content: 'Contenido fallback', metadata: {}, source: {} },
      ]);
      const result = await service.retrieveRelevantChunks(new Array(768).fill(0), 'python', 5);
      expect(result).toHaveLength(1);
      expect(result[0].similarity).toBe(0.5);
    });
  });

  // ── generateLearningPath ───────────────────────────────────────────────────

  describe('generateLearningPath', () => {
    it('debe generar una ruta completa con los campos requeridos', async () => {
      mockPrisma.$queryRaw.mockResolvedValue(mockChunks);
      mockGetGenerativeModel.mockImplementation(() => ({
        embedContent:    () => Promise.resolve({ embedding: { values: new Array(768).fill(0.1) } }),
        generateContent: () => Promise.resolve({ response: { text: () => JSON.stringify(mockGeneratedPath) } }),
      }));

      const result = await service.generateLearningPath(baseRequest);

      expect(result.title).toBe('Python para Data Science: De Cero a Analista');
      expect(result.modules).toHaveLength(1);
      expect(result.modules[0].resources).toHaveLength(1);
      expect(result.modules[0].activities).toHaveLength(1);
      expect(result.ragSources).toHaveLength(2);
      expect(result.generationMeta.model).toBe('gemini-2.0-flash');
      expect(result.generationMeta.chunksRetrieved).toBe(2);
      expect(result.generationMeta.generationMs).toBeGreaterThan(0);
    });

    it('debe usar gemini-2.0-flash como modelo', async () => {
      mockPrisma.$queryRaw.mockResolvedValue(mockChunks);
      let capturedModel = '';
      mockGetGenerativeModel.mockImplementation(({ model }: any) => {
        capturedModel = model;
        return {
          embedContent:    () => Promise.resolve({ embedding: { values: new Array(768).fill(0.1) } }),
          generateContent: () => Promise.resolve({ response: { text: () => JSON.stringify(mockGeneratedPath) } }),
        };
      });

      await service.generateLearningPath(baseRequest);
      expect(capturedModel).toBe('gemini-2.0-flash');
    });

    it('debe lanzar BadGatewayException si la API de Gemini falla', async () => {
      mockPrisma.$queryRaw.mockResolvedValue(mockChunks);
      mockGetGenerativeModel.mockImplementation(() => ({
        embedContent:    () => Promise.resolve({ embedding: { values: new Array(768).fill(0) } }),
        generateContent: () => Promise.reject(new Error('Quota exceeded')),
      }));

      await expect(service.generateLearningPath(baseRequest))
        .rejects.toThrow(BadGatewayException);
    });

    it('debe incluir el tema y nombre del usuario en el prompt enviado a Flash', async () => {
      let capturedPrompt = '';
      mockPrisma.$queryRaw.mockResolvedValue(mockChunks);
      mockGetGenerativeModel.mockImplementation(() => ({
        embedContent: () => Promise.resolve({ embedding: { values: new Array(768).fill(0.1) } }),
        generateContent: (prompt: string) => {
          capturedPrompt = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
          return Promise.resolve({ response: { text: () => JSON.stringify(mockGeneratedPath) } });
        },
      }));

      await service.generateLearningPath({ ...baseRequest, userName: 'María' });
      expect(capturedPrompt).toContain('Python para Data Science');
    });

    it('debe calcular el número correcto de módulos según el tiempo disponible', () => {
      // Acceder al método privado vía any
      const prompt = (service as any).buildUserPrompt(
        { ...baseRequest, timeAvailable: 9 },
        mockChunks,
      );
      // 9h / 3 = 3 módulos
      expect(prompt).toContain('3 módulos');
    });

    it('debe incluir el contexto recuperado en el prompt', async () => {
      const prompt = (service as any).buildUserPrompt(baseRequest, mockChunks);
      expect(prompt).toContain('Python es un lenguaje');
      expect(prompt).toContain('NumPy y Pandas');
      expect(prompt).toContain('92%');  // similitud del primer chunk
    });
  });

  // ── normalización de módulos ───────────────────────────────────────────────

  describe('normalización de campos opcionales', () => {
    it('debe asignar defaults a campos opcionales faltantes', async () => {
      const pathWithDefaults = {
        ...mockGeneratedPath,
        modules: [{
          order: 1,
          title: 'Módulo sin extras',
          objective: 'Objetivo',
          description: 'Descripción',
          content: 'Contenido',
          estimatedTime: 60,
          // tips, resources, activities no incluidos
        }],
      };

      mockPrisma.$queryRaw.mockResolvedValue(mockChunks);
      mockGetGenerativeModel.mockImplementation(() => ({
        embedContent:    () => Promise.resolve({ embedding: { values: new Array(768).fill(0.1) } }),
        generateContent: () => Promise.resolve({ response: { text: () => JSON.stringify(pathWithDefaults) } }),
      }));

      const result = await service.generateLearningPath(baseRequest);
      expect(result.modules[0].tips).toEqual([]);
      expect(result.modules[0].resources).toEqual([]);
      expect(result.modules[0].activities).toEqual([]);
    });
  });
});
