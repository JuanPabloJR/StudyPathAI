# StudyPath AI — Arquitectura del Sistema

## Visión General

StudyPath AI es una plataforma web que genera rutas de aprendizaje personalizadas
mediante Retrieval-Augmented Generation (RAG). El sistema combina recuperación
semántica de contenido educativo con un LLM para producir planes estructurados
y adaptados al perfil de cada usuario.

---

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                         │
│                                                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │            React + TypeScript + Tailwind CSS             │   │
│   │   Landing · Login · Dashboard · PathForm · PathDetail    │   │
│   └──────────────────────────┬──────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                               │ HTTPS / REST API
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (NestJS + Node.js)                   │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌─────────────┐  ┌────────────┐  │
│  │   Auth   │  │  Users   │  │  Learning   │  │    RAG     │  │
│  │  Module  │  │  Module  │  │   Paths     │  │  Module    │  │
│  │          │  │          │  │   Module    │  │            │  │
│  │ /register│  │ /profile │  │ /paths      │  │ /embed     │  │
│  │ /login   │  │ /me      │  │ /paths/:id  │  │ /search    │  │
│  └────┬─────┘  └────┬─────┘  └──────┬──────┘  └─────┬──────┘  │
│       │              │               │                │          │
│  ┌────┴──────────────┴───────────────┘                │          │
│  │              JWT Guard + Guards                     │          │
│  └─────────────────────────────────────────────────   │          │
│                                                        │          │
│  ┌─────────────────────────────────────────────────┐  │          │
│  │              Prisma ORM                          │  │          │
│  └──────────────────────┬──────────────────────────┘  │          │
│                          │                              │          │
└─────────────────────────┼──────────────────────────────┼─────────┘
                           │                              │
           ┌───────────────┘              ┌───────────────┘
           ▼                              ▼
┌──────────────────┐          ┌──────────────────────────┐
│   PostgreSQL     │          │   RAG Pipeline           │
│   + pgvector     │          │                          │
│                  │          │  1. Embed query          │
│  Users           │          │     (vector-cero/fallback)│
│  UserProfiles    │          │  2. Retrieve top-K docs  │
│  LearningPaths   │◄─────────│     from KnowledgeBase   │
│  Modules         │          │  3. Build prompt         │
│  Resources       │          │  4. Call GROQ API        │
│  Activities      │          │  5. Parse + save path    │
│  Progress        │          │                          │
│  KnowledgeChunks │          │  ┌────────────────────┐  │
│  (vector store)  │          │  │   GROQ             │  │
└──────────────────┘          │  │   llama-3.3-70b    │  │
                              │  └────────────────────┘  │
                              └──────────────────────────┘
```

---

## Componentes Principales

### 1. Frontend (React SPA)
| Página | Descripción |
|--------|-------------|
| Landing | Presentación del sistema, CTA de registro |
| Login / Register | Autenticación de usuarios |
| Dashboard | Resumen de rutas activas + métricas de progreso |
| NewPath | Formulario de captura de perfil de aprendizaje |
| PathDetail | Vista detallada de la ruta con módulos y progreso |
| Profile | Gestión del perfil de usuario |

### 2. Backend (NestJS)
| Módulo | Responsabilidad |
|--------|----------------|
| AuthModule | Registro, login, JWT |
| UsersModule | Perfil de usuario, preferencias |
| LearningPathsModule | CRUD de rutas, progreso |
| RagModule | Embedding, búsqueda semántica, generación |
| PrismaModule | Capa de acceso a datos |

### 3. RAG Pipeline
```
Query → Embedding → Vector Search → Context Assembly → LLM → Structured Path
```

---

## Modelo de Datos

```
User ──── UserProfile
  │
  └──── LearningPath ──── Module ──── Resource
                    │              └── Activity
                    │              └── Progress
                    └── (regenerations log)
```

---

## Flujo RAG Detallado

```
1. Usuario envía: { topic, level, objectives, timeAvailable, format, specialNeeds }

2. RagService.generatePath():
   a. Construir query de búsqueda: "<topic> <level> <objectives>"
   b. Embeddings: vector-cero float[768] (fallback — GROQ no tiene API de embeddings)
      * Los chunks en DB fueron embebidos con Google Gemini text-embedding-004 (solo en seed)
   c. pgvector similarity search: SELECT chunks ORDER BY embedding <=> $1 LIMIT 10
   d. Construir prompt con:
      - System: rol de experto educativo + instrucciones de formato JSON
      - User: perfil del estudiante + contexto recuperado
   e. Claude API: POST /v1/messages → texto estructurado
   f. Parsear JSON de la respuesta → Modules[]
   g. Prisma: crear LearningPath + Modules + Resources + Activities
   h. Retornar path completo al frontend

3. Frontend renderiza módulos progresivos con barra de avance
```

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React + TypeScript | 18.x |
| Estilos | Tailwind CSS | 3.x |
| Build | Vite | 5.x |
| Estado | Zustand | 4.x |
| Backend | NestJS + TypeScript | 10.x |
| ORM | Prisma | 5.x |
| Base de datos | PostgreSQL + pgvector | 16.x |
| Auth | JWT + bcrypt | — |
| LLM | GROQ llama-3.3-70b-versatile | — |
| Embeddings | Google Gemini text-embedding-004 (768d, solo seed) | — |
| Contenedor | Docker + Docker Compose | — |

---

## Plan de Implementación por Etapas

### Etapa 1 — Infraestructura (Semana 1-2)
- [ ] Setup monorepo (apps/api, apps/web)
- [ ] Docker Compose (PostgreSQL + pgvector)
- [ ] Prisma schema + migraciones
- [ ] Auth (registro, login, JWT)
- [ ] Endpoints básicos de usuarios

### Etapa 2 — Pipeline RAG (Semana 3-4)
- [ ] Integración Google Gemini Embeddings (text-embedding-004, seed)
- [ ] Población de knowledge base (seed)
- [ ] pgvector similarity search
- [ ] Integración Claude API
- [ ] Prompt engineering para rutas estructuradas
- [ ] Parser JSON de respuestas LLM

### Etapa 3 — Learning Paths (Semana 5-6)
- [ ] CRUD de rutas de aprendizaje
- [ ] Módulos + recursos + actividades
- [ ] Tracking de progreso
- [ ] Regeneración de rutas

### Etapa 4 — Frontend (Semana 7-8)
- [ ] Layout + navegación
- [ ] Formulario de nueva ruta
- [ ] Vista de ruta con módulos
- [ ] Dashboard con métricas
- [ ] Perfil de usuario

### Etapa 5 — QA y Despliegue (Semana 9-10)
- [ ] Pruebas unitarias e integración
- [ ] Variables de entorno + secretos
- [ ] Docker production build
- [ ] Documentación API (Swagger)
- [ ] Demo y evaluación
