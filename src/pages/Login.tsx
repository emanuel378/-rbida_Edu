import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { mockUsers } from '../data/mock'
import { LogIn, User, ShieldCheck, BookOpen } from 'lucide-react'

export default function Login() {
  const [selectedUserId, setSelectedUserId] = useState('')
  const login = useAuthStore(s => s.login)
  const navigate = useNavigate()

  const handleLogin = () => {
    const user = mockUsers.find(u => u.id === selectedUserId)
    if (user) {
      login(user)
      if (user.role === 'professor' && !user.approved) {
        navigate('/pending')
      } else {
        navigate('/dashboard')
      }
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <ShieldCheck className="w-4 h-4" />
      case 'professor': return <BookOpen className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-purple-600 bg-purple-50'
      case 'professor': return 'text-blue-600 bg-blue-50'
      default: return 'text-green-600 bg-green-50'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo-full.png" alt="ÓrbitaEdu" className="w-80 mx-auto mb-6 rounded-2xl shadow-lg shadow-blue-200" />
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center gap-2 mb-6">
            <LogIn className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Acesso ao Sistema</h2>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Selecione seu usuário:</p>
            {mockUsers.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedUserId === u.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  selectedUserId === u.id ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {getRoleIcon(u.role)}
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-medium ${
                    selectedUserId === u.id ? 'text-blue-900' : 'text-gray-900'
                  }`}>{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(u.role)}`}>
                  {u.role}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={handleLogin}
            disabled={!selectedUserId}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            <LogIn className="w-5 h-5" />
            Entrar
          </button>

          <p className="text-center text-xs text-gray-500 mt-4">
            Este é um ambiente de simulação. Selecione um usuário para entrar.
          </p>
        </div>
      </div>
    </div>
  )
}
