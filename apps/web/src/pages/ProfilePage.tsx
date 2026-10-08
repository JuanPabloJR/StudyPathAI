import { useState, useEffect, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';
import { usersApi, getErrorMessage } from '../api/client';
import type { LearningFormat } from '../types';

const FORMAT_OPTIONS: { value: LearningFormat; label: string }[] = [
  { value: 'VIDEO',         label: 'Videos' },
  { value: 'TEXT',          label: 'Lectura' },
  { value: 'INTERACTIVE',   label: 'Interactivo' },
  { value: 'MIXED',         label: 'Mixto' },
  { value: 'PROJECT_BASED', label: 'Proyectos' },
];

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name:            user?.name || '',
    bio:             user?.profile?.bio || '',
    occupation:      user?.profile?.occupation || '',
    learningStyle:   user?.profile?.learningStyle || '',
    weeklyHours:     user?.profile?.weeklyHours || 5,
    preferredFormats: user?.profile?.preferredFormats || [] as LearningFormat[],
  });

  const toggleFormat = (fmt: LearningFormat) => {
    setForm(prev => ({
      ...prev,
      preferredFormats: prev.preferredFormats.includes(fmt)
        ? prev.preferredFormats.filter(f => f !== fmt)
        : [...prev.preferredFormats, fmt],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await usersApi.updateProfile(form);
      setUser(res.data.data);
      toast.success('Perfil actualizado ✓');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">Mi Perfil</h1>
        <p className="text-body mt-2">Personaliza tu experiencia de aprendizaje</p>
      </div>

      {/* Tarjeta de identidad */}
      <div className="card mb-6 flex items-center gap-5">
        <div className="w-16 h-16 bg-accent-100 rounded-2xl flex items-center justify-center text-accent-800 font-bold text-2xl flex-shrink-0">
          {user?.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="font-bold text-ink">{user?.name}</h2>
          <p className="text-body text-sm">{user?.email}</p>
          <p className="text-xs text-muted mt-1">
            Miembro desde {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' }) : ''}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-ink">Información básica</h2>

          <div>
            <label className="label">Nombre completo</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label">Ocupación</label>
            <input
              type="text"
              value={form.occupation}
              onChange={e => setForm({ ...form, occupation: e.target.value })}
              className="input"
              placeholder="Estudiante, Desarrollador, Investigador..."
            />
          </div>

          <div>
            <label className="label">Sobre mí</label>
            <textarea
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              className="input resize-none"
              rows={3}
              placeholder="Cuéntanos un poco sobre ti y tus intereses..."
            />
          </div>
        </div>

        {/* Preferencias de aprendizaje */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-ink">Preferencias de aprendizaje</h2>

          <div>
            <label className="label">
              Horas de estudio por semana: <span className="text-accent">{form.weeklyHours}h</span>
            </label>
            <input
              type="range"
              min={1}
              max={40}
              value={form.weeklyHours}
              onChange={e => setForm({ ...form, weeklyHours: Number(e.target.value) })}
              className="w-full accent-[#0369A1]"
            />
            <div className="flex justify-between text-xs text-muted">
              <span>1h</span><span>20h</span><span>40h</span>
            </div>
          </div>

          <div>
            <label className="label">Estilo de aprendizaje</label>
            <input
              type="text"
              value={form.learningStyle}
              onChange={e => setForm({ ...form, learningStyle: e.target.value })}
              className="input"
              placeholder="Visual, auditivo, kinestésico, lector/escritor..."
            />
          </div>

          <div>
            <label className="label mb-3">Formatos preferidos</label>
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => toggleFormat(f.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    form.preferredFormats.includes(f.value)
                      ? 'bg-accent-50 border-accent text-accent-800'
                      : 'bg-white border-slate-200 text-body hover:border-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
