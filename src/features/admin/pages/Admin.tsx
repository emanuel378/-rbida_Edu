import { useAuthStore } from '../../auth/services/authStore'
import { useCourseStore } from '../../courses/data/courseStore'
import { ShieldCheck, Users, BookOpen, CheckCircle, Clock, XCircle, DollarSign, UserCheck, UserX, Search } from 'lucide-react'

export default function Admin() {
  const { users, approveTeacher } = useAuthStore()
  const { courses, approveCourse, rejectCourse, getTeacherName } = useCourseStore()

  const pendingCourses = courses.filter(c => c.status === 'pending')
  const approvedCourses = courses.filter(c => c.status === 'approved')
  const rejectedCourses = courses.filter(c => c.status === 'rejected')

  const allUsers = users || []
  const pendingTeachers = allUsers.filter(u => u.role === 'professor' && !u.approved)
  const approvedTeachers = allUsers.filter(u => u.role === 'professor' && u.approved)
  const students = allUsers.filter(u => u.role === 'aluno')

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
          Painel do Admin
        </h1>
        <p className="text-gray-600">Gerencie professores, cursos e preços</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
            <span className="text-sm font-medium text-gray-600">Cursos Aprovados</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{approvedCourses.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-gray-600">Pendentes</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{pendingCourses.length + pendingTeachers.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Professores</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{approvedTeachers.length}</p>
        </div>
      </div>

      {/* Pending Courses */}
      {pendingCourses.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              Cursos Pendentes de Aprovação
            </h2>
            <p className="text-sm text-gray-500 mt-1">Avalie o curso e o preço proposto pelo professor</p>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingCourses.map(course => (
              <div key={course.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-yellow-100 text-yellow-700 rounded-xl flex items-center justify-center font-bold">
                        {course.title.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{course.title}</p>
                        <p className="text-sm text-gray-500">{course.description || 'Sem descrição'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 ml-13">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {getTeacherName(course.teacherId)}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-green-600" />
                        <span className="font-medium text-gray-700">
                          {course.price > 0 ? `R$ ${course.price.toFixed(2)}` : 'Gratuito'}
                        </span>
                      </span>
                      <span className="text-gray-400">
                        {new Date(course.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => approveCourse(course.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Aprovar
                    </button>
                    <button
                      onClick={() => rejectCourse(course.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      <XCircle className="w-4 h-4" />
                      Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Teachers */}
      {pendingTeachers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-yellow-600" />
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

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Todos os Usuários
          </h2>
          <span className="text-sm text-gray-500">{allUsers.length} registros</span>
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
                      {u.role === 'admin' ? 'Admin' : u.role === 'professor' ? 'Professor' : 'Aluno'}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.role === 'professor'
                      ? (u.approved
                        ? <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" /> Aprovado</span>
                        : <span className="flex items-center gap-1 text-yellow-600"><Clock className="w-4 h-4" /> Pendente</span>
                      )
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Courses Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Cursos Aprovados ({approvedCourses.length})
            </h2>
          </div>
          {approvedCourses.length === 0 ? (
            <div className="p-6 text-center text-gray-400 py-12">
              <BookOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhum curso aprovado ainda</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {approvedCourses.map(course => (
                <div key={course.id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {course.title.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                    <p className="text-xs text-gray-500">{getTeacherName(course.teacherId)}</p>
                  </div>
                  <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                    {course.price > 0 ? `R$ ${course.price.toFixed(2)}` : 'Grátis'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Cursos Rejeitados ({rejectedCourses.length})
            </h2>
          </div>
          {rejectedCourses.length === 0 ? (
            <div className="p-6 text-center text-gray-400 py-12">
              <BookOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhum curso rejeitado</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {rejectedCourses.map(course => (
                <div key={course.id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 bg-red-100 text-red-700 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {course.title.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                    <p className="text-xs text-gray-500">{getTeacherName(course.teacherId)}</p>
                  </div>
                  <button
                    onClick={() => approveCourse(course.id)}
                    className="text-xs font-medium text-green-600 hover:text-green-700 px-2 py-1 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    Re-aprovar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
