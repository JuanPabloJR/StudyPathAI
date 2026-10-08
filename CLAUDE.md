# StudyPath AI — Instrucciones del proyecto

Tesis (Universidad de Colima, 2026). Genera rutas de aprendizaje personalizadas con RAG + LLM (Groq).

## Stack
- Monorepo sin workspaces: `apps/api` (NestJS 10 + Prisma 5) y `apps/web` (React 18 + Vite 5 + Tailwind + Zustand). Cada app tiene su propio `package.json` y `package-lock.json`.
- PostgreSQL 16 + pgvector (imagen `pgvector/pgvector:pg16`).
- LLM: `groq-sdk`, modelo `llama-3.3-70b-versatile`, `response_format: json_object`.
- Embeddings: Gemini `gemini-embedding-001` a 768 dims vía REST (`src/rag/embeddings.ts`), compartido por `prisma/seed.ts` (documentos) y `RagService.embedQuery` (consultas). Sin `GOOGLE_AI_API_KEY` la ruta se genera sin contexto. Nunca usar vectores cero: pgvector da similitud NaN.
- Auth: JWT (passport-jwt) + bcrypt (12 rounds). Token en `localStorage` en el frontend.
- Solo entorno local. `apps/api/Dockerfile` y `apps/api/railway.json` quedan de un deploy anterior en Railway que ya no se usa.

## Comandos
Backend (`apps/api`):
- `docker compose up postgres -d` (desde la raíz; el compose solo define postgres)
- `npm run start:dev` — API en http://localhost:3001/api, Swagger en `/api/docs` (fuera de producción)
- `npm run db:migrate` / `npm run db:seed` / `npm run db:studio`
- `npm test` — Jest, archivos `*.spec.ts` junto al código en `src/`
- `npm run build` — salida en `dist/src/main.js` (no `dist/main.js`)

Frontend (`apps/web`):
- `npm run dev` — http://localhost:5173
- `npm run build` — `tsc && vite build`

## Estructura backend
- `src/main.ts` — bootstrap: helmet, CORS, prefijo `api`, `ValidationPipe` (whitelist + forbidNonWhitelisted), filtro e interceptor globales, `/health`.
- `src/<feature>/` — módulo Nest por dominio: `auth`, `users`, `learning-paths`, `rag`, `prisma`.
- `src/common/` — `HttpExceptionFilter` (forma de error `{ success: false, statusCode, message, ... }`) y `TransformInterceptor` (envuelve respuestas exitosas).
- `prisma/schema.prisma` — fuente de verdad del modelo. Tablas en snake_case vía `@@map`/`@map`.

## Convenciones
- Archivos kebab-case con sufijo de rol: `*.service.ts`, `*.controller.ts`, `*.module.ts`, `dto/*.dto.ts`.
- DTOs con `class-validator`; controladores protegidos con `@UseGuards(JwtAuthGuard)`.
- Errores: lanzar excepciones HTTP de Nest (`NotFoundException`, `ForbiddenException`, `BadGatewayException`). No devolver objetos de error manuales.
- Verificar pertenencia del recurso al usuario (`userId`) en cada consulta de servicio.
- Comentarios y mensajes al usuario en español.
- Commits: Conventional Commits (`fix:`, `feat:`) en inglés o español.

## Cuidado
- Nunca commitear `.env`; usar `.env.example` como plantilla.
- `POST /api/learning-paths` llama al LLM de forma síncrona (varios segundos, consume cuota de Groq).
