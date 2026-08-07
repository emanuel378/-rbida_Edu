import { useAuthStore } from '../../auth/services/authStore'
import { useCourseStore } from '../../courses/data/courseStore'
import { BarChart3 } from 'lucide-react'
import Breadcrumb from '../../../shared/components/Breadcrumb'

export default function AdminAnalytics() {
  const { users } = useAuthStore()
  const { courses, enrollments } = useCourseStore()

  const approvedCourses = courses.filter(c => c.status === 'approved')
  const allUsers = users || []
  const alunos = allUsers.filter(u => u.role === 'aluno')

  const totalRevenue = enrollments.reduce((sum, e) => {
    const c = courses.find(c => c.id === e.courseId)
    return sum + (c?.price || 0)
  }, 0)

  const revenueByCourse = courses.map(c => ({
    ...c,
    revenue: enrollments.filter(e => e.courseId === c.id).length * c.price,
    students: enrollments.filter(e => e.courseId === c.id).length,
  })).filter(r => r.students > 0)

  const maxRevenue = Math.max(...revenueByCourse.map(r => r.revenue), 1)

  const monthEntries = (() => {
    const months: Record<string, number> = {}
    enrollments.forEach(e => {
      if (!e.createdAt) return
      const m = new Date(e.createdAt).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' })
      months[m] = (months[m] || 0) + 1
    })
    return Object.entries(months).sort((a, b) => a[0].localeCompare(b[0]))
  })()

  const maxMonth = Math.max(...monthEntries.map(([, v]) => v), 1)

  const pop = courses.map(c => ({
    title: c.title,
    count: enrollments.filter(e => e.courseId === c.id).length,
  })).filter(p => p.count > 0)

  const maxPop = Math.max(...pop.map(p => p.count), 1)

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <Breadcrumb items={[{ label: 'Analytics & Financeiro' }]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          Analytics & Financeiro
        </h1>
        <p className="text-gray-600">Acompanhe o desempenho da plataforma, matrículas e receitas.</p>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white">
          <p className="text-blue-200 text-sm font-medium mb-1">Receita Total</p>
          <p className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</p>
          <p className="text-blue-200 text-xs mt-1">{enrollments.length} matrículas</p>
        </div>
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-5 text-white">
          <p className="text-green-200 text-sm font-medium mb-1">Alunos</p>
          <p className="text-2xl font-bold">{alunos.length}</p>
          <p className="text-green-200 text-xs mt-1">{allUsers.length} usuários totais</p>
        </div>
        <div className="bg-gradient-to-br from-purple-600 to-pink-700 rounded-xl p-5 text-white">
          <p className="text-purple-200 text-sm font-medium mb-1">Cursos</p>
          <p className="text-2xl font-bold">{courses.length}</p>
          <p className="text-purple-200 text-xs mt-1">{approvedCourses.length} ativos</p>
        </div>
        <div className="bg-gradient-to-br from-orange-600 to-amber-700 rounded-xl p-5 text-white">
          <p className="text-orange-200 text-sm font-medium mb-1">Matrículas</p>
          <p className="text-2xl font-bold">{enrollments.length}</p>
          <p className="text-orange-200 text-xs mt-1">{enrollments.filter(e => e.progress === 100).length} concluídas</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div className="p-6 space-y-8">
          {/* Revenue per Course Chart */}
          {revenueByCourse.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4">Receita por Curso</h3>
              <div className="space-y-3">
                {revenueByCourse.map(r => (
                  <div key={r.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{r.title}</span>
                      <span className="text-gray-500">R$ {r.revenue.toFixed(2)} ({r.students} alunos)</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${(r.revenue / maxRevenue) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Enrollments Chart */}
          {monthEntries.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4">Matrículas por Mês</h3>
              <div className="flex items-end gap-3 h-40">
                {monthEntries.map(([month, count]) => (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-xs font-medium text-gray-600">{count}</span>
                    <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md transition-all duration-500 min-h-[4px]"
                      style={{ height: `${(count / maxMonth) * 100}%` }} />
                    <span className="text-[10px] text-gray-400 text-center leading-tight">{month}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Course Popularity */}
          {pop.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4">Cursos Mais Populares</h3>
              <div className="space-y-3">
                {pop.sort((a, b) => b.count - a.count).map(p => (
                  <div key={p.title}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{p.title}</span>
                      <span className="text-gray-500">{p.count} alunos</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${(p.count / maxPop) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Student Last Access Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Último Acesso dos Alunos</h2>
        </div>
        {alunos.length === 0 ? (
          <div className="p-6 text-center text-gray-400 py-12">
            <p className="text-sm">Nenhum aluno cadastrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left font-medium text-gray-600">Aluno</th>
                  <th className="p-3 text-left font-medium text-gray-600">Email</th>
                  <th className="p-3 text-left font-medium text-gray-600">Último Acesso</th>
                  <th className="p-3 text-left font-medium text-gray-600">Cursos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alunos.map(a => {
                  const lastLogin = a.lastLogin ? new Date(a.lastLogin).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  }) : 'Nunca acessou'
                  const enrolledCount = enrollments.filter(e => e.userId === a.id).length
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-medium text-gray-900">{a.name}</td>
                      <td className="p-3 text-gray-600">{a.email}</td>
                      <td className="p-3">
                        <span className={`text-sm ${a.lastLogin ? 'text-gray-700' : 'text-gray-400'}`}>
                          {lastLogin}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          enrolledCount > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {enrolledCount} curso{enrolledCount !== 1 ? 's' : ''}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
