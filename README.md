# 🎓 StudyPath AI

**Plataforma web para generación de rutas de aprendizaje personalizadas mediante RAG e Inteligencia Artificial**

> Proyecto de Tesis · Universidad de Colima · 2026

---

## ¿Qué es StudyPath AI?

StudyPath AI combina **Retrieval-Augmented Generation (RAG)** con el modelo de lenguaje **GROQ (llama-3.3-70b-versatile)** para generar rutas de aprendizaje estructuradas, progresivas y adaptadas al perfil de cada estudiante.

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
| LLM | GROQ llama-3.3-70b-versatile |
| Embeddings | Google Gemini text-embedding-004 (768d, solo seed) |
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

### Con Docker Compose (producción)

```bash
cp .env.example .env   # Configurar todas las variables
docker compose up -d   # Levanta postgres + api + web
```

---

## Pipeline RAG — Flujo Técnico

```
1. Usuario envía: { topic, level, objectives, timeAvailable, format }
        ↓
2. Backend genera embedding de la consulta
   (vector-cero como fallback — GROQ no tiene API de embeddings)
        ↓
3. pgvector busca los 8 chunks más similares en knowledge_chunks
   usando similitud coseno: embedding <=> query_vector
        ↓
4. Se construye el prompt:
   - System: instrucciones de experto educativo + formato JSON
   - User:   perfil del estudiante + contexto recuperado (chunks)
        ↓
5. GROQ API (llama-3.3-70b-versatile) genera la ruta estructurada en JSON
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
| 2 | 3-4 | Pipeline RAG: embeddings, pgvector, Claude |
| 3 | 5-6 | CRUD rutas, progreso, regeneración |
| 4 | 7-8 | Frontend completo (React + Tailwind) |
| 5 | 9-10 | QA, seguridad, despliegue, documentación |

---

## 🚀 Deploy en Railway (solo el backend)

Railway auto-despliega el backend en cada `git push`.

### Pasos

1. Crear cuenta en [railway.app](https://railway.app) y conectar tu cuenta de GitHub
2. **New Project → Deploy from GitHub repo** → seleccionar este repositorio
3. En la configuración del servicio, cambiar **Root Directory** a `apps/api`
4. Agregar un servicio de **PostgreSQL** (Railway lo inyecta como `DATABASE_URL` automáticamente)
5. En **Variables**, agregar:

```
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
GOOGLE_AI_API_KEY=AIzaSy...     # solo si vas a correr el seed en Railway
JWT_SECRET=un-secreto-seguro-de-al-menos-32-caracteres
JWT_EXPIRES_IN=7d
NODE_ENV=production
CORS_ORIGIN=https://tu-frontend.vercel.app
```

> `DATABASE_URL` y `PORT` los inyecta Railway automáticamente — no los pongas a mano.

6. Railway detecta el `Dockerfile` y construye. En cada `git push` a `main` se redespliega solo.

### Después del primer deploy

El seed (base de conocimiento con embeddings de Google) se corre **una sola vez** de forma manual:

```bash
# Desde tu máquina local, con las variables apuntando a la DB de Railway
DATABASE_URL="postgresql://..." npx ts-node prisma/seed.ts
```

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
