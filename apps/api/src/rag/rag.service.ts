/**
 * RagService — Pipeline RAG con Groq (Llama 3.3 70B)
 *
 * Flujo:
 *  1. Perfil del usuario → texto de consulta
 *  2. Embedding (Gemini) → pgvector cosine search → top-K chunks sobre umbral
 *     (sin embedding disponible → se genera sin contexto recuperado)
 *  3. Prompt con contexto recuperado → Groq Llama 3.3 70B
 *  4. JSON estructurado via response_format json_object
 *  5. Normalizar y guardar en BD
 */
import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { PrismaService } from '../prisma/prisma.service';
import { embedText } from './embeddings';

// ─── Tipos de la aplicación ───────────────────────────────────────────────────

export interface LearningPathRequest {
  topic: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  objectives: string[];
  timeAvailable: number;       // horas totales
  format: 'VIDEO' | 'TEXT' | 'INTERACTIVE' | 'MIXED' | 'PROJECT_BASED';
  specialNeeds?: string;
  userName?: string;
}

export interface GeneratedModule {
  order: number;
  title: string;
  objective: string;
  description: string;
  content: string;
  estimatedTime: number;       // minutos
  tips: string[];
  resources: {
    title: string;
    url: string;
    type: 'VIDEO' | 'ARTICLE' | 'BOOK' | 'COURSE' | 'EXERCISE' | 'DOCUMENTATION' | 'TUTORIAL';
    description: string;
    author: string;
    isFree: boolean;
  }[];
  activities: {
    title: string;
    description: string;
    type: 'READING' | 'PRACTICE' | 'PROJECT' | 'QUIZ' | 'EXERCISE' | 'DISCUSSION';
    durationMin: number;
    order: number;
  }[];
}

