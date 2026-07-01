import { useMemo } from 'react'
import { useAuthStore } from '../../auth/services/authStore'
import { useQuestionStore } from '../../courses/data/questionStore'
import Breadcrumb from '../../../shared/components/Breadcrumb'
import { Trophy, Target, TrendingUp, TrendingDown, BarChart3, Award, CheckCircle, XCircle } from 'lucide-react'

const MODULE_LABELS: Record<string, string> = {
  conhecimentos_educacionais: 'Conhecimentos Educacionais',
  legislacao: 'Legislação',
  portugues: 'Português',
}

interface ModulePerf {
  moduleId: string
  label: string
  correct: number
  total: number
  percentage: number
}

export default function Desempenho() {
  const { user } = useAuthStore()
  const { questions, getAnswerHistory } = useQuestionStore()

  const history = getAnswerHistory(user?.id)

  const modulePerformance = useMemo(() => {
    const map = new Map<string, ModulePerf>()

    history.forEach(r => {
      const q = questions.find(q => q.id === r.questionId)
      const moduleId = q?.moduleId || 'unknown'
      const label = MODULE_LABELS[moduleId] || moduleId
      const existing = map.get(moduleId)
      if (existing) {
        existing.total += 1
        if (r.correct) existing.correct += 1
        existing.percentage = Math.round((existing.correct / existing.total) * 100)
      } else {
        map.set(moduleId, {
          moduleId,
          label,
          correct: r.correct ? 1 : 0,
          total: 1,
          percentage: r.correct ? 100 : 0,
        })
      }
    })

    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [history, questions])

  const totalCorrect = history.filter(r => r.correct).length
  const totalAnswered = history.length
  const overallPercentage = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0

  const bestModule = modulePerformance.length > 0
    ? modulePerformance.reduce((prev, curr) => curr.percentage > prev.percentage ? curr : prev)
    : null
  const worstModule = modulePerformance.length > 0
    ? modulePerformance.reduce((prev, curr) => curr.percentage < prev.percentage ? curr : prev)
    : null

  const recentHistory = useMemo(() => {
    return [...history]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  }, [history])

  const getBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-blue-500'
    if (percentage >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

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
          Acompanhe sua evolução nas questões que você respondeu.
        </p>
      </div>

      {totalAnswered === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg font-medium">Nenhum dado de desempenho ainda</p>
          <p className="text-gray-400 text-sm mt-1">Responda questões no Banco de Questões para ver seu desempenho aqui.</p>
        </div>
      ) : (
        <>
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
                  <p className="text-2xl font-bold text-gray-900">{totalCorrect}/{totalAnswered}</p>
                  <p className="text-sm text-gray-500">Questões corretas</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalAnswered}</p>
                  <p className="text-sm text-gray-500">Questões respondidas</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalAnswered - totalCorrect}</p>
                  <p className="text-sm text-gray-500">Questões erradas</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Module Performance */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Desempenho por Disciplina</h2>
              </div>
              <div className="p-5">
                {modulePerformance.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">Nenhuma disciplina com questões respondidas.</p>
                ) : (
                  <div className="space-y-4">
                    {modulePerformance.map((mod) => (
                      <div key={mod.moduleId} className="flex items-center gap-4">
                        <div className="w-32 text-sm font-medium text-gray-700 truncate">
                          {mod.label}
                        </div>
                        <div className="flex-1">
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${getBarColor(mod.percentage)}`}
                              style={{ width: `${mod.percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-12 text-right text-sm font-semibold text-gray-900">
                          {mod.percentage}%
                        </div>
                        <div className="text-xs text-gray-400 w-16 text-right">
                          {mod.correct}/{mod.total}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Highlights */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-5 h-5 text-green-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Melhor Disciplina</h3>
                </div>
                {bestModule ? (
                  <>
                    <p className="text-2xl font-bold text-gray-900">{bestModule.label}</p>
                    <p className="text-sm text-gray-500">{bestModule.percentage}% de acerto ({bestModule.correct}/{bestModule.total})</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Nenhum dado</p>
                )}
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-5 h-5 text-orange-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Precisa Melhorar</h3>
                </div>
                {worstModule ? (
                  <>
                    <p className="text-2xl font-bold text-gray-900">{worstModule.label}</p>
                    <p className="text-sm text-gray-500">{worstModule.percentage}% de acerto ({worstModule.correct}/{worstModule.total})</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Nenhum dado</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent History */}
          {recentHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Últimas Questões Respondidas</h2>
              </div>
              <div className="p-5">
                <div className="space-y-2">
                  {recentHistory.map((r, idx) => {
                    const q = questions.find(q => q.id === r.questionId)
                    const date = new Date(r.timestamp)
                    const dateStr = date.toLocaleDateString('pt-BR')
                    return (
                      <div key={`${r.questionId}-${idx}`} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${r.correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {r.correct ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{q?.question || 'Questão removida'}</p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">{dateStr}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
