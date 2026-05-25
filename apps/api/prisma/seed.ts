/**
 * Seed: Poblar la base de conocimiento con fuentes educativas verificadas.
 * Ejecutar: npx ts-node prisma/seed.ts
 *
 * Usa Google Gemini para embeddings (text-embedding-004, 768 dims, GRATIS)
 * API key: https://aistudio.google.com/app/apikey
 */
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();
const genAI  = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// ─── Fuentes de conocimiento verificadas ─────────────────────────────────────
const KNOWLEDGE_SOURCES = [
  // Programación
  {
    title: 'Introducción a la Programación con Python',
    topic: 'programacion',
    subtopics: ['python', 'variables', 'funciones', 'bucles', 'condicionales'],
    level: 'BEGINNER',
    format: 'TEXT',
    author: 'Python Software Foundation',
    url: 'https://docs.python.org/es/3/tutorial/',
    description: 'Tutorial oficial de Python para principiantes',
    chunks: [
      {
        content: `Python es un lenguaje de programación interpretado de alto nivel.
        Sus características principales incluyen: sintaxis clara y legible, tipado dinámico,
        gestión automática de memoria y una extensa biblioteca estándar.
        Para comenzar con Python, se recomienda instalar Python 3.x desde python.org y
        utilizar un entorno virtual (venv) para gestionar dependencias.
        Los conceptos fundamentales incluyen: variables y tipos de datos (int, str, list, dict, tuple),
        estructuras de control (if/elif/else, for, while), funciones (def),
        módulos e importaciones, y manejo de errores (try/except).`,
        metadata: { topic: 'python', level: 'BEGINNER', subtopic: 'introduccion' }
      },
      {
        content: `Programación Orientada a Objetos en Python: Las clases permiten crear tipos
        de datos personalizados con atributos y métodos. Conceptos clave:
        - Clase: plantilla para crear objetos (class MiClase:)
        - Objeto/Instancia: ejemplar concreto de una clase
        - __init__: método constructor
        - self: referencia a la instancia actual
        - Herencia: class Hija(Madre): permite reutilizar código
        - Encapsulamiento: _ prefijo para atributos "privados"
        - Polimorfismo: mismo método, comportamientos distintos según la clase
        Ejemplo práctico: modelar un sistema de biblioteca con clases Libro, Usuario y Préstamo.`,
        metadata: { topic: 'python', level: 'INTERMEDIATE', subtopic: 'poo' }
      },
      {
        content: `Estructuras de datos en Python:
        Listas: colecciones ordenadas y mutables. list.append(), list.sort(), list comprehensions [x*2 for x in lista].
        Diccionarios: pares clave-valor. dict.get(), dict.items(), dict comprehensions.
        Conjuntos (sets): elementos únicos, operaciones de conjuntos (unión, intersección).
        Tuplas: colecciones inmutables, útiles para datos que no cambian.
        Pilas y colas: implementadas con listas o collections.deque.
        Algoritmos de búsqueda: lineal O(n), binaria O(log n).
        Algoritmos de ordenamiento: bubble sort O(n²), merge sort O(n log n), quicksort O(n log n) promedio.`,
        metadata: { topic: 'python', level: 'INTERMEDIATE', subtopic: 'estructuras_datos' }
      }
    ]
  },
  // Matemáticas
  {
    title: 'Cálculo Diferencial e Integral',
    topic: 'matematicas',
    subtopics: ['calculo', 'derivadas', 'integrales', 'limites'],
    level: 'INTERMEDIATE',
    format: 'TEXT',
    author: 'Khan Academy',
    url: 'https://es.khanacademy.org/math/calculus-1',
    description: 'Fundamentos de cálculo diferencial e integral',
    chunks: [
      {
        content: `Límites: fundamento del cálculo. Un límite describe el comportamiento de una función
        cuando la variable se acerca a un valor. lim(x→a) f(x) = L significa que f(x) se aproxima a L
        cuando x se aproxima a a. Reglas importantes:
        - Límite de suma: lim(f+g) = lim(f) + lim(g)
        - Límite de producto: lim(f·g) = lim(f)·lim(g)
        - Regla de L'Hôpital: para formas indeterminadas 0/0 o ∞/∞
        - Continuidad: f es continua en a si lim(x→a)f(x) = f(a)
        Aplicaciones: velocidad instantánea, tasa de cambio, análisis de funciones.`,
        metadata: { topic: 'calculo', level: 'INTERMEDIATE', subtopic: 'limites' }
      },
      {
        content: `Derivadas: miden la tasa de cambio instantánea. f'(x) = lim(h→0) [f(x+h)-f(x)]/h.
        Reglas de derivación:
        - Potencia: d/dx[xⁿ] = n·xⁿ⁻¹
        - Suma: d/dx[f+g] = f' + g'
        - Producto: d/dx[f·g] = f'g + fg'
        - Cociente: d/dx[f/g] = (f'g - fg')/g²
        - Cadena: d/dx[f(g(x))] = f'(g(x))·g'(x)
        Derivadas de funciones comunes: sin'(x)=cos(x), cos'(x)=-sin(x), eˣ'=eˣ, ln'(x)=1/x.
        Aplicaciones: máximos y mínimos (f'(x)=0), velocidad/aceleración, optimización.`,
        metadata: { topic: 'calculo', level: 'INTERMEDIATE', subtopic: 'derivadas' }
      }
    ]
  },
  // Inteligencia Artificial
  {
    title: 'Machine Learning Fundamentos',
    topic: 'inteligencia_artificial',
    subtopics: ['machine_learning', 'redes_neuronales', 'deep_learning', 'nlp'],
    level: 'INTERMEDIATE',
    format: 'MIXED',
    author: 'Google ML Crash Course',
    url: 'https://developers.google.com/machine-learning/crash-course',
    description: 'Fundamentos de aprendizaje automático aplicado',
    chunks: [
      {
        content: `Machine Learning (ML) es un subcampo de la IA donde los sistemas aprenden de datos sin
        ser explícitamente programados. Tipos principales:
        1. Aprendizaje Supervisado: datos etiquetados, predice salidas.
           - Clasificación: predice categorías (spam/no spam)
           - Regresión: predice valores continuos (precio de casa)
           - Algoritmos: regresión lineal/logística, árboles de decisión, SVM, k-NN
        2. Aprendizaje No Supervisado: sin etiquetas, encuentra patrones.
           - Clustering: k-means, DBSCAN
           - Reducción de dimensionalidad: PCA, t-SNE
        3. Aprendizaje por Refuerzo: agente aprende por prueba y error con recompensas.
        Proceso general: recolección de datos → preprocesamiento → selección de modelo →
        entrenamiento → evaluación → ajuste → despliegue.`,
        metadata: { topic: 'machine_learning', level: 'BEGINNER', subtopic: 'introduccion' }
      },
      {
        content: `Redes Neuronales Artificiales: inspiradas en el cerebro humano.
        Componentes: neuronas artificiales (nodos), capas (entrada, ocultas, salida), pesos y sesgos.
        Funcionamiento: entrada → suma ponderada → función de activación → salida.
        Funciones de activación: ReLU (max(0,x)), Sigmoid (1/(1+e⁻ˣ)), Tanh, Softmax.
        Backpropagation: algoritmo que ajusta pesos mediante gradiente descendente.
        Deep Learning: redes con múltiples capas ocultas que aprenden representaciones jerárquicas.
        Tipos de redes: CNN (imágenes), RNN/LSTM (secuencias), Transformer (NLP/visión).
        Frameworks: TensorFlow, PyTorch, Keras.
        Hiperparámetros: tasa de aprendizaje, batch size, número de épocas, arquitectura.`,
        metadata: { topic: 'machine_learning', level: 'INTERMEDIATE', subtopic: 'redes_neuronales' }
      },
      {
        content: `Large Language Models (LLMs) y NLP Moderno:
        Transformer: arquitectura base para GPT, BERT, Claude, etc.
        Mecanismo de atención (Attention): permite al modelo enfocarse en partes relevantes del texto.
        Pre-entrenamiento: el modelo aprende representaciones generales del lenguaje.
        Fine-tuning: ajuste del modelo para tareas específicas.
        Prompt Engineering: diseño de instrucciones efectivas para LLMs.
        RAG (Retrieval-Augmented Generation): combina recuperación de información con generación.
        Ventajas RAG: reduce alucinaciones, permite conocimiento actualizado, más eficiente que fine-tuning.
        Embeddings: representaciones vectoriales del texto que capturan significado semántico.
        Búsqueda semántica: encontrar documentos similares por significado, no por palabras exactas.`,
        metadata: { topic: 'inteligencia_artificial', level: 'ADVANCED', subtopic: 'llms_rag' }
      }
    ]
  },
  // Desarrollo Web
  {
    title: 'Desarrollo Web Full Stack Moderno',
    topic: 'desarrollo_web',
    subtopics: ['html', 'css', 'javascript', 'react', 'nodejs', 'apis'],
    level: 'BEGINNER',
    format: 'PROJECT_BASED',
    author: 'MDN Web Docs',
    url: 'https://developer.mozilla.org/es/',
    description: 'Guía completa de desarrollo web moderno',
    chunks: [
      {
        content: `HTML5 y CSS3: fundamentos del desarrollo web.
        HTML define la estructura: etiquetas semánticas (<header>, <nav>, <main>, <section>, <article>, <footer>),
        formularios (<form>, <input>, <select>), multimedia (<img>, <video>, <canvas>).
        CSS define el estilo: selectores, box model (margin, border, padding, content),
        Flexbox: diseño flexible en una dimensión (display:flex, justify-content, align-items).
        CSS Grid: diseño en dos dimensiones (display:grid, grid-template-columns/rows).
        Responsive Design: media queries (@media), unidades relativas (%, em, rem, vw, vh).
        CSS Variables: --mi-color: #3b82f6; usar: color: var(--mi-color).
        Animaciones: @keyframes, transition, animation.`,
        metadata: { topic: 'desarrollo_web', level: 'BEGINNER', subtopic: 'html_css' }
      },
      {
        content: `JavaScript moderno (ES6+): lenguaje de programación de la web.
        let/const vs var, arrow functions, template literals, destructuring, spread operator.
        Promesas y async/await para código asíncrono.
        Fetch API para peticiones HTTP: fetch(url).then(r => r.json()).
        DOM manipulation: document.querySelector(), addEventListener(), classList.
        Módulos ES6: import/export.
        React: biblioteca para interfaces de usuario basadas en componentes.
        - Componentes funcionales + Hooks (useState, useEffect, useContext, useReducer)
        - Props: datos que fluyen de padre a hijo
        - Estado: datos que cambian y re-renderizan el componente
        - Virtual DOM: React actualiza sólo lo que cambió
        - React Router: navegación sin recargar la página`,
        metadata: { topic: 'desarrollo_web', level: 'INTERMEDIATE', subtopic: 'javascript_react' }
      },
      {
        content: `Backend con Node.js y APIs REST:
        Node.js: runtime de JavaScript del lado del servidor, basado en el motor V8.
        Express.js: framework minimalista para crear servidores HTTP.
        NestJS: framework empresarial con decoradores, módulos y DI (Dependency Injection).
        REST API: arquitectura basada en recursos, métodos HTTP (GET, POST, PUT, PATCH, DELETE).
        HTTP Status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error.
        Autenticación JWT: JSON Web Tokens para sesiones stateless.
        Base de datos: PostgreSQL (relacional), MongoDB (NoSQL), Redis (caché/sesiones).
        ORM: Prisma, TypeORM, Sequelize para abstraer consultas SQL.
        Docker: contenedores para empaquetar aplicaciones con sus dependencias.`,
        metadata: { topic: 'desarrollo_web', level: 'INTERMEDIATE', subtopic: 'backend_nodejs' }
      }
    ]
  }
];

