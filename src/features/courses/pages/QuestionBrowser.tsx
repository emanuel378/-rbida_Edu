import { useState, useMemo } from 'react'
import { useQuestionStore } from '../data/questionStore'
import Breadcrumb from '../../../shared/components/Breadcrumb'
import { Search, X, HelpCircle, BookOpen, ArrowRight, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'

export default function QuestionBrowser() {
  const { questions, loading, loadQuestions } = useQuestionStore()
  const [localError, setLocalError] = useState<string | null>(null)

  const [filterValues, setFilterValues] = useState({
    moduleId: '',
    topicId: '',
    banca: '',
    nivel: '',
    ano: '',
  })
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({})

  const handleRefresh = async () => {
    setLocalError(null)
    await loadQuestions()
  }

  const disciplinaOptions = useMemo(() => {
    const map = new Map<string, string>()
    questions.forEach(q => {
      if (q.moduleId) {
        const label = q.moduleId === 'conhecimentos_educacionais' ? 'Conhecimentos Educacionais'
          : q.moduleId === 'legislacao' ? 'Legislação'
          : q.moduleId === 'portugues' ? 'Português'
          : q.moduleId
        map.set(q.moduleId, label)
      }
    })
    return Array.from(map, ([value, label]) => ({ value, label }))
  }, [questions])

  const assuntoOptions = useMemo(() => {
    const set = new Set<string>()
    questions.forEach(q => {
      if (q.topicId && q.moduleId === filterValues.moduleId) set.add(q.topicId)
    })
    return Array.from(set).sort()
  }, [questions, filterValues.moduleId])

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
    return Array.from(set).sort((a, b) => parseInt(b) - parseInt(a))
  }, [questions])

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      return Object.entries(appliedFilters).every(([key, val]) => {
        if (!val) return true
        return (q as unknown as Record<string, unknown>)[key] === val
      })
    })
  }, [questions, appliedFilters])

  const applyFilters = () => {
    const applied: Record<string, string> = {}
    Object.entries(filterValues).forEach(([key, val]) => {
      if (val) applied[key] = val
    })
    setAppliedFilters(applied)
  }

  const clearFilters = () => {
    setFilterValues({ moduleId: '', topicId: '', banca: '', nivel: '', ano: '' })
    setAppliedFilters({})
  }

  const removeFilter = (key: string) => {
    const next = { ...appliedFilters }
    delete next[key]
    setAppliedFilters(next)
    setFilterValues(prev => ({ ...prev, [key]: '' }))
  }

  const filterLabel = (key: string, value: string): string => {
    switch (key) {
      case 'moduleId': return `Disciplina: ${value}`
      case 'topicId': return `Assunto: ${value}`
      case 'banca': return `Banca: ${value}`
      case 'nivel': return `Nível: ${value}`
      case 'ano': return `Ano: ${value}`
      default: return `${key}: ${value}`
    }
  }

  const getModuleLabel = (moduleId?: string) => {
    if (!moduleId) return ''
    const found = disciplinaOptions.find(d => d.value === moduleId)
    return found?.label || moduleId
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <Breadcrumb items={[{ label: 'Banco de Questões' }]} />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banco de Questões</h1>
          <p className="text-gray-600 mt-1">Visualize todas as questões cadastradas</p>
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
                      <option key={t} value={t}>{t}</option>
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

          <p className="text-sm text-gray-500 mb-4">
            Foram encontradas <strong className="text-gray-800">{filteredQuestions.length}</strong>{' '}
            {filteredQuestions.length === 1 ? 'questão' : 'questões'}
          </p>

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
              {filteredQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:border-blue-200 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-medium leading-relaxed line-clamp-2">
                        {q.question}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {q.code && (
                          <span className="text-xs text-gray-400 font-mono">{q.code}</span>
                        )}
                        {getModuleLabel(q.moduleId) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md text-xs font-medium">
                            <BookOpen className="w-3 h-3" />
                            {getModuleLabel(q.moduleId)}
                          </span>
                        )}
                        {q.topicId && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded-md text-xs font-medium">
                            {q.topicId}
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
