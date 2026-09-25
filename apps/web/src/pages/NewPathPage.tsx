import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { usePathsStore } from '../store/paths.store';
import {
  PlayCircleIcon, DocumentTextIcon, CursorArrowRaysIcon, Squares2X2Icon, WrenchScrewdriverIcon,
  PlusIcon, XMarkIcon, SparklesIcon,
} from '@heroicons/react/24/outline';
import type { KnowledgeLevel, LearningFormat } from '../types';

// ─── Opciones de los selectores ──────────────────────────────────────────────

const LEVELS: { value: KnowledgeLevel; label: string; desc: string }[] = [
  { value: 'BEGINNER',     label: 'Principiante', desc: 'Sin conocimiento previo del tema' },
  { value: 'INTERMEDIATE', label: 'Intermedio',   desc: 'Tengo bases y quiero profundizar' },
  { value: 'ADVANCED',     label: 'Avanzado',     desc: 'Domino el tema, busco expertise' },
  { value: 'EXPERT',       label: 'Experto',      desc: 'Busco conocimientos especializados' },
];

const FORMATS: { value: LearningFormat; label: string; icon: typeof PlayCircleIcon }[] = [
  { value: 'VIDEO',         label: 'Videos',     icon: PlayCircleIcon },
  { value: 'TEXT',          label: 'Lectura',    icon: DocumentTextIcon },
  { value: 'INTERACTIVE',   label: 'Interactivo',icon: CursorArrowRaysIcon },
  { value: 'MIXED',         label: 'Mixto',      icon: Squares2X2Icon },
  { value: 'PROJECT_BASED', label: 'Proyectos',  icon: WrenchScrewdriverIcon },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export function NewPathPage() {
  const { createPath, generating, error } = usePathsStore();
  const navigate = useNavigate();

  const [topic,        setTopic]        = useState('');
  const [level,        setLevel]        = useState<KnowledgeLevel>('BEGINNER');
  const [objectiveInput, setObjectiveInput] = useState('');
  const [objectives,   setObjectives]   = useState<string[]>([]);
  const [timeAvailable, setTimeAvailable] = useState(20);
  const [format,       setFormat]       = useState<LearningFormat>('MIXED');
  const [specialNeeds, setSpecialNeeds] = useState('');

  const addObjective = () => {
    const trimmed = objectiveInput.trim();
    if (trimmed && objectives.length < 5) {
      setObjectives([...objectives, trimmed]);
      setObjectiveInput('');
    }
  };

  const removeObjective = (i: number) =>
    setObjectives(objectives.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) { toast.error('Ingresa un tema de estudio'); return; }
    if (objectives.length === 0) { toast.error('Agrega al menos un objetivo'); return; }

    try {
      const toastId = toast.loading('Generando tu ruta con IA... (puede tardar 15-30s)');
      const path = await createPath({
        topic: topic.trim(),
        level,
        objectives,
        timeAvailable,
        format,
        specialNeeds: specialNeeds.trim() || undefined,
      });
      toast.dismiss(toastId);
      toast.success('¡Ruta generada exitosamente!');
      navigate(`/paths/${path.id}`);
    } catch {
      toast.error('Error al generar la ruta. Intenta de nuevo.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">Nueva Ruta de Aprendizaje</h1>
        <p className="text-body mt-2">
          Completa tu perfil de aprendizaje y la IA generará un plan personalizado.
        </p>
      </div>

      {error && (
        <div className="alert-error mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Tema ── */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-4">Tema de estudio</h2>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="input"
            placeholder="Ej: Machine Learning con Python, JavaScript moderno, Cálculo diferencial..."
            required
          />
        </div>

        {/* ── Nivel ── */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-4">Nivel de conocimiento actual</h2>
          <div className="grid grid-cols-2 gap-3">
            {LEVELS.map(l => (
              <button
                key={l.value}
                type="button"
                onClick={() => setLevel(l.value)}
                className={`choice ${
                  level === l.value
                    ? 'choice-active'
                    : ''
                }`}
              >
                <div className="font-medium text-sm">{l.label}</div>
                <div className="text-xs mt-1 opacity-70">{l.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Objetivos ── */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-4">
            Objetivos de aprendizaje
            <span className="text-muted font-normal text-sm ml-2">({objectives.length}/5)</span>
          </h2>

          {objectives.length > 0 && (
            <div className="space-y-2 mb-4">
              {objectives.map((obj, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5">
                  <span className="text-accent font-bold text-sm w-5">{i + 1}.</span>
                  <span className="text-body text-sm flex-1">{obj}</span>
                  <button
                    type="button"
                    onClick={() => removeObjective(i)}
                    className="text-muted hover:text-red-400 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {objectives.length < 5 && (
            <div className="flex gap-2">
              <input
                type="text"
                value={objectiveInput}
                onChange={e => setObjectiveInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                className="input flex-1"
                placeholder="Ej: Crear modelos predictivos con scikit-learn"
              />
              <button
                type="button"
                onClick={addObjective}
                className="btn-secondary px-4"
                disabled={!objectiveInput.trim()}
              >
                <PlusIcon className="w-4 h-4" /> Agregar
              </button>
            </div>
          )}
        </div>

        {/* ── Tiempo ── */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-4">
            Tiempo disponible: <span className="text-accent">{timeAvailable} horas</span>
          </h2>
          <input
            type="range"
            min={2}
            max={100}
            step={1}
            value={timeAvailable}
            onChange={e => setTimeAvailable(Number(e.target.value))}
            className="w-full accent-[#0369A1]"
          />
          <div className="flex justify-between text-xs text-muted mt-2">
            <span>2h (intensivo)</span>
            <span>50h (completo)</span>
            <span>100h (profundo)</span>
          </div>
        </div>

        {/* ── Formato ── */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-4">Formato de aprendizaje preferido</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {FORMATS.map(f => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFormat(f.value)}
                className={`choice text-center p-3 ${
                  format === f.value
                    ? 'choice-active'
                    : ''
                }`}
              >
                <f.icon className="w-6 h-6 mx-auto mb-1" />
                <div className="text-xs font-medium">{f.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Necesidades especiales (opcional) ── */}
        <div className="card">
          <h2 className="font-semibold text-ink mb-1">
            Necesidades especiales <span className="text-muted font-normal">(opcional)</span>
          </h2>
          <p className="text-muted text-xs mb-4">
            Dislexia, ritmo lento, enfoque visual, idioma preferido, etc.
          </p>
          <textarea
            value={specialNeeds}
            onChange={e => setSpecialNeeds(e.target.value)}
            className="input resize-none"
            rows={3}
            placeholder="Ej: Prefiero ejemplos prácticos, tengo dislexia, necesito ir más despacio..."
          />
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={generating || objectives.length === 0 || !topic.trim()}
          className="btn-primary w-full py-4 text-base"
        >
          {generating ? (
            <span className="flex items-center justify-center gap-3">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generando tu ruta personalizada...
            </span>
          ) : (
            <><SparklesIcon className="w-5 h-5" /> Generar ruta de aprendizaje</>
          )}
        </button>

        {generating && (
          <div className="text-center text-sm text-muted">
            La IA está diseñando tu ruta. Esto puede tomar 15-30 segundos.
          </div>
        )}
      </form>
    </div>
  );
}
