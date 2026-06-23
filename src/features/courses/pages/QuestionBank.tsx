import { useState } from 'react'
import { useQuestionStore } from '../data/questionStore'
import { useCourseStore } from '../data/courseStore'
import type { Question } from '../data/mock'
import { Plus, CheckCircle, Upload, X as XIcon, FileText, Image as ImageIcon } from 'lucide-react'
import Breadcrumb from '../../../shared/components/Breadcrumb'
import { isSupabaseConfigured } from '../../../lib/supabase'
import { uploadQuestionMaterial } from '../../../lib/supabase-storage'
import { generateId } from '../../../lib/id'
import { useAuthStore } from '../../auth/services/authStore'

const STANDARD_FIELDS = new Set(['id', 'code', 'question', 'options', 'correctAnswer', 'moduleId', 'topicId', 'assunto'])
const BLOCKED_FIELDS = new Set(['nivel', 'ano', 'banca', 'disciplina', 'disciplinas', 'assunto', 'gabaritocomentado', 'createdat', 'imageurl', 'aulasrelacionadas', 'materialurl', 'aularelacionada'])

const BANCAS = [
  'Cebraspe',
  'Fundação Getúlio Vargas - FGV',
  'Fundação Carlos Chagas - FCC',
  'Fundação Cesgranrio',
  'Instituto AOCP',
  'IDECAN',
  'IBFC',
  'Quadrix',
  'Consulplan',
  'Consulpam',
  'FUNDEP',
  'VUNESP',
  'IADES',
  'FUNCAB',
  'FUNRIO',
  'Fundação CEFETMINAS',
  'IFPI',
  'Objetiva Concursos',
  'FAURGS',
  'COPEVE-UFAL',
  'Fundatec',
  'FAU',
  'COPESE/COPED',
  'UFRN',
  'UFSM',
  'UFPE',
  'UFAL',
  'UFAM',
  'IFSertãoPE',
  'IFMG',
  'IFSP',
  'IF Goiano',
  'IFPR',
  'IFAC',
  'IFAL',
  'IFAM',
  'IFAP',
  'IF Baiano',
  'IFBA',
  'IFB',
  'IFCE',
  'IFES',
  'IF Fluminense',
  'IFG',
  'IFMA',
  'IFMT',
  'IFMS',
  'IFNMG',
  'IFPA',
  'IFPB',
  'IFPE',
  'IFRN',
  'IFRO',
  'IFRR',
  'IFRS',
  'IFSul',
  'IF Sudeste MG',
  'IFS',
  'IFTO',
  'IFC',
  'IF Farroupilha',
]

const DISCIPLINAS = [
  { value: 'conhecimentos_educacionais', label: 'Conhecimentos Educacionais' },
  { value: 'legislacao', label: 'Legislação' },
  { value: 'portugues', label: 'Português' },
]

const TOPICOS_POR_DISCIPLINA: Record<string, string[]> = {
  portugues: [
    'Interpretação e Compreensão de Texto',
    'Tipologia e Gêneros Textuais',
    'Coesão e Coerência Textual',
    'Sintaxe da Norma Padrão',
    'Morfologia',
    'Semântica e Léxico',
    'Sintaxe do Período',
    'Variação Linguística',
    'Estilística e Figuras de Linguagem',
    'Fonética e Fonologia',
    'Redação Oficial',
    'Análise do Discurso',
  ],
  legislacao: [
    'Constituição Federal de 1988',
    'Regime Jurídico Único da União – Lei nº 8.112/1990',
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
    'Decreto nº 5.154/2004',
    'Decreto nº 5.840/2006',
    'Diretrizes Gerais para EPT - Resolução CNE/CP nº 1/2021',
    'Estatuto da Criança e do Adolescente (ECA) - Lei nº 8.069/1990',
    'Inclusão e Acessibilidade',
    'Diretrizes e Planos Educacionais',
    'Normas específicas de cada instituição',
  ],
  conhecimentos_educacionais: [
    'Didática Geral e Formação Docente',
    'Tendências Pedagógicas',
    'Planejamento Escolar e Pedagógico',
    'Avaliação no Processo de Ensino-Aprendizagem',
    'Psicologia da Aprendizagem e do Desenvolvimento',
    'Educação de Jovens e Adultos',
    'Tecnologias de Informação e Comunicação (TICs) na Educação',
    'Metodologias Ativas de Aprendizagem',
    'Inclusão na Educação Escolar',
    'Gestão Escolar',
    'Base Nacional Comum Curricular',
    'Conhecimentos sobre Educação Profissional e Tecnológica',
    'Outros Temas Educacionais',
  ],
}

