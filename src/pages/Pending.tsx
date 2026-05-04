import { Clock, Mail, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Pending() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-orange-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-200">
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Aguardando Aprovação</h1>
          <p className="text-gray-600">Seu cadastro como professor está pendente de aprovação pelo administrador.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl">
              <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                <strong>Status:</strong> Pendente
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
              <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                Você receberá uma notificação quando seu cadastro for aprovado.
              </p>
            </div>
          </div>

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Login
          </Link>
        </div>
      </div>
    </div>
  )
}
