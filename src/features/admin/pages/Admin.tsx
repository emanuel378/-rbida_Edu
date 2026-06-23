import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../auth/services/authStore'
import { useCourseStore } from '../../courses/data/courseStore'
import { ShieldCheck, Users, BookOpen, CheckCircle, Clock, XCircle, DollarSign, UserCheck, UserX, Ban, Trash2, Globe, Download } from 'lucide-react'
import { generateId } from '../../../lib/id'

function exportStudentsCSV(users: any[], enrollments: any[], courses: any[]) {
  const alunos = users.filter(u => u.role === 'aluno')
  let csv = 'Nome,Email,Cursos Matriculados\n'
  alunos.forEach(a => {
    const enrolled = enrollments.filter(e => e.userId === a.id)
    const courseNames = enrolled.map(e => courses.find(c => c.id === e.courseId)?.title || 'Desconhecido').join('; ')
    csv += `"${a.name}","${a.email}","${courseNames}"\n`
  })
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'relatorio-alunos.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export default function Admin() {
  const navigate = useNavigate()
  const { users, approveTeacher } = useAuthStore()
  const { courses, messages, enrollments, approveCourse, rejectCourse, getTeacherName, adminSetCoursePrice, adminApprovePublish, adminApproveDeletion, adminRejectRequest } = useCourseStore()
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({})

  const pendingCourses = courses.filter(c => c.status === 'pending')
  const approvedCourses = courses.filter(c => c.status === 'approved')
  const rejectedCourses = courses.filter(c => c.status === 'rejected')

  const allUsers = users || []
  const pendingTeachers = allUsers.filter(u => u.role === 'professor' && !u.approved)
  const approvedTeachers = allUsers.filter(u => u.role === 'professor' && u.approved)
  const alunos = allUsers.filter(u => u.role === 'aluno')

  const priceRequests = messages.filter(m => m.type === 'price_request' && m.status === 'pending')
  const deleteRequests = messages.filter(m => m.type === 'delete_request' && m.status === 'pending')
  const publishRequests = messages.filter(m => m.type === 'publish_request' && m.status === 'pending')

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



      {/* Price Requests */}
      {priceRequests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Solicitações de Preço
            </h2>
            <p className="text-sm text-gray-500 mt-1">Professores criaram novos cursos. Defina o preço para aprová-los.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {priceRequests.map(msg => {
              const course = courses.find(c => c.id === msg.courseId)
              if (!course) return null
              return (
                <div key={msg.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold">
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
                        <span className="text-gray-400">
                          {new Date(course.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">R$</span>
                        <input
                          value={priceInputs[msg.id] || ''}
                          onChange={e => setPriceInputs({ ...priceInputs, [msg.id]: e.target.value })}
                          type="number" step="0.01" min="0"
                          placeholder="0,00"
                          className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const price = parseFloat(priceInputs[msg.id]) || 0
                          adminSetCoursePrice(course.id, price, msg.id)
                        }}
                        disabled={!priceInputs[msg.id] || parseFloat(priceInputs[msg.id]) < 0}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Definir Preço e Aprovar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Deletion Requests */}
      {deleteRequests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Solicitações de Exclusão
            </h2>
            <p className="text-sm text-gray-500 mt-1">Professores solicitaram exclusão de conteúdos. Autorize ou recuse.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {deleteRequests.map(msg => {
              const course = courses.find(c => c.id === msg.courseId)
              if (!course) return null
              const typeLabel = { course: 'Curso', module: 'Módulo', lesson: 'Aula', question: 'Questão' }[msg.targetType || 'course']
              const typeColors: Record<string, string> = {
                course: 'bg-red-100 text-red-700',
                module: 'bg-green-100 text-green-700',
                lesson: 'bg-purple-100 text-purple-700',
                question: 'bg-orange-100 text-orange-700',
              }
              const colorClass = typeColors[msg.targetType || 'course']
              return (
                <div key={msg.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 ${colorClass} rounded-xl flex items-center justify-center font-bold text-xs`}>
                          {typeLabel.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>{typeLabel}</span>
                            <p className="font-medium text-gray-900">{msg.targetName || course.title}</p>
                          </div>
                          <p className="text-sm text-gray-500">Curso: {course.title} · Professor: {getTeacherName(course.teacherId)}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 ml-13">{msg.text}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => adminApproveDeletion(msg.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Aprovar Exclusão
                      </button>
                      <button
                        onClick={() => adminRejectRequest(msg.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors text-sm font-medium"
                      >
                        <Ban className="w-4 h-4" />
                        Recusar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Publish Requests */}
      {publishRequests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Solicitações de Publicação
            </h2>
            <p className="text-sm text-gray-500 mt-1">Professores solicitaram publicação de cursos na vitrine.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {publishRequests.map(msg => {
              const course = courses.find(c => c.id === msg.courseId)
              if (!course) return null
              return (
                <div key={msg.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold">
                          {course.title.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{course.title}</p>
                          <p className="text-sm text-gray-500">
                            Professor: {getTeacherName(course.teacherId)} · Preço: R$ {course.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 ml-13">{msg.text}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => adminApprovePublish(msg.id, course.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        <Globe className="w-4 h-4" />
                        Publicar
                      </button>
                      <button
                        onClick={() => adminRejectRequest(msg.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors text-sm font-medium"
                      >
                        <Ban className="w-4 h-4" />
                        Recusar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pending Courses */}
      {pendingCourses.filter(c => !messages.some(m => m.courseId === c.id && m.type === 'price_request' && m.status === 'pending')).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              Cursos Pendentes de Aprovação
            </h2>
            <p className="text-sm text-gray-500 mt-1">Cursos com preço já definido aguardando aprovação final</p>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingCourses.filter(c => !messages.some(m => m.courseId === c.id && m.type === 'price_request' && m.status === 'pending')).map(course => (
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

      {/* Students Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            Alunos Matriculados ({alunos.length})
          </h2>
          <button onClick={() => exportStudentsCSV(allUsers, enrollments, courses)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium">
            <Download className="w-4 h-4" /> Exportar Planilha
          </button>
        </div>
        {alunos.length === 0 ? (
          <div className="p-6 text-center text-gray-400 py-12">
            <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Nenhum aluno cadastrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left font-medium text-gray-600">Aluno</th>
                  <th className="p-4 text-left font-medium text-gray-600">Email</th>
                  <th className="p-4 text-left font-medium text-gray-600">Cursos Matriculados</th>
                  <th className="p-4 text-left font-medium text-gray-600">Total Gasto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alunos.map(a => {
                  const enrolled = enrollments.filter(e => e.userId === a.id)
                  const enrolledCourses = enrolled.map(e => courses.find(c => c.id === e.courseId)).filter(Boolean)
                  const total = enrolledCourses.reduce((sum, c) => sum + (c?.price || 0), 0)
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-xs font-bold">
                            {a.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{a.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{a.email}</td>
                      <td className="p-4">
                        {enrolledCourses.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {enrolledCourses.map(c => (
                              <span key={c!.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                {c!.title}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">Nenhum</span>
                        )}
                      </td>
                      <td className="p-4 font-medium text-gray-700">
                        R$ {total.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
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
              {approvedCourses.map(course => {
                const hasPendingPublish = messages.some(m => m.courseId === course.id && m.type === 'publish_request' && m.status === 'pending')
                return (
                  <div key={course.id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/teacher/course/${course.id}`)}>
                    <div className="w-8 h-8 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {course.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                      <p className="text-xs text-gray-500">{getTeacherName(course.teacherId)}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${
                      course.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {course.published ? <Globe className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {course.published ? 'Publicado' : 'Não publicado'}
                    </span>
                    <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
                      {course.price > 0 ? `R$ ${course.price.toFixed(2)}` : 'Grátis'}
                    </span>
                    {!course.published && !hasPendingPublish && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const admin = allUsers.find(u => u.role === 'admin')
                          if (!admin) return
                          const msgId = generateId()
                          useCourseStore.getState().addMessage({
                            id: msgId,
                            courseId: course.id,
                            fromUserId: admin.id,
                            fromUserName: admin.name,
                            toTeacherId: admin.id,
                            text: `Publicação direta pelo admin ${admin.name}`,
                            createdAt: new Date().toISOString(),
                            type: 'publish_request',
                            status: 'pending',
                            targetType: 'course',
                            targetName: course.title,
                          })
                          adminApprovePublish(msgId, course.id)
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-xs font-medium">
                        <Globe className="w-3 h-3" /> Publicar
                      </button>
                    )}
                    {hasPendingPublish && (
                      <span className="text-xs font-medium text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">
                        Solic. enviada
                      </span>
                    )}
                  </div>
                )
              })}
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
