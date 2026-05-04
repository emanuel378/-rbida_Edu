import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useCourseStore } from '../store/courseStore'
import { useQuestionStore } from '../store/questionStore'
import { Clock, CheckCircle, XCircle, ArrowRight, ArrowLeft, Trophy, RotateCcw, Play } from 'lucide-react'

export default function Simulado() {
  const { questions } = useQuestionStore()
  const { disciplines } = useCourseStore()
  const { addResult } = useQuestionStore()
  const { user } = useAuthStore()
  const results = useQuestionStore(s => s.results)

  const [selectedDiscipline, setSelectedDiscipline] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [finished, setFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600)
  const [started, setStarted] = useState(false)

  const filtered = selectedDiscipline
    ? questions.filter(q => q.disciplineId === selectedDiscipline)
    : questions

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
    if (!user) return
    const correct = filtered.filter(q => answers[q.id] === q.correctAnswer).length
    addResult({
      userId: user.id,
      userName: user.name,
      score: correct,
      total: filtered.length,
      date: new Date().toISOString(),
    })
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progress = filtered.length > 0 ? ((currentIndex + 1) / filtered.length) * 100 : 0

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Simulado</h1>
          <p className="text-gray-600">Teste seus conhecimentos e veja seu desempenho</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Configurar Simulado</h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Disciplina</label>
              <select
                value={selectedDiscipline}
                onChange={e => setSelectedDiscipline(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Todas as questões</option>
                {disciplines.map(d => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl">
              <div>
                <p className="text-sm text-gray-600">Tempo</p>
                <p className="text-lg font-bold text-gray-900">10 minutos</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Questões</p>
                <p className="text-lg font-bold text-gray-900">{filtered.length}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => { setStarted(true); setTimeLeft(600) }}
            disabled={filtered.length === 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            <Play className="w-5 h-5" />
            Iniciar Simulado
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Ranking
            </h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left font-medium text-gray-600">#</th>
                    <th className="p-4 text-left font-medium text-gray-600">Nome</th>
                    <th className="p-4 text-left font-medium text-gray-600">Acertos</th>
                    <th className="p-4 text-left font-medium text-gray-600">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {results.sort((a, b) => b.score - a.score).slice(0, 10).map((r, i) => (
                    <tr key={i} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          i === 0 ? 'bg-yellow-100 text-yellow-700' :
                          i === 1 ? 'bg-gray-100 text-gray-700' :
                          i === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {i + 1}
                        </span>
                      </td>
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
    )
  }

  if (finished) {
    const correct = filtered.filter(q => answers[q.id] === q.correctAnswer).length
    const percentage = filtered.length > 0 ? Math.round((correct / filtered.length) * 100) : 0
    return (
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
              <p className="text-3xl font-bold text-red-600">{filtered.length - correct}</p>
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
                setCurrentIndex(0)
                setAnswers({})
                setTimeLeft(600)
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              <RotateCcw className="w-5 h-5" />
              Novo Simulado
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentQ = filtered[currentIndex]

  return (
    <div>
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600">
              Questão {currentIndex + 1}/{filtered.length}
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
            {Object.keys(answers).length} de {filtered.length} respondidas
          </span>

          {currentIndex < filtered.length - 1 ? (
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
