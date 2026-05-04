import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Loader2 } from 'lucide-react'

interface Props {
  children: React.ReactNode
  roles?: ('aluno' | 'professor' | 'admin')[]
}

export default function ProtectedRoute({ children, roles }: Props) {
  const user = useAuthStore(s => s.user)

  if (!user) return <Navigate to="/login" replace />

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  if (user.role === 'professor' && !user.approved) {
    return <Navigate to="/pending" replace />
  }

  return <>{children}</>
}

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>
  )
}
