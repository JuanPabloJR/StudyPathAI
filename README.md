# 🎓 StudyPath AI

**Plataforma web para generación de rutas de aprendizaje personalizadas mediante RAG e Inteligencia Artificial**

> Proyecto de Tesis · Universidad de Colima · 2026

---

## ¿Qué es StudyPath AI?

StudyPath AI combina **Retrieval-Augmented Generation (RAG)** con el modelo de lenguaje **GROQ (openai/gpt-oss-120b)** para generar rutas de aprendizaje estructuradas, progresivas y adaptadas al perfil de cada estudiante.

El usuario ingresa su tema, nivel, objetivos y tiempo disponible; el sistema recupera contenido educativo verificado desde su base de conocimiento y genera un plan con módulos, recursos, actividades y tiempos estimados.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS + Vite |
| Estado | Zustand |
| Backend | NestJS 10 + TypeScript |
| ORM | Prisma 5 |
| Base de datos | PostgreSQL 16 + pgvector |
| LLM | GROQ openai/gpt-oss-120b |
| Embeddings | Google Gemini gemini-embedding-001 (768d, seed + consultas) |
| Auth | JWT + bcrypt |
| Contenedores | Docker + Docker Compose |

---

## Estructura del Proyecto

```
studypath-ai/
├── apps/
│   ├── api/                    # Backend NestJS
│   │   ├── src/
│   │   │   ├── main.ts         # Punto de entrada
│   │   │   ├── app.module.ts   # Módulo raíz
│   │   │   ├── auth/           # Registro, login, JWT
│   │   │   ├── users/          # Perfiles de usuario
│   │   │   ├── learning-paths/ # CRUD rutas + progreso
│   │   │   ├── rag/            # Pipeline RAG (núcleo del sistema)
│   │   │   ├── prisma/         # Servicio de base de datos
│   │   │   └── common/         # Filtros, interceptores
│   │   └── prisma/
│   │       ├── schema.prisma   # Modelo de datos
│   │       └── seed.ts         # Base de conocimiento inicial
│   │
│   └── web/                    # Frontend React
│       └── src/
│           ├── api/            # Cliente HTTP (axios)
│           ├── store/          # Estado global (Zustand)
│           ├── pages/          # Vistas de la aplicación
│           ├── components/     # Componentes reutilizables
│           └── types/          # Tipos TypeScript
│
├── docs/
│   ├── ARCHITECTURE.md         # Arquitectura del sistema
│   ├── API_PAYLOADS.md         # Ejemplos de requests/responses
│   └── SECURITY.md             # Consideraciones de seguridad
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## ⚡ Inicio Rápido

### Prerrequisitos
- Node.js 20+
- Docker Desktop
- Claves API: GROQ + Google AI (solo para seed)

### 1. Clonar y configurar entorno

```bash
git clone <repo>
cd studypath-ai
cp .env.example .env
# Editar .env con tus API keys
```

### 2. Levantar PostgreSQL con Docker

```bash
docker compose up postgres -d
```

### 3. Configurar e iniciar el backend

```bash
cd apps/api
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed       # Poblar base de conocimiento
npm run start:dev     # http://localhost:3001
```

### 4. Iniciar el frontend

```bash
cd apps/web
npm install
npm run dev           # http://localhost:5173
```

> `docker-compose.yml` solo define PostgreSQL. Para producción ver [Despliegue gratuito](#-despliegue-gratuito-vercel--render--neon).

---

## Pipeline RAG — Flujo Técnico

```
1. Usuario envía: { topic, level, objectives, timeAvailable, format }
        ↓
2. Backend genera embedding de la consulta con Gemini (gemini-embedding-001, 768d)
   (sin embedding disponible → se genera sin contexto recuperado)
        ↓
3. pgvector busca los 8 chunks más similares en knowledge_chunks
   usando similitud coseno (embedding <=> query_vector), con umbral RAG_MIN_SIMILARITY
        ↓
4. Se construye el prompt:
   - System: instrucciones de experto educativo + formato JSON
   - User:   perfil del estudiante + contexto recuperado (chunks)
        ↓
5. GROQ API (openai/gpt-oss-120b) genera la ruta estructurada en JSON
        ↓
6. El JSON se parsea y valida
        ↓
7. Prisma guarda LearningPath + Modules + Resources + Activities
        ↓
