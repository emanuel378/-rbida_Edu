import { useState } from 'react'
import { useAuthStore } from '../../auth/services/authStore'
import { useQuestionStore } from '../data/questionStore'
import { HelpCircle, CheckCircle, XCircle, Plus, Download, Search, Trash2 } from 'lucide-react'
import Breadcrumb from '../../../shared/components/Breadcrumb'
import jsPDF from 'jspdf'

export default function QuestionBank() {
  const user = useAuthStore(s => s.user)
  const { questions, addQuestion, deleteQuestion } = useQuestionStore()

  const [searchCode, setSearchCode] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('')
  const [showAnswer, setShowAnswer] = useState<Record<string, boolean>>({})
  const [showModal, setShowModal] = useState(false)

  const [newQ, setNewQ] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    difficulty: 'facil' as 'facil' | 'medio' | 'dificil',
  })

  const isAdmin = user?.role === 'admin'

  const filtered = questions.filter(q => {
    if (searchCode && !q.code.toLowerCase().includes(searchCode.toLowerCase())) return false
    if (filterDifficulty && q.difficulty !== filterDifficulty) return false
    return true
  })

  const handleAnswer = (qId: string) => {
    setShowAnswer(prev => ({ ...prev, [qId]: !prev[qId] }))
  }

  const handleAddQuestion = () => {
    if (!newQ.question || newQ.options.some(o => !o)) return
    addQuestion({ id: Date.now().toString(), code: '', ...newQ })
    setNewQ({ question: '', options: ['', '', '', ''], correctAnswer: 0, difficulty: 'facil' })
    setShowModal(false)
  }

  const handleDelete = (qId: string) => {
    if (confirm('Tem certeza que deseja excluir esta questão?')) {
      deleteQuestion(qId)
    }
  }

  const difficultyConfig = {
    facil: { label: 'Fácil', color: 'bg-green-100 text-green-700 border-green-200', icon: '🟢' },
    medio: { label: 'Médio', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '🟡' },
    dificil: { label: 'Difícil', color: 'bg-red-100 text-red-700 border-red-200', icon: '🔴' },
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF()
    let y = 20
    const pageHeight = doc.internal.pageSize.height
    const margin = 20
    const lineHeight = 7

    doc.setFontSize(16)
    doc.text('Banco de Questões', margin, y)
    y += 10

    filtered.forEach((q, index) => {
      if (y > pageHeight - 40) {
        doc.addPage()
        y = 20
      }

      doc.setFontSize(10)
      doc.text(`${q.code} - ${difficultyConfig[q.difficulty].label}`, margin, y)
      y += lineHeight

      doc.setFontSize(11)
      const questionLines = doc.splitTextToSize(`${index + 1}. ${q.question}`, 170)
      doc.text(questionLines, margin, y)
      y += questionLines.length * lineHeight

      q.options.forEach((opt, i) => {
        const prefix = i === q.correctAnswer ? '✓ ' : '  '
        const optionLines = doc.splitTextToSize(`${prefix}${String.fromCharCode(97 + i)}) ${opt}`, 165)
        doc.text(optionLines, margin + 5, y)
        y += optionLines.length * lineHeight
      })

      y += 5
    })

    doc.save('questoes.pdf')
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <Breadcrumb items={[{ label: 'Questões' }]} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banco de Questões</h1>
          <p className="text-gray-600 mt-1">{filtered.length} questões disponíveis</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nova Questão
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            Baixar PDF
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Buscar por código</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchCode}
                onChange={e => setSearchCode(e.target.value)}
                placeholder="Ex: QST-A1B2"
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Dificuldade</label>
            <select
              value={filterDifficulty}
              onChange={e => setFilterDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Todas</option>
              <option value="facil">🟢 Fácil</option>
              <option value="medio">🟡 Médio</option>
              <option value="dificil">🔴 Difícil</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma questão encontrada.</p>
          </div>
        ) : (
          filtered.map((q, index) => {
            const config = difficultyConfig[q.difficulty]
            const isAnswerShown = showAnswer[q.id]
            return (
              <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <code className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono font-bold">
                        {q.code}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                        {config.icon} {config.label}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir questão"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-800 font-medium mb-4">{q.question}</p>

                  <div className="space-y-2">
                    {q.options.map((opt, i) => {
                      const isCorrect = i === q.correctAnswer
                      const showCorrect = isAnswerShown && isCorrect
                      const showWrong = isAnswerShown && !isCorrect
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            showCorrect
                              ? 'bg-green-50 border-green-300 text-green-800'
                              : showWrong
                              ? 'bg-gray-50 border-gray-200 text-gray-600'
                              : 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-200 text-gray-700'
                          }`}
                        >
                          <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            showCorrect ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {String.fromCharCode(97 + i)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {showCorrect && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                        </div>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => handleAnswer(q.id)}
                    className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {isAnswerShown ? (
                      <>
                        <XCircle className="w-4 h-4" />
                        Ocultar Resposta
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Ver Resposta
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Adicionar Nova Questão
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                value={newQ.question}
                onChange={e => setNewQ({ ...newQ, question: e.target.value })}
                placeholder="Digite a questão..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {newQ.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    i === newQ.correctAnswer ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {String.fromCharCode(97 + i)}
                  </span>
                  <input
                    value={opt}
                    onChange={e => {
                      const opts = [...newQ.options]
                      opts[i] = e.target.value
                      setNewQ({ ...newQ, options: opts })
                    }}
                    placeholder={`Opção ${i + 1}`}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setNewQ({ ...newQ, correctAnswer: i })}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      i === newQ.correctAnswer
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {i === newQ.correctAnswer ? '✓ Correta' : 'Marcar'}
                  </button>
                </div>
              ))}
              <div className="flex gap-3">
                <select
                  value={newQ.difficulty}
                  onChange={e => setNewQ({ ...newQ, difficulty: e.target.value as 'facil' | 'medio' | 'dificil' })}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="facil">🟢 Fácil</option>
                  <option value="medio">🟡 Médio</option>
                  <option value="dificil">🔴 Difícil</option>
                </select>
                <button
                  onClick={handleAddQuestion}
                  disabled={!newQ.question || newQ.options.some(o => !o)}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Adicionar Questão
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
