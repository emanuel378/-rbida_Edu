import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../auth/services/authStore'
import { useQuestionStore } from '../../courses/data/questionStore'
import { useNotebookStore } from '../data/notebookStore'
import type { Caderno, CadernoFilters } from '../data/notebookTypes'
import { generateNotebookPdf } from '../utils/exportNotebookPdf'
import Breadcrumb from '../../../shared/components/Breadcrumb'
import { FileStack, Plus, Download, Trash2, Play, CheckCircle2, Clock3, Loader2 } from 'lucide-react'

const FILTER_LABELS: Record<keyof CadernoFilters, string> = {
  moduleId: 'Disciplina', topicId: 'Assunto', banca: 'Banca',
  institutionId: 'Órgão', cargo: 'Cargo', nivel: 'Dificuldade', ano: 'Ano',
}

function filterSummary(filters: CadernoFilters): string[] {
  return (Object.keys(filters) as (keyof CadernoFilters)[])
    .filter(key => filters[key]?.length)
    .map(key => `${FILTER_LABELS[key]} (${filters[key].length})`)
}

export default function NotebookList() {
  const { user } = useAuthStore()
  const { questions, loadQuestions } = useQuestionStore()
  const { notebooks, attempts, loading, loadNotebooks, deleteNotebook, getAttempt } = useNotebookStore()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) loadNotebooks(user.id)
    if (questions.length === 0) loadQuestions().catch(() => {})
  }, [user, loadNotebooks, loadQuestions, questions.length])

  const myNotebooks = notebooks
    .filter(n => n.userId === user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const statusOf = (notebook: Caderno) => {
    const attempt = user ? getAttempt(notebook.id, user.id) : undefined
    if (!attempt) return { label: 'Não iniciado', icon: FileStack, className: 'bg-gray-100 text-gray-600' }
    if (!attempt.finishedAt) return { label: 'Em andamento', icon: Clock3, className: 'bg-yellow-50 text-yellow-700' }
    return { label: 'Concluído', icon: CheckCircle2, className: 'bg-green-50 text-green-700' }
  }

  const handleDelete = (notebook: Caderno) => {
    if (!window.confirm(`Tem certeza que deseja excluir o caderno "${notebook.title}"? Esta ação não pode ser desfeita.`)) return
    deleteNotebook(notebook.id)
  }

  const handleDownload = async (notebook: Caderno) => {
    setDownloadingId(notebook.id)
    try {
      const notebookQuestions = notebook.questionIds
        .map(id => questions.find(q => q.id === id))
        .filter((q): q is NonNullable<typeof q> => !!q)
      await generateNotebookPdf(notebook, notebookQuestions)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <Breadcrumb items={[{ label: 'Cadernos' }]} />

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <FileStack className="w-5 h-5 text-blue-600" />
            </div>
            Meus Cadernos
          </h1>
          <p className="text-gray-600 mt-2">Cadernos de questões gerados a partir dos filtros do Banco de Questões.</p>
        </div>
        <Link
          to="/dashboard/cadernos/novo"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Gerar Novo Caderno
        </Link>
      </div>

      {loading && myNotebooks.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Loader2 className="w-10 h-10 text-blue-600 mx-auto mb-3 animate-spin" />
          <p className="text-gray-500 text-lg font-medium">Carregando cadernos...</p>
        </div>
      ) : myNotebooks.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <FileStack className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg font-medium">Você ainda não gerou nenhum caderno</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">Monte um caderno com os filtros do Banco de Questões para praticar ou imprimir.</p>
          <Link
            to="/dashboard/cadernos/novo"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Gerar Novo Caderno
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {myNotebooks.map(notebook => {
            const status = statusOf(notebook)
            const StatusIcon = status.icon
            const chips = filterSummary(notebook.filters)
            return (
              <div key={notebook.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold text-gray-900 leading-snug">{notebook.title}</h3>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${status.className}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {status.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {notebook.questionIds.length} {notebook.questionIds.length === 1 ? 'questão' : 'questões'} ·{' '}
                  {new Date(notebook.createdAt).toLocaleDateString('pt-BR')}
                </p>
                {chips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {chips.map(chip => (
                      <span key={chip} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-xs">{chip}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => navigate(`/dashboard/cadernos/${notebook.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    <Play className="w-4 h-4" />
                    {status.label === 'Concluído' ? 'Ver resultado' : 'Resolver'}
                  </button>
                  <button
                    onClick={() => handleDownload(notebook)}
                    disabled={downloadingId === notebook.id}
                    title="Baixar PDF"
                    className="p-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {downloadingId === notebook.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(notebook)}
                    title="Excluir caderno"
                    className="p-2.5 border border-gray-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
