import { NavLink, useNavigate } from 'react-router-dom'
import { useUiStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
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
} from 'lucide-react'

const navItems = [
  { to: '.', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: 'cursos', icon: BookOpen, label: 'Meus Cursos', end: false },
  { to: 'simulados', icon: ClipboardList, label: 'Simulados', end: false },
  { to: 'cronograma', icon: Calendar, label: 'Cronograma', end: false },
  { to: 'desempenho', icon: BarChart2, label: 'Desempenho', end: false },
]

const footerItems = [
  { to: 'configuracoes', icon: Settings, label: 'Configurações', end: false },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

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
          {footerItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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
