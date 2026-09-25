import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AcademicCapIcon,
  PencilSquareIcon,
  MapIcon,
  ClockIcon,
  PresentationChartLineIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/auth.store';

const navItems = [
  { to: '/paths/new',    label: 'Nuevo Perfil', icon: PencilSquareIcon },
  { to: '/paths/active', label: 'Ruta Activa',  icon: MapIcon },
  { to: '/history',      label: 'Historial',    icon: ClockIcon },
  { to: '/dashboard',    label: 'Progreso',     icon: PresentationChartLineIcon },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-3 rounded-lg whitespace-nowrap transition-all ${
    isActive
      ? 'bg-slate-800 text-white font-medium'
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
  }`;

export function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // El detalle de una ruta (/paths/:id) cuenta como "Ruta Activa"
  const viewingPath = /^\/paths\/(?!new$|active$)[^/]+$/.test(pathname);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* ─── Sidebar ────────────────────────────────────────────────────── */}
      <aside className="w-full md:w-64 md:h-screen md:sticky md:top-0 bg-ink text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-700">
          <Link to="/dashboard" className="flex items-center gap-2">
            <AcademicCapIcon className="w-6 h-6 text-sky-400" />
            <span className="font-heading font-bold text-lg tracking-tight">StudyPath AI</span>
          </Link>
        </div>

        <nav className="flex md:flex-col md:flex-grow gap-1 md:gap-2 p-2 md:p-4 overflow-x-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) => navLinkClass({ isActive: isActive || (to === '/paths/active' && viewingPath) })}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </NavLink>
          ))}

          {/* En móvil el bloque de usuario se oculta: perfil y salir van en la barra */}
          <NavLink to="/profile" className={(s) => `md:hidden ${navLinkClass(s)}`}>
            <UserCircleIcon className="w-5 h-5 shrink-0" />
            Mi Perfil
          </NavLink>
          <button onClick={handleLogout} className="md:hidden flex items-center gap-3 px-4 py-3 rounded-lg whitespace-nowrap text-slate-400 hover:bg-slate-800 hover:text-white">
            <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
            Salir
          </button>
        </nav>

        <div className="hidden md:block p-4 mt-auto border-t border-slate-700">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive ? 'bg-slate-800' : 'hover:bg-slate-800'
              }`
            }
          >
            <div className="w-10 h-10 rounded-full border border-slate-600 bg-slate-700 flex items-center justify-center font-heading font-bold text-sky-300 shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">
                {user?.profile?.occupation || 'Estudiante'}
              </p>
            </div>
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 mt-1 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ─── Contenido principal ─────────────────────────────────────────── */}
      <main className="flex-grow min-w-0 p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
