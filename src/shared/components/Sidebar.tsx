import { NavLink, useNavigate } from 'react-router-dom'
import { useUiStore } from '../../features/dashboard/store/uiStore'
import { useAuthStore } from '../../features/auth/services/authStore'
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Calendar,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  MessageCircle,
} from 'lucide-react'

interface NavItem {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  end?: boolean
}

const studentNavItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/cursos', icon: BookOpen, label: 'Meus Cursos', end: false },
  { to: '/dashboard/simulados', icon: ClipboardList, label: 'Simulados', end: false },
  { to: '/dashboard/cronograma', icon: Calendar, label: 'Cronograma', end: false },
  { to: '/dashboard/desempenho', icon: BarChart2, label: 'Desempenho', end: false },
]

const teacherNavItems: NavItem[] = [
  { to: '/teacher', icon: GraduationCap, label: 'Painel', end: true },
  { to: '/teacher/courses', icon: BookOpen, label: 'Meus Cursos', end: false },
  { to: '/teacher/simulados', icon: ClipboardList, label: 'Simulados', end: false },
  { to: '/teacher/messages', icon: MessageCircle, label: 'Mensagens', end: false },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = user?.role === 'professor' ? teacherNavItems : studentNavItems

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-100 shadow-sm transition-all duration-300 z-40 ${
        sidebarCollapsed ? 'w-[68px]' : 'w-[220px]'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className={`flex items-center h-16 px-4 border-b border-gray-100 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <img src="/logo-small.png" alt="ÓrbitaEdu" className="w-12 h-12 rounded-lg object-cover" />
              <span className="text-sm font-bold text-gray-900">ÓrbitaEdu</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg transition-all duration-200 ${
                  sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-[#1a3a5c] text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-[#1a3a5c]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                  {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="py-4 px-3 border-t border-gray-100 space-y-1">
          <NavLink
            to={user?.role === 'professor' ? '/teacher/configuracoes' : '/dashboard/configuracoes'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg transition-all duration-200 ${
                sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-[#1a3a5c] text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-[#1a3a5c]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Settings className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                {!sidebarCollapsed && <span className="text-sm font-medium">Configurações</span>}
              </>
            )}
          </NavLink>

          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 rounded-lg transition-all duration-200 w-full text-red-500 hover:bg-red-50 hover:text-red-600 ${
              sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Sair</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}
