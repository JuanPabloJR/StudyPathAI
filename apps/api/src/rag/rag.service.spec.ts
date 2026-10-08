/**
 * Tests unitarios — RagService (embeddings Gemini + generación con Groq)
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

// Groq: `import Groq from 'groq-sdk'` compila a `groq_sdk_1.default`
const mockGroqCreate = jest.fn();
jest.mock('groq-sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockGroqCreate } },
  })),
}));

const groqReturns = (body: unknown) =>
  mockGroqCreate.mockResolvedValue({
    choices: [{ message: { content: JSON.stringify(body) } }],
  });

// Gemini embeddings vía fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

const embeddingResponse = (values: number[]) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve({ embedding: { values } }),
  text: () => Promise.resolve(''),
});

const mockPrisma = {
  $queryRaw: jest.fn(),
};

const configValues: Record<string, string | undefined> = {};
const mockConfig = { get: jest.fn((key: string) => configValues[key]) };

const baseConfig = {
  GROQ_API_KEY:       'test-groq-key',
  GROQ_MODEL:         'llama-3.3-70b-versatile',
  GOOGLE_AI_API_KEY:  'test-google-key',
  EMBEDDING_MODEL:    'gemini-embedding-001',
  RAG_MIN_SIMILARITY: '0.6',
};

// ─── Suite de tests ───────────────────────────────────────────────────────────

describe('RagService', () => {
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
    jest.clearAllMocks();
    for (const k of Object.keys(configValues)) delete configValues[k];
    Object.assign(configValues, baseConfig);

    mockFetch.mockResolvedValue(embeddingResponse(new Array(768).fill(0.1)));
    mockPrisma.$queryRaw.mockResolvedValue(mockChunks);
    groqReturns(mockGeneratedPath);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<RagService>(RagService);
  });

  // ── embedQuery ─────────────────────────────────────────────────────────────

  describe('embedQuery', () => {
    it('debe retornar un vector de 768 dimensiones desde Gemini', async () => {
      const emb = await service.embedQuery('Python ciencia de datos');
      expect(emb).toHaveLength(768);
    });

    it('debe pedir el embedding como consulta, con el modelo configurado y 768 dimensiones', async () => {
      await service.embedQuery('Python ciencia de datos');

      const [url, init] = mockFetch.mock.calls[0];
      const body = JSON.parse(init.body);
      expect(url).toContain('gemini-embedding-001:embedContent');
      expect(init.headers['x-goog-api-key']).toBe('test-google-key');
      expect(body.taskType).toBe('RETRIEVAL_QUERY');
      expect(body.outputDimensionality).toBe(768);
    });

    it('debe retornar null (no un vector cero) si la API falla', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve('API key not valid'),
      });
      expect(await service.embedQuery('test')).toBeNull();
    });

    it('debe retornar null si la API devuelve un vector cero', async () => {
      mockFetch.mockResolvedValueOnce(embeddingResponse(new Array(768).fill(0)));
      expect(await service.embedQuery('test')).toBeNull();
    });

    it('debe retornar null sin llamar a la API si falta GOOGLE_AI_API_KEY', async () => {
      delete configValues.GOOGLE_AI_API_KEY;
      expect(await service.embedQuery('test')).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ── retrieveRelevantChunks ─────────────────────────────────────────────────

  describe('retrieveRelevantChunks', () => {
    it('debe retornar chunks con similitud desde pgvector', async () => {
      const result = await service.retrieveRelevantChunks(new Array(768).fill(0.1), 5);
      expect(result).toHaveLength(2);
      expect(result[0].similarity).toBe(0.92);
    });

    it('debe excluir vectores cero y aplicar el umbral de similitud', async () => {
      await service.retrieveRelevantChunks(new Array(768).fill(0.1), 5);

      const [strings, ...values] = mockPrisma.$queryRaw.mock.calls[0];
      const sql = (strings as string[]).join('?');
      expect(sql).toContain('vector_norm(kc.embedding) > 0');
      expect(sql).not.toContain('OR kc.embedding IS NOT NULL');
      expect(values).toContain(0.6);
      expect(values).toContain(5);
    });

    it('debe retornar lista vacía (no chunks arbitrarios) si falla la consulta', async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('pgvector unavailable'));
      const result = await service.retrieveRelevantChunks(new Array(768).fill(0.1), 5);
      expect(result).toEqual([]);
    });
  });

  // ── generateLearningPath ───────────────────────────────────────────────────

  describe('generateLearningPath', () => {
    it('debe generar una ruta completa con los campos requeridos', async () => {
      const result = await service.generateLearningPath(baseRequest);

      expect(result.title).toBe('Python para Data Science: De Cero a Analista');
      expect(result.modules).toHaveLength(1);
      expect(result.modules[0].resources).toHaveLength(1);
      expect(result.modules[0].activities).toHaveLength(1);
      expect(result.ragSources).toHaveLength(2);
      expect(result.generationMeta.model).toBe('llama-3.3-70b-versatile');
      expect(result.generationMeta.chunksRetrieved).toBe(2);
    });

    it('debe enviar el contexto recuperado a Groq', async () => {
      await service.generateLearningPath(baseRequest);

      const { messages } = mockGroqCreate.mock.calls[0][0];
      const userPrompt = messages.find((m: any) => m.role === 'user').content;
      expect(userPrompt).toContain('Python para Data Science');
      expect(userPrompt).toContain('NumPy y Pandas');
    });

    it('debe generar sin contexto y sin consultar pgvector si no hay embedding', async () => {
      delete configValues.GOOGLE_AI_API_KEY;

      const result = await service.generateLearningPath(baseRequest);

      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
      expect(result.ragSources).toEqual([]);
      expect(result.generationMeta.chunksRetrieved).toBe(0);
      const userPrompt = mockGroqCreate.mock.calls[0][0].messages[1].content;
      expect(userPrompt).toContain('No se encontró contexto específico');
    });

    it('debe lanzar BadGatewayException (no un 500) si la respuesta no trae módulos', async () => {
      groqReturns({ title: 'Sin módulos', description: 'x', estimatedHours: 1 });
      await expect(service.generateLearningPath(baseRequest))
        .rejects.toThrow(BadGatewayException);
    });

    it('debe lanzar BadGatewayException si Groq falla', async () => {
      mockGroqCreate.mockRejectedValueOnce(new Error('Quota exceeded'));
      await expect(service.generateLearningPath(baseRequest))
        .rejects.toThrow(BadGatewayException);
    });

    it('debe calcular el número correcto de módulos según el tiempo disponible', () => {
      const prompt = (service as any).buildUserPrompt(
        { ...baseRequest, timeAvailable: 9 },
        mockChunks,
      );
      // 9h / 3 = 3 módulos
      expect(prompt).toContain('Número de módulos: 3');
    });

    it('debe incluir el contexto recuperado en el prompt', () => {
      const prompt = (service as any).buildUserPrompt(baseRequest, mockChunks);
      expect(prompt).toContain('Python es un lenguaje');
      expect(prompt).toContain('NumPy y Pandas');
      expect(prompt).toContain('92%');  // similitud del primer chunk
    });
  });

  // ── normalización de módulos ───────────────────────────────────────────────

  describe('normalización de campos opcionales', () => {
    it('debe asignar defaults a campos opcionales faltantes', async () => {
      groqReturns({
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
      });

      const result = await service.generateLearningPath(baseRequest);
      expect(result.modules[0].tips).toEqual([]);
      expect(result.modules[0].resources).toEqual([]);
      expect(result.modules[0].activities).toEqual([]);
    });
  });
});
