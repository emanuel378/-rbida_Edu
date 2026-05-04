import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { BookOpen, User, LogOut, LayoutDashboard, GraduationCap, ShieldCheck } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="flex items-center gap-2 text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
              <GraduationCap className="w-8 h-8" />
              <span>IF Preparatório</span>
            </Link>

            {user && (
              <div className="flex items-center gap-1 sm:gap-2">
                <NavLink to="/dashboard" active={isActive('/dashboard')}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </NavLink>

                {user.role === 'professor' && (
                  <NavLink to="/teacher" active={isActive('/teacher')}>
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">Professor</span>
                  </NavLink>
                )}

                {user.role === 'admin' && (
                  <NavLink to="/admin" active={isActive('/admin')}>
                    <ShieldCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </NavLink>
                )}

                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user.name}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Sair"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sair</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}

function NavLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {children}
    </Link>
  )
}
