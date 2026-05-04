import { Outlet } from 'react-router-dom'
import { useUiStore } from '../../store/uiStore'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const { sidebarCollapsed } = useUiStore()

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
