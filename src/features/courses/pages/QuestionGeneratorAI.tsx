import { useState, useRef } from 'react'
import { useQuestionStore } from '../data/questionStore'
import { useAuthStore } from '../../auth/services/authStore'
import { uploadQuestionMaterial } from '../../../lib/supabase-storage'
import { generateQuestionsFromMaterial } from '../../../lib/ai-question-generator'
import { generateId } from '../../../lib/id'
import { DISCIPLINAS, TOPICOS_POR_DISCIPLINA } from '../data/taxonomy'
import Breadcrumb from '../../../shared/components/Breadcrumb'
import {
  Sparkles, Upload, FileText, AlertCircle, Loader2, CheckCircle,
  Edit2, Trash2, Save, X as XIcon, Wand2,
} from 'lucide-react'

interface ReviewForm {
  question: string
  options: string[]
  correctAnswer: number
  moduleId: string
  topicId: string
  banca: string
  nivel: string
  ano: string
  gabaritoComentado: string
}

interface ReviewItem {
  key: string
  form: ReviewForm
  saved: boolean
}

const EMPTY_FORM: ReviewForm = {
  question: '', options: ['', '', '', '', ''], correctAnswer: 0,
  moduleId: '', topicId: '', banca: '', nivel: '', ano: '', gabaritoComentado: '',
}

function matchTopic(moduleId: string, assunto: string): string {
  const options = TOPICOS_POR_DISCIPLINA[moduleId] ?? []
  const found = options.find(o => o.toLowerCase() === assunto.trim().toLowerCase())
  return found ?? ''
}

