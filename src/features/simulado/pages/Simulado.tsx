import { useState, useEffect } from 'react'
import { useAuthStore } from '../../auth/services/authStore'
import { useCourseStore } from '../../courses/data/courseStore'
import { useQuestionStore } from '../../courses/data/questionStore'
import { useTeacherSimuladoStore } from '../../teacher/data/teacherSimuladoStore'
import { Clock, CheckCircle, ArrowRight, ArrowLeft, Trophy, RotateCcw, Play, FileText, AlertTriangle } from 'lucide-react'
import type { Question } from '../../courses/data/mock'

export default function Simulado() {
  const { user } = useAuthStore()
  const { courses, modules } = useCourseStore()
  const { questions, addResult } = useQuestionStore()
  const { simulados } = useTeacherSimuladoStore()
  const results = useQuestionStore(s => s.results)

  const [selectedSimuladoId, setSelectedSimuladoId] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [finished, setFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600)
  const [started, setStarted] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingSimuladoId, setPendingSimuladoId] = useState<string | null>(null)

  const selectedSimulado = simulados.find(s => s.id === selectedSimuladoId)
  const simuladoQuestions: Question[] = selectedSimulado
    ? questions.filter(q => selectedSimulado.questionIds.includes(q.id))
    : []

  const pendingSim = simulados.find(s => s.id === pendingSimuladoId)

  useEffect(() => {
    if (!started || finished) return
    if (timeLeft <= 0) {
      finishSimulado()
      return
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(timer)
  }, [started, timeLeft, finished])

  const finishSimulado = () => {
    setFinished(true)
    if (!user || !selectedSimulado) return
    const correct = simuladoQuestions.filter(q => answers[q.id] === q.correctAnswer).length
    addResult({
      userId: user.id,
      userName: user.name,
      score: correct,
      total: simuladoQuestions.length,
      date: new Date().toISOString(),
    })
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progress = simuladoQuestions.length > 0 ? ((currentIndex + 1) / simuladoQuestions.length) * 100 : 0

  const confirmStart = (simuladoId: string) => {
    setPendingSimuladoId(simuladoId)
    setShowConfirmModal(true)
  }

  const startSimulado = (simuladoId: string) => {
    const sim = simulados.find(s => s.id === simuladoId)
    if (!sim) return
    setSelectedSimuladoId(simuladoId)
    setTimeLeft(sim.timeLimit * 60)
    setStarted(true)
    setFinished(false)
    setCurrentIndex(0)
    setAnswers({})
    setShowConfirmModal(false)
    setPendingSimuladoId(null)
  }

  if (started && !finished) {
    const currentQ = simuladoQuestions[currentIndex]
    if (!currentQ) return null

    return (
      <div className="p-6 lg:p-8">
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600">
                {selectedSimulado?.title} - Questão {currentIndex + 1}/{simuladoQuestions.length}
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg ${
              timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' :
              timeLeft < 180 ? 'bg-yellow-50 text-yellow-600' :
              'bg-blue-50 text-blue-600'
            }`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
            <p className="text-lg font-medium text-gray-900 mb-6">{currentQ.question}</p>
            <div className="space-y-3">
              {currentQ.options.map((opt, i) => {
                const isSelected = answers[currentQ.id] === i
                return (
                  <button
                    key={i}
                    onClick={() => setAnswers({ ...answers, [currentQ.id]: i })}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {String.fromCharCode(97 + i)}
                      </span>
                      <span className="font-medium">{opt}</span>
                      {isSelected && <CheckCircle className="w-5 h-5 text-blue-500 ml-auto" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(i => i - 1)}
              className="flex items-center gap-2 px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </button>

            <span className="text-sm text-gray-500">
              {Object.keys(answers).length} de {simuladoQuestions.length} respondidas
            </span>

            {currentIndex < simuladoQuestions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex(i => i + 1)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Próxima
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={finishSimulado}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
              >
                <CheckCircle className="w-5 h-5" />
                Finalizar
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (finished) {
    const correct = simuladoQuestions.filter(q => answers[q.id] === q.correctAnswer).length
    const percentage = simuladoQuestions.length > 0 ? Math.round((correct / simuladoQuestions.length) * 100) : 0
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
              percentage >= 70 ? 'bg-green-100' : percentage >= 50 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <Trophy className={`w-12 h-12 ${
                percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">Resultado do Simulado</h1>
            <p className="text-gray-600 mb-8">
              {percentage === 100 ? 'Perfeito! Parabéns!' :
               percentage >= 70 ? 'Excelente desempenho!' :
               percentage >= 50 ? 'Bom trabalho, continue estudando!' :
               'Não desista, a prática leva à perfeição!'}
            </p>

            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-green-600">{correct}</p>
                <p className="text-sm text-gray-600">Acertos</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-red-600">{simuladoQuestions.length - correct}</p>
                <p className="text-sm text-gray-600">Erros</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-blue-600">{percentage}%</p>
                <p className="text-sm text-gray-600">Aproveitamento</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setStarted(false)
                  setFinished(false)
                  setSelectedSimuladoId(null)
                  setCurrentIndex(0)
                  setAnswers({})
                }}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                <RotateCcw className="w-5 h-5" />
                Voltar aos Simulados
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Simulados</h1>
            <p className="text-gray-600">Teste seus conhecimentos com simulados criados pelos professores</p>
          </div>

          {simulados.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum simulado disponível no momento.</p>
              <p className="text-sm text-gray-400 mt-2">Os professores ainda não criaram simulados.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {simulados.map(sim => {
                const simQuestions = questions.filter(q => sim.questionIds.includes(q.id))
                const module = sim.moduleId
                  ? modules.find(m => m.id === sim.moduleId)
                  : null
                const course = module
                  ? courses.find(c => c.id === module.courseId)
                  : null
                return (
                  <div key={sim.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{sim.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          {course && <span>{course.title}</span>}
                          {module && <span>• {module.title}</span>}
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-gray-600">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {sim.timeLimit} min
                          </span>
                          <span className="text-sm text-gray-600">
                            {simQuestions.length} questões
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => confirmStart(sim.id)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Play className="w-4 h-4" />
                        Iniciar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Últimos Resultados
              </h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-left font-medium text-gray-600">Nome</th>
                      <th className="p-4 text-left font-medium text-gray-600">Acertos</th>
                      <th className="p-4 text-left font-medium text-gray-600">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.slice(0, 5).map((r, i) => (
                      <tr key={i} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium text-gray-900">{r.userName}</td>
                        <td className="p-4">
                          <span className={`font-bold ${r.score / r.total >= 0.7 ? 'text-green-600' : 'text-orange-600'}`}>
                            {r.score}/{r.total}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500">{new Date(r.date).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showConfirmModal && pendingSim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Confirmar Início</h2>
              <p className="text-gray-600 mb-1">Você está prestes a iniciar o simulado:</p>
              <p className="font-bold text-gray-900 mb-4">{pendingSim.title}</p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tempo:</span>
                  <span className="font-medium">{pendingSim.timeLimit} minutos</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Questões:</span>
                  <span className="font-medium">{pendingSim.questionIds.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Módulo:</span>
                  <span className="font-medium">
                    {pendingSim.moduleId
                      ? modules.find(m => m.id === pendingSim.moduleId)?.title || 'N/A'
                      : 'Varias'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-red-500 mt-4">
                O tempo começará a contar assim que você clicar em "Iniciar".
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setPendingSimuladoId(null)
                }}
                className="flex-1 px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => startSimulado(pendingSim.id)}
                className="flex-1 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Iniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
