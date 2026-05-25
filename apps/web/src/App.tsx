import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { LandingPage }    from './pages/LandingPage';
import { LoginPage }      from './pages/LoginPage';
import { RegisterPage }   from './pages/RegisterPage';
import { DashboardPage }  from './pages/DashboardPage';
import { NewPathPage }    from './pages/NewPathPage';
import { PathDetailPage } from './pages/PathDetailPage';
import { ProfilePage }    from './pages/ProfilePage';
import { Layout }         from './components/Layout/Layout';

// Guard: ruta protegida
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

// Guard: ruta pública (redirigir si ya está autenticado)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return !token ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Rutas protegidas */}
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/dashboard"    element={<DashboardPage />} />
        <Route path="/paths/new"    element={<NewPathPage />} />
        <Route path="/paths/:id"    element={<PathDetailPage />} />
        <Route path="/profile"      element={<ProfilePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
