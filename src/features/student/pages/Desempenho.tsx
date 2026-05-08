import { Trophy, Target, TrendingUp, TrendingDown, BarChart3, Award, Clock } from 'lucide-react'
import Breadcrumb from '../../../shared/components/Breadcrumb'

interface SubjectPerformance {
  subject: string
  correct: number
  total: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
}

const subjectData: SubjectPerformance[] = [
  { subject: 'Matemática', correct: 42, total: 50, percentage: 84, trend: 'up' },
  { subject: 'Português', correct: 35, total: 50, percentage: 70, trend: 'up' },
  { subject: 'Física', correct: 28, total: 45, percentage: 62, trend: 'down' },
  { subject: 'Química', correct: 30, total: 40, percentage: 75, trend: 'stable' },
  { subject: 'Biologia', correct: 25, total: 35, percentage: 71, trend: 'up' },
  { subject: 'História', correct: 38, total: 45, percentage: 84, trend: 'up' },
]

const simuladoHistory = [
  { date: '15/04', score: 72, total: 100 },
  { date: '22/04', score: 78, total: 100 },
  { date: '29/04', score: 81, total: 100 },
  { date: '06/05', score: 85, total: 100 },
]

export default function Desempenho() {
  const totalCorrect = subjectData.reduce((acc, s) => acc + s.correct, 0)
  const totalQuestions = subjectData.reduce((acc, s) => acc + s.total, 0)
  const overallPercentage = Math.round((totalCorrect / totalQuestions) * 100)
  const bestSubject = subjectData.reduce((prev, current) => (prev.percentage > current.percentage ? prev : current))
  const worstSubject = subjectData.reduce((prev, current) => (prev.percentage < current.percentage ? prev : current))

  const lastSimulado = simuladoHistory[simuladoHistory.length - 1]
  const firstSimulado = simuladoHistory[0]
  const improvement = lastSimulado.score - firstSimulado.score

  const getBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-blue-500'
    if (percentage >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />
    return <span className="text-gray-400 text-xs">—</span>
  }

  const maxScore = Math.max(...simuladoHistory.map((s) => s.score))

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <Breadcrumb items={[{ label: 'Desempenho' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          Desempenho
        </h1>
        <p className="text-gray-600 mt-2">
          Acompanhe sua evolução e identifique pontos de melhoria.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{overallPercentage}%</p>
              <p className="text-sm text-gray-500">Aproveitamento</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalCorrect}/{totalQuestions}</p>
              <p className="text-sm text-gray-500">Questões corretas</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{lastSimulado.score}%</p>
              <p className="text-sm text-gray-500">Último simulado</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              improvement >= 0 ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {improvement >= 0 ? (
                <TrendingUp className={`w-5 h-5 ${improvement >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <p className={`text-2xl font-bold ${improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {improvement >= 0 ? '+' : ''}{improvement}%
              </p>
              <p className="text-sm text-gray-500">Evolução</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Subject Performance */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Desempenho por Módulo</h2>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              {subjectData.map((subject) => (
                <div key={subject.subject} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-medium text-gray-700 truncate">
                    {subject.subject}
                  </div>
                  <div className="flex-1">
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getBarColor(subject.percentage)}`}
                        style={{ width: `${subject.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm font-semibold text-gray-900">
                    {subject.percentage}%
                  </div>
                  <div className="w-6">
                    {getTrendIcon(subject.trend)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Highlights */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-green-500" />
              <h3 className="text-sm font-semibold text-gray-900">Melhor Módulo</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{bestSubject.subject}</p>
            <p className="text-sm text-gray-500">{bestSubject.percentage}% de acerto</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-orange-500" />
              <h3 className="text-sm font-semibold text-gray-900">Precisa Melhorar</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{worstSubject.subject}</p>
            <p className="text-sm text-gray-500">{worstSubject.percentage}% de acerto</p>
          </div>
        </div>
      </div>

      {/* Simulado History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Histórico de Simulados</h2>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            {simuladoHistory.map((simulado) => (
              <div key={simulado.date} className="flex items-center gap-4">
                <div className="w-12 text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {simulado.date}
                </div>
                <div className="flex-1">
                  <div className="w-full h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                    <div
                      className={`h-full rounded-lg transition-all duration-500 ${
                        simulado.score === maxScore
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${simulado.score}%` }}
                    />
                    <span className="absolute inset-0 flex items-center px-3 text-xs font-semibold text-gray-700">
                      {simulado.score}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
