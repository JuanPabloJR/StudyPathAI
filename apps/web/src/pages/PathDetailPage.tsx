import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { usePathsStore } from '../store/paths.store';
import {
  PlayCircleIcon, DocumentTextIcon, BookOpenIcon, AcademicCapIcon, CodeBracketIcon, WrenchScrewdriverIcon,
  QuestionMarkCircleIcon, ChatBubbleLeftRightIcon, LightBulbIcon, ClockIcon, ArrowPathIcon, TrashIcon,
  CheckIcon, ChevronDownIcon, ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import type { LearningModule } from '../types';
import { LEVEL_LABELS, FORMAT_LABELS, RESOURCE_TYPE_LABELS, ACTIVITY_TYPE_LABELS } from '../types';

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-body mb-1">
        <span>Progreso general</span>
        <span className="font-semibold text-ink">{percent}%</span>
      </div>
      <div className="w-full bg-slate-50 border border-slate-100 rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full bg-accent transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function ModuleCard({
  module,
  pathId,
  isExpanded,
  onToggle,
}: {
  module: LearningModule;
  pathId: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { updateProgress } = usePathsStore();
  const isCompleted = module.progress?.completed ?? false;

  const handleToggleComplete = async () => {
    await updateProgress(pathId, module.id, {
      completed: !isCompleted,
      timeSpent: isCompleted ? 0 : module.estimatedTime,
    });
    toast.success(isCompleted ? 'Módulo desmarcado' : '¡Módulo completado! ');
  };

  const resourceTypeIcon: Record<string, typeof BookOpenIcon> = {
    VIDEO: PlayCircleIcon, ARTICLE: DocumentTextIcon, BOOK: BookOpenIcon, COURSE: AcademicCapIcon,
    EXERCISE: CodeBracketIcon, DOCUMENTATION: BookOpenIcon, TUTORIAL: WrenchScrewdriverIcon,
  };

  const activityTypeIcon: Record<string, typeof BookOpenIcon> = {
    READING: BookOpenIcon, PRACTICE: CodeBracketIcon, PROJECT: WrenchScrewdriverIcon,
    QUIZ: QuestionMarkCircleIcon, EXERCISE: CodeBracketIcon, DISCUSSION: ChatBubbleLeftRightIcon,
  };

  return (
    <div className={`card transition-all duration-300 ${
      isCompleted ? 'border-emerald-100 bg-emerald-50/40' : 'hover:border-slate-200'
    }`}>
      {/* ── Header del módulo ── */}
      <div className="flex items-start gap-4">
        {/* Número / Checkmark */}
        <button
          onClick={handleToggleComplete}
          className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm border-2 transition-all ${
            isCompleted
              ? 'bg-success border-success text-white'
              : 'border-slate-300 text-body hover:border-accent hover:text-accent'
          }`}
        >
          {isCompleted ? <CheckIcon className="w-5 h-5" /> : module.order}
        </button>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${isCompleted ? 'text-body line-through decoration-slate-300' : 'text-ink'}`}>
              {module.title}
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted inline-flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" /> {module.estimatedTime} min</span>
              <button
                onClick={onToggle}
                className="text-muted hover:text-ink transition-colors text-lg"
              >
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
          <p className="text-body text-sm mt-1">{module.objective}</p>
        </div>
      </div>

      {/* ── Contenido expandido ── */}
      {isExpanded && (
        <div className="mt-6 ml-14 animate-fade-in">
          {/* Descripción */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Descripción</h4>
            <p className="text-body text-sm leading-relaxed">{module.description}</p>
          </div>

          {/* Contenido */}
          {module.content && (
            <div className="mb-5">
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Contenido</h4>
              <div className="bg-slate-50 rounded-xl p-4 text-body text-sm leading-relaxed whitespace-pre-line">
                {module.content}
              </div>
            </div>
          )}

          {/* Tips */}
          {module.tips?.length > 0 && (
            <div className="mb-5">
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2"><span className="inline-flex items-center gap-1"><LightBulbIcon className="w-4 h-4 text-amber-500" /> Consejos</span></h4>
              <ul className="space-y-2">
                {module.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-body">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recursos */}
          {module.resources?.length > 0 && (
            <div className="mb-5">
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                Recursos ({module.resources.length})
              </h4>
              <div className="space-y-3">
                {module.resources.map((r) => (
                  <div key={r.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-start gap-3">
                    {(() => { const Icon = resourceTypeIcon[r.type] || DocumentTextIcon; return <span className="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center flex-shrink-0"><Icon className="w-5 h-5" /></span>; })()}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {r.url ? (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-accent hover:text-accent-800 text-sm"
                          >
                            {r.title} <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 inline -mt-0.5" />
                          </a>
                        ) : (
                          <span className="font-medium text-ink text-sm">{r.title}</span>
                        )}
                        <span className="badge badge-blue text-xs">{RESOURCE_TYPE_LABELS[r.type]}</span>
                        {r.isFree && <span className="badge badge-green text-xs">Gratis</span>}
                      </div>
                      {r.description && (
                        <p className="text-body text-xs mt-1">{r.description}</p>
                      )}
                      {r.author && (
                        <p className="text-muted text-xs mt-1">por {r.author}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actividades */}
          {module.activities?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                Actividades
              </h4>
              <div className="space-y-3">
                {module.activities.map((a) => (
                  <div key={a.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-start gap-3">
                    {(() => { const Icon = activityTypeIcon[a.type] || CodeBracketIcon; return <span className="w-9 h-9 rounded-full bg-success/10 text-success flex items-center justify-center flex-shrink-0"><Icon className="w-5 h-5" /></span>; })()}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink text-sm">{a.title}</span>
                        <span className="badge badge-purple text-xs">{ACTIVITY_TYPE_LABELS[a.type]}</span>
                        <span className="text-xs text-muted">{a.durationMin}min</span>
                      </div>
                      <p className="text-body text-xs mt-1 leading-relaxed">{a.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function PathDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentPath, loading, generating, fetchPath, regeneratePath, deletePath } = usePathsStore();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [adjustments, setAdjustments] = useState('');

  useEffect(() => {
    if (id) fetchPath(id);
  }, [id]);

  // Expandir el primer módulo no completado automáticamente
  useEffect(() => {
    if (currentPath?.modules) {
      const firstIncomplete = currentPath.modules.find(m => !m.progress?.completed);
      if (firstIncomplete) {
        setExpandedModules(new Set([firstIncomplete.id]));
      }
    }
  }, [currentPath?.id]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const handleRegenerate = async () => {
    if (!id) return;
    try {
      const toastId = toast.loading('Regenerando ruta con IA...');
      const newPath = await regeneratePath(id, adjustments || undefined);
      toast.dismiss(toastId);
      toast.success('¡Ruta regenerada!');
      setShowRegenerateModal(false);
      navigate(`/paths/${newPath.id}`);
    } catch {
      toast.error('Error al regenerar');
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('¿Seguro que deseas eliminar esta ruta?')) return;
    await deletePath(id);
    toast.success('Ruta eliminada');
    navigate('/dashboard');
  };

  if (loading && !currentPath) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4" />
          <p className="text-body">Cargando ruta...</p>
        </div>
      </div>
    );
  }

  if (!currentPath) return null;

  const { stats } = currentPath;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* ─── Breadcrumb ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link to="/history" className="hover:text-ink">Historial</Link>
        <span>›</span>
        <span className="text-body truncate">{currentPath.title}</span>
      </div>

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink mb-3">{currentPath.title}</h1>
            <div className="flex flex-wrap gap-2">
              <span className="badge badge-purple">{LEVEL_LABELS[currentPath.level]}</span>
              <span className="badge badge-yellow">{FORMAT_LABELS[currentPath.format]}</span>
              <span className="badge-gray">
                <ClockIcon className="w-3 h-3" /> {currentPath.estimatedHours}h estimadas
              </span>
              <span className="badge-gray">
                v{currentPath.version}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setShowRegenerateModal(true)}
              className="btn-secondary text-sm px-3 py-2"
            >
              <ArrowPathIcon className="w-4 h-4" /> Regenerar
            </button>
            <button
              onClick={handleDelete}
              aria-label="Eliminar ruta"
              title="Eliminar ruta"
              className="text-muted hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all text-sm"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Objetivos */}
        {currentPath.objectives?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Objetivos</h3>
            <ul className="space-y-1">
              {currentPath.objectives.map((obj, i) => (
                <li key={i} className="text-sm text-body flex items-start gap-2">
                  <span className="text-accent mt-0.5">→</span> {obj}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Progreso */}
        {stats && (
          <div>
            <ProgressBar percent={stats.percent} />
            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
              <div>
                <div className="text-lg font-bold text-ink">{stats.completedModules}</div>
                <div className="text-xs text-muted">Completados</div>
              </div>
              <div>
                <div className="text-lg font-bold text-ink">
                  {stats.totalModules - stats.completedModules}
                </div>
                <div className="text-xs text-muted">Pendientes</div>
              </div>
              <div>
                <div className="text-lg font-bold text-ink">
                  {Math.round(stats.estimatedRemainingMin / 60)}h
                </div>
                <div className="text-xs text-muted">Restantes</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Módulos ─────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {currentPath.modules?.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            pathId={currentPath.id}
            isExpanded={expandedModules.has(module.id)}
            onToggle={() => toggleModule(module.id)}
          />
        ))}
      </div>

      {/* ─── Modal de Regenerar ──────────────────────────────────────────── */}
      {showRegenerateModal && (
        <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full">
            <h2 className="font-bold text-ink text-lg mb-2">Regenerar Ruta</h2>
            <p className="text-body text-sm mb-4">
              Se creará una nueva versión de tu ruta. La actual quedará archivada.
            </p>
            <label className="label">Ajustes o cambios deseados (opcional)</label>
            <textarea
              value={adjustments}
              onChange={e => setAdjustments(e.target.value)}
              className="input resize-none mb-4"
              rows={3}
              placeholder="Ej: Quiero más énfasis en práctica, necesito ir más despacio en el módulo 2..."
            />
            <div className="flex gap-3">
              <button
                onClick={handleRegenerate}
                disabled={generating}
                className="btn-primary flex-1"
              >
                {generating ? 'Generando...' : 'Regenerar'}
              </button>
              <button
                onClick={() => setShowRegenerateModal(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
