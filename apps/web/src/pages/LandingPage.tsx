import { Link } from 'react-router-dom';
import {
  AcademicCapIcon, CpuChipIcon, MagnifyingGlassIcon, PresentationChartLineIcon,
  ArrowPathIcon, Squares2X2Icon, AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: CpuChipIcon,
    title: 'Rutas Personalizadas con IA',
    desc: 'La IA analiza tu perfil y genera un plan de estudio adaptado a tus objetivos, nivel y tiempo disponible.',
  },
  {
    icon: MagnifyingGlassIcon,
    title: 'Basado en Fuentes Verificadas',
    desc: 'Nuestro sistema RAG recupera contenido de fuentes educativas reales para fundamentar cada recomendación.',
  },
  {
    icon: PresentationChartLineIcon,
    title: 'Seguimiento de Progreso',
    desc: 'Marca módulos como completados, registra tu tiempo y visualiza tu avance en tiempo real.',
  },
  {
    icon: ArrowPathIcon,
    title: 'Rutas Adaptativas',
    desc: 'Si cambias tus objetivos o necesitas otro enfoque, regenera tu ruta con un clic.',
  },
  {
    icon: Squares2X2Icon,
    title: 'Módulos Estructurados',
    desc: 'Cada módulo incluye objetivos claros, recursos curados, actividades prácticas y estimaciones de tiempo.',
  },
  {
    icon: AdjustmentsHorizontalIcon,
    title: 'Múltiples Formatos',
    desc: 'Elige entre videos, lectura, proyectos prácticos o un enfoque mixto según tu estilo de aprendizaje.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* ─── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-ink rounded-lg flex items-center justify-center"><AcademicCapIcon className="w-5 h-5 text-sky-400" /></div>
            <span className="font-bold text-ink">StudyPath <span className="text-accent">AI</span></span>
          </div>
          <div className="flex gap-3">
            <Link to="/login" className="btn-ghost text-sm">Iniciar sesión</Link>
            <Link to="/register" className="btn-primary text-sm">Comenzar gratis</Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">

        <h1 className="text-5xl md:text-6xl font-bold text-ink leading-tight mb-6">
          Tu ruta de aprendizaje,{' '}
          <span className="text-accent">
            diseñada por IA
          </span>
        </h1>

        <p className="text-xl text-body max-w-2xl mx-auto mb-12 leading-relaxed">
          StudyPath AI genera planes de estudio personalizados basados en tus objetivos, nivel
          y tiempo disponible. Usa recuperación semántica (RAG) y un modelo de lenguaje para resultados precisos.
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
              <div className="text-2xl font-bold text-accent">{stat.value}</div>
              <div className="text-xs text-muted mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-ink text-center mb-12">
          Todo lo que necesitas para aprender mejor
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card hover:border-slate-200 transition-colors">
              <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center mb-4"><f.icon className="w-5 h-5" /></div>
              <h3 className="font-bold text-ink mb-2">{f.title}</h3>
              <p className="text-body text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA Final ───────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <div className="rounded-xl bg-ink p-10 shadow-sm">
          <h2 className="text-3xl font-bold text-white mb-4">
            Empieza a aprender de forma inteligente
          </h2>
          <p className="text-slate-300 mb-8">
            Crea tu cuenta y genera tu primera ruta de aprendizaje personalizada en minutos.
          </p>
          <Link to="/register" className="btn-accent px-10 py-3 text-base">
            Comenzar ahora →
          </Link>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center text-muted text-sm">
        StudyPath AI — Proyecto de Tesis · Universidad de Colima · 2026
      </footer>
    </div>
  );
}
