import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../auth/services/authStore'
import QuestionBank from './QuestionBank'

export default function PublicQuestions() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <img src="/logo-full.png" alt="ÓrbitaEdu" className="h-14 w-auto" />
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                Ir para o Dashboard
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="text-gray-700 hover:text-blue-600 transition-colors text-sm font-medium px-4 py-2"
                >
                  Entrar
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
                >
                  Criar conta grátis
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <QuestionBank />
    </div>
  )
}
