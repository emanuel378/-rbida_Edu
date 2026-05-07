import { useAuthStore } from '../../auth/services/authStore'
import { mockUsers } from '../../courses/data/mock'
import { useCourseStore } from '../../courses/data/courseStore'
import { ShieldCheck, Users, BookOpen, CheckCircle, Clock, User, Mail, Calendar } from 'lucide-react'

export default function Admin() {
  const { users, approveTeacher } = useAuthStore()
  const { courses } = useCourseStore()

  const storedUsers = users || []
  const allUsers = [...mockUsers, ...storedUsers]
  const allCourses = [...courses]

  const pendingTeachers = allUsers.filter(u => u.role === 'professor' && !u.approved)
  const approvedTeachers = allUsers.filter(u => u.role === 'professor' && u.approved)
  const students = allUsers.filter(u => u.role === 'aluno')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
          Painel do Admin
        </h1>
        <p className="text-gray-600">Gerencie usuários e visualize cursos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Total de Usuários</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{allUsers.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Cursos Criados</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{allCourses.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-gray-600">Pendentes</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{pendingTeachers.length}</p>
        </div>
      </div>

      {pendingTeachers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              Professores Pendentes de Aprovação
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingTeachers.map(u => (
              <div key={u.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-yellow-100 text-yellow-700 rounded-xl flex items-center justify-center font-bold">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{u.name}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => approveTeacher(u.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprovar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Todos os Usuários
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left font-medium text-gray-600">Usuário</th>
                <th className="p-4 text-left font-medium text-gray-600">Email</th>
                <th className="p-4 text-left font-medium text-gray-600">Tipo</th>
                <th className="p-4 text-left font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'professor' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">{u.email}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'professor' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.role === 'professor'
                      ? (u.approved
                        ? <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" /> Aprovado</span>
                        : <span className="flex items-center gap-1 text-yellow-600"><Clock className="w-4 h-4" /> Pendente</span>
                      )
                      : '-'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-green-600" />
            Cursos Criados
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left font-medium text-gray-600">Título</th>
                <th className="p-4 text-left font-medium text-gray-600">Descrição</th>
                <th className="p-4 text-left font-medium text-gray-600">Professor</th>
                <th className="p-4 text-left font-medium text-gray-600">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allCourses.map(c => {
                const teacher = allUsers.find(u => u.id === c.teacherId)
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{c.title}</td>
                    <td className="p-4 text-gray-600">{c.description}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded flex items-center justify-center text-xs font-bold">
                          {teacher?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span className="text-gray-700">{teacher?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
