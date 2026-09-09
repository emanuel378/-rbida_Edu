import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuestionStore, DAILY_FREE_QUESTION_LIMIT, getAnsweredTodayCount } from '../../courses/data/questionStore'
import { useInstitutionStore } from '../../courses/data/institutionStore'
import { useAuthStore } from '../../auth/services/authStore'
import { useCourseStore, hasQuestionBankAccess, getQuestionBankCourse } from '../../courses/data/courseStore'
import { DISCIPLINAS, TOPICOS_POR_DISCIPLINA } from '../../courses/data/taxonomy'
import QuestionCard from '../components/QuestionCard'
import CheckoutModal from '../../courses/components/CheckoutModal'
import Breadcrumb from '../../../shared/components/Breadcrumb'
import MultiSelectDropdown from '../../../shared/components/MultiSelectDropdown'
import { Search, X, HelpCircle, RefreshCw, AlertCircle, Loader2, Lock, ShoppingCart } from 'lucide-react'

type Situacao = '' | 'resolvidas' | 'nao_resolvidas' | 'acertei' | 'errei'

function QuestionBankContent() {
  const { questions, loading, loadQuestions, answerHistory } = useQuestionStore()
  const { institutions, loadInstitutions } = useInstitutionStore()
  const { user } = useAuthStore()
  const { courses, getEnrollment, loadFromSupabase } = useCourseStore()
  const hasUnlimitedAccess = hasQuestionBankAccess(user, courses, getEnrollment)
  // Sem acesso completo (visitante ou aluno sem assinatura) = modo de teste:
  // só pode ver/responder uma amostra de DAILY_FREE_QUESTION_LIMIT questões.
  const limitedAccess = !hasUnlimitedAccess
  const [localError, setLocalError] = useState<string | null>(null)

  const answeredTodayCount = user ? getAnsweredTodayCount(answerHistory, user.id) : 0
  const dailyLimitReached = !!user && !hasUnlimitedAccess && answeredTodayCount >= DAILY_FREE_QUESTION_LIMIT
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  // Só dispara o pop-up de conversão automaticamente quando o limite é atingido
  // durante a sessão atual (transição 4 -> 5), não a cada vez que a página recarrega.
  const previousAnsweredCountRef = useRef(answeredTodayCount)
  useEffect(() => {
    if (
      !hasUnlimitedAccess &&
      previousAnsweredCountRef.current < DAILY_FREE_QUESTION_LIMIT &&
      answeredTodayCount >= DAILY_FREE_QUESTION_LIMIT
    ) {
      setShowLimitModal(true)
    }
    previousAnsweredCountRef.current = answeredTodayCount
  }, [answeredTodayCount, hasUnlimitedAccess])

  useEffect(() => {
    loadInstitutions()
  }, [loadInstitutions])

  const [filterValues, setFilterValues] = useState({
    moduleId: [] as string[],
    topicId: [] as string[],
    banca: [] as string[],
    institutionId: [] as string[],
    cargo: [] as string[],
    nivel: [] as string[],
    ano: [] as string[],
    situacao: '' as Situacao,
    palavraChave: '',
  })
  const [appliedFilters, setAppliedFilters] = useState(filterValues)
  const [refreshKey, setRefreshKey] = useState(0)
  const [justAnsweredIds, setJustAnsweredIds] = useState<Set<string>>(new Set())

  const handleRefresh = async () => {
    setLocalError(null)
    try {
      await loadQuestions()
      setRefreshKey(k => k + 1)
      setJustAnsweredIds(new Set())
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Erro ao carregar questões')
    }
  }

  const markJustAnswered = (questionId: string) => {
    setJustAnsweredIds(prev => (prev.has(questionId) ? prev : new Set(prev).add(questionId)))
  }

  const assuntoOptions = useMemo(() => {
    const set = new Set<string>()
    const modules = filterValues.moduleId.length ? filterValues.moduleId : Object.keys(TOPICOS_POR_DISCIPLINA)
    modules.forEach(m => (TOPICOS_POR_DISCIPLINA[m] ?? []).forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [filterValues.moduleId])

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
    return Array.from(set).sort()
  }, [questions])

  const resolvedQuestionIds = useMemo(() => {
    const set = new Set<string>()
    answerHistory.forEach(r => { if (r.userId === user?.id) set.add(r.questionId) })
    return set
  }, [answerHistory, user?.id])

  const correctQuestionIds = useMemo(() => {
    const set = new Set<string>()
    answerHistory.forEach(r => { if (r.userId === user?.id && r.correct) set.add(r.questionId) })
    return set
  }, [answerHistory, user?.id])

  const incorrectQuestionIds = useMemo(() => {
    const set = new Set<string>()
    answerHistory.forEach(r => { if (r.userId === user?.id && !r.correct) set.add(r.questionId) })
    return set
  }, [answerHistory, user?.id])

  const filteredQuestions = useMemo(() => {
    const keyword = appliedFilters.palavraChave.trim().toLowerCase()
    return questions.filter(q => {
      if (appliedFilters.moduleId.length && !appliedFilters.moduleId.includes(q.moduleId ?? '')) return false
      if (appliedFilters.topicId.length && !appliedFilters.topicId.includes(q.topicId ?? '')) return false
      if (appliedFilters.banca.length && !appliedFilters.banca.includes(q.banca ?? '')) return false
      if (appliedFilters.institutionId.length && !appliedFilters.institutionId.includes(q.institutionId ?? '')) return false
      if (appliedFilters.cargo.length && !appliedFilters.cargo.includes(q.cargo ?? '')) return false
      if (appliedFilters.nivel.length && !appliedFilters.nivel.includes(q.nivel ?? '')) return false
      if (appliedFilters.ano.length && !appliedFilters.ano.includes(q.ano ?? '')) return false
      if (!justAnsweredIds.has(q.id)) {
        if (appliedFilters.situacao === 'resolvidas' && !resolvedQuestionIds.has(q.id)) return false
        if (appliedFilters.situacao === 'nao_resolvidas' && resolvedQuestionIds.has(q.id)) return false
        if (appliedFilters.situacao === 'acertei' && !correctQuestionIds.has(q.id)) return false
        if (appliedFilters.situacao === 'errei' && !incorrectQuestionIds.has(q.id)) return false
      }
      if (keyword) {
        const haystack = [q.question, q.code, q.assunto, q.banca].filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(keyword)) return false
      }
      return true
    })
  }, [questions, appliedFilters, resolvedQuestionIds, correctQuestionIds, incorrectQuestionIds, justAnsweredIds])

  // No modo de teste o usuário vê no máximo DAILY_FREE_QUESTION_LIMIT questões,
  // independentemente dos filtros — o restante do banco fica reservado para assinantes.
  const visibleQuestions = useMemo(
    () => (limitedAccess ? filteredQuestions.slice(0, DAILY_FREE_QUESTION_LIMIT) : filteredQuestions),
    [filteredQuestions, limitedAccess]
  )

  const applyFilters = () => setAppliedFilters(filterValues)

  const emptyFilters: typeof filterValues = {
    moduleId: [], topicId: [], banca: [], institutionId: [], cargo: [], nivel: [], ano: [], situacao: '', palavraChave: '',
  }

  const clearFilters = () => {
    setFilterValues(emptyFilters)
    setAppliedFilters(emptyFilters)
  }

  const getInstitutionName = (id?: string) => institutions.find(i => i.id === id)?.name || ''

  const multiFilterKeys = ['moduleId', 'topicId', 'banca', 'institutionId', 'cargo', 'nivel', 'ano'] as const
  type MultiFilterKey = (typeof multiFilterKeys)[number]

  const setMultiFilter = (key: MultiFilterKey, values: string[]) => {
    setFilterValues(prev => ({ ...prev, [key]: values }))
  }

  const removeMultiFilterValue = (key: MultiFilterKey, value: string) => {
    const next = { ...filterValues, [key]: filterValues[key].filter(v => v !== value) }
    setFilterValues(next)
    setAppliedFilters(next)
  }

  const removeSingleFilter = (key: 'situacao' | 'palavraChave') => {
    const next = { ...filterValues, [key]: '' }
    setFilterValues(next)
    setAppliedFilters(next)
  }

  const valueLabel = (key: MultiFilterKey, value: string): string => {
    switch (key) {
      case 'moduleId': return DISCIPLINAS.find(d => d.value === value)?.label || value
      case 'institutionId': return getInstitutionName(value) || value
      default: return value
    }
  }

  const filterKeyLabel: Record<MultiFilterKey, string> = {
    moduleId: 'Disciplina', topicId: 'Assunto', banca: 'Banca', institutionId: 'Instituição', cargo: 'Cargo', nivel: 'Nível', ano: 'Ano',
  }

  const activeMultiFilterEntries = multiFilterKeys.flatMap(key =>
    appliedFilters[key].map(value => ({ key, value, label: `${filterKeyLabel[key]}: ${valueLabel(key, value)}` }))
  )

  const hasActiveFilters = activeMultiFilterEntries.length > 0 || !!appliedFilters.situacao || !!appliedFilters.palavraChave

  const situacaoLabel = (value: Situacao): string => {
    if (value === 'resolvidas') return 'Já resolvi'
    if (value === 'nao_resolvidas') return 'Não resolvi'
    if (value === 'acertei') return 'Acertei'
    return 'Errei'
  }

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

      {/* Aviso do modo de teste (amostra limitada do banco) */}
      {limitedAccess && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl">
          <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">Modo de teste — amostra grátis</p>
            <p className="opacity-90">
              Você pode ver e responder até {DAILY_FREE_QUESTION_LIMIT} questões de demonstração.
              Assine o Banco de Questões para liberar o banco completo.
            </p>
          </div>
        </div>
      )}

      {/* Uso diário grátis */}
      {user && !hasUnlimitedAccess && (
        <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-700">
                {dailyLimitReached ? 'Limite diário grátis atingido' : 'Questões grátis hoje'}
              </span>
              <span className={`text-sm font-semibold ${dailyLimitReached ? 'text-orange-600' : 'text-gray-700'}`}>
                {Math.min(answeredTodayCount, DAILY_FREE_QUESTION_LIMIT)}/{DAILY_FREE_QUESTION_LIMIT}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${dailyLimitReached ? 'bg-orange-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, (answeredTodayCount / DAILY_FREE_QUESTION_LIMIT) * 100)}%` }}
              />
            </div>
          </div>
          {dailyLimitReached && (
            <button
              onClick={() => setShowCheckout(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm flex-shrink-0"
            >
              <ShoppingCart className="w-4 h-4" />
              Assinar acesso ilimitado
            </button>
          )}
        </div>
      )}

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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
            <div className="p-6 space-y-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Filtros</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">PALAVRA-CHAVE</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={filterValues.palavraChave}
                    onChange={e => setFilterValues({ ...filterValues, palavraChave: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && applyFilters()}
                    placeholder="Buscar por palavras no enunciado, código, assunto ou banca..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                <MultiSelectDropdown
                  label="DISCIPLINA"
                  options={DISCIPLINAS}
                  selected={filterValues.moduleId}
                  onChange={values => setMultiFilter('moduleId', values)}
                  placeholder="Todas as disciplinas"
                />

                <MultiSelectDropdown
                  label="ASSUNTO"
                  options={assuntoOptions.map(t => ({ value: t, label: t }))}
                  selected={filterValues.topicId}
                  onChange={values => setMultiFilter('topicId', values)}
                  placeholder="Todos os assuntos"
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
                    <option value="acertei">Acertei</option>
                    <option value="errei">Errei</option>
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
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {activeMultiFilterEntries.map(({ key, value, label }) => (
                <span
                  key={`${key}-${value}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-sm"
                >
                  {label}
                  <button
                    onClick={() => removeMultiFilterValue(key, value)}
                    className="p-0.5 hover:bg-blue-100 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {appliedFilters.situacao && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-sm">
                  Situação: {situacaoLabel(appliedFilters.situacao)}
                  <button
                    onClick={() => removeSingleFilter('situacao')}
                    className="p-0.5 hover:bg-blue-100 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {appliedFilters.palavraChave && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-sm">
                  Palavra-chave: {appliedFilters.palavraChave}
                  <button
                    onClick={() => removeSingleFilter('palavraChave')}
                    className="p-0.5 hover:bg-blue-100 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
            </div>
          )}

          {!limitedAccess && !hasActiveFilters ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-lg font-medium">Use os filtros acima para buscar questões</p>
              <p className="text-gray-400 text-sm mt-1">Escolha ao menos um filtro para ver as questões correspondentes.</p>
            </div>
          ) : (
            <>
              {/* Contador */}
              <p className="text-sm text-gray-500 mb-4">
                {limitedAccess ? (
                  <>
                    Amostra grátis: <strong className="text-gray-800">{visibleQuestions.length}</strong>{' '}
                    {visibleQuestions.length === 1 ? 'questão disponível' : 'questões disponíveis'} para teste
                  </>
                ) : (
                  <>
                    Foram encontradas <strong className="text-gray-800">{filteredQuestions.length}</strong>{' '}
                    {filteredQuestions.length === 1 ? 'questão' : 'questões'}
                  </>
                )}
              </p>

              {/* Lista de questões */}
              {visibleQuestions.length === 0 ? (
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
                  {visibleQuestions.map((q, idx) => (
                    <QuestionCard
                      key={`${q.id}-${refreshKey}`}
                      question={q}
                      index={idx + 1}
                      onAnswered={() => markJustAnswered(q.id)}
                      hasUnlimitedAccess={hasUnlimitedAccess}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Pop-up de conversão ao atingir o limite diário */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLimitModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <button
              onClick={() => setShowLimitModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Você atingiu o limite diário grátis</h3>
            <p className="text-sm text-gray-500 mb-6">
              Você já respondeu {DAILY_FREE_QUESTION_LIMIT} questões grátis hoje. Assine para praticar sem limites e continuar sua preparação.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => { setShowLimitModal(false); setShowCheckout(true) }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                Assinar acesso ilimitado
              </button>
              <button
                onClick={() => setShowLimitModal(false)}
                className="text-sm text-gray-500 hover:text-gray-700 py-2"
              >
                Continuar amanhã
              </button>
            </div>
          </div>
        </div>
      )}

      {showCheckout && user && (() => {
        const course = getQuestionBankCourse(courses)
        return course ? (
          <CheckoutModal course={course} user={user} onClose={() => setShowCheckout(false)} onPaid={() => loadFromSupabase()} />
        ) : null
      })()}
    </div>
  )
}

export default function QuestionBank() {
  return <QuestionBankContent />
}