export interface GeneratedLearningPath {
  title: string;
  description: string;
  estimatedHours: number;
  modules: GeneratedModule[];
  ragSources: { content: string; similarity: number; metadata: any }[];
  generationMeta: {
    model: string;
    chunksRetrieved: number;
    generationMs: number;
  };
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly groq: Groq;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      this.logger.error('⛔ GROQ_API_KEY no configurada en .env');
    }
    this.groq = new Groq({ apiKey: apiKey ?? '' });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PASO 1 — Embedding de la consulta (Gemini, mismo modelo que el seed)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Devuelve null si no hay GOOGLE_AI_API_KEY o la API falla.
   * En ese caso no se recupera contexto: un vector cero haría que pgvector
   * devuelva similitud NaN y chunks en orden arbitrario.
   */
  async embedQuery(text: string): Promise<number[] | null> {
    const apiKey = this.config.get<string>('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GOOGLE_AI_API_KEY no configurada: se genera sin contexto RAG');
      return null;
    }

    try {
      return await embedText(text, {
        apiKey,
        model:    this.config.get<string>('EMBEDDING_MODEL'),
        taskType: 'RETRIEVAL_QUERY',
      });
    } catch (err: any) {
      this.logger.error(`Error generando embedding de la consulta: ${err?.message ?? err}`);
      return null;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PASO 2 — Recuperar chunks por similitud coseno (pgvector)
  // ══════════════════════════════════════════════════════════════════════════

  async retrieveRelevantChunks(
    queryEmbedding: number[],
    topK = 8,
  ): Promise<{ content: string; similarity: number; metadata: any }[]> {
    const vec           = `[${queryEmbedding.join(',')}]`;
    const minSimilarity = Number(this.config.get<string>('RAG_MIN_SIMILARITY') ?? 0.6);

    try {
      // Excluye chunks sin embedding o con vector cero (seeds viejos en "demo mode")
      // y los que no superan el umbral, para no inyectar contexto irrelevante.
      return await this.prisma.$queryRaw<
        { content: string; similarity: number; metadata: any }[]
      >`
        SELECT
          kc.content,
          1 - (kc.embedding <=> ${vec}::vector) AS similarity,
          kc.metadata
        FROM knowledge_chunks  kc
        JOIN knowledge_sources ks ON kc.source_id = ks.id
        WHERE ks.is_active = true
          AND kc.embedding IS NOT NULL
          AND vector_norm(kc.embedding) > 0
          AND 1 - (kc.embedding <=> ${vec}::vector) >= ${minSimilarity}
        ORDER BY kc.embedding <=> ${vec}::vector
        LIMIT ${topK}
      `;
    } catch (err: any) {
      this.logger.error(`Error en búsqueda vectorial: ${err?.message ?? err}`);
      return [];
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PASO 3 — Construir prompt
  // ══════════════════════════════════════════════════════════════════════════

  private buildSystemInstruction(): string {
    return `Eres un experto en diseño instruccional y educación personalizada.
Generas rutas de aprendizaje estructuradas, progresivas y adaptadas al perfil del estudiante.

REGLAS:
- Basa el contenido PRINCIPALMENTE en el contexto educativo proporcionado.
- Los módulos van de lo básico a lo avanzado, en orden progresivo.
- Los recursos deben ser reales (prioriza los del contexto dado).
- Las actividades deben ser prácticas y medibles.
- Respeta el tiempo disponible: distribúyelo de forma realista entre módulos.
- Si hay necesidades especiales, adapta el ritmo y los ejemplos.

RESPONDE ÚNICAMENTE con un objeto JSON válido con esta estructura exacta (sin texto adicional, sin markdown):
{
  "title": "string — título descriptivo y motivador",
  "description": "string — 2-3 oraciones sobre lo que el estudiante logrará",
  "estimatedHours": number,
  "modules": [
    {
      "order": number,
      "title": "string",
      "objective": "string — con verbo de acción: Al completar este módulo...",
      "description": "string — 1-2 oraciones",
      "content": "string — explicación pedagógica detallada mínimo 150 palabras",
      "estimatedTime": number,
      "tips": ["string", "string"],
      "resources": [
        {
          "title": "string",
          "url": "string o null",
          "type": "VIDEO|ARTICLE|BOOK|COURSE|EXERCISE|DOCUMENTATION|TUTORIAL",
          "description": "string",
          "author": "string o null",
          "isFree": true
        }
      ],
      "activities": [
        {
          "title": "string",
          "description": "string — instrucciones paso a paso",
          "type": "READING|PRACTICE|PROJECT|QUIZ|EXERCISE|DISCUSSION",
          "durationMin": number,
          "order": number
        }
      ]
    }
  ]
}`;
  }

  private buildUserPrompt(
    req: LearningPathRequest,
    chunks: { content: string; similarity: number; metadata: any }[],
  ): string {
    const levelLabel: Record<string, string> = {
      BEGINNER:     'Principiante — sin conocimiento previo',
      INTERMEDIATE: 'Intermedio — tiene bases, quiere profundizar',
      ADVANCED:     'Avanzado — domina el tema, busca expertise',
      EXPERT:       'Experto — busca conocimientos muy especializados',
    };

    const formatLabel: Record<string, string> = {
      VIDEO:         'videos explicativos (YouTube, plataformas de cursos)',
      TEXT:          'lectura: documentación, artículos y libros',
      INTERACTIVE:   'ejercicios interactivos (Codecademy, plataformas online)',
      MIXED:         'formato mixto: videos + lecturas + práctica',
      PROJECT_BASED: 'construcción de proyectos reales paso a paso',
    };

    const numMods    = Math.min(Math.max(Math.ceil(req.timeAvailable / 3), 3), 8);
    const minsPerMod = Math.round((req.timeAvailable * 60) / numMods);

    const context = chunks.length > 0
      ? chunks
          .map((c, i) => `[Fuente ${i + 1} · relevancia ${(c.similarity * 100).toFixed(0)}%]\n${c.content}`)
          .join('\n\n---\n\n')
      : 'No se encontró contexto específico. Usa tu conocimiento sobre el tema.';

    return `PERFIL DEL ESTUDIANTE
- Nombre: ${req.userName ?? 'Estudiante'}
- Tema: "${req.topic}"
- Nivel: ${levelLabel[req.level] ?? req.level}
- Objetivos:
${req.objectives.map((o, i) => `  ${i + 1}. ${o}`).join('\n')}
- Tiempo total: ${req.timeAvailable} horas
- Formato preferido: ${formatLabel[req.format] ?? req.format}
${req.specialNeeds ? `- Necesidades especiales: ${req.specialNeeds}` : ''}

PARÁMETROS DE GENERACIÓN
- Número de módulos: ${numMods}
- Tiempo por módulo: ~${minsPerMod} minutos
- Suma de estimatedTime debe ser ≈ ${req.timeAvailable * 60} minutos

CONTEXTO EDUCATIVO RECUPERADO (base principal del contenido)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${context}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Genera la ruta de aprendizaje completa en español. Responde SOLO con el JSON.`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PASO 4 — Llamar a Groq (Llama 3.3 70B)
  // ══════════════════════════════════════════════════════════════════════════

  async generateLearningPath(req: LearningPathRequest): Promise<GeneratedLearningPath> {
    const t0    = Date.now();
    const model = this.config.get<string>('GROQ_MODEL') || 'llama-3.3-70b-versatile';
    this.logger.log(`🚀 [Groq/${model}] Generando ruta: "${req.topic}" · ${req.level}`);

    // 1. Embedding de la consulta
    const queryText = `${req.topic} ${req.level} ${req.objectives.join(' ')}`;
    const embedding = await this.embedQuery(queryText);

    // 2. Recuperación (sin embedding no hay búsqueda vectorial posible)
    const chunks = embedding ? await this.retrieveRelevantChunks(embedding) : [];
    this.logger.log(`📚 Chunks recuperados: ${chunks.length}`);

    // 3. Prompt
    const systemInstruction = this.buildSystemInstruction();
    const userPrompt        = this.buildUserPrompt(req, chunks);

    // 4. Groq con json_object (garantiza JSON válido)
    let parsed: any;

    try {
      const completion = await this.groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user',   content: userPrompt },
        ],
        temperature:    0.7,
        max_tokens:     8192,
        response_format: { type: 'json_object' },
      });

      const rawText = completion.choices[0]?.message?.content ?? '{}';
      this.logger.log(`🤖 Groq respondió: ${rawText.length} chars`);

      parsed = JSON.parse(rawText);

    } catch (err: any) {
      this.logger.error('Error Groq:', err?.message ?? err);
      throw new BadGatewayException(
        `Error al generar la ruta: ${err?.message ?? 'revisa GROQ_API_KEY en .env'}`,
      );
    }

    // 5. Normalizar campos opcionales con validación estricta de enums
    const VALID_RESOURCE_TYPES  = ['VIDEO', 'ARTICLE', 'BOOK', 'COURSE', 'EXERCISE', 'DOCUMENTATION', 'TUTORIAL'];
    const VALID_ACTIVITY_TYPES  = ['READING', 'PRACTICE', 'PROJECT', 'QUIZ', 'EXERCISE', 'DISCUSSION'];

    parsed.modules = (parsed.modules as any[]).map((m, i) => ({
      ...m,
      order:         m.order         ?? i + 1,
      estimatedTime: m.estimatedTime ?? 60,
      tips:          Array.isArray(m.tips)      ? m.tips      : [],
      resources:     Array.isArray(m.resources) ? m.resources.map((r: any) => ({
        title:       r.title       ?? 'Recurso',
        url:         r.url         ?? null,
        type:        VALID_RESOURCE_TYPES.includes(r.type) ? r.type : 'ARTICLE',
        description: r.description ?? '',
        author:      r.author      ?? null,
        isFree:      r.isFree      !== false,
      })) : [],
      activities: Array.isArray(m.activities) ? m.activities.map((a: any, j: number) => ({
        title:       a.title       ?? `Actividad ${j + 1}`,
        description: a.description ?? '',
        type:        VALID_ACTIVITY_TYPES.includes(a.type) ? a.type : 'EXERCISE',
        durationMin: a.durationMin ?? 30,
        order:       a.order       ?? j + 1,
      })) : [],
    }));

    const ms = Date.now() - t0;
    this.logger.log(`✅ Ruta generada en ${ms}ms · ${parsed.modules.length} módulos`);

    return {
      title:          parsed.title,
      description:    parsed.description,
      estimatedHours: parsed.estimatedHours,
      modules:        parsed.modules,
      ragSources:     chunks,
      generationMeta: {
        model,
        chunksRetrieved: chunks.length,
        generationMs:    ms,
      },
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Utilidad: búsqueda semántica directa
  // ══════════════════════════════════════════════════════════════════════════

  async searchKnowledge(query: string, topK = 5) {
    const emb = await this.embedQuery(query);
    return emb ? this.retrieveRelevantChunks(emb, topK) : [];
  }
}
