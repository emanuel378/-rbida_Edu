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

const ANSWER_KEY_ACCEPT = '.pdf,.jpg,.jpeg,.png,.csv,.xlsx,.xls,application/pdf,image/jpeg,image/png,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'

function isSupportedQuestionFile(file: File): boolean {
  return file.type === 'application/pdf' || file.type.startsWith('image/')
}

function isSupportedAnswerKeyFile(file: File): boolean {
  return (
    file.type === 'application/pdf' ||
    file.type.startsWith('image/') ||
    file.type === 'text/csv' ||
    file.type === 'application/csv' ||
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel' ||
    /\.(csv|xlsx|xls)$/i.test(file.name)
  )
}

export default function QuestionGeneratorAI() {
  const { user } = useAuthStore()
  const { addQuestion } = useQuestionStore()
  const mainFileInputRef = useRef<HTMLInputElement>(null)
  const answerKeyInputRef = useRef<HTMLInputElement>(null)

  const [defaultModuleId, setDefaultModuleId] = useState('')
  const [customInstructions, setCustomInstructions] = useState('')
  const [mainFiles, setMainFiles] = useState<File[]>([])
  const [answerKeyFiles, setAnswerKeyFiles] = useState<File[]>([])
  const [isDraggingMain, setIsDraggingMain] = useState(false)
  const [isDraggingKey, setIsDraggingKey] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [reviewList, setReviewList] = useState<ReviewItem[]>([])
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ReviewForm>(EMPTY_FORM)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const addMainFiles = (files: FileList | File[]) => {
    const list = Array.from(files)
    const invalid = list.find(f => !isSupportedQuestionFile(f))
    if (invalid) {
      setGenerateError('O arquivo das questões precisa ser PDF, JPG ou PNG.')
      return
    }
    setGenerateError(null)
    setMainFiles(prev => [...prev, ...list])
  }

  const addAnswerKeyFiles = (files: FileList | File[]) => {
    const list = Array.from(files)
    const invalid = list.find(f => !isSupportedAnswerKeyFile(f))
    if (invalid) {
      setGenerateError('O gabarito precisa ser PDF, JPG, PNG, CSV ou planilha (XLSX/XLS).')
      return
    }
    setGenerateError(null)
    setAnswerKeyFiles(prev => [...prev, ...list])
  }

  const removeMainFile = (index: number) => setMainFiles(prev => prev.filter((_, i) => i !== index))
  const removeAnswerKeyFile = (index: number) => setAnswerKeyFiles(prev => prev.filter((_, i) => i !== index))

  const handleGenerate = async () => {
    if (mainFiles.length === 0 || !user) return

    setIsGenerating(true)
    setGenerateError(null)
    try {
      const materials = await Promise.all(mainFiles.map(async file => {
        const upload = await uploadQuestionMaterial(file, user.id)
        if (upload.error) throw new Error(upload.error)
        return { url: upload.url, mimeType: file.type }
      }))

      const answerKeys = await Promise.all(answerKeyFiles.map(async file => {
        const upload = await uploadQuestionMaterial(file, user.id)
        if (upload.error) throw new Error(upload.error)
        return { url: upload.url, mimeType: file.type }
      }))

      const generated = await generateQuestionsFromMaterial(materials, answerKeys, customInstructions)
      if (generated.length === 0) {
        setGenerateError('A IA não encontrou nenhuma questão de múltipla escolha neste material.')
        return
      }

      const items: ReviewItem[] = generated.map(g => {
        const moduleId = defaultModuleId || g.moduleId || ''
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
      setMainFiles([])
      setAnswerKeyFiles([])
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Erro ao gerar questões com IA')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleMainDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingMain(false)
    if (e.dataTransfer.files?.length) addMainFiles(e.dataTransfer.files)
  }

  const handleAnswerKeyDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingKey(false)
    if (e.dataTransfer.files?.length) addAnswerKeyFiles(e.dataTransfer.files)
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

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Instruções adicionais para a IA (opcional)</label>
        <textarea
          value={customInstructions}
          onChange={e => setCustomInstructions(e.target.value)}
          placeholder='Ex: "Estas questões são de Direito Constitucional, nível concurso público" ou "Ignore a última página, é só um rascunho"'
          rows={2}
          disabled={isGenerating}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none disabled:bg-gray-50"
        />
      </div>

      {isGenerating ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
          <div className="flex flex-col items-center gap-3 text-gray-600">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
            <p className="font-medium">A IA está lendo o material e gerando as questões...</p>
            <p className="text-sm text-gray-400">Isso pode levar um minuto, dependendo do tamanho do arquivo.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Zona: arquivo das questões */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDraggingMain(true) }}
            onDragLeave={() => setIsDraggingMain(false)}
            onDrop={handleMainDrop}
            className={`relative bg-white rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
              isDraggingMain ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            <input
              ref={mainFileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="hidden"
              onChange={e => { if (e.target.files?.length) addMainFiles(e.target.files); e.target.value = '' }}
            />
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Questões</p>
              <p className="text-xs text-gray-400">Arraste ou clique — PDF, JPG ou PNG (pode enviar várias páginas)</p>
              {mainFiles.length > 0 && (
                <div className="w-full space-y-1.5">
                  {mainFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg text-xs text-purple-700">
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate flex-1 text-left">{f.name}</span>
                      <button onClick={() => removeMainFile(i)} className="flex-shrink-0"><XIcon className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => mainFileInputRef.current?.click()}
                className="mt-1 flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium text-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                {mainFiles.length > 0 ? 'Adicionar mais' : 'Selecionar'}
              </button>
            </div>
          </div>

          {/* Zona: gabarito */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDraggingKey(true) }}
            onDragLeave={() => setIsDraggingKey(false)}
            onDrop={handleAnswerKeyDrop}
            className={`relative bg-white rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
              isDraggingKey ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <input
              ref={answerKeyInputRef}
              type="file"
              multiple
              accept={ANSWER_KEY_ACCEPT}
              className="hidden"
              onChange={e => { if (e.target.files?.length) addAnswerKeyFiles(e.target.files); e.target.value = '' }}
            />
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Gabarito (opcional)</p>
              <p className="text-xs text-gray-400">PDF, foto, CSV ou planilha (pode enviar vários)</p>
              {answerKeyFiles.length > 0 && (
                <div className="w-full space-y-1.5">
                  {answerKeyFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg text-xs text-green-700">
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate flex-1 text-left">{f.name}</span>
                      <button onClick={() => removeAnswerKeyFile(i)} className="flex-shrink-0"><XIcon className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => answerKeyInputRef.current?.click()}
                className="mt-1 flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium text-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                {answerKeyFiles.length > 0 ? 'Adicionar mais' : 'Selecionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!isGenerating && (
        <button
          onClick={handleGenerate}
          disabled={mainFiles.length === 0}
          className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-5 h-5" />
          Gerar Questões com IA
        </button>
      )}

      {reviewList.length > 0 && (
        <div className="mt-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Disciplina (a IA já classifica sozinha — use aqui só se quiser sobrescrever tudo):</label>
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
