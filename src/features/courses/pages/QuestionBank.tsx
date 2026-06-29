import { useState } from 'react'
import { useQuestionStore } from '../data/questionStore'
import type { Question } from '../data/mock'
import {
  Plus, CheckCircle, Upload, X as XIcon, FileText, Image as ImageIcon,
  Edit2, Trash2, Eye, ChevronLeft, Save, AlertCircle
} from 'lucide-react'
import Breadcrumb from '../../../shared/components/Breadcrumb'

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

const DISCIPLINAS = [
  { value: 'conhecimentos_educacionais', label: 'Conhecimentos Educacionais' },
  { value: 'legislacao', label: 'Legislação' },
  { value: 'portugues', label: 'Português' },
]

const TOPICOS_POR_DISCIPLINA: Record<string, string[]> = {
  portugues: [
    'Interpretação e Compreensão de Texto', 'Tipologia e Gêneros Textuais',
    'Coesão e Coerência Textual', 'Sintaxe da Norma Padrão', 'Morfologia',
    'Semântica e Léxico', 'Sintaxe do Período', 'Variação Linguística',
    'Estilística e Figuras de Linguagem', 'Fonética e Fonologia',
    'Redação Oficial', 'Análise do Discurso',
  ],
  legislacao: [
    'Constituição Federal de 1988', 'Regime Jurídico Único da União – Lei nº 8.112/1990',
    'Código de Ética Profissional - Decreto nº 1.171/1994',
    'Lei de Acesso à Informação (LAI) - Lei nº 12.527/2011',
    'Lei Geral de Proteção de Dados (LGPD) - Lei nº 13.709/2018',
    'Processo Administrativo Federal - LEI nº 9.784/1999',
    'Licitações e Contratos Administrativos - Lei nº 14.133/2021',
    'Lei de Improbidade Administrativa - Lei nº 8.429/1992',
    'Criação dos Institutos Federais - Lei nº 11.892/2008',
    'Estrutura do Plano de Carreira dos Técnico-Administrativos - Lei nº 11.091/2005',
    'Plano de carreiras e cargos docentes - Lei nº 12.772/2012',
    'Lei de Diretrizes e Bases da Educação (LDB) - Lei nº 9.394/1996',
    'Decreto nº 5.154/2004', 'Decreto nº 5.840/2006',
    'Diretrizes Gerais para EPT - Resolução CNE/CP nº 1/2021',
    'Estatuto da Criança e do Adolescente (ECA) - Lei nº 8.069/1990',
    'Inclusão e Acessibilidade', 'Diretrizes e Planos Educacionais',
    'Normas específicas de cada instituição',
  ],
  conhecimentos_educacionais: [
    'Didática Geral e Formação Docente', 'Tendências Pedagógicas',
    'Planejamento Escolar e Pedagógico', 'Avaliação no Processo de Ensino-Aprendizagem',
    'Psicologia da Aprendizagem e do Desenvolvimento', 'Educação de Jovens e Adultos',
    'Tecnologias de Informação e Comunicação (TICs) na Educação',
    'Metodologias Ativas de Aprendizagem', 'Inclusão na Educação Escolar',
    'Gestão Escolar', 'Base Nacional Comum Curricular',
    'Conhecimentos sobre Educação Profissional e Tecnológica', 'Outros Temas Educacionais',
  ],
}

const EMPTY_FORM = {
  question: '',
  options: ['', '', '', '', ''],
  correctAnswer: 0,
  moduleId: '',
  topicId: '',
  banca: '',
  nivel: '',
  ano: '',
  gabaritoComentado: '',
  materialUrl: '',
  materialType: undefined as 'image' | 'pdf' | undefined,
  aulaRelacionada: '',
}

