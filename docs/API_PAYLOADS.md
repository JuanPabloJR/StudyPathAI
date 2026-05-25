# StudyPath AI — Ejemplos de Payloads de la API

Base URL: `http://localhost:3001/api`

---

## 🔐 Autenticación

### POST `/api/auth/register`
**Request:**
```json
{
  "name": "Juan Ramírez Cruz",
  "email": "juan@ucol.mx",
  "password": "Segura123!"
}
```
**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clr7x2abc0001defg",
      "email": "juan@ucol.mx",
      "name": "Juan Ramírez Cruz",
      "createdAt": "2026-05-24T18:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### POST `/api/auth/login`
**Request:**
```json
{
  "email": "juan@ucol.mx",
  "password": "Segura123!"
}
```
**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clr7x2abc0001defg",
      "email": "juan@ucol.mx",
      "name": "Juan Ramírez Cruz",
      "profile": {
        "weeklyHours": 5,
        "preferredFormats": ["MIXED"],
        "learningStyle": "visual"
      }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### GET `/api/auth/me`
**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "clr7x2abc0001defg",
    "email": "juan@ucol.mx",
    "name": "Juan Ramírez Cruz",
    "isVerified": false,
    "createdAt": "2026-05-24T18:00:00.000Z",
    "profile": {
      "bio": "Estudiante de ingeniería en sistemas",
      "occupation": "Estudiante",
      "preferredFormats": ["MIXED", "VIDEO"],
      "learningStyle": "visual",
      "weeklyHours": 10
    },
    "_count": { "learningPaths": 3 }
  }
}
```

---

## 🗺️ Rutas de Aprendizaje

### POST `/api/learning-paths`
Genera una nueva ruta de aprendizaje con RAG + Claude.

**Headers:** `Authorization: Bearer <token>`

**Request — Ejemplo 1 (Python para ML):**
```json
{
  "topic": "Machine Learning con Python",
  "level": "BEGINNER",
  "objectives": [
    "Comprender los fundamentos del aprendizaje automático supervisado",
    "Usar scikit-learn para entrenar modelos de clasificación",
    "Evaluar y mejorar el rendimiento de modelos predictivos"
  ],
  "timeAvailable": 30,
  "format": "MIXED",
  "specialNeeds": "Prefiero muchos ejemplos prácticos con código real"
}
```

**Request — Ejemplo 2 (Desarrollo Web):**
```json
{
  "topic": "Desarrollo Web Full Stack con React y Node.js",
  "level": "INTERMEDIATE",
  "objectives": [
    "Crear una API REST con Express y autenticación JWT",
    "Construir un frontend con React Hooks y Context API",
    "Desplegar la aplicación con Docker"
  ],
  "timeAvailable": 50,
  "format": "PROJECT_BASED"
}
```

**Request — Ejemplo 3 (Matemáticas, necesidades especiales):**
```json
{
  "topic": "Cálculo diferencial e integral",
  "level": "BEGINNER",
  "objectives": [
    "Entender el concepto de límite y continuidad",
    "Calcular derivadas usando las reglas básicas",
    "Resolver integrales indefinidas simples"
  ],
  "timeAvailable": 40,
  "format": "VIDEO",
  "specialNeeds": "Tengo dificultades con la abstracción matemática. Prefiero ejemplos visuales y aplicaciones del mundo real. Necesito ir más despacio en cada concepto."
}
```

**Response 201 (estructura abreviada):**
```json
{
  "success": true,
  "data": {
    "id": "clr8y3bcd0002efgh",
    "title": "Machine Learning con Python: De Cero a Predictor",
    "topic": "Machine Learning con Python",
    "level": "BEGINNER",
    "objectives": [
      "Comprender los fundamentos del aprendizaje automático supervisado",
      "Usar scikit-learn para entrenar modelos de clasificación",
      "Evaluar y mejorar el rendimiento de modelos predictivos"
    ],
    "timeAvailable": 30,
    "format": "MIXED",
    "status": "ACTIVE",
    "totalModules": 6,
    "estimatedHours": 30,
    "version": 1,
    "createdAt": "2026-05-24T18:05:00.000Z",
    "modules": [
      {
        "id": "mod001",
        "order": 1,
        "title": "Fundamentos de Python para Ciencia de Datos",
        "objective": "Al completar este módulo, el estudiante podrá usar NumPy y Pandas para manipular datos numéricos y tablas.",
        "description": "Introducción a las bibliotecas esenciales del ecosistema científico de Python.",
        "content": "Python se ha convertido en el lenguaje estándar para Machine Learning gracias a su ecosistema de bibliotecas científicas...",
        "estimatedTime": 180,
        "tips": [
          "Practica en Google Colab para no necesitar instalación local",
          "Los ejercicios del tutorial oficial de NumPy son excelentes para consolidar",
          "Usa pandas-profiling para explorar datasets rápidamente"
        ],
        "resources": [
          {
            "id": "res001",
            "title": "Tutorial oficial de NumPy",
            "url": "https://numpy.org/doc/stable/user/quickstart.html",
            "type": "DOCUMENTATION",
            "description": "Guía de inicio rápido con ejercicios interactivos",
            "author": "NumPy Community",
            "isFree": true,
            "order": 0
          },
          {
            "id": "res002",
            "title": "Pandas en 10 minutos",
            "url": "https://pandas.pydata.org/docs/user_guide/10min.html",
            "type": "TUTORIAL",
            "description": "Introducción práctica a DataFrames y Series",
            "author": "Pandas Development Team",
            "isFree": true,
            "order": 1
          }
        ],
        "activities": [
          {
            "id": "act001",
            "title": "Exploración de dataset con Pandas",
            "description": "Descarga el dataset Titanic de Kaggle y realiza un análisis exploratorio básico: carga el CSV, muestra las primeras 10 filas, calcula estadísticas descriptivas y visualiza la distribución de edades.",
            "type": "EXERCISE",
            "durationMin": 45,
            "order": 1
          }
        ],
        "progress": {
          "id": "prog001",
          "moduleId": "mod001",
          "completed": false,
          "timeSpent": 0
        }
      }
    ],
    "stats": {
      "totalModules": 6,
      "completedModules": 0,
      "percent": 0,
      "totalTimeSpentMin": 0,
      "estimatedRemainingMin": 1800
    }
  }
}
```

---

### GET `/api/learning-paths`
Lista todas las rutas del usuario.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clr8y3bcd0002efgh",
      "title": "Machine Learning con Python: De Cero a Predictor",
      "topic": "Machine Learning con Python",
      "level": "BEGINNER",
      "format": "MIXED",
      "status": "ACTIVE",
      "estimatedHours": 30,
      "version": 1,
      "createdAt": "2026-05-24T18:05:00.000Z",
      "progress": {
        "totalModules": 6,
        "completedModules": 2,
        "percent": 33
      }
    },
    {
      "id": "clr9z4cde0003fghi",
      "title": "Desarrollo Web Full Stack Moderno",
      "topic": "Desarrollo Web Full Stack con React y Node.js",
      "level": "INTERMEDIATE",
      "format": "PROJECT_BASED",
      "status": "COMPLETED",
      "estimatedHours": 50,
      "version": 2,
      "createdAt": "2026-05-20T10:00:00.000Z",
      "progress": {
        "totalModules": 8,
        "completedModules": 8,
        "percent": 100
      }
    }
  ]
}
```

