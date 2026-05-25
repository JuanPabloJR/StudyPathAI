import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';
import { usePathsStore } from '../store/paths.store';
import { LEVEL_LABELS, FORMAT_LABELS } from '../types';

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-2xl font-bold text-slate-100">{value}</p>
        </div>
      </div>
    </div>
  );
}

function PathCard({ path }: { path: any }) {
  const percent    = path.progress?.percent ?? 0;
  const isComplete = path.status === 'COMPLETED';

  return (
    <Link to={`/paths/${path.id}`} className="card hover:border-slate-700 transition-all hover:shadow-lg block">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-100 leading-tight">{path.title}</h3>
          <p className="text-slate-500 text-sm mt-1">{path.topic}</p>
        </div>
        <span className={`badge ml-3 flex-shrink-0 ${
          isComplete               ? 'badge-green'  :
          path.status === 'ACTIVE' ? 'badge-blue'   :
                                     'badge-yellow'
        }`}>
          {isComplete ? '✅ Completado' : path.status === 'ACTIVE' ? '📚 Activo' : '⏳'}
        </span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="badge badge-purple">{LEVEL_LABELS[path.level as keyof typeof LEVEL_LABELS]}</span>
        <span className="badge badge-yellow">{FORMAT_LABELS[path.format as keyof typeof FORMAT_LABELS]}</span>
        <span className="badge bg-slate-800 text-slate-400 border border-slate-700">
          ⏱ {path.estimatedHours}h
        </span>
      </div>

      {/* Barra de progreso */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>{path.progress?.completedModules ?? 0} / {path.progress?.totalModules ?? 0} módulos</span>
          <span className="font-medium text-slate-300">{percent}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              isComplete ? 'bg-green-500' : 'bg-primary-500'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

// Tarjeta para rutas que fallaron (ARCHIVED)
function FailedPathCard({ path, onDelete }: { path: any; onDelete: (id: string) => void }) {
  return (
    <div className="card border-red-900/40 bg-red-950/10">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-red-400 text-sm">⚠️</span>
            <h3 className="font-medium text-slate-300 text-sm truncate">{path.topic}</h3>
          </div>
          <p className="text-slate-500 text-xs">Generación fallida — puedes eliminarla</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="badge badge-purple text-xs">{LEVEL_LABELS[path.level as keyof typeof LEVEL_LABELS]}</span>
            <span className="badge bg-red-900/40 text-red-400 border border-red-800/50 text-xs">Error</span>
          </div>
        </div>
        <button
          onClick={() => onDelete(path.id)}
          className="ml-3 flex-shrink-0 text-slate-600 hover:text-red-400 hover:bg-red-900/20 px-3 py-2 rounded-lg transition-all text-sm"
          title="Eliminar ruta fallida"
        >
          🗑️ Eliminar
        </button>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const { paths, stats, loading, fetchPaths, fetchStats, deletePath } = usePathsStore();

  useEffect(() => {
    fetchPaths();
    fetchStats();
  }, []);

  const activePaths    = paths.filter(p => p.status === 'ACTIVE');
  const completedPaths = paths.filter(p => p.status === 'COMPLETED');
  const failedPaths    = paths.filter(p => p.status === 'ARCHIVED');
  const visiblePaths   = [...activePaths, ...completedPaths];

  const handleDeleteFailed = async (id: string) => {
    if (!confirm('¿Eliminar esta ruta fallida?')) return;
    await deletePath(id);
    toast.success('Ruta eliminada');
  };

  return (
    <div className="animate-fade-in">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Hola, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 mt-1">Tu panel de aprendizaje personalizado</p>
        </div>
        <Link to="/paths/new" className="btn-primary">
          ✨ Nueva Ruta
        </Link>
      </div>

      {/* ─── Stats ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="📚" label="Total de rutas"    value={visiblePaths.length} color="bg-blue-900/40" />
        <StatCard icon="🎯" label="Rutas activas"     value={activePaths.length}  color="bg-primary-900/40" />
        <StatCard icon="✅" label="Completadas"        value={completedPaths.length} color="bg-green-900/40" />
        <StatCard
          icon="⏱"
          label="Horas de estudio"
          value={`${Math.round((stats?.totalTimeSpentMin || 0) / 60)}h`}
          color="bg-purple-900/40"
        />
      </div>

      {/* ─── Contenido ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Cargando tus rutas...</p>
          </div>
        </div>
      ) : visiblePaths.length === 0 && failedPaths.length === 0 ? (
        /* Estado vacío real */
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-xl font-bold text-slate-200 mb-2">Aún no tienes rutas</h2>
          <p className="text-slate-400 mb-6">
            Crea tu primera ruta de aprendizaje personalizada con IA
          </p>
          <Link to="/paths/new" className="btn-primary">
            ✨ Crear mi primera ruta
          </Link>
        </div>
      ) : (
        <div>
          {/* Rutas activas */}
          {activePaths.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-slate-200 mb-4">
                📚 Rutas en progreso ({activePaths.length})
              </h2>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {activePaths.map(p => <PathCard key={p.id} path={p} />)}
              </div>
            </section>
          )}

          {/* Rutas completadas */}
          {completedPaths.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-slate-200 mb-4">
                ✅ Completadas ({completedPaths.length})
              </h2>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {completedPaths.map(p => <PathCard key={p.id} path={p} />)}
              </div>
            </section>
          )}

          {/* Rutas fallidas — con botón de eliminar */}
          {failedPaths.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-400 mb-4">
                ⚠️ Generación fallida ({failedPaths.length})
              </h2>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {failedPaths.map(p => (
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
