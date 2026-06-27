import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuestionStore } from '../../courses/data/questionStore'
import { useCourseStore } from '../../courses/data/courseStore'
import Breadcrumb from '../../../shared/components/Breadcrumb'
import { Search, X, HelpCircle, BookOpen, ArrowRight, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'

const normalizeKey = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const STANDARD_FIELDS = new Set(['id', 'code', 'question', 'options', 'correctAnswer', 'moduleId', 'topicId', 'assunto'])
const BLOCKED_FIELDS = new Set(['nivel', 'ano', 'banca', 'disciplina', 'disciplinas', 'assunto', 'gabaritocomentado', 'createdat', 'imageurl', 'aulasrelacionadas', 'materialurl', 'aularelacionada'])

export default function QuestionBank() {
  const navigate = useNavigate()
  const { questions, loading, loadQuestions, error } = useQuestionStore()
  const { modules, topics } = useCourseStore()
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (error) {
      setLocalError(error)
    }
  }, [error])

  const [filterValues, setFilterValues] = useState({
    moduleId: '',
    topicId: '',
    banca: '',
    nivel: '',
    ano: '',
  })
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, string>>({})
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({})

  const handleRefresh = async () => {
    setLocalError(null)
    await loadQuestions()
  }

  const disciplinaOptions = modules.map(m => ({ value: m.id, label: m.title }))

  const assuntoOptions = useMemo(
    () => topics.filter(t => t.moduleId === filterValues.moduleId),
    [topics, filterValues.moduleId]
  )

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

  const dynamicFields = useMemo(() => {
    const fields = new Set<string>()
    questions.forEach(q => {
      Object.keys(q).forEach(key => {
        if (!STANDARD_FIELDS.has(key) && !BLOCKED_FIELDS.has(normalizeKey(key))) fields.add(key)
      })
    })
    return Array.from(fields).sort()
  }, [questions])

  const dynamicFieldOptions = useMemo(() => {
    const map: Record<string, string[]> = {}
    dynamicFields.forEach(field => {
      const set = new Set<string>()
      questions.forEach(q => {
        const val = (q as unknown as Record<string, unknown>)[field]
        if (val !== undefined && val !== null && val !== '') set.add(String(val))
      })
      map[field] = Array.from(set).sort()
    })
    return map
  }, [dynamicFields, questions])

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      return Object.entries(appliedFilters).every(([key, val]) => {
        if (!val) return true
        if (key === 'moduleId') return q.moduleId === val
        if (key === 'topicId') return q.topicId === val
        return (q as unknown as Record<string, unknown>)[key] === val
      })
    })
  }, [questions, appliedFilters])

  const applyFilters = () => {
    const applied: Record<string, string> = {}
    Object.entries(filterValues).forEach(([key, val]) => {
      if (val) applied[key] = val
    })
    Object.entries(dynamicFilters).forEach(([key, val]) => {
      if (val) applied[key] = val
    })
    setAppliedFilters(applied)
  }

  const clearFilters = () => {
    setFilterValues({ moduleId: '', topicId: '', banca: '', nivel: '', ano: '' })
    setDynamicFilters({})
    setAppliedFilters({})
  }

  const removeFilter = (key: string) => {
    const next = { ...appliedFilters }
    delete next[key]
    setAppliedFilters(next)
    if (key in filterValues) {
      setFilterValues(prev => ({ ...prev, [key]: '' }))
    } else {
      setDynamicFilters(prev => {
        const p = { ...prev }
        delete p[key]
        return p
      })
    }
  }

  const filterLabel = (key: string, value: string): string => {
    switch (key) {
      case 'moduleId': return `Disciplina: ${modules.find(m => m.id === value)?.title || value}`
      case 'topicId': return `Assunto: ${topics.find(t => t.id === value)?.title || value}`
      case 'banca': return `Banca: ${value}`
      case 'nivel': return `Nível: ${value}`
      case 'ano': return `Ano: ${value}`
      default: return `${key}: ${value}`
    }
  }

  const getModuleName = (moduleId?: string) => modules.find(m => m.id === moduleId)?.title
  const getTopicName = (topicId?: string) => topics.find(t => t.id === topicId)?.title

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <Breadcrumb items={[{ label: 'Banco de Questões' }]} />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banco de Questões</h1>
          <p className="text-gray-600 mt-1">Explore as questões cadastradas pelos professores</p>
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

      {/* Erro */}
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

      {/* Loading inicial */}
      {loading && questions.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Loader2 className="w-10 h-10 text-blue-600 mx-auto mb-3 animate-spin" />
          <p className="text-gray-500 text-lg font-medium">Carregando questões...</p>
        </div>
      )}

      {/* Conteúdo principal — só aparece quando não está carregando */}
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
                    {disciplinaOptions.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
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
                      <option key={t.id} value={t.id}>{t.title}</option>
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

                {dynamicFields.map(field => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 uppercase">{field}</label>
                    <select
                      value={dynamicFilters[field] ?? ''}
                      onChange={e => setDynamicFilters(prev => ({ ...prev, [field]: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Todos</option>
                      {(dynamicFieldOptions[field] || []).map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                ))}

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
          {Object.keys(appliedFilters).length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {Object.entries(appliedFilters).map(([key, val]) => (
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
            <div className="space-y-3">
              {filteredQuestions.map((q, idx) => {
                const moduleName = getModuleName(q.moduleId)
                const topicName = getTopicName(q.topicId)
                return (
                  <button
                    key={q.id}
                    onClick={() => navigate(`/dashboard/question/${q.id}`)}
                    className="w-full text-left bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:border-blue-200 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium leading-relaxed line-clamp-2 group-hover:text-blue-700 transition-colors">
                          {q.question}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {q.code && (
                            <span className="text-xs text-gray-400 font-mono">{q.code}</span>
                          )}
                          {moduleName && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md text-xs font-medium">
                              <BookOpen className="w-3 h-3" />
                              {moduleName}
                            </span>
                          )}
                          {topicName && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded-md text-xs font-medium">
                              {topicName}
                            </span>
                          )}
                          {q.banca && (
                            <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md text-xs font-medium">
                              {q.banca}
                            </span>
                          )}
                          {q.nivel && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                              {q.nivel}
                            </span>
                          )}
                          {q.ano && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                              {q.ano}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0 self-center" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </>  
      )}
    </div>
  )
}