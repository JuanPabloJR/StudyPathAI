import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ClockIcon, ExclamationTriangleIcon, TrashIcon, PlusIcon, MapIcon } from '@heroicons/react/24/outline';
import { usePathsStore } from '../store/paths.store';
import type { LearningPath } from '../types';
import { LEVEL_LABELS, FORMAT_LABELS } from '../types';

function PathCard({ path }: { path: LearningPath }) {
  const percent    = path.progress?.percent ?? 0;
  const isComplete = path.status === 'COMPLETED';

  return (
    <Link to={`/paths/${path.id}`} className="card hover:border-slate-200 hover:shadow-md transition-all block">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="font-bold text-ink leading-tight">{path.title}</h3>
          <p className="text-muted text-sm mt-1 truncate">{path.topic}</p>
        </div>
        <span className={`shrink-0 ${isComplete ? 'badge-green' : 'badge-blue'}`}>
          {isComplete ? 'Completada' : 'Activa'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="badge-purple">{LEVEL_LABELS[path.level]}</span>
        <span className="badge-gray">{FORMAT_LABELS[path.format]}</span>
        <span className="badge-gray"><ClockIcon className="w-3 h-3" /> {path.estimatedHours}h</span>
      </div>

      <div className="flex justify-between text-xs text-body mb-2">
        <span>{path.progress?.completedModules ?? 0} / {path.progress?.totalModules ?? 0} módulos</span>
        <span className="font-bold text-ink">{percent}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${isComplete ? 'bg-success' : 'bg-accent'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </Link>
  );
}

function FailedPathCard({ path, onDelete }: { path: LearningPath; onDelete: (id: string) => void }) {
  return (
    <div className="card border-red-100 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <ExclamationTriangleIcon className="w-4 h-4 text-red-600 shrink-0" />
          <h3 className="font-semibold text-ink text-sm truncate">{path.topic}</h3>
        </div>
        <p className="text-muted text-xs">Generación fallida — puedes eliminarla</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="badge-purple">{LEVEL_LABELS[path.level]}</span>
          <span className="badge-red">Error</span>
        </div>
      </div>
      <button
        onClick={() => onDelete(path.id)}
        className="btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
        title="Eliminar ruta fallida"
      >
        <TrashIcon className="w-4 h-4" /> Eliminar
      </button>
    </div>
  );
}

export function HistoryPage() {
  const { paths, loading, fetchPaths, deletePath } = usePathsStore();

  useEffect(() => {
    fetchPaths();
  }, []);

  const activePaths    = paths.filter((p) => p.status === 'ACTIVE');
  const completedPaths = paths.filter((p) => p.status === 'COMPLETED');
  const failedPaths    = paths.filter((p) => p.status === 'FAILED');

  const handleDeleteFailed = async (id: string) => {
    if (!confirm('¿Eliminar esta ruta fallida?')) return;
    await deletePath(id);
    toast.success('Ruta eliminada');
  };

  return (
    <div className="animate-fade-in">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink mb-2">Historial de Rutas</h1>
          <p className="text-body leading-relaxed">Todas tus rutas de aprendizaje, activas y completadas.</p>
        </div>
        <Link to="/paths/new" className="btn-primary self-start md:self-auto">
          <PlusIcon className="w-4 h-4" /> Nueva ruta
        </Link>
      </header>

      {loading && paths.length === 0 ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 spinner" /></div>
      ) : activePaths.length + completedPaths.length + failedPaths.length === 0 ? (
        <div className="card text-center py-16">
          <MapIcon className="w-12 h-12 text-accent mx-auto mb-4" />
          <h2 className="text-xl font-bold text-ink mb-2">Aún no tienes rutas</h2>
          <p className="text-body mb-6">Crea tu primera ruta de aprendizaje personalizada con IA.</p>
          <Link to="/paths/new" className="btn-primary">Crear mi primera ruta</Link>
        </div>
      ) : (
        <div className="space-y-10">
          {activePaths.length > 0 && (
            <section>
              <h2 className="eyebrow text-xs mb-4">En progreso ({activePaths.length})</h2>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {activePaths.map((p) => <PathCard key={p.id} path={p} />)}
              </div>
            </section>
          )}

          {completedPaths.length > 0 && (
            <section>
              <h2 className="eyebrow text-xs mb-4">Completadas ({completedPaths.length})</h2>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {completedPaths.map((p) => <PathCard key={p.id} path={p} />)}
              </div>
            </section>
          )}

          {failedPaths.length > 0 && (
            <section>
              <h2 className="eyebrow text-xs mb-4">Generación fallida ({failedPaths.length})</h2>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {failedPaths.map((p) => (
                  <FailedPathCard key={p.id} path={p} onDelete={handleDeleteFailed} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