---

### GET `/api/learning-paths/stats`
**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalPaths": 3,
    "completedPaths": 1,
    "activePaths": 2,
    "totalTimeSpentMin": 840
  }
}
```

---

### PATCH `/api/learning-paths/:pathId/modules/:moduleId/progress`
Actualiza el progreso de un módulo.

**Request — Marcar como completado:**
```json
{
  "completed": true,
  "score": 90,
  "timeSpent": 165,
  "notes": "Muy buen recurso de NumPy. El ejercicio del Titanic fue desafiante pero muy útil."
}
```

**Request — Solo registrar tiempo:**
```json
{
  "timeSpent": 30
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "prog001",
    "moduleId": "mod001",
    "completed": true,
    "completedAt": "2026-05-24T20:15:00.000Z",
    "score": 90,
    "timeSpent": 165,
    "notes": "Muy buen recurso de NumPy..."
  }
}
```

---

### POST `/api/learning-paths/:id/regenerate`
Regenera la ruta con ajustes opcionales.

**Request:**
```json
{
  "adjustments": "Quiero más énfasis en deep learning y menos en estadística clásica. También me gustaría un módulo dedicado a transformers."
}
```

**Response 201:** (misma estructura que POST `/api/learning-paths`)

---

## 👤 Usuarios

### PATCH `/api/users/profile`
**Request:**
```json
{
  "name": "Juan Ramírez Cruz",
  "bio": "Estudiante de Ingeniería en Sistemas Computacionales. Apasionado por la IA aplicada.",
  "occupation": "Estudiante universitario",
  "learningStyle": "visual-kinestésico",
  "weeklyHours": 15,
  "preferredFormats": ["VIDEO", "PROJECT_BASED"]
}
```

**Response 200:** Usuario con perfil actualizado.

---

## ❌ Errores Comunes

### 400 — Validación fallida
```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2026-05-24T18:00:00.000Z",
  "path": "/api/learning-paths",
  "message": ["timeAvailable must not be less than 2", "objectives must contain at least 1 elements"]
}
```

### 401 — No autenticado
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Token inválido"
}
```

### 409 — Conflicto (email duplicado)
```json
{
  "success": false,
  "statusCode": 409,
  "message": "Ya existe una cuenta con este correo electrónico"
}
```

### 502 — Error de IA
```json
{
  "success": false,
  "statusCode": 502,
  "message": "Error al generar la ruta de aprendizaje con IA"
}
```