export default function QuestionBank() {
  const { questions, addQuestion, updateQuestion, deleteQuestion } = useQuestionStore()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showEditSuccess, setShowEditSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // --- Form de criação ---
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [materialPreview, setMaterialPreview] = useState('')
  const [materialFileName, setMaterialFileName] = useState('')
  const [isBancaCustom, setIsBancaCustom] = useState(false)
  const [bancaCustom, setBancaCustom] = useState('')
  const [isAnoCustom, setIsAnoCustom] = useState(false)
  const [anoCustom, setAnoCustom] = useState('')

  // --- Form de edição ---
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM })
  const [editMaterialPreview, setEditMaterialPreview] = useState('')
  const [editMaterialFileName, setEditMaterialFileName] = useState('')
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

  const getCorrectLetter = (index: number) => String.fromCharCode(65 + index)

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
      } else {
        setForm(prev => ({ ...prev, materialUrl: result, materialType: type }))
        setMaterialPreview(isImage ? result : '')
        setMaterialFileName(file.name)
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
    } else {
      setForm(prev => ({ ...prev, materialUrl: '', materialType: undefined }))
      setMaterialPreview('')
      setMaterialFileName('')
    }
  }

  // --- Submissão: CRIA questão no Supabase ---
  const handleAdd = async () => {
    if (!form.question || form.options.some(o => !o)) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      // Não envia base64 pro banco (só URLs externas)
      const materialUrl = form.materialUrl.startsWith('data:') ? '' : form.materialUrl
      const materialType = materialUrl ? form.materialType : ''

      await addQuestion({
        id: Date.now().toString(),
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
        materialUrl,
        materialType,
        aulaRelacionada: form.aulaRelacionada,
      })

      setForm({ ...EMPTY_FORM })
      setMaterialPreview('')
      setMaterialFileName('')
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
      nivel: question.nivel || '',
      ano: question.ano || '',
      gabaritoComentado: question.gabaritoComentado || '',
      materialUrl: question.materialUrl || '',
      materialType: question.materialType || '',
      aulaRelacionada: question.aulaRelacionada || '',
    })
    setEditMaterialPreview(question.materialType === 'image' ? question.materialUrl || '' : '')
    setEditMaterialFileName('')
    setIsEditBancaCustom(false)
    setEditBancaCustom('')
    setIsEditAnoCustom(false)
    setEditAnoCustom('')
    setIsEditing(true)
    setSidebarOpen(true)
  }

  // --- Salva edição no Supabase ---
  const handleUpdate = async () => {
    if (!editingQuestion || !editForm.question || editForm.options.some(o => !o)) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const materialUrl = editForm.materialUrl.startsWith('data:') ? '' : editForm.materialUrl
      const materialType = materialUrl ? editForm.materialType : ''

      await updateQuestion({
        ...editingQuestion,
        question: editForm.question,
        options: editForm.options,
        correctAnswer: editForm.correctAnswer,
        moduleId: editForm.moduleId,
        topicId: editForm.topicId,
        assunto: editForm.topicId,
        banca: editForm.banca,
        nivel: editForm.nivel,
        ano: editForm.ano,
        gabaritoComentado: editForm.gabaritoComentado,
        materialUrl,
        materialType,
        aulaRelacionada: editForm.aulaRelacionada,
      })

      setShowEditSuccess(true)
      setTimeout(() => setShowEditSuccess(false), 2500)
      setSidebarOpen(false)
      setIsEditing(false)
      setEditingQuestion(null)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao atualizar questão')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta questão?')) return
    await deleteQuestion(id)
    if (editingQuestion?.id === id) {
      setSidebarOpen(false)
      setIsEditing(false)
      setEditingQuestion(null)
    }
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
        <Breadcrumb items={[{ label: 'Banco de Questões' }]} />
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Criar Questão</h1>
          <p className="text-gray-600 mt-1">Preencha os campos para adicionar uma nova questão ao banco</p>
        </div>

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

            {/* Disciplina + Banca */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {/* Material de apoio */}
            <MaterialField isEdit={false} />

            {/* Alternativas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ALTERNATIVAS</label>
              <div className="space-y-3">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      i === form.correctAnswer ? 'bg-green-100 text-green-700 ring-2 ring-green-400' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {String.fromCharCode(97 + i)}
                    </span>
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
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, correctAnswer: i }))}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                        i === form.correctAnswer ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {i === form.correctAnswer ? 'Correta ✓' : 'Marcar como correta'}
                    </button>
                  </div>
                ))}
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
              disabled={!form.question || form.options.some(o => !o) || isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Plus className="w-5 h-5" />
              {isSubmitting ? 'Salvando no banco...' : 'Adicionar Questão ao Banco'}
            </button>
          </div>
        </div>
      </div>

      {/* Botão para abrir sidebar */}
      <button
        onClick={() => setSidebarOpen(true)}
        className={`fixed top-1/2 right-0 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-l-lg shadow-lg hover:bg-blue-700 transition-all duration-300 z-40 ${
          sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

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
            // --- Lista de questões ---
            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma questão criada ainda.</p>
                  <p className="text-sm">Adicione sua primeira questão!</p>
                </div>
              ) : (
                questions.map((q, index) => (
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
                        <button onClick={() => handleEdit(q)} className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600" title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(q.id)} className="p-1.5 hover:bg-red-100 rounded-lg text-red-600" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ALTERNATIVAS</label>
                <div className="space-y-3">
                  {editForm.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        i === editForm.correctAnswer ? 'bg-green-100 text-green-700 ring-2 ring-green-400' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {String.fromCharCode(97 + i)}
                      </span>
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
                  disabled={!editForm.question || editForm.options.some(o => !o) || isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                >
                  <Save className="w-5 h-5" />
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                <button
                  onClick={() => { setIsEditing(false); setEditingQuestion(null) }}
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