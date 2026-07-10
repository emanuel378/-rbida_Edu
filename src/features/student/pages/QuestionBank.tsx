import { useState, useMemo } from 'react'
import { useQuestionStore } from '../../courses/data/questionStore'
import { useAuthStore } from '../../auth/services/authStore'
import { DISCIPLINAS, TOPICOS_POR_DISCIPLINA } from '../../courses/data/taxonomy'
import QuestionCard from '../components/QuestionCard'
import Breadcrumb from '../../../shared/components/Breadcrumb'
import { Search, X, HelpCircle, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'

type Situacao = '' | 'resolvidas' | 'nao_resolvidas'

export default function QuestionBank() {
  const { questions, loading, loadQuestions, answerHistory } = useQuestionStore()
  const { user } = useAuthStore()
  const [localError, setLocalError] = useState<string | null>(null)

  const [filterValues, setFilterValues] = useState({
    moduleId: '',
    topicId: '',
    banca: '',
    nivel: '',
    ano: '',
    situacao: '' as Situacao,
  })
  const [appliedFilters, setAppliedFilters] = useState(filterValues)

  const handleRefresh = async () => {
    setLocalError(null)
    await loadQuestions()
  }

  const assuntoOptions = TOPICOS_POR_DISCIPLINA[filterValues.moduleId] ?? []

  const bancaOptions = useMemo(() => {
    const set = new Set<string>()
    questions.forEach(q => { if (q.banca) set.add(q.banca) })
    return Array.from(set).sort()
  }, [questions])

  const nivelOptions = useMemo(() => {
    const set = new Set<string>()
    questions.forEach(q => { if (q.nivel) set.add(q.nivel) })
    return Array.from(set).sort()
  }, [questions])

  const anoOptions = useMemo(() => {
    const set = new Set<string>()
    questions.forEach(q => { if (q.ano) set.add(q.ano) })
    return Array.from(set).sort()
  }, [questions])

  const resolvedQuestionIds = useMemo(() => {
    const set = new Set<string>()
    answerHistory.forEach(r => { if (r.userId === user?.id) set.add(r.questionId) })
    return set
  }, [answerHistory, user?.id])

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (appliedFilters.moduleId && q.moduleId !== appliedFilters.moduleId) return false
      if (appliedFilters.topicId && q.topicId !== appliedFilters.topicId) return false
      if (appliedFilters.banca && q.banca !== appliedFilters.banca) return false
      if (appliedFilters.nivel && q.nivel !== appliedFilters.nivel) return false
      if (appliedFilters.ano && q.ano !== appliedFilters.ano) return false
      if (appliedFilters.situacao === 'resolvidas' && !resolvedQuestionIds.has(q.id)) return false
      if (appliedFilters.situacao === 'nao_resolvidas' && resolvedQuestionIds.has(q.id)) return false
      return true
    })
  }, [questions, appliedFilters, resolvedQuestionIds])

  const applyFilters = () => setAppliedFilters(filterValues)

  const clearFilters = () => {
    const empty: typeof filterValues = { moduleId: '', topicId: '', banca: '', nivel: '', ano: '', situacao: '' }
    setFilterValues(empty)
    setAppliedFilters(empty)
  }

  const removeFilter = (key: keyof typeof filterValues) => {
    const next = { ...filterValues, [key]: key === 'moduleId' ? '' : filterValues[key] }
    if (key === 'moduleId') next.topicId = ''
    setFilterValues(next)
    setAppliedFilters(next)
  }

  const filterLabel = (key: keyof typeof filterValues, value: string): string => {
    switch (key) {
      case 'moduleId': return `Disciplina: ${DISCIPLINAS.find(d => d.value === value)?.label || value}`
      case 'topicId': return `Assunto: ${value}`
      case 'banca': return `Banca: ${value}`
      case 'nivel': return `Nível: ${value}`
      case 'ano': return `Ano: ${value}`
      case 'situacao': return value === 'resolvidas' ? 'Já resolvi' : 'Não resolvi'
      default: return `${key}: ${value}`
    }
  }

  const activeFilterEntries = (Object.entries(appliedFilters) as [keyof typeof filterValues, string][]).filter(([, v]) => v)

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <Breadcrumb items={[{ label: 'Banco de Questões' }]} />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banco de Questões</h1>
          <p className="text-gray-600 mt-1">Explore e responda as questões cadastradas pelos professores</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {localError && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Erro ao carregar questões</p>
            <p className="text-sm opacity-80">{localError}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 rounded-lg transition-colors flex-shrink-0"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {loading && questions.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Loader2 className="w-10 h-10 text-blue-600 mx-auto mb-3 animate-spin" />
          <p className="text-gray-500 text-lg font-medium">Carregando questões...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Painel de filtros */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="p-6 space-y-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Filtros</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">DISCIPLINA</label>
                  <select
                    value={filterValues.moduleId}
                    onChange={e => setFilterValues({ ...filterValues, moduleId: e.target.value, topicId: '' })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Todas as disciplinas</option>
                    {DISCIPLINAS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ASSUNTO</label>
                  <select
                    value={filterValues.topicId}
                    onChange={e => setFilterValues({ ...filterValues, topicId: e.target.value })}
                    disabled={!filterValues.moduleId}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      {!filterValues.moduleId ? 'Primeiro selecione a disciplina' : 'Todos os assuntos'}
                    </option>
                    {assuntoOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">BANCA</label>
                  <select
                    value={filterValues.banca}
                    onChange={e => setFilterValues({ ...filterValues, banca: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Todas as bancas</option>
                    {bancaOptions.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">NÍVEL</label>
                  <select
                    value={filterValues.nivel}
                    onChange={e => setFilterValues({ ...filterValues, nivel: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Todos os níveis</option>
                    {nivelOptions.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ANO</label>
                  <select
                    value={filterValues.ano}
                    onChange={e => setFilterValues({ ...filterValues, ano: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Todos os anos</option>
                    {anoOptions.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">SITUAÇÃO</label>
                  <select
                    value={filterValues.situacao}
                    onChange={e => setFilterValues({ ...filterValues, situacao: e.target.value as Situacao })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Todas</option>
                    <option value="resolvidas">Já resolvi</option>
                    <option value="nao_resolvidas">Não resolvi</option>
                  </select>
                </div>

              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={applyFilters}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  <Search className="w-4 h-4" />
                  Filtrar
                </button>
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          </div>

          {/* Tags dos filtros aplicados */}
          {activeFilterEntries.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {activeFilterEntries.map(([key, val]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-sm"
                >
                  {filterLabel(key, val)}
                  <button
                    onClick={() => removeFilter(key)}
                    className="p-0.5 hover:bg-blue-100 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Contador */}
          <p className="text-sm text-gray-500 mb-4">
            Foram encontradas <strong className="text-gray-800">{filteredQuestions.length}</strong>{' '}
            {filteredQuestions.length === 1 ? 'questão' : 'questões'}
          </p>

          {/* Lista de questões */}
          {filteredQuestions.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-lg font-medium">Nenhuma questão encontrada</p>
              <p className="text-gray-400 text-sm mt-1">Tente ajustar os filtros ou clique em Atualizar para recarregar.</p>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm mx-auto disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredQuestions.map((q, idx) => (
                <QuestionCard key={q.id} question={q} index={idx + 1} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
