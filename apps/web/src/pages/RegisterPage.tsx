import { useState, FormEvent } from 'react';
import { AcademicCapIcon } from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';

export function RegisterPage() {
  const { register, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (form.password !== form.confirmPassword) {
      setValidationError('Las contraseñas no coinciden');
      return;
    }

    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/\d/.test(form.password)) {
      setValidationError('La contraseña debe tener al menos 8 caracteres, una mayúscula y un número');
      return;
    }

    try {
      await register(form.name, form.email, form.password);
      toast.success('¡Cuenta creada! Bienvenido a StudyPath AI');
      navigate('/dashboard');
    } catch {
      // el error ya está en el store
    }
  };

  const displayError = validationError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-ink rounded-2xl flex items-center justify-center mx-auto mb-4"><AcademicCapIcon className="w-7 h-7 text-sky-400" /></div>
          <h1 className="text-2xl font-bold text-ink">Crear cuenta</h1>
          <p className="text-body mt-2 text-sm">Empieza a aprender con IA</p>
        </div>

        <div className="card">
          {displayError && (
            <div className="alert-error mb-5">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nombre completo</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                placeholder="Juan Pérez"
                required
                minLength={2}
              />
            </div>

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
                placeholder="Mínimo 8 caracteres, 1 mayúscula, 1 número"
                required
              />
            </div>

            <div>
              <label className="label">Confirmar contraseña</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="input"
                placeholder="Repite tu contraseña"
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta →'}
            </button>
          </form>

          <p className="text-center text-muted text-sm mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-accent hover:text-accent-800">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
