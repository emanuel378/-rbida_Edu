import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuestionStore } from '../../courses/data/questionStore'
import { useInstitutionStore } from '../../courses/data/institutionStore'
import { useAuthStore } from '../../auth/services/authStore'
import { useCourseStore, hasQuestionBankAccess, getQuestionBankCourse } from '../../courses/data/courseStore'
import { DISCIPLINAS, TOPICOS_POR_DISCIPLINA, getDisciplinaLabel } from '../../courses/data/taxonomy'
import { useNotebookStore } from '../data/notebookStore'
import { emptyCadernoFilters, type CadernoFilters } from '../data/notebookTypes'
import CheckoutModal from '../../courses/components/CheckoutModal'
import Breadcrumb from '../../../shared/components/Breadcrumb'
import MultiSelectDropdown from '../../../shared/components/MultiSelectDropdown'
import { FileStack, Sparkles, Loader2, Lock, ShoppingCart } from 'lucide-react'

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function NotebookGenerator() {
  const navigate = useNavigate()
  const { questions, loading, loadQuestions } = useQuestionStore()
  const { institutions, loadInstitutions } = useInstitutionStore()
  const { user } = useAuthStore()
  const { courses, getEnrollment, loadFromSupabase } = useCourseStore()
  const { createNotebook } = useNotebookStore()
  const hasAccess = hasQuestionBankAccess(user, courses, getEnrollment)

  useEffect(() => {
    loadInstitutions()
    if (questions.length === 0) loadQuestions().catch(() => {})
  }, [loadInstitutions, loadQuestions, questions.length])

  const [showCheckout, setShowCheckout] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const [filters, setFilters] = useState<CadernoFilters>(emptyCadernoFilters())
  const [title, setTitle] = useState('')
  const [distributeByDiscipline, setDistributeByDiscipline] = useState(false)
  const [perDiscipline, setPerDiscipline] = useState<Record<string, number>>({})

  const assuntoOptions = useMemo(() => {
    const set = new Set<string>()
    const modules = filters.moduleId.length ? filters.moduleId : Object.keys(TOPICOS_POR_DISCIPLINA)
    modules.forEach(m => (TOPICOS_POR_DISCIPLINA[m] ?? []).forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [filters.moduleId])

  const bancaOptions = useMemo(() => {
    const set = new Set<string>()
    questions.forEach(q => { if (q.banca) set.add(q.banca) })
    return Array.from(set).sort()
  }, [questions])

  const cargoOptions = useMemo(() => {
    const set = new Set<string>()
    questions.forEach(q => { if (q.cargo) set.add(q.cargo) })
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

  const setMultiFilter = (key: keyof CadernoFilters, values: string[]) => {
    setFilters(prev => ({ ...prev, [key]: values }))
  }

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (filters.moduleId.length && !filters.moduleId.includes(q.moduleId ?? '')) return false
      if (filters.topicId.length && !filters.topicId.includes(q.topicId ?? '')) return false
      if (filters.banca.length && !filters.banca.includes(q.banca ?? '')) return false
      if (filters.institutionId.length && !filters.institutionId.includes(q.institutionId ?? '')) return false
      if (filters.cargo.length && !filters.cargo.includes(q.cargo ?? '')) return false
      if (filters.nivel.length && !filters.nivel.includes(q.nivel ?? '')) return false
      if (filters.ano.length && !filters.ano.includes(q.ano ?? '')) return false
      return true
    })
  }, [questions, filters])

  const disciplinesInPool = useMemo(() => {
    const set = new Set<string>()
    filteredQuestions.forEach(q => { if (q.moduleId) set.add(q.moduleId) })
    return Array.from(set)
  }, [filteredQuestions])

  const availableCount = filteredQuestions.length
  const [total, setTotal] = useState(10)

  useEffect(() => {
    setTotal(prev => Math.max(1, Math.min(prev, Math.max(1, availableCount))))
  }, [availableCount])

  const allocatedByDiscipline = Object.values(perDiscipline).reduce((sum, v) => sum + (v || 0), 0)
  const remainingToAllocate = total - allocatedByDiscipline

  const handleGenerate = async () => {
    if (!user || availableCount === 0 || total < 1) return
    setIsGenerating(true)
    try {
      let selectedIds: string[] = []

      if (distributeByDiscipline && disciplinesInPool.length > 0) {
        const usedIds = new Set<string>()
        disciplinesInPool.forEach(moduleId => {
          const quota = Math.max(0, Math.min(perDiscipline[moduleId] || 0, total))
          const pool = shuffle(filteredQuestions.filter(q => q.moduleId === moduleId))
          pool.slice(0, quota).forEach(q => { selectedIds.push(q.id); usedIds.add(q.id) })
        })
        const remaining = total - selectedIds.length
        if (remaining > 0) {
          const restPool = shuffle(filteredQuestions.filter(q => !usedIds.has(q.id)))
          selectedIds.push(...restPool.slice(0, remaining).map(q => q.id))
        }
      } else {
        selectedIds = shuffle(filteredQuestions).slice(0, total).map(q => q.id)
      }

      const finalTitle = title.trim() || `Caderno de ${new Date().toLocaleDateString('pt-BR')}`
      const notebook = await createNotebook({
        userId: user.id,
        title: finalTitle,
        filters,
        questionIds: selectedIds,
      })
      navigate(`/dashboard/cadernos/${notebook.id}`)
    } finally {
      setIsGenerating(false)
    }
  }

  if (!hasAccess) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <Breadcrumb items={[{ label: 'Cadernos', to: '/dashboard/cadernos' }, { label: 'Gerar Caderno' }]} />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Lock className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Assine o Banco de Questões</h1>
          <p className="text-gray-500 mb-6">
            Gerar cadernos de questões é um recurso do acesso completo ao Banco de Questões.
          </p>
          <button
            onClick={() => setShowCheckout(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            Assinar acesso ilimitado
          </button>
        </div>
        {showCheckout && user && (() => {
          const course = getQuestionBankCourse(courses)
          return course ? (
            <CheckoutModal course={course} user={user} onClose={() => setShowCheckout(false)} onPaid={() => loadFromSupabase()} />
          ) : null
        })()}
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <Breadcrumb items={[{ label: 'Cadernos', to: '/dashboard/cadernos' }, { label: 'Gerar Caderno' }]} />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <FileStack className="w-5 h-5 text-blue-600" />
          </div>
          Gerar Caderno de Questões
        </h1>
        <p className="text-gray-600 mt-2">Escolha os filtros e a quantidade de questões para montar seu caderno.</p>
      </div>

      {loading && questions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Loader2 className="w-10 h-10 text-blue-600 mx-auto mb-3 animate-spin" />
          <p className="text-gray-500 text-lg font-medium">Carregando questões...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
            <div className="p-6 space-y-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Filtros</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <MultiSelectDropdown
                  label="DISCIPLINA"
                  options={DISCIPLINAS}
                  selected={filters.moduleId}
                  onChange={values => setMultiFilter('moduleId', values)}
                  placeholder="Todas as disciplinas"
                />
                <MultiSelectDropdown
                  label="ASSUNTO"
                  options={assuntoOptions.map(t => ({ value: t, label: t }))}
                  selected={filters.topicId}
                  onChange={values => setMultiFilter('topicId', values)}
                  placeholder="Todos os assuntos"
                />
                <MultiSelectDropdown
                  label="BANCA"
                  options={bancaOptions.map(v => ({ value: v, label: v }))}
                  selected={filters.banca}
                  onChange={values => setMultiFilter('banca', values)}
                  placeholder="Todas as bancas"
                />
                <MultiSelectDropdown
                  label="ÓRGÃO"
                  options={institutions.map(i => ({ value: i.id, label: i.name }))}
                  selected={filters.institutionId}
                  onChange={values => setMultiFilter('institutionId', values)}
                  placeholder="Todos os órgãos"
                />
                <MultiSelectDropdown
                  label="CARGO"
                  options={cargoOptions.map(v => ({ value: v, label: v }))}
                  selected={filters.cargo}
                  onChange={values => setMultiFilter('cargo', values)}
                  placeholder="Todos os cargos"
                />
                <MultiSelectDropdown
                  label="DIFICULDADE"
                  options={nivelOptions.map(v => ({ value: v, label: v }))}
                  selected={filters.nivel}
                  onChange={values => setMultiFilter('nivel', values)}
                  placeholder="Todas as dificuldades"
                />
                <MultiSelectDropdown
                  label="ANO"
                  options={anoOptions.map(v => ({ value: v, label: v }))}
                  selected={filters.ano}
                  onChange={values => setMultiFilter('ano', values)}
                  placeholder="Todos os anos"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <p className="text-sm text-gray-500 mb-4">
              <strong className="text-gray-900 text-base">{availableCount}</strong>{' '}
              {availableCount === 1 ? 'questão disponível' : 'questões disponíveis'} com esse filtro
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">TÍTULO DO CADERNO</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={`Caderno de ${new Date().toLocaleDateString('pt-BR')}`}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">QUANTIDADE DE QUESTÕES</label>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, availableCount)}
                  value={total}
                  onChange={e => setTotal(Math.max(1, Math.min(Number(e.target.value) || 1, Math.max(1, availableCount))))}
                  disabled={availableCount === 0}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={distributeByDiscipline}
                onChange={e => setDistributeByDiscipline(e.target.checked)}
                disabled={disciplinesInPool.length === 0}
              />
              Distribuir quantidade por disciplina
            </label>

            {distributeByDiscipline && disciplinesInPool.length > 0 && (
              <div className="mt-3 border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50">
                {disciplinesInPool.map(moduleId => {
                  const poolCount = filteredQuestions.filter(q => q.moduleId === moduleId).length
                  return (
                    <div key={moduleId} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-700">
                        {getDisciplinaLabel(moduleId)}
                        <span className="text-gray-400 text-xs ml-1.5">({poolCount} disponíveis)</span>
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={poolCount}
                        value={perDiscipline[moduleId] ?? 0}
                        onChange={e => setPerDiscipline(prev => ({
                          ...prev,
                          [moduleId]: Math.max(0, Math.min(Number(e.target.value) || 0, poolCount)),
                        }))}
                        className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  )
                })}
                <p className={`text-xs pt-1 ${remainingToAllocate < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                  {remainingToAllocate > 0 && `${remainingToAllocate} questões serão sorteadas livremente para completar o total.`}
                  {remainingToAllocate === 0 && 'Toda a quantidade foi distribuída entre as disciplinas.'}
                  {remainingToAllocate < 0 && 'A soma por disciplina ultrapassa a quantidade total.'}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={availableCount === 0 || isGenerating || remainingToAllocate < 0}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Gerar Caderno de Questões
          </button>
        </>
      )}
    </div>
  )
}
