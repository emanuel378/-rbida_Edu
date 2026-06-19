import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuestionStore } from '../../courses/data/questionStore'
import { useCourseStore } from '../../courses/data/courseStore'
import { useAuthStore } from '../../auth/services/authStore'
import type { Question } from '../../courses/data/mock'
import Breadcrumb from '../../../shared/components/Breadcrumb'
import { ArrowLeft, CheckCircle, XCircle, Play, FileText, HelpCircle, BarChart3 } from 'lucide-react'

function DonutChart({ percentage, size = 120 }: { percentage: number; size?: number }) {
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference
  const center = size / 2

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={percentage >= 60 ? '#22c55e' : percentage >= 40 ? '#eab308' : '#ef4444'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-lg font-bold text-gray-900">
        {percentage}%
      </span>
    </div>
  )
}

const LETTERS = ['A', 'B', 'C', 'D', 'E']

export default function QuestionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { questions, questionStats, recordAnswer } = useQuestionStore()
  const { modules, topics } = useCourseStore()

  const question = questions.find(q => q.id === id)

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [showStats, setShowStats] = useState(false)

  if (!question) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: 'Banco de Questões', to: '/dashboard/questions' }, { label: 'Questão' }]} />
        <div className="text-center py-20">
          <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Questão não encontrada</p>
          <button
            onClick={() => navigate('/dashboard/questions')}
            className="mt-4 text-blue-600 hover:underline text-sm"
          >
            Voltar ao Banco de Questões
          </button>
        </div>
      </div>
    )
  }

  const stats = questionStats.find(s => s.questionId === question.id)
  const overallPercentage = stats ? Math.round((stats.correct / stats.total) * 100) : 0
  const getModuleName = (moduleId?: string) => modules.find(m => m.id === moduleId)?.title
  const getTopicName = (topicId?: string) => topics.find(t => t.id === topicId)?.title

  const handleAnswer = () => {
    if (selectedAnswer === null) return
    setAnswered(true)
    recordAnswer({
      questionId: question.id,
      selectedAnswer,
      correct: selectedAnswer === question.correctAnswer,
      userId: user?.id || 'unknown',
      timestamp: new Date().toISOString(),
    })
  }

  const handleRetry = () => {
    setSelectedAnswer(null)
    setAnswered(false)
  }

  const moduleName = getModuleName(question.moduleId)
  const topicName = getTopicName(question.topicId)
  const hasResolution = question.aulaRelacionada || (question.materialUrl && question.materialType === 'pdf')

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <Breadcrumb items={[
        { label: 'Banco de Questões', to: '/dashboard/questions' },
        { label: `Questão ${question.code || ''}` },
      ]} />

      <button
        onClick={() => navigate('/dashboard/questions')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao Banco de Questões
      </button>

      {/* Header - Metadados */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {question.banca && (
                <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-medium backdrop-blur-sm">
                  {question.banca}
                </span>
              )}
              {question.nivel && (
                <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-medium backdrop-blur-sm">
                  {question.nivel}
                </span>
              )}
              {question.ano && (
                <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-medium backdrop-blur-sm">
                  {question.ano}
                </span>
              )}
              {moduleName && (
                <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-medium backdrop-blur-sm">
                  {moduleName}
                </span>
              )}
            </div>
            <span className="text-white/80 text-xs font-mono bg-white/10 px-3 py-1 rounded-lg">
              {question.code || 'Sem código'}
            </span>
          </div>
        </div>
      </div>

      {/* Question Body */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 space-y-6">
          {topicName && (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
                {topicName}
              </span>
            </div>
          )}

          <div className="prose prose-sm max-w-none">
            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-lg">
              {question.question}
            </p>
          </div>

          <div className="space-y-3">
            {question.options.map((opt, i) => {
              const isCorrect = i === question.correctAnswer
              const isSelected = i === selectedAnswer
              let border = 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              let bg = 'bg-white'
              let radioBg = 'border-gray-300'
              let ring = ''

              if (answered) {
                if (isCorrect) {
                  border = 'border-green-300 bg-green-50'
                  radioBg = 'border-green-500 bg-green-500'
                  ring = 'ring-2 ring-green-200'
                } else if (isSelected && !isCorrect) {
                  border = 'border-red-300 bg-red-50'
                  radioBg = 'border-red-500 bg-red-500'
                  ring = 'ring-2 ring-red-200'
                } else {
                  border = 'border-gray-200 bg-gray-50 opacity-60'
                  radioBg = 'border-gray-300'
                }
              } else if (isSelected) {
                border = 'border-blue-400 bg-blue-50'
                radioBg = 'border-blue-500 bg-blue-500'
                ring = 'ring-2 ring-blue-200'
              }

              return (
                <button
                  key={i}
                  disabled={answered}
                  onClick={() => setSelectedAnswer(i)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${border} ${ring}`}
                >
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                    answered && isCorrect
                      ? 'bg-green-500 text-white'
                      : answered && isSelected && !isCorrect
                        ? 'bg-red-500 text-white'
                        : isSelected
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                  }`}>
                    {answered && isCorrect ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : answered && isSelected && !isCorrect ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      LETTERS[i]
                    )}
                  </span>
                  <span className="text-gray-700 flex-1">{opt}</span>
                  {answered && isCorrect && (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                  {answered && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                </button>
              )
            })}
          </div>

          {answered && (
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${
              selectedAnswer === question.correctAnswer
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {selectedAnswer === question.correctAnswer ? (
                <><CheckCircle className="w-6 h-6 flex-shrink-0" /><div><p className="font-semibold">Resposta Correta!</p><p className="text-sm opacity-80">Você acertou esta questão.</p></div></>
              ) : (
                <><XCircle className="w-6 h-6 flex-shrink-0" /><div><p className="font-semibold">Resposta Incorreta</p><p className="text-sm opacity-80">A alternativa correta é a <strong>{LETTERS[question.correctAnswer]}</strong>.</p></div></>
              )}
            </div>
          )}

          {answered && question.gabaritoComentado && (
            <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Gabarito Comentado</p>
              <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">{question.gabaritoComentado}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            {!answered ? (
              <button
                onClick={handleAnswer}
                disabled={selectedAnswer === null}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5" />
                Confirmar Resposta
              </button>
            ) : (
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Responder Novamente
              </button>
            )}
            {answered && (
              <button
                onClick={() => setShowStats(!showStats)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-colors font-medium text-sm border ${
                  showStats ? 'bg-purple-50 border-purple-200 text-purple-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                {showStats ? 'Ocultar Estatísticas' : 'Ver Estatísticas'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resolution Area */}
      {hasResolution && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Resolução</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              {question.aulaRelacionada && (
                <a
                  href={question.aulaRelacionada}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-5 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl hover:bg-red-100 transition-colors font-medium text-sm"
                >
                  <Play className="w-5 h-5" />
                  Resolução em Vídeo
                </a>
              )}
              {question.materialUrl && question.materialType === 'pdf' && (
                <a
                  href={question.materialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-5 py-3 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl hover:bg-orange-100 transition-colors font-medium text-sm"
                >
                  <FileText className="w-5 h-5" />
                  Resolução em PDF
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {answered && showStats && stats && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Estatísticas da Questão</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Donut Chart - Performace geral */}
              <div className="flex flex-col items-center justify-center">
                <p className="text-sm font-medium text-gray-600 mb-4">Percentual de Acertos</p>
                <DonutChart percentage={overallPercentage} size={140} />
                <p className="text-sm text-gray-500 mt-3">
                  {stats.correct} de {stats.total} alunos acertaram
                </p>
              </div>

              {/* Distribution Table */}
              <div>
                <p className="text-sm font-medium text-gray-600 mb-4">Distribuição de Respostas</p>
                <div className="space-y-3">
                  {question.options.map((opt, i) => {
                    const count = stats.answers[i] || 0
                    const pct = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : '0.0'
                    const isCorrect = i === question.correctAnswer
                    return (
                      <div key={i} className={`p-3 rounded-xl border ${isCorrect ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                              isCorrect ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {LETTERS[i]}
                            </span>
                            <span className={`text-sm ${isCorrect ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                              {opt}
                              {isCorrect && <span className="ml-1 text-green-500">✓</span>}
                            </span>
                          </div>
                          <span className={`text-sm font-semibold ${isCorrect ? 'text-green-700' : 'text-gray-700'}`}>
                            {pct}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCorrect ? 'bg-green-500' : 'bg-blue-400'
                            }`}
                            style={{ width: `${Math.max(parseFloat(pct), 1)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
