import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';

export function LoginPage() {
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      toast.success('¡Bienvenido de vuelta!');
      navigate('/dashboard');
    } catch {
      // el error ya está en el store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-4">
            S
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Iniciar sesión</h1>
          <p className="text-slate-400 mt-2 text-sm">Bienvenido a StudyPath AI</p>
        </div>

        <div className="card">
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-xl p-3 mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Correo electrónico</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
                placeholder="tu@correo.com"
                required
              />
            </div>

            <div>
              <label className="label">Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? '⏳ Iniciando sesión...' : 'Iniciar sesión →'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