export default function QuestionGeneratorAI() {
  const { user } = useAuthStore()
  const { addQuestion } = useQuestionStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [defaultModuleId, setDefaultModuleId] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [reviewList, setReviewList] = useState<ReviewItem[]>([])
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ReviewForm>(EMPTY_FORM)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const processFile = async (file: File) => {
    const isPdf = file.type === 'application/pdf'
    const isImage = file.type.startsWith('image/')
    if (!isPdf && !isImage) {
      setGenerateError('Envie um arquivo PDF, JPG ou PNG.')
      return
    }
    if (!user) return

    setIsGenerating(true)
    setGenerateError(null)
    try {
      const upload = await uploadQuestionMaterial(file, user.id)
      if (upload.error) throw new Error(upload.error)

      const generated = await generateQuestionsFromMaterial(upload.url, file.type)
      if (generated.length === 0) {
        setGenerateError('A IA não encontrou nenhuma questão de múltipla escolha neste material.')
        return
      }

      const items: ReviewItem[] = generated.map(g => {
        const moduleId = defaultModuleId
        const topicId = moduleId ? matchTopic(moduleId, g.assunto || '') : ''
        return {
          key: generateId(),
          saved: false,
          form: {
            question: g.question,
            options: g.options.length === 5 ? g.options : [...g.options, '', '', '', '', ''].slice(0, 5),
            correctAnswer: g.correctAnswer ?? 0,
            moduleId,
            topicId,
            banca: g.banca || '',
            nivel: g.nivel || '',
            ano: g.ano || '',
            gabaritoComentado: g.gabaritoComentado || '',
          },
        }
      })
      setReviewList(prev => [...prev, ...items])
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Erro ao gerar questões com IA')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const openEdit = (item: ReviewItem) => {
    setEditingKey(item.key)
    setEditForm({ ...item.form, options: [...item.form.options] })
  }

  const closeEdit = () => {
    setEditingKey(null)
    setEditForm(EMPTY_FORM)
  }

  const saveEdit = () => {
    if (!editingKey) return
    setReviewList(prev => prev.map(item => item.key === editingKey ? { ...item, form: editForm } : item))
    closeEdit()
  }

  const discard = (key: string) => {
    setReviewList(prev => prev.filter(item => item.key !== key))
  }

  const saveItem = async (item: ReviewItem) => {
    const { form } = item
    if (!form.question.trim() || form.options.some(o => !o.trim()) || !form.moduleId) {
      setSaveError('Preencha disciplina, enunciado e todas as alternativas antes de salvar.')
      setEditingKey(item.key)
      setEditForm({ ...form })
      return
    }
    setSavingKey(item.key)
    setSaveError(null)
    try {
      await addQuestion({
        id: generateId(),
        code: '',
        question: form.question,
        options: form.options,
        correctAnswer: form.correctAnswer,
        moduleId: form.moduleId,
        topicId: form.topicId,
        assunto: form.topicId,
        banca: form.banca,
        nivel: form.nivel,
        ano: form.ano,
        gabaritoComentado: form.gabaritoComentado,
      })
      setReviewList(prev => prev.map(i => i.key === item.key ? { ...i, saved: true } : i))
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar questão')
    } finally {
      setSavingKey(null)
    }
  }

  const getTopicOptions = (moduleId: string) => TOPICOS_POR_DISCIPLINA[moduleId] ?? []

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <Breadcrumb items={[{ label: 'Gerador IA de Questões' }]} />

      <div className="mb-6 flex items-center gap-3">
        <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerador IA de Questões</h1>
          <p className="text-gray-600 mt-1">Envie um PDF ou foto de uma prova e a IA extrai as questões automaticamente</p>
        </div>
      </div>

      {generateError && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{generateError}</p>
        </div>
      )}

      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative bg-white rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          isDragging ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
        }`}
      >
        {isGenerating ? (
          <div className="flex flex-col items-center gap-3 text-gray-600">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
            <p className="font-medium">A IA está lendo o material e gerando as questões...</p>
            <p className="text-sm text-gray-400">Isso pode levar um minuto, dependendo do tamanho do arquivo.</p>
          </div>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }}
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center">
                <Wand2 className="w-7 h-7 text-purple-600" />
              </div>
              <p className="text-gray-700 font-medium">Arraste um arquivo aqui ou clique para selecionar</p>
              <p className="text-sm text-gray-400">PDF, JPG ou PNG</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium text-sm"
              >
                <Upload className="w-4 h-4" />
                Selecionar arquivo
              </button>
            </div>
          </>
        )}
      </div>

      {reviewList.length > 0 && (
        <div className="mt-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Aplicar disciplina a todas as questões geradas:</label>
            <select
              value={defaultModuleId}
              onChange={e => {
                const moduleId = e.target.value
                setDefaultModuleId(moduleId)
                setReviewList(prev => prev.map(item => item.saved ? item : {
                  ...item,
                  form: { ...item.form, moduleId, topicId: matchTopic(moduleId, item.form.topicId) },
                }))
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">Selecione a disciplina...</option>
              {DISCIPLINAS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          {saveError && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {saveError}
            </div>
          )}

          <p className="text-sm text-gray-500 mb-4">{reviewList.length} questão(ões) geradas — revise antes de salvar</p>

          <div className="space-y-4">
            {reviewList.map((item, idx) => (
              <div key={item.key} className={`bg-white rounded-2xl border p-5 ${item.saved ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-gray-900 font-medium flex-1">{idx + 1}. {item.form.question || <span className="text-gray-400 italic">Sem enunciado</span>}</p>
                  {item.saved && (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium flex-shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" /> Salva
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 mb-3">
                  {item.form.options.map((opt, i) => (
                    <div key={i} className={`text-sm px-3 py-1.5 rounded-lg flex items-center gap-2 ${
                      i === item.form.correctAnswer ? 'bg-green-50 text-green-800 border border-green-200' : 'text-gray-600'
                    }`}>
                      <span className="font-semibold">{String.fromCharCode(65 + i)})</span>
                      <span className="flex-1">{opt || <span className="italic text-gray-400">vazio</span>}</span>
                      {i === item.form.correctAnswer && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {item.form.banca && <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs">{item.form.banca}</span>}
                  {item.form.ano && <span className="px-2 py-1 rounded-md bg-purple-100 text-purple-700 text-xs">{item.form.ano}</span>}
                  {item.form.nivel && <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs">{item.form.nivel}</span>}
                  {item.form.moduleId && (
                    <span className="px-2 py-1 rounded-md bg-amber-100 text-amber-700 text-xs">
                      {DISCIPLINAS.find(d => d.value === item.form.moduleId)?.label}
                    </span>
                  )}
                </div>

                {!item.saved && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(item)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      <Edit2 className="w-4 h-4" /> Editar
                    </button>
                    <button
                      onClick={() => saveItem(item)}
                      disabled={savingKey === item.key}
                      className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> {savingKey === item.key ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      onClick={() => discard(item.key)}
                      className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium ml-auto"
                    >
                      <Trash2 className="w-4 h-4" /> Descartar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de edição */}
      {editingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeEdit} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Editar Questão</h2>
              <button onClick={closeEdit} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <XIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">DISCIPLINA</label>
                  <select
                    value={editForm.moduleId}
                    onChange={e => setEditForm(prev => ({ ...prev, moduleId: e.target.value, topicId: '' }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="">Selecione...</option>
                    {DISCIPLINAS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ASSUNTO</label>
                  <select
                    value={editForm.topicId}
                    onChange={e => setEditForm(prev => ({ ...prev, topicId: e.target.value }))}
                    disabled={!editForm.moduleId}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white disabled:bg-gray-100 disabled:opacity-60"
                  >
                    <option value="">Selecione...</option>
                    {getTopicOptions(editForm.moduleId).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">QUESTÃO</label>
                <textarea
                  value={editForm.question}
                  onChange={e => setEditForm(prev => ({ ...prev, question: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ALTERNATIVAS</label>
                <div className="space-y-2">
                  {editForm.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        i === editForm.correctAnswer ? 'bg-green-100 text-green-700 ring-2 ring-green-400' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <input
                        value={opt}
                        onChange={e => {
                          const options = [...editForm.options]
                          options[i] = e.target.value
                          setEditForm(prev => ({ ...prev, options }))
                        }}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => setEditForm(prev => ({ ...prev, correctAnswer: i }))}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                          i === editForm.correctAnswer ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {i === editForm.correctAnswer ? 'Correta ✓' : 'Marcar'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">BANCA</label>
                  <input
                    value={editForm.banca}
                    onChange={e => setEditForm(prev => ({ ...prev, banca: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">NÍVEL</label>
                  <select
                    value={editForm.nivel}
                    onChange={e => setEditForm(prev => ({ ...prev, nivel: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="">--</option>
                    <option value="Técnico">Técnico</option>
                    <option value="Médio">Médio</option>
                    <option value="Superior">Superior</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ANO</label>
                  <input
                    value={editForm.ano}
                    onChange={e => setEditForm(prev => ({ ...prev, ano: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">GABARITO COMENTADO</label>
                <textarea
                  value={editForm.gabaritoComentado}
                  onChange={e => setEditForm(prev => ({ ...prev, gabaritoComentado: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button onClick={closeEdit} className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm">
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium text-sm"
                >
                  Confirmar alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-16" />
      <div className="flex items-center gap-2 text-xs text-gray-400 -mt-12">
        <FileText className="w-3.5 h-3.5" />
        Formatos aceitos: PDF, JPG, PNG
      </div>
    </div>
  )
}
