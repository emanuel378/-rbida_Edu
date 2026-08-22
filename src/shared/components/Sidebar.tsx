import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useUiStore } from '../../features/dashboard/store/uiStore'
import { useAuthStore } from '../../features/auth/services/authStore'
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  GraduationCap,
  MessageCircle,
  HelpCircle,
  ShieldCheck,
  TrendingUp,
  PlusCircle,
  Database,
  Sparkles,
  Edit2,
  Landmark,
  Wrench,
  ClipboardList,
} from 'lucide-react'

interface NavItem {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  end?: boolean
}

interface NavGroup {
  label: string
  icon: React.ComponentType<{ className?: string }>
  children: NavItem[]
}

type NavEntry = NavItem | NavGroup

const isNavGroup = (entry: NavEntry): entry is NavGroup => 'children' in entry

const studentNavItems: NavEntry[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/cursos', icon: BookOpen, label: 'Meus Cursos', end: false },
  { to: '/dashboard/cronograma', icon: Calendar, label: 'Cronograma', end: false },
  { to: '/dashboard/questions', icon: HelpCircle, label: 'Banco de Questões', end: false },
]

const teacherNavItems: NavEntry[] = [
  { to: '/teacher', icon: GraduationCap, label: 'Painel', end: true },
  { to: '/teacher/courses', icon: BookOpen, label: 'Meus Cursos', end: false },
  { to: '/teacher/simulados', icon: ClipboardList, label: 'Simulados', end: false },
  { to: '/teacher/question-bank', icon: Database, label: 'Banco de Questões', end: false },
  {
    label: 'Ferramentas',
    icon: Wrench,
    children: [
      { to: '/teacher/questions', icon: PlusCircle, label: 'Criar Questões', end: true },
      { to: '/teacher/questions/editar', icon: Edit2, label: 'Editar Questões', end: false },
      { to: '/teacher/question-generator', icon: Sparkles, label: 'Gerador IA de Questões', end: false },
      { to: '/dashboard/questions', icon: HelpCircle, label: 'Responder Questões', end: false },
    ],
  },
  { to: '/teacher/messages', icon: MessageCircle, label: 'Mensagens', end: false },
]

const adminNavItems: NavEntry[] = [
  { to: '/admin', icon: ShieldCheck, label: 'Painel', end: true },
  { to: '/admin/institutions', icon: Landmark, label: 'Instituições', end: false },
  { to: '/admin/question-bank', icon: Database, label: 'Banco de Questões', end: false },
  {
    label: 'Ferramentas',
    icon: Wrench,
    children: [
      { to: '/admin/questions', icon: PlusCircle, label: 'Criar Questões', end: true },
      { to: '/admin/questions/editar', icon: Edit2, label: 'Editar Questões', end: false },
      { to: '/admin/question-generator', icon: Sparkles, label: 'Gerador IA de Questões', end: false },
      { to: '/dashboard/questions', icon: HelpCircle, label: 'Responder Questões', end: false },
    ],
  },
  { to: '/admin/messages', icon: MessageCircle, label: 'Mensagens', end: false },
  { to: '/admin/analytics', icon: TrendingUp, label: 'Analytics & Financeiro', end: false },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const { user, logoutFromSupabase } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set())

  const handleLogout = async () => {
    await logoutFromSupabase()
    navigate('/login')
  }

  const navItems: NavEntry[] = user?.role === 'professor' ? teacherNavItems : user?.role === 'admin' ? adminNavItems : studentNavItems

  useEffect(() => {
    const activeGroup = navItems.find(entry => isNavGroup(entry) && entry.children.some(c => location.pathname === c.to))
    if (activeGroup && isNavGroup(activeGroup)) {
      setOpenGroups(prev => (prev.has(activeGroup.label) ? prev : new Set(prev).add(activeGroup.label)))
    }
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGroup = (label: string) => {
    if (sidebarCollapsed) toggleSidebar()
    setOpenGroups(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
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
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((entry) =>
            isNavGroup(entry) ? (
              <div key={entry.label}>
                <button
                  onClick={() => toggleGroup(entry.label)}
                  className={`w-full flex items-center gap-3 rounded-lg transition-all duration-200 ${
                    sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
                  } ${
                    entry.children.some(c => location.pathname === c.to)
                      ? 'bg-[#1a3a5c] text-white'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-[#1a3a5c]'
                  }`}
                >
                  <entry.icon className={`w-5 h-5 flex-shrink-0 ${entry.children.some(c => location.pathname === c.to) ? 'text-white' : ''}`} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="text-sm font-medium flex-1 text-left">{entry.label}</span>
                      {openGroups.has(entry.label) ? (
                        <ChevronDown className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      )}
                    </>
                  )}
                </button>
                {!sidebarCollapsed && openGroups.has(entry.label) && (
                  <div className="mt-1 ml-4 pl-3 border-l border-gray-200 space-y-1">
                    {entry.children.map(child => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        end={child.end}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors ${
                            isActive
                              ? 'bg-[#1a3a5c] text-white'
                              : 'text-gray-500 hover:bg-gray-100 hover:text-[#1a3a5c]'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <child.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                            <span className="text-sm font-medium">{child.label}</span>
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                key={entry.to}
                to={entry.to}
                end={entry.end}
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
                    <entry.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                    {!sidebarCollapsed && <span className="text-sm font-medium">{entry.label}</span>}
                  </>
                )}
              </NavLink>
            )
          )}
        </nav>

        {/* Footer */}
        <div className="py-4 px-3 border-t border-gray-100 space-y-1">
          <NavLink
            to={user?.role === 'professor' ? '/teacher/configuracoes' : user?.role === 'admin' ? '/admin/configuracoes' : '/dashboard/configuracoes'}
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