// ─── Función para obtener embeddings con Gemini ───────────────────────────────
async function getEmbedding(text: string): Promise<number[]> {
  const model  = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(text.slice(0, 8000));
  return result.embedding.values;  // 768 dimensiones
}

// ─── Función principal de seed ────────────────────────────────────────────────
async function main() {
  console.log('🌱 Iniciando seed de la base de conocimiento...\n');

  // Habilitar pgvector
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`);
  console.log('✅ Extensión pgvector habilitada');

  // Índice HNSW para búsqueda vectorial eficiente (768 dims, Gemini)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
    ON knowledge_chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64)
  `);
  console.log('✅ Índice HNSW creado\n');

  for (const sourceData of KNOWLEDGE_SOURCES) {
    const { chunks, ...sourceFields } = sourceData;

    // Crear o actualizar la fuente
    const source = await prisma.knowledgeSource.upsert({
      where: { id: sourceData.title.toLowerCase().replace(/\s+/g, '_') },
      create: {
        id: sourceData.title.toLowerCase().replace(/\s+/g, '_'),
        ...sourceFields,
      },
      update: { ...sourceFields },
    });

    console.log(`📚 Fuente: ${source.title}`);

    // Procesar cada chunk
    for (const chunk of chunks) {
      console.log(`  → Generando embedding para chunk: ${(chunk.content.slice(0, 60))}...`);

      let embedding: number[];
      try {
        embedding = await getEmbedding(chunk.content);
      } catch (error) {
        console.warn(`  ⚠️ Error generando embedding, usando vector cero (demo mode)`);
        embedding = new Array(768).fill(0);
      }

      // Insertar chunk con embedding usando SQL raw (pgvector no es soportado directamente por Prisma)
      await prisma.$executeRaw`
        INSERT INTO knowledge_chunks (id, source_id, content, metadata, embedding, created_at)
        VALUES (
          gen_random_uuid()::text,
          ${source.id},
          ${chunk.content},
          ${JSON.stringify(chunk.metadata)}::jsonb,
          ${`[${embedding.join(',')}]`}::vector,
          NOW()
        )
        ON CONFLICT DO NOTHING
      `;
    }

    console.log(`  ✅ ${chunks.length} chunks insertados\n`);
  }

  console.log('🎉 Seed completado exitosamente!');
  console.log(`   Fuentes: ${KNOWLEDGE_SOURCES.length}`);
  console.log(`   Chunks:  ${KNOWLEDGE_SOURCES.reduce((acc, s) => acc + s.chunks.length, 0)}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
