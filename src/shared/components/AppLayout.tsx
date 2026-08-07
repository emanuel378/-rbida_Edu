import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useUiStore } from '../../features/dashboard/store/uiStore'
import { useAuthStore } from '../../features/auth/services/authStore'
import Sidebar from './Sidebar'

const SESSION_CHECK_INTERVAL_MS = 30_000

export default function AppLayout() {
  const { sidebarCollapsed } = useUiStore()
  const user = useAuthStore(s => s.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.role !== 'aluno') return

    const check = async () => {
      const ok = await useAuthStore.getState().checkSingleSession()
      if (!ok) navigate('/login', { replace: true, state: { kicked: true } })
    }

    check()
    const interval = setInterval(check, SESSION_CHECK_INTERVAL_MS)
    const onFocus = () => check()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [user?.role, navigate])

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main
        className={`transition-all duration-300 min-h-screen ${
          sidebarCollapsed ? 'ml-[68px]' : 'ml-[220px]'
        }`}
      >
        <Outlet />
      </main>
    </div>
  )
}