const normalizeKey = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export default function QuestionBank() {
  const { questions, addQuestion } = useQuestionStore()
  const modules = useCourseStore(s => s.modules)
  const topics = useCourseStore(s => s.topics)
  const user = useAuthStore(s => s.user)

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

  const getBancaValues = () => BANCAS

  const getTopicOptions = () => {
    return TOPICOS_POR_DISCIPLINA[newQ.moduleId] ?? []
  }

  const [newQ, setNewQ] = useState({
    question: '',
    options: ['', '', '', '', ''],
    correctAnswer: 0,
    moduleId: '',
    topicId: '',
  })
  const [meta, setMeta] = useState<Record<string, string>>({})

  const [gabaritoComentado, setGabaritoComentado] = useState('')

  // ---- Material de apoio (imagem ou PDF) ----
  const [materialUrl, setMaterialUrl] = useState('')
  const [materialPreview, setMaterialPreview] = useState('')
  const [materialType, setMaterialType] = useState<'image' | 'pdf' | ''>('')
  const [materialFileName, setMaterialFileName] = useState('')

  // ---- Aula relacionada (link único) ----
  const [aulaRelacionada, setAulaRelacionada] = useState('')

  const [showSuccess, setShowSuccess] = useState(false)

  const handleMaterialFile = async (file: File) => {
    const isPdf = file.type === 'application/pdf'
    const isImage = file.type.startsWith('image/')
    if (!isPdf && !isImage) return

    if (isSupabaseConfigured() && user) {
      setMaterialFileName(file.name)
      setMaterialType(isPdf ? 'pdf' : 'image')
      if (isImage) {
        const reader = new FileReader()
        reader.onload = () => setMaterialPreview(reader.result as string)
        reader.readAsDataURL(file)
      }
      const { url, type, error } = await uploadQuestionMaterial(file, user.id)
      if (error) {
        console.error('Erro no upload:', error)
        fallbackMaterialFile(file, isPdf, isImage)
        return
      }
      setMaterialUrl(url)
      setMaterialType(type)
    } else {
      fallbackMaterialFile(file, isPdf, isImage)
    }
  }

  const fallbackMaterialFile = (file: File, isPdf: boolean, isImage: boolean) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setMaterialUrl(result)
      setMaterialType(isPdf ? 'pdf' : 'image')
      setMaterialFileName(file.name)
      setMaterialPreview(isImage ? result : '')
    }
    reader.readAsDataURL(file)
  }

  const handleMaterialUrlChange = (value: string) => {
    setMaterialUrl(value)
    setMaterialFileName('')
    if (!value) {
      setMaterialType('')
      setMaterialPreview('')
      return
    }
    if (/\.pdf($|\?)/i.test(value)) {
      setMaterialType('pdf')
      setMaterialPreview('')
    } else {
      setMaterialType('image')
      setMaterialPreview(value)
    }
  }

  const handleRemoveMaterial = () => {
    setMaterialUrl('')
    setMaterialPreview('')
    setMaterialType('')
    setMaterialFileName('')
  }

  const handleAdd = () => {
    if (!newQ.question || newQ.options.some(o => !o)) return
    const metaData: Record<string, unknown> = {}
    if (newQ.moduleId) metaData.moduleId = newQ.moduleId
    if (newQ.topicId) { metaData.topicId = newQ.topicId; metaData.assunto = newQ.topicId }
    if (newQ.moduleId && !modules.some(m => m.id === newQ.moduleId)) {
      disciplinaFields.forEach(({ key }) => { metaData[key] = newQ.moduleId })
    }
    dynamicFields.forEach(field => {
      if (meta[field]) metaData[field] = meta[field]
    })
    if (meta[fieldNivel]) metaData[fieldNivel] = meta[fieldNivel]
    if (meta[fieldAno]) metaData[fieldAno] = meta[fieldAno]
    if (meta.banca) metaData.banca = meta.banca
    if (gabaritoComentado) metaData.gabaritoComentado = gabaritoComentado
    if (materialUrl) {
      metaData.materialUrl = materialUrl
      metaData.materialType = materialType
    }
    if (aulaRelacionada) metaData.aulaRelacionada = aulaRelacionada

    addQuestion({ id: generateId(), code: '', ...newQ, ...metaData })
    setNewQ({ question: '', options: ['', '', '', ''], correctAnswer: 0, moduleId: '', topicId: '' })
    setMeta({})
    setGabaritoComentado('')
    handleRemoveMaterial()
    setAulaRelacionada('')
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
                onChange={e => setNewQ({ ...newQ, moduleId: e.target.value, topicId: '' })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Selecione a disciplina...</option>
                {DISCIPLINAS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">BANCA</label>
              <select
                value={meta.banca ?? ''}
                onChange={e => setMeta(prev => ({ ...prev, banca: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Selecione a banca...</option>
                {getBancaValues().map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ASSUNTO</label>
            <select
              value={newQ.topicId}
              onChange={e => setNewQ({ ...newQ, topicId: e.target.value })}
              disabled={!newQ.moduleId || getTopicOptions().length === 0}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {!newQ.moduleId
                  ? 'Primeiro selecione a disciplina'
                  : getTopicOptions().length === 0
                    ? 'Nenhum assunto disponível para esta disciplina'
                    : 'Selecione o assunto...'}
              </option>
              {getTopicOptions().map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
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

          {/* ---- Material de apoio (imagem ou PDF) ---- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              MATERIAL DE APOIO — IMAGEM OU PDF (opcional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Anexe uma imagem (gráfico, tabela, figura) ou um PDF de apoio que o aluno verá ao responder a questão.
            </p>

            {materialUrl ? (
              <div className="relative inline-block">
                {materialType === 'image' && materialPreview ? (
                  <img
                    src={materialPreview}
                    alt="Pré-visualização do material"
                    className="max-h-56 rounded-xl border border-gray-200 object-contain"
                  />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
                    <FileText className="w-6 h-6 text-red-500" />
                    <span className="text-sm text-gray-700 truncate max-w-xs">
                      {materialFileName || 'Arquivo PDF anexado'}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleRemoveMaterial}
                  className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50"
                  aria-label="Remover material"
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
                  <Upload className="w-4 h-4" /> Clique para enviar uma imagem ou PDF
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleMaterialFile(file)
                  }}
                />
              </label>
            )}

            <div className="mt-2">
              <input
                value={materialUrl.startsWith('data:') ? '' : materialUrl}
                onChange={e => handleMaterialUrlChange(e.target.value)}
                placeholder="ou cole a URL de uma imagem ou PDF"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
                {[2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026].map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
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

          {/* ---- Gabarito Comentado ---- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">GABARITO COMENTADO (opcional)</label>
            <p className="text-xs text-gray-500 mb-2">
              Texto exibido na aba "Gabarito Comentado" quando o aluno responder a questão.
            </p>
            <textarea
              value={gabaritoComentado}
              onChange={e => setGabaritoComentado(e.target.value)}
              placeholder="Escreva a explicação/comentário da resposta correta..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* ---- Aula relacionada (link único) ---- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">AULA RELACIONADA (opcional)</label>
            <p className="text-xs text-gray-500 mb-2">
              Link do vídeo da aula relacionada a este assunto, exibido na aba "Aulas".
            </p>
            <input
              value={aulaRelacionada}
              onChange={e => setAulaRelacionada(e.target.value)}
              placeholder="URL do vídeo (YouTube, Vimeo, etc.)"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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