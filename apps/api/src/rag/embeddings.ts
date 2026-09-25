/**
 * Embeddings con Gemini (API REST).
 *
 * Compartido por el seed (documentos) y RagService (consultas): ambos deben usar
 * el mismo modelo y la misma dimensión, o la similitud coseno no tiene sentido.
 *
 * Se usa REST en lugar de @google/generative-ai porque el SDK 0.21 no expone
 * outputDimensionality, necesario para ajustar gemini-embedding-001 a vector(768).
 */

export const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-001';
export const EMBEDDING_DIMENSIONS    = 768; // debe coincidir con vector(768) en schema.prisma

export type EmbeddingTaskType = 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT';

export async function embedText(
  text: string,
  opts: { apiKey: string; model?: string; taskType: EmbeddingTaskType },
): Promise<number[]> {
  const model = opts.model || DEFAULT_EMBEDDING_MODEL;
  const url   = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type':   'application/json',
      'x-goog-api-key': opts.apiKey,
    },
    body: JSON.stringify({
      model:                `models/${model}`,
      content:              { parts: [{ text: text.slice(0, 8000) }] },
      taskType:             opts.taskType,
      outputDimensionality: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini embeddings ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  const data   = (await res.json()) as { embedding?: { values?: number[] } };
  const values = data.embedding?.values;

  if (!values || values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Embedding inválido: se esperaban ${EMBEDDING_DIMENSIONS} dimensiones, llegaron ${values?.length ?? 0}`);
  }
  if (values.every((v) => v === 0)) {
    throw new Error('Embedding inválido: vector cero');
  }

  return values;
}
