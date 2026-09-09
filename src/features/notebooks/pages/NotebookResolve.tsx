import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuthStore } from '../../auth/services/authStore'
import { useQuestionStore } from '../../courses/data/questionStore'
import { useNotebookStore } from '../data/notebookStore'
import { getDisciplinaLabel } from '../../courses/data/taxonomy'
import { generateNotebookPdf } from '../utils/exportNotebookPdf'
import Breadcrumb from '../../../shared/components/Breadcrumb'
import type { CadernoAttempt } from '../data/notebookTypes'
import type { Question } from '../../courses/data/mock'
import {
  ArrowLeft, ArrowRight, CheckCircle, Trophy, Download, Clock3, Loader2,
  FileStack, HelpCircle,
} from 'lucide-react'

const LETTERS = ['A', 'B', 'C', 'D', 'E']

const formatDuration = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`
  return `${m}:${s.toString().padStart(2, '0')}`
}

const getBarColor = (percentage: number) => {
  if (percentage >= 80) return 'bg-green-500'
  if (percentage >= 60) return 'bg-blue-500'
  if (percentage >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

interface Breakdown { key: string; label: string; correct: number; total: number; percentage: number }

const buildBreakdown = (
  questions: Question[],
  answers: Record<string, number>,
  keyFn: (q: Question) => string | undefined,
  labelFn: (key: string) => string
): Breakdown[] => {
  const map = new Map<string, Breakdown>()
  questions.forEach(q => {
    const key = keyFn(q) || 'outros'
    const isAnswered = answers[q.id] !== undefined
    if (!isAnswered) return
    const isCorrect = answers[q.id] === q.correctAnswer
    const existing = map.get(key)
    if (existing) {
      existing.total += 1
      if (isCorrect) existing.correct += 1
    } else {
      map.set(key, { key, label: labelFn(key), correct: isCorrect ? 1 : 0, total: 1, percentage: 0 })
    }
  })
  return Array.from(map.values())
    .map(p => ({ ...p, percentage: p.total ? Math.round((p.correct / p.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total)
}

export default function NotebookResolve() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const { questions, loading: questionsLoading, loadQuestions, recordAnswer } = useQuestionStore()
  const { getNotebook, loadNotebooks, loadAttempt, startAttempt, saveAttemptProgress, finishAttempt } = useNotebookStore()

  const [ready, setReady] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [attempt, setAttempt] = useState<CadernoAttempt | undefined>()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [, forceTick] = useState(0)

  const notebook = id ? getNotebook(id) : undefined
  const baseSecondsRef = useRef(0)
  const sessionStartRef = useRef(Date.now())

  useEffect(() => {
    if (questions.length === 0) loadQuestions().catch(() => {})
  }, [loadQuestions, questions.length])

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      if (!user || !id) return
      let nb = getNotebook(id)
      if (!nb) {
        await loadNotebooks(user.id)
        nb = getNotebook(id)
      }
      if (cancelled) return
      if (!nb) { setNotFound(true); setReady(true); return }

      let a = await loadAttempt(id, user.id)
      if (!a) a = startAttempt(id, user.id)
      if (cancelled) return
      baseSecondsRef.current = a.timeSpentSeconds || 0
      sessionStartRef.current = Date.now()
      setAttempt(a)
      setCurrentIndex(a.currentIndex || 0)
      setReady(true)
    }
    init()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id])

  const isFinished = !!attempt?.finishedAt

  useEffect(() => {
    if (!ready || isFinished) return
    const t = setInterval(() => forceTick(v => v + 1), 1000)
    return () => clearInterval(t)
  }, [ready, isFinished])

  const computeElapsed = () => baseSecondsRef.current + Math.floor((Date.now() - sessionStartRef.current) / 1000)

  const notebookQuestions = useMemo(() => {
    if (!notebook) return []
    return notebook.questionIds
      .map(qid => questions.find(q => q.id === qid))
      .filter((q): q is Question => !!q)
  }, [notebook, questions])

  const answers = attempt?.answers ?? {}
  const answeredCount = Object.keys(answers).length

  const persist = (patch: Partial<CadernoAttempt>) => {
    if (!attempt) return
    const updated: CadernoAttempt = { ...attempt, ...patch, timeSpentSeconds: computeElapsed() }
    setAttempt(updated)
    saveAttemptProgress(updated)
  }

  const handleSelect = (questionId: string, optionIndex: number) => {
    persist({ answers: { ...answers, [questionId]: optionIndex } })
  }

  const goTo = (idx: number) => {
    setCurrentIndex(idx)
    persist({ currentIndex: idx })
  }

  const handleFinish = async () => {
    if (!attempt || !user) return
    const finalAttempt: CadernoAttempt = { ...attempt, timeSpentSeconds: computeElapsed() }
    notebookQuestions.forEach(q => {
      const selected = finalAttempt.answers[q.id]
      if (selected === undefined) return
      recordAnswer(
        { questionId: q.id, correct: selected === q.correctAnswer, userId: user.id, timestamp: new Date().toISOString() },
        selected
      )
    })
    await finishAttempt(finalAttempt)
    setAttempt({ ...finalAttempt, finishedAt: new Date().toISOString() })
  }

  const handleDownload = async () => {
    if (!notebook) return
    setDownloading(true)
    try {
      await generateNotebookPdf(notebook, notebookQuestions)
    } finally {
      setDownloading(false)
    }
  }

  if (!ready || questionsLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: 'Cadernos', to: '/dashboard/cadernos' }, { label: 'Resolver' }]} />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Loader2 className="w-10 h-10 text-blue-600 mx-auto mb-3 animate-spin" />
          <p className="text-gray-500 text-lg font-medium">Carregando caderno...</p>
        </div>
      </div>
    )
  }

  if (notFound || !notebook) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: 'Cadernos', to: '/dashboard/cadernos' }, { label: 'Resolver' }]} />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <FileStack className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg font-medium">Caderno não encontrado</p>
          <Link to="/dashboard/cadernos" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-3 inline-block">
            Voltar para Meus Cadernos
          </Link>
        </div>
      </div>
    )
  }

  if (isFinished) {
    const correctCount = notebookQuestions.filter(q => answers[q.id] === q.correctAnswer).length
    const wrongCount = notebookQuestions.filter(q => answers[q.id] !== undefined && answers[q.id] !== q.correctAnswer).length
    const blankCount = notebookQuestions.length - correctCount - wrongCount
    const percentage = notebookQuestions.length ? Math.round((correctCount / notebookQuestions.length) * 100) : 0

    const disciplineBreakdown = buildBreakdown(notebookQuestions, answers, q => q.moduleId, getDisciplinaLabel)
    const assuntoBreakdown = buildBreakdown(notebookQuestions, answers, q => q.topicId, key => key)

    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: 'Cadernos', to: '/dashboard/cadernos' }, { label: notebook.title }]} />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            percentage >= 70 ? 'bg-green-100' : percentage >= 50 ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            <Trophy className={`w-10 h-10 ${percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{notebook.title}</h1>
          <p className="text-gray-500 mb-6">Desempenho neste caderno</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-2">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-blue-600">{percentage}%</p>
              <p className="text-xs text-gray-600 mt-1">Aproveitamento</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-green-600">{correctCount}</p>
              <p className="text-xs text-gray-600 mt-1">Acertos</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-red-600">{wrongCount}</p>
              <p className="text-xs text-gray-600 mt-1">Erros</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-gray-600">{blankCount}</p>
              <p className="text-xs text-gray-600 mt-1">Não respondidas</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 flex items-center justify-center gap-1.5 mt-4">
            <Clock3 className="w-4 h-4" />
            Tempo total: {formatDuration(attempt?.timeSpentSeconds ?? 0)}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Por Disciplina</h2>
            {disciplineBreakdown.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhuma questão respondida.</p>
            ) : (
              <div className="space-y-3">
                {disciplineBreakdown.map(item => (
                  <div key={item.key}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span className="truncate">{item.label}</span>
                      <span className="font-semibold">{item.percentage}% ({item.correct}/{item.total})</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${getBarColor(item.percentage)}`} style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Por Assunto</h2>
            {assuntoBreakdown.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhuma questão respondida.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {assuntoBreakdown.map(item => (
                  <div key={item.key}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span className="truncate">{item.label}</span>
                      <span className="font-semibold">{item.percentage}% ({item.correct}/{item.total})</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${getBarColor(item.percentage)}`} style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/dashboard/cadernos"
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Meus Cadernos
          </Link>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Baixar PDF
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = notebookQuestions[currentIndex]
  const progress = notebookQuestions.length > 0 ? ((currentIndex + 1) / notebookQuestions.length) * 100 : 0

  if (!currentQuestion) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: 'Cadernos', to: '/dashboard/cadernos' }, { label: notebook.title }]} />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg font-medium">As questões deste caderno não foram encontradas.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <span className="text-sm font-medium text-gray-600 truncate">
              {notebook.title} - Questão {currentIndex + 1}/{notebookQuestions.length}
            </span>
            <div className="w-24 bg-gray-200 rounded-full h-2 flex-shrink-0">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 font-mono font-semibold text-sm flex-shrink-0">
            <Clock3 className="w-4 h-4" />
            {formatDuration(computeElapsed())}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <p className="text-lg font-medium text-gray-900 mb-6 whitespace-pre-wrap">{currentQuestion.question}</p>
          {currentQuestion.questionImageUrl && (
            <img src={currentQuestion.questionImageUrl} alt="Imagem da questão" className="max-w-md rounded-lg border border-gray-200 mb-6" />
          )}
          <div className="space-y-3">
            {currentQuestion.options.map((opt, i) => {
              const isSelected = answers[currentQuestion.id] === i
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(currentQuestion.id, i)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    isSelected ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {LETTERS[i] ?? i + 1}
                    </span>
                    <span className="font-medium whitespace-pre-wrap">{opt}</span>
                    {isSelected && <CheckCircle className="w-5 h-5 text-blue-500 ml-auto flex-shrink-0" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex justify-between items-center flex-wrap gap-3">
          <button
            disabled={currentIndex === 0}
            onClick={() => goTo(currentIndex - 1)}
            className="flex items-center gap-2 px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </button>

          <span className="text-sm text-gray-500">
            {answeredCount} de {notebookQuestions.length} respondidas
          </span>

          <div className="flex items-center gap-3">
            {currentIndex < notebookQuestions.length - 1 && (
              <button
                onClick={() => goTo(currentIndex + 1)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Próxima
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
            >
              <CheckCircle className="w-5 h-5" />
              Finalizar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
