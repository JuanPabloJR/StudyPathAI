-- Habilitar pgvector para búsqueda semántica
CREATE EXTENSION IF NOT EXISTS vector;

-- Nota: el índice HNSW se crea en el seed después de que Prisma genere las tablas.
-- Dimensión: 768 (Gemini text-embedding-004)
SELECT 'pgvector extension enabled — dim=768 (Gemini text-embedding-004)' AS status;