8. Frontend renderiza la ruta con módulos expandibles y progreso
```

---

## Endpoints de API

| Método | Endpoint | Descripción |
|--------|---------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Usuario actual |
| GET | `/api/users/profile` | Ver perfil |
| PATCH | `/api/users/profile` | Actualizar perfil |
| POST | `/api/learning-paths` | **Generar nueva ruta (RAG + LLM)** |
| GET | `/api/learning-paths` | Listar rutas del usuario |
| GET | `/api/learning-paths/stats` | Estadísticas del usuario |
| GET | `/api/learning-paths/:id` | Obtener ruta completa |
| PATCH | `/api/learning-paths/:pathId/modules/:moduleId/progress` | Actualizar progreso |
| POST | `/api/learning-paths/:id/regenerate` | Regenerar ruta |
| DELETE | `/api/learning-paths/:id` | Eliminar ruta |

📖 **Swagger UI:** `http://localhost:3001/api/docs` (modo desarrollo)

---

## Modelo de Datos

```
User
 ├── UserProfile           (1:1)
 ├── RefreshToken[]        (1:N)
 └── LearningPath[]        (1:N)
      └── Module[]         (1:N)
           ├── Resource[]  (1:N)
           ├── Activity[]  (1:N)
           └── ModuleProgress (1:1)

KnowledgeSource
 └── KnowledgeChunk[]      (1:N) — con vector embedding
```

---

## Plan de Implementación

| Etapa | Semanas | Contenido |
|-------|---------|-----------|
| 1 | 1-2 | Infraestructura: Docker, DB, Auth, Prisma |
| 2 | 3-4 | Pipeline RAG: embeddings (Gemini), pgvector, Groq |
| 3 | 5-6 | CRUD rutas, progreso, regeneración |
| 4 | 7-8 | Frontend completo (React + Tailwind) |
| 5 | 9-10 | QA, seguridad, despliegue, documentación |

---

## 🚀 Despliegue gratuito (Vercel + Render + Neon)

| Pieza | Servicio | Plan |
|-------|----------|------|
| Frontend (React) | [Vercel](https://vercel.com) | Hobby (gratis) |
| API (NestJS, Docker) | [Render](https://render.com) | Free web service |
| PostgreSQL + pgvector | [Neon](https://neon.tech) | Free |

> Render apaga la API tras ~15 min sin tráfico; la primera petición después tarda 30-60 s en despertar.

### 1. Base de datos (Neon)

1. Crear proyecto en Neon, región **AWS us-east-2 (Ohio)**.
2. Copiar la cadena de conexión **sin pooler** (desactivar *Connection pooling*). Debe terminar en `?sslmode=require`.
3. No hace falta crear la extensión `vector` a mano: la primera migración ejecuta `CREATE EXTENSION IF NOT EXISTS "vector"`.

### 2. API (Render)

1. Render → **New → Blueprint** → seleccionar este repositorio. Render lee `render.yaml`.
2. Capturar las variables pedidas: `DATABASE_URL` (Neon), `GROQ_API_KEY`, `GOOGLE_AI_API_KEY` y `CORS_ORIGIN` (URL de Vercel; si aún no la tienes, pon un valor temporal y actualízala en el paso 4).
3. Render construye `apps/api/Dockerfile`. Al arrancar, el contenedor ejecuta `prisma migrate deploy`. En cada `git push` a `main` se redespliega solo.
4. Verificar: `https://<tu-api>.onrender.com/health` → `{"status":"ok"}`.

### 3. Seed de la base de conocimiento (una sola vez)

Desde tu máquina, en `apps/api`, apuntando a Neon:

```bash
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require" npm run db:seed
```

### 4. Frontend (Vercel)

1. Vercel → **Add New → Project** → importar el repositorio.
2. **Root Directory**: `apps/web` (Vercel detecta Vite; `vercel.json` agrega el rewrite para las rutas de React Router).
3. Variable de entorno: `VITE_API_URL=https://<tu-api>.onrender.com/api`.
4. Deploy. Copiar la URL final (`https://<proyecto>.vercel.app`) a `CORS_ORIGIN` en Render y redesplegar la API.

---

## Documentación Adicional

- 📐 [Arquitectura detallada](docs/ARCHITECTURE.md)
- 📋 [Ejemplos de API](docs/API_PAYLOADS.md)
- 🔒 [Seguridad y validación](docs/SECURITY.md)

---

## Autor

**Juan Ramírez Cruz**  
Universidad de Colima — Tesis de Licenciatura  
Ingeniería en Sistemas Computacionales · 2026

Asesor: [Nombre del asesor]
