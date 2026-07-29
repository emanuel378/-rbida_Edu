import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuestionStore } from '../data/questionStore'
import { useInstitutionStore } from '../data/institutionStore'
import { useAuthStore } from '../../auth/services/authStore'
import { uploadQuestionMaterial } from '../../../lib/supabase-storage'
import type { Question } from '../data/mock'
import {
  Plus, CheckCircle, Upload, X as XIcon, FileText, Image as ImageIcon,
  Edit2, Trash2, Eye, ChevronLeft, Save, AlertCircle, Loader2, Send, Search
} from 'lucide-react'
import Breadcrumb from '../../../shared/components/Breadcrumb'
import { DISCIPLINAS, TOPICOS_POR_DISCIPLINA } from '../data/taxonomy'

const BANCAS = [
  'Cebraspe', 'Fundação Getúlio Vargas - FGV', 'Fundação Carlos Chagas - FCC',
  'Fundação Cesgranrio', 'Instituto AOCP', 'IDECAN', 'IBFC', 'Quadrix',
  'Consulplan', 'Consulpam', 'FUNDEP', 'VUNESP', 'IADES', 'FUNCAB', 'FUNRIO',
  'Fundação CEFETMINAS', 'IFPI', 'Objetiva Concursos', 'FAURGS', 'COPEVE-UFAL',
  'Fundatec', 'FAU', 'COPESE/COPED', 'UFRN', 'UFSM', 'UFPE', 'UFAL', 'UFAM',
  'IFSertãoPE', 'IFMG', 'IFSP', 'IF Goiano', 'IFPR', 'IFAC', 'IFAL', 'IFAM',
  'IFAP', 'IF Baiano', 'IFBA', 'IFB', 'IFCE', 'IFES', 'IF Fluminense', 'IFG',
  'IFMA', 'IFMT', 'IFMS', 'IFNMG', 'IFPA', 'IFPB', 'IFPE', 'IFRN', 'IFRO',
  'IFRR', 'IFRS', 'IFSul', 'IF Sudeste MG', 'IFS', 'IFTO', 'IFC', 'IF Farroupilha',
]

const EMPTY_FORM = {
  question: '',
  options: ['', '', '', '', ''],
  correctAnswer: 0,
  moduleId: '',
  topicId: '',
  banca: '',
  institutionId: '',
  nivel: '',
  ano: '',
  gabaritoComentado: '',
  materialUrl: '',
  materialType: undefined as 'image' | 'pdf' | undefined,
  aulaRelacionada: '',
  questionImageUrl: '',
  optionImages: [] as (string | undefined)[],
  optionTypes: [] as ('text' | 'image' | 'both')[],
}

const getCorrectLetter = (index: number) => String.fromCharCode(65 + index)

