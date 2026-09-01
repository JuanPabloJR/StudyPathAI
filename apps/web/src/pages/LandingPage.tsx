import { Link } from 'react-router-dom';

const features = [
  {
    icon: '🧠',
    title: 'Rutas Personalizadas con IA',
    desc: 'Claude analiza tu perfil y genera un plan de estudio adaptado a tus objetivos, nivel y tiempo disponible.',
  },
  {
    icon: '🔍',
    title: 'Basado en Fuentes Verificadas',
    desc: 'Nuestro sistema RAG recupera contenido de fuentes educativas reales para fundamentar cada recomendación.',
  },
  {
    icon: '📊',
    title: 'Seguimiento de Progreso',
    desc: 'Marca módulos como completados, registra tu tiempo y visualiza tu avance en tiempo real.',
  },
  {
    icon: '🔄',
    title: 'Rutas Adaptativas',
    desc: 'Si cambias tus objetivos o necesitas otro enfoque, regenera tu ruta con un clic.',
  },
  {
    icon: '📚',
    title: 'Módulos Estructurados',
    desc: 'Cada módulo incluye objetivos claros, recursos curados, actividades prácticas y estimaciones de tiempo.',
  },
  {
    icon: '🎯',
    title: 'Múltiples Formatos',
    desc: 'Elige entre videos, lectura, proyectos prácticos o un enfoque mixto según tu estilo de aprendizaje.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* ─── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
              S
            </div>
            <span className="font-bold text-slate-100">StudyPath <span className="text-primary-400">AI</span></span>
          </div>
          <div className="flex gap-3">
            <Link to="/login" className="btn-ghost text-sm">Iniciar sesión</Link>
            <Link to="/register" className="btn-primary text-sm">Comenzar gratis</Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">

        <h1 className="text-5xl md:text-6xl font-black text-slate-100 leading-tight mb-6">
          Tu ruta de aprendizaje,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-blue-300">
            diseñada por IA
          </span>
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          StudyPath AI genera planes de estudio personalizados basados en tus objetivos, nivel
          y tiempo disponible. Usando recuperación semántica y Claude para resultados precisos.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="btn-primary text-base px-8 py-3">
            Crear mi ruta gratis →
          </Link>
          <Link to="/login" className="btn-secondary text-base px-8 py-3">
            Ya tengo cuenta
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto text-center">
          {[
            { value: 'RAG', label: 'Retrieval-Augmented' },
            { value: 'GROQ', label: 'Modelo de lenguaje' },
            { value: '∞', label: 'Temas disponibles' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-black text-primary-400">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-slate-100 text-center mb-12">
          Todo lo que necesitas para aprender mejor
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card hover:border-slate-700 transition-colors">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-slate-100 mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA Final ───────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="card border-primary-800 bg-gradient-to-b from-primary-900/20 to-slate-900">
          <h2 className="text-3xl font-bold text-slate-100 mb-4">
            Empieza a aprender de forma inteligente
          </h2>
          <p className="text-slate-400 mb-8">
            Crea tu cuenta y genera tu primera ruta de aprendizaje personalizada en minutos.
          </p>
          <Link to="/register" className="btn-primary px-10 py-3 text-base">
            Comenzar ahora →
          </Link>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-8 px-6 text-center text-slate-600 text-sm">
        StudyPath AI — Proyecto de Tesis · Universidad de Colima · 2026
      </footer>
    </div>
  );
}
