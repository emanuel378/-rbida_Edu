import { useState } from 'react'
import { useQuestionStore } from '../data/questionStore'
import { useCourseStore } from '../data/courseStore'
import type { Question } from '../data/mock'
import { Plus, CheckCircle } from 'lucide-react'
import Breadcrumb from '../../../shared/components/Breadcrumb'

const STANDARD_FIELDS = new Set(['id', 'code', 'question', 'options', 'correctAnswer', 'difficulty', 'moduleId'])
const BLOCKED_FIELDS = new Set(['nivel', 'ano', 'banca', 'disciplina', 'disciplinas'])

const BANCAS = [
  'CESPE/CEBRASPE', 'FGV', 'VUNESP', 'FCC',
  'IFSP', 'IFMG', 'IFBA', 'IFRJ', 'IFSUL', 'IFSC', 'IFPR', 'IFES',
  'IFPE', 'IFCE', 'IFMA', 'IFPA', 'IFRN', 'IFGOIANO', 'IFTM', 'IFSULDEMINAS',
]
const normalizeKey = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export default function QuestionBank() {
  const { questions, addQuestion } = useQuestionStore()
  const modules = useCourseStore(s => s.modules)

  const asRecord = (q: Question): Record<string, unknown> => q as unknown as Record<string, unknown>

  const getMetaFields = () => {
    const fields = new Set<string>()
    questions.forEach(q => {
      Object.keys(q).forEach(key => {
        if (!STANDARD_FIELDS.has(key) && !BLOCKED_FIELDS.has(normalizeKey(key))) fields.add(key)
      })
    })
    return Array.from(fields).sort()
  }

  const dynamicFields = getMetaFields()

  const findFieldKey = (name: string): string | undefined => {
    const normalized = normalizeKey(name)
    for (const q of questions) {
      for (const key of Object.keys(q)) {
        if (normalizeKey(key) === normalized) return key
      }
    }
    return name
  }
  const fieldNivel = findFieldKey('nivel') ?? 'nivel'
  const fieldAno = findFieldKey('ano') ?? 'ano'
  const disciplinaFields = ['disciplina', 'disciplinas', 'materia', 'materias']
    .map(name => ({ name, key: findFieldKey(name) }))
    .filter((entry): entry is { name: string; key: string } => !!entry.key && entry.key !== entry.name)

  const getDisciplineOptions = () => {
    const seenLabels = new Set<string>()
    const result: { value: string; label: string }[] = []

    modules.forEach(m => {
      const norm = normalizeKey(m.title)
      if (!seenLabels.has(norm)) {
        seenLabels.add(norm)
        result.push({ value: m.id, label: m.title })
      }
    })

    questions.forEach(q => {
      const vals: string[] = []
      if (q.moduleId) vals.push(q.moduleId)
      disciplinaFields.forEach(({ name, key }) => {
        const v = asRecord(q)[key]
        if (v) vals.push(String(v))
      })
      vals.forEach(v => {
        if (!seenLabels.has(normalizeKey(v))) {
          seenLabels.add(normalizeKey(v))
          result.push({ value: v, label: v })
        }
      })
    })

    return result
  }

  const getRelatedValues = (field: string, currentSelections: Record<string, string>) => {
    const values = new Set<string>()
    questions.forEach(q => {
      const record = asRecord(q)
      for (const [key, val] of Object.entries(currentSelections)) {
        if (key !== field && val && !BLOCKED_FIELDS.has(normalizeKey(key)) && record[key] !== val) return
      }
      const v = record[field]
      if (v !== undefined && v !== null && v !== '') values.add(String(v))
    })
    return Array.from(values).sort()
  }

  const getBancaValues = () => {
    const fromExisting = getRelatedValues('banca', { ...meta, moduleId: newQ.moduleId })
    const all = new Set([...BANCAS, ...fromExisting])
    return Array.from(all)
  }

  const [newQ, setNewQ] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    difficulty: 'facil' as 'facil' | 'medio' | 'dificil',
    moduleId: '',
  })
  const [meta, setMeta] = useState<Record<string, string>>({})

  const [showSuccess, setShowSuccess] = useState(false)

  const handleAdd = () => {
    if (!newQ.question || newQ.options.some(o => !o)) return
    const metaData: Record<string, string> = {}
    if (newQ.moduleId) metaData.moduleId = newQ.moduleId
    if (newQ.moduleId && !modules.some(m => m.id === newQ.moduleId)) {
      disciplinaFields.forEach(({ key }) => { metaData[key] = newQ.moduleId })
    }
    dynamicFields.forEach(field => {
      if (meta[field]) metaData[field] = meta[field]
    })
    if (meta[fieldNivel]) metaData[fieldNivel] = meta[fieldNivel]
    if (meta[fieldAno]) metaData[fieldAno] = meta[fieldAno]
    if (meta.banca) metaData.banca = meta.banca
    addQuestion({ id: Date.now().toString(), code: '', ...newQ, ...metaData })
    setNewQ({ question: '', options: ['', '', '', ''], correctAnswer: 0, difficulty: 'facil', moduleId: '' })
    setMeta({})
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2500)
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <Breadcrumb items={[{ label: 'Nova Questão' }]} />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Criar Questão</h1>
        <p className="text-gray-600 mt-1">Preencha os campos para adicionar uma nova questão ao banco</p>
      </div>

      {showSuccess && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
          <CheckCircle className="w-5 h-5" />
          Questão adicionada com sucesso!
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">DISCIPLINA</label>
              <select
                value={newQ.moduleId}
                onChange={e => setNewQ({ ...newQ, moduleId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Selecione a disciplina...</option>
                {getDisciplineOptions().map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">BANCA</label>
              <select
                value={meta.banca ?? ''}
                onChange={e => setMeta(prev => ({ ...prev, banca: e.target.value }))}
                disabled={!newQ.moduleId}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">{newQ.moduleId ? 'Selecione a banca...' : 'Primeiro selecione a disciplina'}</option>
                {getBancaValues().map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">QUESTÃO</label>
            <textarea
              value={newQ.question}
              onChange={e => setNewQ({ ...newQ, question: e.target.value })}
              placeholder="Digite o enunciado da questão..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ALTERNATIVAS</label>
            <div className="space-y-3">
              {newQ.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    i === newQ.correctAnswer ? 'bg-green-100 text-green-700 ring-2 ring-green-400' : 'bg-gray-100 text-gray-600'
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
                    placeholder={`Alternativa ${String.fromCharCode(65 + i)}`}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setNewQ({ ...newQ, correctAnswer: i })}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                      i === newQ.correctAnswer
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {i === newQ.correctAnswer ? 'Correta' : 'Marcar como correta'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">DIFICULDADE</label>
              <select
                value={newQ.difficulty}
                onChange={e => setNewQ({ ...newQ, difficulty: e.target.value as 'facil' | 'medio' | 'dificil' })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="facil">🟢 Fácil</option>
                <option value="medio">🟡 Médio</option>
                <option value="dificil">🔴 Difícil</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">NÍVEL</label>
              <select
                value={meta[fieldNivel] ?? ''}
                onChange={e => setMeta(prev => ({ ...prev, [fieldNivel]: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Selecione...</option>
                <option value="Técnico">Técnico</option>
                <option value="Médio">Médio</option>
                <option value="Superior">Superior</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ANO</label>
              <select
                value={meta[fieldAno] ?? ''}
                onChange={e => setMeta(prev => ({ ...prev, [fieldAno]: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Selecione...</option>
                <option value="2020">2020</option>
                <option value="2021">2021</option>
                <option value="2022">2022</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>

            {dynamicFields.map(field => {
              const vals = getRelatedValues(field, meta)
              return (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 uppercase">{field}</label>
                  <select
                    value={meta[field] ?? ''}
                    onChange={e => {
                      const next = { ...meta, [field]: e.target.value }
                      dynamicFields.forEach(f => {
                        if (f !== field && next[f] && !getRelatedValues(f, next).includes(next[f])) {
                          next[f] = ''
                        }
                      })
                      setMeta(next)
                    }}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Selecione...</option>
                    {vals.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>

          <button
            onClick={handleAdd}
            disabled={!newQ.question || newQ.options.some(o => !o)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Plus className="w-5 h-5" />
            Adicionar Questão ao Banco
          </button>
        </div>
      </div>
    </div>
  )
}