// --- Painel com busca e lista de questões criadas (usado no conteúdo principal da rota de edição e na sidebar da rota de criação) ---
// Definido fora do componente para não perder o foco do campo de busca a cada re-render.
function QuestionListPanel({ questions, filteredQuestions, searchTerm, onSearchChange, onEdit, onDelete }: {
  questions: Question[]
  filteredQuestions: Question[]
  searchTerm: string
  onSearchChange: (value: string) => void
  onEdit: (question: Question) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      {questions.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Buscar por texto, código, banca, disciplina..."
            className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-full"
            >
              <XIcon className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      )}

      {questions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Nenhuma questão criada ainda.</p>
          <p className="text-sm">Adicione sua primeira questão!</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Nenhuma questão encontrada para "{searchTerm}".</p>
        </div>
      ) : (
        filteredQuestions.map((q, index) => (
          <div key={q.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-all">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                  {index + 1}. {q.question}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {q.banca && <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs">{q.banca}</span>}
                  {q.ano && <span className="px-2 py-1 rounded-md bg-purple-100 text-purple-700 text-xs">{q.ano}</span>}
                  {q.moduleId && (
                    <span className="px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs">
                      {DISCIPLINAS.find(d => d.value === q.moduleId)?.label || q.moduleId}
                    </span>
                  )}
                  {q.nivel && <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs">{q.nivel}</span>}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Gabarito: {getCorrectLetter(q.correctAnswer)}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => onEdit(q)} className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600" title="Editar">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(q.id)} className="p-1.5 hover:bg-red-100 rounded-lg text-red-600" title="Excluir">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default function QuestionBank() {
  const { user } = useAuthStore()
  const { questions, addQuestion, updateQuestion, deleteQuestion } = useQuestionStore()
  const { institutions, loadInstitutions } = useInstitutionStore()
  const location = useLocation()
  const navigate = useNavigate()
  const isEditRoute = location.pathname.endsWith('/editar')

  useEffect(() => {
    loadInstitutions()
  }, [loadInstitutions])

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showEditSuccess, setShowEditSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredQuestions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return questions
    return questions.filter(q => {
      const disciplina = DISCIPLINAS.find(d => d.value === q.moduleId)?.label || q.moduleId || ''
      return [q.question, q.code, q.banca, q.topicId, q.nivel, q.ano, disciplina]
        .some(field => field?.toLowerCase().includes(term))
    })
  }, [questions, searchTerm])

  // Abre a edição automaticamente ao chegar do "Banco de Questões" com uma questão selecionada
  useEffect(() => {
    const editQuestionId = (location.state as { editQuestionId?: string } | null)?.editQuestionId
    if (!editQuestionId) return
    const target = questions.find(q => q.id === editQuestionId)
    if (target) {
      handleEdit(target)
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, questions])

  const uploadImageFile = async (file: File): Promise<string> => {
    const result = await uploadQuestionMaterial(file, user?.id || 'unknown')
    if (result.error) throw new Error(result.error)
    return result.url
  }

  // --- Form de criação ---
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [materialPreview, setMaterialPreview] = useState('')
  const [materialFileName, setMaterialFileName] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingQuestionImage, setPendingQuestionImage] = useState<File | null>(null)
  const [questionImagePreview, setQuestionImagePreview] = useState('')
  const [pendingOptionImages, setPendingOptionImages] = useState<(File | null)[]>([null, null, null, null, null])
  const [optionImagePreviews, setOptionImagePreviews] = useState<string[]>(['', '', '', '', ''])
  const [isBancaCustom, setIsBancaCustom] = useState(false)
  const [bancaCustom, setBancaCustom] = useState('')
  const [isAnoCustom, setIsAnoCustom] = useState(false)
  const [anoCustom, setAnoCustom] = useState('')

  // --- Form de edição ---
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM })
  const [editMaterialPreview, setEditMaterialPreview] = useState('')
  const [editMaterialFileName, setEditMaterialFileName] = useState('')
  const [editPendingFile, setEditPendingFile] = useState<File | null>(null)
  const [editPendingQuestionImage, setEditPendingQuestionImage] = useState<File | null>(null)
  const [editQuestionImagePreview, setEditQuestionImagePreview] = useState('')
  const [editPendingOptionImages, setEditPendingOptionImages] = useState<(File | null)[]>([null, null, null, null, null])
  const [editOptionImagePreviews, setEditOptionImagePreviews] = useState<string[]>(['', '', '', '', ''])
  const [isEditBancaCustom, setIsEditBancaCustom] = useState(false)
  const [editBancaCustom, setEditBancaCustom] = useState('')
  const [isEditAnoCustom, setIsEditAnoCustom] = useState(false)
  const [editAnoCustom, setEditAnoCustom] = useState('')

  const getTopicOptions = (moduleId: string) =>
    TOPICOS_POR_DISCIPLINA[moduleId] ?? []

  const getUniqueBancas = (): string[] => {
    const s = new Set<string>()
    questions.forEach(q => { if (q.banca?.trim()) s.add(q.banca.trim()) })
    return Array.from(s).sort()
  }

  const getUniqueAnos = (): string[] => {
    const s = new Set<string>()
    questions.forEach(q => { if (q.ano?.trim()) s.add(q.ano.trim()) })
    return Array.from(s).sort((a, b) => parseInt(b) - parseInt(a))
  }

  // --- Handlers de material ---
  const handleMaterialFile = (file: File, isEdit = false) => {
    const isPdf = file.type === 'application/pdf'
    const isImage = file.type.startsWith('image/')
    if (!isPdf && !isImage) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const type: 'image' | 'pdf' = isPdf ? 'pdf' : 'image'
      if (isEdit) {
        setEditForm(prev => ({ ...prev, materialUrl: result, materialType: type }))
        setEditMaterialPreview(isImage ? result : '')
        setEditMaterialFileName(file.name)
        setEditPendingFile(file)
      } else {
        setForm(prev => ({ ...prev, materialUrl: result, materialType: type }))
        setMaterialPreview(isImage ? result : '')
        setMaterialFileName(file.name)
        setPendingFile(file)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleMaterialUrlChange = (value: string, isEdit = false) => {
    const type: 'image' | 'pdf' | '' = /\.pdf($|\?)/i.test(value) ? 'pdf' : value ? 'image' : ''
    if (isEdit) {
      setEditForm(prev => ({ ...prev, materialUrl: value, materialType: undefined }))
      setEditMaterialPreview(type === 'image' ? value : '')
      setEditMaterialFileName('')
    } else {
      setForm(prev => ({ ...prev, materialUrl: value, materialType: undefined }))
      setMaterialPreview(type === 'image' ? value : '')
      setMaterialFileName('')
    }
  }

  const handleRemoveMaterial = (isEdit = false) => {
    if (isEdit) {
      setEditForm(prev => ({ ...prev, materialUrl: '', materialType:undefined }))
      setEditMaterialPreview('')
      setEditMaterialFileName('')
      setEditPendingFile(null)
    } else {
      setForm(prev => ({ ...prev, materialUrl: '', materialType: undefined }))
      setMaterialPreview('')
      setMaterialFileName('')
      setPendingFile(null)
    }
  }

  // --- Submissão: CRIA questão no Supabase ---
  const handleAdd = async () => {
    if (!form.question || form.options.some((o, i) => !o && (form.optionTypes[i] || 'text') !== 'image')) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      let materialUrl = form.materialUrl
      let materialType = form.materialType

      if (pendingFile) {
        const result = await uploadQuestionMaterial(pendingFile, user?.id || 'unknown')
        if (result.error) throw new Error(result.error)
        materialUrl = result.url
        materialType = result.type
      } else if (form.materialUrl.startsWith('data:')) {
        materialUrl = ''
        materialType = undefined
      }

      let questionImageUrl = form.questionImageUrl
      if (pendingQuestionImage) {
        questionImageUrl = await uploadImageFile(pendingQuestionImage)
      } else if (form.questionImageUrl.startsWith('data:')) {
        questionImageUrl = ''
      }

      const optionImages: string[] = []
      const options = form.options.map((opt, i) => {
        const type = form.optionTypes[i] || 'text'
        return type === 'image' ? '' : opt
      })
      for (let i = 0; i < 5; i++) {
        if (pendingOptionImages[i]) {
          const url = await uploadImageFile(pendingOptionImages[i]!)
          optionImages.push(url)
        } else if (form.optionImages[i]?.startsWith('data:')) {
          optionImages.push('')
        } else {
          optionImages.push(form.optionImages[i] || '')
        }
      }

      await addQuestion({
        id: Date.now().toString(),
        code: '',
        question: form.question,
        options,
        correctAnswer: form.correctAnswer,
        moduleId: form.moduleId,
        topicId: form.topicId,
        assunto: form.topicId,
        banca: form.banca,
        institutionId: form.institutionId || undefined,
        nivel: form.nivel,
        ano: form.ano,
        gabaritoComentado: form.gabaritoComentado,
        materialUrl,
        materialType,
        aulaRelacionada: form.aulaRelacionada,
        questionImageUrl: questionImageUrl || undefined,
        optionImages: optionImages.filter(Boolean),
      })

      setForm({ ...EMPTY_FORM, optionTypes: [] })
      setMaterialPreview('')
      setMaterialFileName('')
      setPendingFile(null)
      setPendingQuestionImage(null)
      setQuestionImagePreview('')
      setPendingOptionImages([null, null, null, null, null])
      setOptionImagePreviews(['', '', '', '', ''])
      setIsBancaCustom(false)
      setBancaCustom('')
      setIsAnoCustom(false)
      setAnoCustom('')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2500)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao salvar questão')
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Abre edição na sidebar ---
  const handleEdit = (question: Question) => {
    setEditingQuestion(question)
    setEditForm({
      question: question.question || '',
      options: question.options?.length === 5 ? question.options : [...(question.options ?? []), ...['', '', '', '', '']].slice(0, 5),
      correctAnswer: question.correctAnswer || 0,
      moduleId: question.moduleId || '',
      topicId: question.topicId || '',
      banca: question.banca || '',
      institutionId: question.institutionId || '',
      nivel: question.nivel || '',
      ano: question.ano || '',
      gabaritoComentado: question.gabaritoComentado || '',
      materialUrl: question.materialUrl || '',
      materialType: question.materialType || ''|| undefined,
      aulaRelacionada: question.aulaRelacionada || '',
      questionImageUrl: question.questionImageUrl || '',
      optionImages: question.optionImages?.length === 5 ? question.optionImages : [...(question.optionImages ?? []), ...['', '', '', '', '']].slice(0, 5),
      optionTypes: question.optionImages?.length === 5
        ? question.optionImages.map((img, i) => img && question.options[i]?.trim() ? 'both' : img ? 'image' : 'text')
        : ['text', 'text', 'text', 'text', 'text'],
    })
    setEditMaterialPreview(question.materialType === 'image' ? question.materialUrl || '' : '')
    setEditMaterialFileName('')
    setEditQuestionImagePreview('')
    setEditPendingQuestionImage(null)
    setEditPendingOptionImages([null, null, null, null, null])
    setEditOptionImagePreviews(['', '', '', '', ''])
    setIsEditBancaCustom(false)
    setEditBancaCustom('')
    setIsEditAnoCustom(false)
    setEditAnoCustom('')
    setIsEditing(true)
    setSidebarOpen(true)
  }

  // --- Salva edição no Supabase ---
  const handleUpdate = async () => {
    if (!editingQuestion || !editForm.question || editForm.options.some((o, i) => !o && (editForm.optionTypes[i] || 'text') !== 'image')) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      let materialUrl = editForm.materialUrl
      let materialType = editForm.materialType

      if (editPendingFile) {
        const result = await uploadQuestionMaterial(editPendingFile, user?.id || 'unknown')
        if (result.error) throw new Error(result.error)
        materialUrl = result.url
        materialType = result.type
      } else if (editForm.materialUrl.startsWith('data:')) {
        materialUrl = ''
        materialType = undefined
      }

      let questionImageUrl = editForm.questionImageUrl
      if (editPendingQuestionImage) {
        questionImageUrl = await uploadImageFile(editPendingQuestionImage)
      } else if (editForm.questionImageUrl.startsWith('data:')) {
        questionImageUrl = ''
      }

      const optionImages: string[] = []
      const options = editForm.options.map((opt, i) => {
        const type = editForm.optionTypes[i] || 'text'
        return type === 'image' ? '' : opt
      })
      for (let i = 0; i < 5; i++) {
        if (editPendingOptionImages[i]) {
          const url = await uploadImageFile(editPendingOptionImages[i]!)
          optionImages.push(url)
        } else if (editForm.optionImages[i]?.startsWith('data:')) {
          optionImages.push('')
        } else {
          optionImages.push(editForm.optionImages[i] || '')
        }
      }

      await updateQuestion({
        ...editingQuestion,
        question: editForm.question,
        options,
        correctAnswer: editForm.correctAnswer,
        moduleId: editForm.moduleId,
        topicId: editForm.topicId,
        assunto: editForm.topicId,
        banca: editForm.banca,
        institutionId: editForm.institutionId || undefined,
        nivel: editForm.nivel,
        ano: editForm.ano,
        gabaritoComentado: editForm.gabaritoComentado,
        materialUrl,
        materialType,
        aulaRelacionada: editForm.aulaRelacionada,
        questionImageUrl: questionImageUrl || undefined,
        optionImages: optionImages.filter(Boolean),
      })

      setShowEditSuccess(true)
      setTimeout(() => setShowEditSuccess(false), 2500)
      setSidebarOpen(false)
      setIsEditing(false)
      setEditingQuestion(null)
      setEditPendingFile(null)
      setEditPendingQuestionImage(null)
      setEditQuestionImagePreview('')
      setEditPendingOptionImages([null, null, null, null, null])
      setEditOptionImagePreviews(['', '', '', '', ''])
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao atualizar questão')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingQuestion(null)
    if (isEditRoute) setSidebarOpen(false)
  }

  const handleDelete = async (id: string) => {
    const question = questions.find(q => q.id === id)
    if (!question) return

    if (user?.role === 'admin') {
      if (!window.confirm('Tem certeza que deseja excluir esta questão permanentemente?')) return
      await deleteQuestion(id)
      if (editingQuestion?.id === id) {
        setSidebarOpen(false)
        setIsEditing(false)
        setEditingQuestion(null)
      }
    } else {
      if (!window.confirm('Enviar solicitação de exclusão para o administrador?')) return
      useQuestionStore.getState().requestQuestionDeletion(id, user?.id || '', user?.name || '')
      if (editingQuestion?.id === id) {
        setSidebarOpen(false)
        setIsEditing(false)
        setEditingQuestion(null)
      }
    }
  }

  // --- Componente reutilizável de imagem do enunciado ---
  const QuestionImageField = ({ isEdit }: { isEdit: boolean }) => {
    const imageUrl = isEdit ? editForm.questionImageUrl : form.questionImageUrl
    const preview = isEdit ? editQuestionImagePreview : questionImagePreview
    const pendingFileState = isEdit ? editPendingQuestionImage : pendingQuestionImage
    const setPendingFileState = isEdit ? setEditPendingQuestionImage : setPendingQuestionImage
    const setPreview = isEdit ? setEditQuestionImagePreview : setQuestionImagePreview
    const setFormState = isEdit
      ? (url: string) => setEditForm(prev => ({ ...prev, questionImageUrl: url }))
      : (url: string) => setForm(prev => ({ ...prev, questionImageUrl: url }))

    const handleFile = (file: File) => {
      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
        setFormState('')
        setPendingFileState(file)
      }
      reader.readAsDataURL(file)
    }

    const handleRemove = () => {
      setPreview('')
      setFormState('')
      setPendingFileState(null)
    }

    const currentPreview = preview || (imageUrl && !imageUrl.startsWith('data:') ? imageUrl : '')

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          IMAGEM DO ENUNCIADO (opcional)
        </label>
        {currentPreview ? (
          <div className="relative inline-block">
            <img src={currentPreview} alt="Preview enunciado" className="max-h-48 rounded-xl border border-gray-200 object-contain" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50"
            >
              <XIcon className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-1 w-full px-4 py-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors text-gray-500">
            <ImageIcon className="w-6 h-6" />
            <span className="text-xs flex items-center gap-1">
              <Upload className="w-3 h-3" /> Clique para enviar imagem
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </label>
        )}
        <input
          value={imageUrl.startsWith('data:') ? '' : imageUrl}
          onChange={e => { setFormState(e.target.value); setPendingFileState(null); setPreview('') }}
          placeholder="ou cole a URL da imagem"
          className="mt-2 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    )
  }

  // --- Componente reutilizável de material ---
  const MaterialField = ({ isEdit }: { isEdit: boolean }) => {
    const url = isEdit ? editForm.materialUrl : form.materialUrl
    const type = isEdit ? editForm.materialType : form.materialType
    const preview = isEdit ? editMaterialPreview : materialPreview
    const fileName = isEdit ? editMaterialFileName : materialFileName

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          MATERIAL DE APOIO — IMAGEM OU PDF (opcional)
        </label>
        {url ? (
          <div className="relative inline-block">
            {type === 'image' && preview ? (
              <img src={preview} alt="Pré-visualização" className="max-h-56 rounded-xl border border-gray-200 object-contain" />
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
                <FileText className="w-6 h-6 text-red-500" />
                <span className="text-sm text-gray-700 truncate max-w-xs">{fileName || 'Arquivo PDF anexado'}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => handleRemoveMaterial(isEdit)}
              className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50"
            >
              <XIcon className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 w-full px-4 py-8 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors text-gray-500">
            <div className="flex gap-2">
              <ImageIcon className="w-6 h-6" />
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-sm flex items-center gap-1">
              <Upload className="w-4 h-4" /> Clique para enviar imagem ou PDF
            </span>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleMaterialFile(f, isEdit) }}
            />
          </label>
        )}
        <input
          value={url.startsWith('data:') ? '' : url}
          onChange={e => handleMaterialUrlChange(e.target.value, isEdit)}
          placeholder="ou cole a URL de uma imagem ou PDF"
          className="mt-2 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    )
  }

  // --- Componente de select de banca ---
  const BancaField = ({ isEdit }: { isEdit: boolean }) => {
    const value = isEdit ? editForm.banca : form.banca
    const isCustom = isEdit ? isEditBancaCustom : isBancaCustom
    const customValue = isEdit ? editBancaCustom : bancaCustom

    const setValue = (v: string) => isEdit
      ? setEditForm(prev => ({ ...prev, banca: v }))
      : setForm(prev => ({ ...prev, banca: v }))
    const setIsCustom = isEdit ? setIsEditBancaCustom : setIsBancaCustom
    const setCustomValue = isEdit ? setEditBancaCustom : setBancaCustom

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">BANCA</label>
        {!isCustom ? (
          <select
            value={value}
            onChange={e => {
              if (e.target.value === 'CUSTOM') { setIsCustom(true); setCustomValue(''); setValue('') }
              else setValue(e.target.value)
            }}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Selecione a banca...</option>
            {BANCAS.map(v => <option key={v} value={v}>{v}</option>)}
            {getUniqueBancas().filter(v => !BANCAS.includes(v)).map(v => (
              <option key={v} value={v}>{v} (salva)</option>
            ))}
            <option value="CUSTOM">+ Adicionar outra banca...</option>
          </select>
        ) : (
          <div className="flex gap-2">
            <input
              value={customValue}
              onChange={e => { setCustomValue(e.target.value); setValue(e.target.value) }}
              placeholder="Digite o nome da banca"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              autoFocus
            />
            <button
              type="button"
              onClick={() => { setIsCustom(false); setCustomValue(''); setValue('') }}
              className="px-3 py-2 text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    )
  }

  // --- Componente de select de ano ---
  const AnoField = ({ isEdit }: { isEdit: boolean }) => {
    const value = isEdit ? editForm.ano : form.ano
    const isCustom = isEdit ? isEditAnoCustom : isAnoCustom
    const customValue = isEdit ? editAnoCustom : anoCustom

    const setValue = (v: string) => isEdit
      ? setEditForm(prev => ({ ...prev, ano: v }))
      : setForm(prev => ({ ...prev, ano: v }))
    const setIsCustom = isEdit ? setIsEditAnoCustom : setIsAnoCustom
    const setCustomValue = isEdit ? setEditAnoCustom : setAnoCustom

    const anos = [...new Set([
      ...Array.from({ length: 2026 - 2009 + 1 }, (_, i) => String(2009 + i)),
      ...getUniqueAnos()
    ])].sort((a, b) => parseInt(b) - parseInt(a))

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">ANO</label>
        {!isCustom ? (
          <select
            value={value}
            onChange={e => {
              if (e.target.value === 'CUSTOM') { setIsCustom(true); setCustomValue(''); setValue('') }
              else setValue(e.target.value)
            }}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Selecione o ano...</option>
            {anos.map(y => <option key={y} value={y}>{y}</option>)}
            <option value="CUSTOM">+ Adicionar outro ano...</option>
          </select>
        ) : (
          <div className="flex gap-2">
            <input
              value={customValue}
              onChange={e => { setCustomValue(e.target.value); setValue(e.target.value) }}
              placeholder="Ex: 2027"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              autoFocus
            />
            <button
              type="button"
              onClick={() => { setIsCustom(false); setCustomValue(''); setValue('') }}
              className="px-3 py-2 text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      {/* ===== CONTEÚDO PRINCIPAL ===== */}
      <div className={`flex-1 p-6 lg:p-8 overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'mr-[420px]' : ''}`}>
        <Breadcrumb items={[{ label: isEditRoute ? 'Editar Questões' : 'Criar Questões' }]} />
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{isEditRoute ? 'Editar Questões' : 'Criar Questões'}</h1>
          <p className="text-gray-600 mt-1">
            {isEditRoute ? 'Veja, edite ou exclua as questões já cadastradas' : 'Preencha os campos para adicionar uma nova questão ao banco'}
          </p>
        </div>

        {isEditRoute ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <QuestionListPanel
              questions={questions}
              filteredQuestions={filteredQuestions}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        ) : (
        <>
        {showSuccess && (
          <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
            <CheckCircle className="w-5 h-5" />
            Questão adicionada com sucesso no banco de dados!
          </div>
        )}

        {submitError && (
          <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5" />
            {submitError}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 space-y-5">

            {/* Disciplina + Banca + Instituição */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">DISCIPLINA</label>
                <select
                  value={form.moduleId}
                  onChange={e => setForm(prev => ({ ...prev, moduleId: e.target.value, topicId: '' }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Selecione a disciplina...</option>
                  {DISCIPLINAS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <BancaField isEdit={false} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">INSTITUIÇÃO</label>
                <select
                  value={form.institutionId}
                  onChange={e => setForm(prev => ({ ...prev, institutionId: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Selecione a instituição...</option>
                  {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
            </div>

            {/* Assunto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ASSUNTO</label>
              <select
                value={form.topicId}
                onChange={e => setForm(prev => ({ ...prev, topicId: e.target.value }))}
                disabled={!form.moduleId || getTopicOptions(form.moduleId).length === 0}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {!form.moduleId ? 'Primeiro selecione a disciplina' : 'Selecione o assunto...'}
                </option>
                {getTopicOptions(form.moduleId).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Questão */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">QUESTÃO</label>
              <textarea
                value={form.question}
                onChange={e => setForm(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Digite o enunciado da questão..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Imagem do enunciado */}
            <QuestionImageField isEdit={false} />

            {/* Material de apoio */}
            <MaterialField isEdit={false} />

            {/* Alternativas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ALTERNATIVAS</label>
              <div className="space-y-3">
                {form.options.map((opt, i) => {
                  const optType = form.optionTypes[i] || 'text'
                  const optImgUrl = optionImagePreviews[i] || (form.optionImages[i] && !form.optionImages[i]!.startsWith('data:') ? form.optionImages[i]! : '')
                  return (
                    <div key={i}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                          {String.fromCharCode(65 + i)}:
                        </span>
                        {(['text', 'image', 'both'] as const).map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              const types = [...form.optionTypes]
                              types[i] = type
                              setForm(prev => ({ ...prev, optionTypes: types }))
                              if (type === 'image') {
                                const opts = [...form.options]
                                opts[i] = ''
                                setForm(prev => ({ ...prev, options: opts }))
                              }
                              if (type === 'text' && optImgUrl) {
                                const imgs = [...optionImagePreviews]; imgs[i] = ''
                                setOptionImagePreviews(imgs)
                                const pending = [...pendingOptionImages]; pending[i] = null
                                setPendingOptionImages(pending)
                                const oimgs = [...form.optionImages]; oimgs[i] = ''
                                setForm(prev => ({ ...prev, optionImages: oimgs }))
                              }
                            }}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                              optType === type
                                ? type === 'text' ? 'bg-blue-100 text-blue-700'
                                  : type === 'image' ? 'bg-purple-100 text-purple-700'
                                  : 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {type === 'text' ? 'Texto' : type === 'image' ? 'Imagem' : 'Ambos'}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          i === form.correctAnswer ? 'bg-green-100 text-green-700 ring-2 ring-green-400' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {String.fromCharCode(97 + i)}
                        </span>
                        {optType !== 'image' && (
                          <input
                            value={opt}
                            onChange={e => {
                              const opts = [...form.options]
                              opts[i] = e.target.value
                              setForm(prev => ({ ...prev, options: opts }))
                            }}
                            placeholder={`Alternativa ${String.fromCharCode(65 + i)}`}
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                        {optType === 'image' && !optImgUrl && (
                          <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-colors text-gray-500">
                            <ImageIcon className="w-5 h-5" />
                            <span className="text-sm">Clique para enviar imagem</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => {
                                const f = e.target.files?.[0]
                                if (!f) return
                                const reader = new FileReader()
                                reader.onload = () => {
                                  const imgs = [...optionImagePreviews]; imgs[i] = reader.result as string
                                  setOptionImagePreviews(imgs)
                                  const pending = [...pendingOptionImages]; pending[i] = f
                                  setPendingOptionImages(pending)
                                }
                                reader.readAsDataURL(f)
                              }}
                            />
                          </label>
                        )}
                        {optType === 'image' && optImgUrl && (
                          <div className="flex-1 relative inline-block">
                            <img src={optImgUrl} alt={`Opção ${i+1}`} className="max-h-20 rounded-xl border border-gray-200 object-contain" />
                            <button
                              type="button"
                              onClick={() => {
                                const imgs = [...optionImagePreviews]; imgs[i] = ''
                                setOptionImagePreviews(imgs)
                                const pending = [...pendingOptionImages]; pending[i] = null
                                setPendingOptionImages(pending)
                                const opts = [...form.optionImages]; opts[i] = ''
                                setForm(prev => ({ ...prev, optionImages: opts }))
                              }}
                              className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50"
                            >
                              <XIcon className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, correctAnswer: i }))}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                            i === form.correctAnswer ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {i === form.correctAnswer ? 'Correta ✓' : 'Marcar'}
                        </button>
                      </div>
                      {optType === 'both' && (
                        <div className="flex items-center gap-2 mt-1 ml-11">
                          {optImgUrl ? (
                            <div className="relative inline-block">
                              <img src={optImgUrl} alt={`Opção ${i+1}`} className="h-10 rounded border border-gray-200 object-contain" />
                              <button
                                type="button"
                                onClick={() => {
                                  const imgs = [...optionImagePreviews]; imgs[i] = ''
                                  setOptionImagePreviews(imgs)
                                  const pending = [...pendingOptionImages]; pending[i] = null
                                  setPendingOptionImages(pending)
                                  const opts = [...form.optionImages]; opts[i] = ''
                                  setForm(prev => ({ ...prev, optionImages: opts }))
                                }}
                                className="absolute -top-1.5 -right-1.5 bg-white border border-gray-200 rounded-full p-0.5 shadow-sm hover:bg-gray-50"
                              >
                                <XIcon className="w-3 h-3 text-gray-600" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer hover:text-blue-600 transition-colors">
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>Adicionar imagem</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => {
                                  const f = e.target.files?.[0]
                                  if (!f) return
                                  const reader = new FileReader()
                                  reader.onload = () => {
                                    const imgs = [...optionImagePreviews]; imgs[i] = reader.result as string
                                    setOptionImagePreviews(imgs)
                                    const pending = [...pendingOptionImages]; pending[i] = f
                                    setPendingOptionImages(pending)
                                  }
                                  reader.readAsDataURL(f)
                                }}
                              />
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Nível + Ano */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">NÍVEL</label>
                <select
                  value={form.nivel}
                  onChange={e => setForm(prev => ({ ...prev, nivel: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Selecione...</option>
                  <option value="Técnico">Técnico</option>
                  <option value="Médio">Médio</option>
                  <option value="Superior">Superior</option>
                </select>
              </div>
              <AnoField isEdit={false} />
            </div>

            {/* Gabarito comentado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">GABARITO COMENTADO (opcional)</label>
              <p className="text-xs text-gray-500 mb-2">
                Texto exibido ao aluno após responder a questão.
              </p>
              <textarea
                value={form.gabaritoComentado}
                onChange={e => setForm(prev => ({ ...prev, gabaritoComentado: e.target.value }))}
                placeholder="Escreva a explicação/comentário da resposta correta..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Aula relacionada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">AULA RELACIONADA (opcional)</label>
              <input
                value={form.aulaRelacionada}
                onChange={e => setForm(prev => ({ ...prev, aulaRelacionada: e.target.value }))}
                placeholder="URL do vídeo (YouTube, Vimeo, etc.)"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={!form.question || form.options.some((o, i) => !o && (form.optionTypes[i] || 'text') !== 'image') || isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Plus className="w-5 h-5" />
              {isSubmitting ? 'Salvando no banco...' : 'Adicionar Questão ao Banco'}
            </button>
          </div>
        </div>
        </>
        )}
      </div>

      {/* Botão para abrir sidebar */}
      {!isEditRoute && (
        <button
          onClick={() => setSidebarOpen(true)}
          className={`fixed top-1/2 right-0 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-l-lg shadow-lg hover:bg-blue-700 transition-all duration-300 z-40 ${
            sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* ===== SIDEBAR ===== */}
      <div className={`fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl border-l border-gray-200 transition-all duration-300 z-50 overflow-y-auto ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {isEditing ? 'Editar Questão' : 'Questões Criadas'}
          </h2>
          <button
            onClick={() => { setSidebarOpen(false); setIsEditing(false); setEditingQuestion(null) }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          {showEditSuccess && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
              <CheckCircle className="w-5 h-5" />
              Questão atualizada com sucesso!
            </div>
          )}

          {submitError && isEditing && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5" />
              {submitError}
            </div>
          )}

          {!isEditing ? (
            !isEditRoute && (
              <QuestionListPanel
                questions={questions}
                filteredQuestions={filteredQuestions}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )
          ) : (
            // --- Formulário de edição ---
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">DISCIPLINA</label>
                <select
                  value={editForm.moduleId}
                  onChange={e => setEditForm(prev => ({ ...prev, moduleId: e.target.value, topicId: '' }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Selecione...</option>
                  {DISCIPLINAS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>

              <BancaField isEdit={true} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">INSTITUIÇÃO</label>
                <select
                  value={editForm.institutionId}
                  onChange={e => setEditForm(prev => ({ ...prev, institutionId: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Selecione a instituição...</option>
                  {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ASSUNTO</label>
                <select
                  value={editForm.topicId}
                  onChange={e => setEditForm(prev => ({ ...prev, topicId: e.target.value }))}
                  disabled={!editForm.moduleId}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:opacity-60"
                >
                  <option value="">Selecione o assunto...</option>
                  {getTopicOptions(editForm.moduleId).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">QUESTÃO</label>
                <textarea
                  value={editForm.question}
                  onChange={e => setEditForm(prev => ({ ...prev, question: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Imagem do enunciado */}
              <QuestionImageField isEdit={true} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ALTERNATIVAS</label>
                <div className="space-y-3">
                  {editForm.options.map((opt, i) => {
                    const optType = editForm.optionTypes[i] || 'text'
                    const optImgUrl = editOptionImagePreviews[i] || (editForm.optionImages[i] && !editForm.optionImages[i]!.startsWith('data:') ? editForm.optionImages[i]! : '')
                    return (
                      <div key={i}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                            {String.fromCharCode(65 + i)}:
                          </span>
                          {(['text', 'image', 'both'] as const).map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                const types = [...editForm.optionTypes]
                                types[i] = type
                                setEditForm(prev => ({ ...prev, optionTypes: types }))
                                if (type === 'image') {
                                  const opts = [...editForm.options]
                                  opts[i] = ''
                                  setEditForm(prev => ({ ...prev, options: opts }))
                                }
                                if (type === 'text' && optImgUrl) {
                                  const imgs = [...editOptionImagePreviews]; imgs[i] = ''
                                  setEditOptionImagePreviews(imgs)
                                  const pending = [...editPendingOptionImages]; pending[i] = null
                                  setEditPendingOptionImages(pending)
                                  const oimgs = [...editForm.optionImages]; oimgs[i] = ''
                                  setEditForm(prev => ({ ...prev, optionImages: oimgs }))
                                }
                              }}
                              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                                optType === type
                                  ? type === 'text' ? 'bg-blue-100 text-blue-700'
                                    : type === 'image' ? 'bg-purple-100 text-purple-700'
                                    : 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                            >
                              {type === 'text' ? 'Texto' : type === 'image' ? 'Imagem' : 'Ambos'}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            i === editForm.correctAnswer ? 'bg-green-100 text-green-700 ring-2 ring-green-400' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {String.fromCharCode(97 + i)}
                          </span>
                          {optType !== 'image' && (
                            <input
                              value={opt}
                              onChange={e => {
                                const opts = [...editForm.options]
                                opts[i] = e.target.value
                                setEditForm(prev => ({ ...prev, options: opts }))
                              }}
                              placeholder={`Alternativa ${String.fromCharCode(65 + i)}`}
                              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                          {optType === 'image' && !optImgUrl && (
                            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-colors text-gray-500">
                              <ImageIcon className="w-5 h-5" />
                              <span className="text-sm">Clique para enviar imagem</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => {
                                  const f = e.target.files?.[0]
                                  if (!f) return
                                  const reader = new FileReader()
                                  reader.onload = () => {
                                    const imgs = [...editOptionImagePreviews]; imgs[i] = reader.result as string
                                    setEditOptionImagePreviews(imgs)
                                    const pending = [...editPendingOptionImages]; pending[i] = f
                                    setEditPendingOptionImages(pending)
                                  }
                                  reader.readAsDataURL(f)
                                }}
                              />
                            </label>
                          )}
                          {optType === 'image' && optImgUrl && (
                            <div className="flex-1 relative inline-block">
                              <img src={optImgUrl} alt={`Opção ${i+1}`} className="max-h-20 rounded-xl border border-gray-200 object-contain" />
                              <button
                                type="button"
                                onClick={() => {
                                  const imgs = [...editOptionImagePreviews]; imgs[i] = ''
                                  setEditOptionImagePreviews(imgs)
                                  const pending = [...editPendingOptionImages]; pending[i] = null
                                  setEditPendingOptionImages(pending)
                                  const opts = [...editForm.optionImages]; opts[i] = ''
                                  setEditForm(prev => ({ ...prev, optionImages: opts }))
                                }}
                                className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50"
                              >
                                <XIcon className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          )}
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
                        {optType === 'both' && (
                          <div className="flex items-center gap-2 mt-1 ml-11">
                            {optImgUrl ? (
                              <div className="relative inline-block">
                                <img src={optImgUrl} alt={`Opção ${i+1}`} className="h-10 rounded border border-gray-200 object-contain" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const imgs = [...editOptionImagePreviews]; imgs[i] = ''
                                    setEditOptionImagePreviews(imgs)
                                    const pending = [...editPendingOptionImages]; pending[i] = null
                                    setEditPendingOptionImages(pending)
                                    const opts = [...editForm.optionImages]; opts[i] = ''
                                    setEditForm(prev => ({ ...prev, optionImages: opts }))
                                  }}
                                  className="absolute -top-1.5 -right-1.5 bg-white border border-gray-200 rounded-full p-0.5 shadow-sm hover:bg-gray-50"
                                >
                                  <XIcon className="w-3 h-3 text-gray-600" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer hover:text-blue-600 transition-colors">
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>Adicionar imagem</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={e => {
                                    const f = e.target.files?.[0]
                                    if (!f) return
                                    const reader = new FileReader()
                                    reader.onload = () => {
                                      const imgs = [...editOptionImagePreviews]; imgs[i] = reader.result as string
                                      setEditOptionImagePreviews(imgs)
                                      const pending = [...editPendingOptionImages]; pending[i] = f
                                      setEditPendingOptionImages(pending)
                                    }
                                    reader.readAsDataURL(f)
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">NÍVEL</label>
                  <select
                    value={editForm.nivel}
                    onChange={e => setEditForm(prev => ({ ...prev, nivel: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Selecione...</option>
                    <option value="Técnico">Técnico</option>
                    <option value="Médio">Médio</option>
                    <option value="Superior">Superior</option>
                  </select>
                </div>
                <AnoField isEdit={true} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">GABARITO COMENTADO</label>
                <textarea
                  value={editForm.gabaritoComentado}
                  onChange={e => setEditForm(prev => ({ ...prev, gabaritoComentado: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <MaterialField isEdit={true} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">AULA RELACIONADA</label>
                <input
                  value={editForm.aulaRelacionada}
                  onChange={e => setEditForm(prev => ({ ...prev, aulaRelacionada: e.target.value }))}
                  placeholder="URL do vídeo"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleUpdate}
                  disabled={!editForm.question || editForm.options.some((o, i) => !o && (editForm.optionTypes[i] || 'text') !== 'image') || isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                >
                  <Save className="w-5 h-5" />
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}