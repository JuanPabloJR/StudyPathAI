import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { MapIcon } from '@heroicons/react/24/outline';
import { usePathsStore } from '../store/paths.store';

/**
 * "Ruta Activa": redirige a la ruta ACTIVE más reciente.
 * Si no hay ninguna, invita a crear una.
 */
export function ActivePathPage() {
  const { paths, fetchPaths } = usePathsStore();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchPaths().finally(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return <div className="flex justify-center py-32"><div className="w-10 h-10 spinner" /></div>;
  }

  const active = paths.find((p) => p.status === 'ACTIVE');
  if (active) return <Navigate to={`/paths/${active.id}`} replace />;

  return (
    <div className="card text-center py-16 max-w-xl mx-auto animate-fade-in">
      <MapIcon className="w-12 h-12 text-accent mx-auto mb-4" />
      <h1 className="text-xl font-bold text-ink mb-2">No tienes una ruta activa</h1>
      <p className="text-body mb-6">Genera una nueva ruta o revisa tus rutas anteriores.</p>
      <div className="flex gap-3 justify-center">
        <Link to="/paths/new" className="btn-primary">Crear ruta</Link>
        <Link to="/history" className="btn-secondary">Ver historial</Link>
      </div>
    </div>
  );
}
