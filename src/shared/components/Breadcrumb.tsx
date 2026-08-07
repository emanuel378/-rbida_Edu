import { Link } from 'react-router-dom'
import { Home, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../../features/auth/services/authStore'

interface BreadcrumbItem {
  label: string
  to?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const user = useAuthStore(s => s.user)
  const homeLink = user?.role === 'professor' ? '/teacher' : user?.role === 'admin' ? '/admin' : '/dashboard'

  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6">
      <Link to={homeLink} className="flex items-center gap-1 hover:text-gray-700 transition-colors">
        <Home className="w-4 h-4" />
        <span>Início</span>
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          {item.to && index < items.length - 1 ? (
            <Link to={item.to} className="hover:text-gray-700 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className={index === items.length - 1 ? 'font-semibold text-gray-900' : ''}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
