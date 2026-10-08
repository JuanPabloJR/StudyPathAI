import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  BookOpenIcon,
  CodeBracketIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  WrenchScrewdriverIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { usePathsStore } from '../store/paths.store';
import { pathsApi } from '../api/client';
import type { ActivityType, LearningPath } from '../types';
import { TimeComparisonChart } from '../components/charts/TimeComparisonChart';

const fmtHours = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`;
};

const ACTIVITY_ICON: Record<ActivityType, typeof BookOpenIcon> = {
  READING:    BookOpenIcon,
  PRACTICE:   CodeBracketIcon,
  PROJECT:    WrenchScrewdriverIcon,
  QUIZ:       QuestionMarkCircleIcon,
  EXERCISE:   CodeBracketIcon,
  DISCUSSION: ChatBubbleLeftRightIcon,
};

function MetricCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card">
      <p className="eyebrow mb-2">{label}</p>
      <p className="text-2xl font-bold text-ink">
        {value}{' '}
        {hint && <span className="text-xs text-success font-normal">{hint}</span>}
      </p>
    </div>
  );
}

export function DashboardPage() {
  const { paths, stats, loading, fetchPaths, fetchStats } = usePathsStore();
  const [activePath, setActivePath] = useState<LearningPath | null>(null);

  useEffect(() => {
    fetchPaths();
    fetchStats();
  }, []);

  // Ruta activa = la ACTIVE más reciente (la lista viene ordenada por fecha desc)
  const activeSummary = paths.find((p) => p.status === 'ACTIVE');

  useEffect(() => {
    if (!activeSummary) { setActivePath(null); return; }
    pathsApi.get(activeSummary.id)
      .then((res) => setActivePath(res.data.data))
      .catch(() => setActivePath(null));
  }, [activeSummary?.id]);

  const visible   = paths.filter((p) => p.status === 'ACTIVE' || p.status === 'COMPLETED');
  const active    = paths.filter((p) => p.status === 'ACTIVE');
  const completed = paths.filter((p) => p.status === 'COMPLETED');
  const modulesDone = visible.reduce((acc, p) => acc + (p.progress?.completedModules ?? 0), 0);
  const avgPercent  = active.length
    ? Math.round(active.reduce((acc, p) => acc + (p.progress?.percent ?? 0), 0) / active.length)
    : 0;

  const modules = activePath?.modules ?? [];

  const chartData = useMemo(
    () => modules.map((m) => ({
      label:     `M${m.order}`,
      title:     m.title,
      estimated: m.estimatedTime,
      real:      m.progress?.timeSpent ?? 0,
    })),
    [activePath?.id, activePath?.updatedAt],
  );

  // Próximas actividades: las del primer módulo sin completar
  const nextModule = modules.find((m) => !m.progress?.completed);
  const nextActivities = nextModule?.activities.slice(0, 3) ?? [];

  if (loading && paths.length === 0) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-10 h-10 spinner mx-auto mb-4" />
          <p className="text-body">Cargando tu progreso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink mb-2">Panel de Progreso Académico</h1>
          <p className="text-body leading-relaxed">
            Visualiza tu avance global y el desempeño en tus rutas de aprendizaje.
          </p>
        </div>
        {activeSummary && (
          <Link
            to={`/paths/${activeSummary.id}`}
            className="flex items-center gap-2 text-sm bg-white border border-gray-100 px-4 py-2 rounded-lg shadow-sm hover:border-slate-200 max-w-xs"
          >
            <span className="text-muted shrink-0">Ruta actual:</span>
            <span className="font-bold text-ink truncate">{activeSummary.topic}</span>
          </Link>
        )}
      </header>

      {/* ─── Métricas ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <MetricCard label="Tiempo total"        value={fmtHours(stats?.totalTimeSpentMin ?? 0)} />
        <MetricCard label="Módulos completados" value={modulesDone} />
        <MetricCard
          label="Rutas activas"
          value={active.length}
          hint={completed.length ? `${completed.length} completada${completed.length > 1 ? 's' : ''}` : undefined}
        />
        <MetricCard label="Avance promedio" value={`${avgPercent}%`} />
      </div>

      {visible.length === 0 ? (
        <div className="card text-center py-16">
          <SparklesIcon className="w-12 h-12 text-accent mx-auto mb-4" />
          <h2 className="text-xl font-bold text-ink mb-2">Aún no tienes rutas</h2>
          <p className="text-body mb-6">Crea tu primera ruta de aprendizaje personalizada con IA.</p>
          <Link to="/paths/new" className="btn-primary">Crear mi primera ruta</Link>
        </div>
      ) : (
        <>
          {/* ─── Gráficas ─────────────────────────────────────────────────── */}
          {activePath && modules.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              <div className="card lg:min-h-[350px]">
                <h3 className="section-title mb-6">
                  <ChartBarIcon className="w-4 h-4 text-accent" /> Avance por Módulo (Ruta Activa)
                </h3>
                <ul className="space-y-3">
                  {modules.map((m) => {
                    const done = m.progress?.completed ?? false;
                    return (
                      <li key={m.id} className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          done ? 'bg-success/10 text-success' : 'bg-slate-100 text-body'
                        }`}>
                          {done ? <CheckCircleIcon className="w-4 h-4" /> : m.order}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between gap-2 text-sm">
                            <span className={`truncate ${done ? 'text-body' : 'text-ink font-medium'}`}>{m.title}</span>
                            <span className="text-xs text-muted shrink-0">{done ? 'Completado' : fmtHours(m.estimatedTime)}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5">
                            <div
                              className="h-1.5 rounded-full bg-accent transition-all duration-500"
                              style={{ width: done ? '100%' : '0%' }}
                            />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="card lg:min-h-[350px]">
                <h3 className="section-title mb-4">
                  <ClockIcon className="w-4 h-4 text-accent" /> Tiempo Real vs. Estimado
                </h3>
                <TimeComparisonChart data={chartData} />
              </div>
            </div>
          )}

          {/* ─── Próximas actividades ─────────────────────────────────────── */}
          {activePath && nextModule && nextActivities.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-bold text-ink mb-6 uppercase tracking-wider">
                Próximas Actividades Recomendadas
              </h3>
              <div className="space-y-4">
                {nextActivities.map((a, i) => {
                  const Icon = ACTIVITY_ICON[a.type] ?? BookOpenIcon;
                  return (
                    <div key={a.id} className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          i === 0 ? 'bg-accent/10 text-accent' : 'bg-success/10 text-success'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-ink truncate">{a.title}</p>
                          <p className="text-[11px] text-body truncate">
                            Módulo {nextModule.order}: {nextModule.title} • {a.durationMin} min est.
                          </p>
                        </div>
                      </div>
                      <Link to={`/paths/${activePath.id}`} className="btn-primary text-xs px-4 py-2 shrink-0">
                        Iniciar
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
