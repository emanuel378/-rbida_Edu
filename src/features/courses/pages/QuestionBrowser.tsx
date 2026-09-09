import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuestionStore } from '../data/questionStore'
import { useInstitutionStore } from '../data/institutionStore'
import Breadcrumb from '../../../shared/components/Breadcrumb'
import MultiSelectDropdown from '../../../shared/components/MultiSelectDropdown'
import { Search, X, HelpCircle, BookOpen, Landmark, Edit2, RefreshCw, AlertCircle, Loader2, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'

export default function QuestionBrowser() {
  const { questions, loading, loadQuestions } = useQuestionStore()
  const { institutions, loadInstitutions } = useInstitutionStore()
  const [localError, setLocalError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/teacher'

  useEffect(() => {
    loadInstitutions()
  }, [loadInstitutions])

  const handleEdit = (questionId: string) => {
    navigate(`${basePath}/questions`, { state: { editQuestionId: questionId } })
  }

  const [filterValues, setFilterValues] = useState({
    moduleId: [] as string[],
    topicId: [] as string[],
    banca: [] as string[],
    institutionId: [] as string[],
    cargo: [] as string[],
    nivel: [] as string[],
    ano: [] as string[],
  })
  const [appliedFilters, setAppliedFilters] = useState(filterValues)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  type FilterKey = keyof typeof filterValues

  const setMultiFilter = (key: FilterKey, values: string[]) => {
    setFilterValues(prev => ({ ...prev, [key]: values }))
  }

  const handleRefresh = async () => {
    setLocalError(null)
    try {
      await loadQuestions()
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Erro ao carregar questões')
    }
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
      if (q.topicId && (filterValues.moduleId.length === 0 || filterValues.moduleId.includes(q.moduleId ?? ''))) set.add(q.topicId)
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

  const cargoOptions = useMemo(() => {
    const set = new Set<string>()
    questions.forEach(q => { if (q.cargo) set.add(q.cargo) })
    return Array.from(set).sort()
  }, [questions])

  const anoOptions = useMemo(() => {
    const set = new Set<string>()
    questions.forEach(q => { if (q.ano) set.add(q.ano) })
    return Array.from(set).sort((a, b) => parseInt(b) - parseInt(a))
  }, [questions])

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      return (Object.entries(appliedFilters) as [FilterKey, string[]][]).every(([key, values]) => {
        if (values.length === 0) return true
        return values.includes((q as unknown as Record<string, unknown>)[key] as string ?? '')
      })
    })
  }, [questions, appliedFilters])

  const applyFilters = () => setAppliedFilters(filterValues)

  const emptyFilters: typeof filterValues = { moduleId: [], topicId: [], banca: [], institutionId: [], cargo: [], nivel: [], ano: [] }

  const clearFilters = () => {
    setFilterValues(emptyFilters)
    setAppliedFilters(emptyFilters)
  }

  const getInstitutionName = (id?: string) => institutions.find(i => i.id === id)?.name || ''

  const removeFilterValue = (key: FilterKey, value: string) => {
    const next = { ...filterValues, [key]: filterValues[key].filter(v => v !== value) }
    setFilterValues(next)
    setAppliedFilters(next)
  }

  const filterKeyLabel: Record<FilterKey, string> = {
    moduleId: 'Disciplina', topicId: 'Assunto', banca: 'Banca', institutionId: 'Instituição', cargo: 'Cargo', nivel: 'Nível', ano: 'Ano',
  }

  const getModuleLabel = (moduleId?: string) => {
    if (!moduleId) return ''
    const found = disciplinaOptions.find(d => d.value === moduleId)
    return found?.label || moduleId
  }

  const valueLabel = (key: FilterKey, value: string): string => {
    if (key === 'moduleId') return getModuleLabel(value)
    if (key === 'institutionId') return getInstitutionName(value) || value
    return value
  }

  const activeFilterEntries = (Object.keys(filterValues) as FilterKey[]).flatMap(key =>
    appliedFilters[key].map(value => ({ key, value, label: `${filterKeyLabel[key]}: ${valueLabel(key, value)}` }))
  )

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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
            <div className="p-6 space-y-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Filtros</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <MultiSelectDropdown
                  label="DISCIPLINA"
                  options={disciplinaOptions}
                  selected={filterValues.moduleId}
                  onChange={values => setMultiFilter('moduleId', values)}
                  placeholder="Todas as disciplinas"
                />

                <MultiSelectDropdown
                  label="BANCA"
                  options={bancaOptions.map(v => ({ value: v, label: v }))}
                  selected={filterValues.banca}
                  onChange={values => setMultiFilter('banca', values)}
                  placeholder="Todas as bancas"
                />

                <MultiSelectDropdown
                  label="INSTITUIÇÃO"
                  options={institutions.map(i => ({ value: i.id, label: i.name }))}
                  selected={filterValues.institutionId}
                  onChange={values => setMultiFilter('institutionId', values)}
                  placeholder="Todas as instituições"
                />

                <MultiSelectDropdown
                  label="ASSUNTO"
                  options={assuntoOptions.map(t => ({ value: t, label: t }))}
                  selected={filterValues.topicId}
                  onChange={values => setMultiFilter('topicId', values)}
                  placeholder="Todos os assuntos"
                />

                <MultiSelectDropdown
                  label="CARGO"
                  options={cargoOptions.map(v => ({ value: v, label: v }))}
                  selected={filterValues.cargo}
                  onChange={values => setMultiFilter('cargo', values)}
                  placeholder="Todos os cargos"
                />

                <MultiSelectDropdown
                  label="NÍVEL"
                  options={nivelOptions.map(v => ({ value: v, label: v }))}
                  selected={filterValues.nivel}
                  onChange={values => setMultiFilter('nivel', values)}
                  placeholder="Todos os níveis"
                />

                <MultiSelectDropdown
                  label="ANO"
                  options={anoOptions.map(v => ({ value: v, label: v }))}
                  selected={filterValues.ano}
                  onChange={values => setMultiFilter('ano', values)}
                  placeholder="Todos os anos"
                />
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

          {activeFilterEntries.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {activeFilterEntries.map(({ key, value, label }) => (
                <span
                  key={`${key}-${value}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-sm"
                >
                  {label}
                  <button
                    onClick={() => removeFilterValue(key, value)}
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
                      <div className="flex items-start justify-between gap-3">
                        <p className={`text-gray-900 font-medium leading-relaxed ${expandedId === q.id ? '' : 'line-clamp-2'}`}>
                          {q.question}
                        </p>
                        <button
                          onClick={() => handleEdit(q.id)}
                          title="Editar questão"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Editar
                        </button>
                      </div>
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
                        {getInstitutionName(q.institutionId) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-xs font-medium">
                            <Landmark className="w-3 h-3" />
                            {getInstitutionName(q.institutionId)}
                          </span>
                        )}
                        {q.nivel && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                            {q.nivel}
                          </span>
                        )}
                        {q.cargo && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-xs font-medium">
                            {q.cargo}
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

                  {expandedId === q.id && (
                    <div className="mt-4 pl-14 border-t border-gray-100 pt-4">
                      {q.imageUrl && (
                        <div className="mb-4">
                          <img src={q.imageUrl} alt="Imagem da questão" className="max-w-md rounded-lg border border-gray-200" />
                        </div>
                      )}
                      <div className="space-y-2">
                        {q.options.map((opt, oi) => {
                          const isCorrect = oi === q.correctAnswer
                          return (
                            <div
                              key={oi}
                              className={`flex items-start gap-3 px-4 py-2.5 rounded-xl text-sm border ${
                                isCorrect
                                  ? 'bg-green-50 border-green-200 text-green-800'
                                  : 'bg-gray-50 border-gray-100 text-gray-700'
                              }`}
                            >
                              <span className="font-semibold flex-shrink-0">{(oi + 1)}.</span>
                              <span className="flex-1 leading-relaxed whitespace-pre-wrap">{opt}</span>
                              {isCorrect && (
                                <span className="flex items-center gap-1 text-xs font-medium text-green-700 flex-shrink-0">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Gabarito
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      {q.gabaritoComentado && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                          <p className="text-sm font-semibold text-blue-800 mb-1">Comentário do professor</p>
                          <p className="text-sm text-blue-700 leading-relaxed whitespace-pre-wrap">{q.gabaritoComentado}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 pl-14">
                    <button
                      onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                      className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {expandedId === q.id ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Ver menos
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Ver mais
                        </>
                      )}
                    </button>
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
