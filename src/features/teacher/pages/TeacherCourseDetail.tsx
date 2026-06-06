import { useState, useRef, useEffect } from 'react'
import { useCourseStore } from '../../courses/data/courseStore'
import { useQuestionStore } from '../../courses/data/questionStore'
import { useAuthStore } from '../../auth/services/authStore'
import {
  BookOpen, Plus, Video, HelpCircle, Trash2, ArrowLeft,
  ChevronDown, ChevronRight, FileText, CheckCircle, Loader2,
  Edit2, Check, X, ExternalLink, Upload,
  GraduationCap, AlertTriangle, XCircle, PlayCircle, Send, Clock, DollarSign, Globe
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

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

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText = 'Excluir', confirmColor = 'bg-red-600 hover:bg-red-700' }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmText?: string; confirmColor?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm">
            Cancelar
          </button>
          <button onClick={() => { onConfirm(); onClose() }} className={`px-4 py-2.5 text-white rounded-xl transition-colors font-medium text-sm ${confirmColor}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

function getVideoId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com') || u.hostname === 'youtu.be') {
      if (u.searchParams.has('v')) return u.searchParams.get('v')
      const path = u.pathname.replace(/^\//, '')
      if (u.hostname === 'youtu.be' && path) return path
    }
    return null
  } catch { return null }
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}

export default function TeacherCourseDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const { courses, modules, lessons, topics, enrollments, messages, addModule, addLesson, updateModule, updateLesson, requestContentDeletion, requestCoursePublish, getTeacherName } = useCourseStore()
  const { questions, addQuestion, deleteQuestion } = useQuestionStore()
  const navigate = useNavigate()

  const course = courses.find(c => c.id === id)
  if (course && course.teacherId !== user?.id) {
    return <p className="text-center py-8 text-red-500">Você não tem permissão para acessar este curso.</p>
  }

  const myModules = modules.filter(m => m.courseId === id).sort((a, b) => a.order - b.order)
  const myLessons = lessons.filter(l => myModules.some(m => m.id === l.moduleId))
  const myQuestions = questions.filter(q => myModules.some(m => m.id === q.moduleId))
  const enrolledCount = enrollments.filter(e => e.courseId === id).length

  const [expandedModule, setExpandedModule] = useState<string | null>(null)

  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [editingModuleTitle, setEditingModuleTitle] = useState('')
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [editingLessonTitle, setEditingLessonTitle] = useState('')

  const [showModuleModal, setShowModuleModal] = useState(false)
  const [newModuleTitle, setNewModuleTitle] = useState('')

  const [showLessonModal, setShowLessonModal] = useState(false)
  const [lessonForm, setLessonForm] = useState({ moduleId: '', title: '', videoUrl: '', pdfFile: null as File | null })

  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [questionForm, setQuestionForm] = useState({
    moduleId: '', assunto: '', question: '', options: ['', '', '', ''], correctAnswer: 0
  })

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'module' | 'lesson' | 'question'; id: string; name: string; moduleId?: string } | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 4000)
      return () => clearTimeout(t)
    }
  }, [successMsg])

  const [showPlaylist, setShowPlaylist] = useState(false)
  const [playlistModuleId, setPlaylistModuleId] = useState('')
  const [videoUrls, setVideoUrls] = useState('')
  const [playlistVideos, setPlaylistVideos] = useState<{ title: string; videoId: string; selected: boolean }[]>([])
  const [loadingPlaylist, setLoadingPlaylist] = useState(false)
  const [playlistError, setPlaylistError] = useState('')

  const videoId = lessonForm.videoUrl ? getVideoId(lessonForm.videoUrl) : null

  const moduleEditRef = useRef<HTMLInputElement>(null)
  const lessonEditRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingModuleId && moduleEditRef.current) moduleEditRef.current.focus()
  }, [editingModuleId])

  useEffect(() => {
    if (editingLessonId && lessonEditRef.current) lessonEditRef.current.focus()
  }, [editingLessonId])

  if (!course) return <p className="text-center py-8">Curso não encontrado</p>

  const handleAddModule = () => {
    if (!newModuleTitle.trim() || !user) return
    addModule({
      id: Date.now().toString(),
      courseId: course.id,
      title: newModuleTitle.trim(),
      order: myModules.length + 1,
      teacherId: user.id,
    })
    setNewModuleTitle('')
    setShowModuleModal(false)
  }

  const handleAddLesson = () => {
    if (!lessonForm.moduleId || !lessonForm.title.trim() || !lessonForm.videoUrl.trim()) return
    const pdfUrl = lessonForm.pdfFile ? URL.createObjectURL(lessonForm.pdfFile) : ''
    addLesson({
      id: Date.now().toString(),
      moduleId: lessonForm.moduleId,
      title: lessonForm.title.trim(),
      videoUrl: lessonForm.videoUrl.trim(),
      pdfUrl,
      order: lessons.filter(l => l.moduleId === lessonForm.moduleId).length + 1,
    })
    setLessonForm({ moduleId: '', title: '', videoUrl: '', pdfFile: null })
    setShowLessonModal(false)
  }

  const handleAddQuestion = () => {
    if (!questionForm.moduleId || !questionForm.question.trim() || questionForm.options.some(o => !o.trim())) return
    const data: Record<string, any> = {
      id: Date.now().toString(),
      code: '',
      moduleId: questionForm.moduleId,
      question: questionForm.question.trim(),
      options: questionForm.options.map(o => o.trim()),
      correctAnswer: questionForm.correctAnswer,
    }
    if (questionForm.assunto) data.topicId = questionForm.assunto
    addQuestion(data as any)
    setQuestionForm({ moduleId: '', assunto: '', question: '', options: ['', '', '', ''], correctAnswer: 0 })
    setShowQuestionModal(false)
  }

  const startEditingModule = (mod: typeof myModules[0]) => {
    setEditingModuleId(mod.id)
    setEditingModuleTitle(mod.title)
  }

  const saveEditingModule = () => {
    if (editingModuleId && editingModuleTitle.trim()) {
      updateModule(editingModuleId, { title: editingModuleTitle.trim() })
    }
    setEditingModuleId(null)
  }

  const startEditingLesson = (lesson: typeof myLessons[0]) => {
    setEditingLessonId(lesson.id)
    setEditingLessonTitle(lesson.title)
  }

  const saveEditingLesson = () => {
    if (editingLessonId && editingLessonTitle.trim()) {
      updateLesson(editingLessonId, { title: editingLessonTitle.trim() })
    }
    setEditingLessonId(null)
  }

  const handleFetchVideos = async () => {
    const ids = [...new Set(videoUrls.split('\n').map(u => getVideoId(u.trim())).filter(Boolean) as string[])]
    if (!ids.length) { setPlaylistError('Nenhum link do YouTube válido encontrado'); return }
    setLoadingPlaylist(true)
    setPlaylistError('')
    const videos: { title: string; videoId: string; selected: boolean }[] = []
    for (const vid of ids) {
      try {
        const res = await fetch(`https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${vid}`)
        const data = await res.json()
        videos.push({ title: data.title || 'Sem título', videoId: vid, selected: true })
      } catch {
        videos.push({ title: `Vídeo (${vid})`, videoId: vid, selected: true })
      }
    }
    setPlaylistVideos(videos)
    setLoadingPlaylist(false)
  }

  const handleImportPlaylist = () => {
    if (!playlistModuleId) return
    const selected = playlistVideos.filter(v => v.selected)
    let order = lessons.filter(l => l.moduleId === playlistModuleId).length
    selected.forEach(video => {
      order++
      addLesson({
        id: Date.now().toString() + Math.random(),
        moduleId: playlistModuleId,
        title: video.title,
        videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
        pdfUrl: '',
        order,
      })
    })
    setVideoUrls('')
    setPlaylistVideos([])
    setShowPlaylist(false)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/teacher/courses')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-gray-500 text-sm">{course.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5 text-sm">
              <DollarSign className="w-4 h-4 text-green-600" />
              {course.price > 0 ? `R$ ${course.price.toFixed(2)}` : 'Gratuito'}
            </div>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              course.status === 'approved' ? 'bg-green-100 text-green-700' :
              course.status === 'rejected' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {course.status === 'approved' ? <CheckCircle className="w-3 h-3" /> :
               course.status === 'rejected' ? <XCircle className="w-3 h-3" /> :
               <Clock className="w-3 h-3" />}
              {course.status === 'approved' ? 'Aprovado' :
               course.status === 'rejected' ? 'Rejeitado' :
               'Aguardando aprovação'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard icon={BookOpen} label="Módulos" value={myModules.length} color="bg-green-100 text-green-600" />
        <StatCard icon={Video} label="Aulas" value={myLessons.length} color="bg-purple-100 text-purple-600" />
        <StatCard icon={HelpCircle} label="Questões" value={myQuestions.length} color="bg-orange-100 text-orange-600" />
        <StatCard icon={GraduationCap} label="Alunos" value={enrolledCount} color="bg-blue-100 text-blue-600" />
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <button onClick={() => setShowModuleModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-medium text-sm shadow-sm shadow-green-200">
          <Plus className="w-4 h-4" /> Módulo
        </button>
        <button onClick={() => setShowLessonModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-medium text-sm shadow-sm shadow-purple-200">
          <Plus className="w-4 h-4" /> Aula
        </button>
        <button onClick={() => setShowQuestionModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all font-medium text-sm shadow-sm shadow-orange-200">
          <Plus className="w-4 h-4" /> Questão
        </button>
      </div>

      {course.status === 'approved' && (
        <div className="mb-8 p-4 bg-white rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900 text-sm">Publicação do curso</p>
                <p className="text-xs text-gray-500">
                  {course.published
                    ? 'Este curso está publicado e visível na vitrine de cursos.'
                    : messages.some(m => m.courseId === course.id && m.type === 'publish_request' && m.status === 'pending')
                      ? 'Solicitação de publicação enviada ao admin. Aguarde aprovação.'
                      : 'Publique este curso para disponibilizá-lo na vitrine e para matrícula dos alunos.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {course.published ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-xl text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> Publicado
                </span>
              ) : messages.some(m => m.courseId === course.id && m.type === 'publish_request' && m.status === 'pending') ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-xl text-sm font-medium">
                  <Clock className="w-4 h-4" /> Pendente
                </span>
              ) : (
                <button onClick={() => { if (user) { requestCoursePublish(course.id, user.name); setSuccessMsg('Solicitação de publicação enviada ao admin.') } }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium">
                  <Globe className="w-4 h-4" /> Publicar / Vender
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Módulos e Conteúdos</h2>
        </div>
        {myModules.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum módulo ainda</h3>
            <p className="text-gray-500 mb-6">Crie seu primeiro módulo para começar</p>
            <button onClick={() => setShowModuleModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium text-sm">
              <Plus className="w-4 h-4" /> Criar Módulo
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {myModules.map((mod, idx) => {
              const modLessons = lessons.filter(l => l.moduleId === mod.id).sort((a, b) => a.order - b.order)
              const modQuestions = questions.filter(q => q.moduleId === mod.id)
              const isExpanded = expandedModule === mod.id
              return (
                <div key={mod.id} className="border border-gray-100 rounded-xl overflow-hidden transition-all duration-200 hover:border-gray-200">
                  <div className={`flex items-center gap-3 px-4 py-3 ${isExpanded ? 'bg-gray-50 border-b border-gray-100' : 'bg-white'} transition-colors`}>
                    <button onClick={() => setExpandedModule(isExpanded ? null : mod.id)} className="p-1 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    </button>
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    {editingModuleId === mod.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input ref={moduleEditRef} value={editingModuleTitle} onChange={e => setEditingModuleTitle(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEditingModule(); if (e.key === 'Escape') setEditingModuleId(null) }}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium" />
                        <button onClick={saveEditingModule} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingModuleId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{mod.title}</p>
                        <p className="text-xs text-gray-500">{modLessons.length} aulas · {modQuestions.length} questões</p>
                      </div>
                    )}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => startEditingModule(mod)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget({ type: 'module', id: mod.id, name: mod.title })}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="animate-slideDown">
                      {modLessons.length === 0 && modQuestions.length === 0 ? (
                        <div className="p-8 text-center">
                          <Video className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">Nenhuma aula ou questão neste módulo</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {modLessons.map(lesson => (
                            <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group">
                              <div className="w-7 h-7 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Video className="w-3.5 h-3.5" />
                              </div>
                              {editingLessonId === lesson.id ? (
                                <div className="flex-1 flex items-center gap-2">
                                  <input ref={lessonEditRef} value={editingLessonTitle} onChange={e => setEditingLessonTitle(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') saveEditingLesson(); if (e.key === 'Escape') setEditingLessonId(null) }}
                                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                                  <button onClick={saveEditingLesson} className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"><Check className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => setEditingLessonId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"><X className="w-3.5 h-3.5" /></button>
                                </div>
                              ) : (
                                <>
                                  <span className="flex-1 text-sm text-gray-700 truncate">{lesson.title}</span>
                                  <div className="flex items-center gap-2">
                                    <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer"
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Abrir vídeo">
                                      <PlayCircle className="w-3.5 h-3.5" />
                                    </a>
                                    {lesson.pdfUrl && (
                                      <a href={lesson.pdfUrl} target="_blank" rel="noopener noreferrer"
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Abrir PDF">
                                        <FileText className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                    <button onClick={() => startEditingLesson(lesson)}
                                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Editar título">
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => setDeleteTarget({ type: 'lesson', id: lesson.id, name: lesson.title })}
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                          {modQuestions.map(q => (
                            <div key={q.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group">
                              <div className="w-7 h-7 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <HelpCircle className="w-3.5 h-3.5" />
                              </div>
                              <span className="flex-1 text-sm text-gray-700 truncate">{q.question}</span>
                              <button onClick={() => setDeleteTarget({ type: 'question', id: q.id, name: q.question, moduleId: q.moduleId })}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Excluir questão">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal: Novo Módulo */}
      <Modal open={showModuleModal} onClose={() => setShowModuleModal(false)} title="Novo Módulo">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do módulo</label>
            <input value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddModule() }}
              placeholder="Ex: Matemática Básica"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" autoFocus />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowModuleModal(false)} className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm">Cancelar</button>
            <button onClick={handleAddModule} disabled={!newModuleTitle.trim()}
              className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 font-medium text-sm">
              Criar Módulo
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Nova Aula */}
      <Modal open={showLessonModal} onClose={() => { setShowLessonModal(false); setShowPlaylist(false) }} title="Nova Aula">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Módulo</label>
            <select value={lessonForm.moduleId} onChange={e => setLessonForm({ ...lessonForm, moduleId: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white">
              <option value="">Selecione o módulo</option>
              {myModules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Título da aula</label>
            <input value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
              placeholder="Ex: Álgebra Básica - Parte 1"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">URL do Vídeo (YouTube)</label>
            <input value={lessonForm.videoUrl} onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500" />
            {videoId && (
              <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <div className="aspect-video bg-black">
                  <iframe src={`https://www.youtube.com/embed/${videoId}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
                <div className="px-3 py-2 flex items-center gap-2 text-xs text-gray-500">
                  <PlayCircle className="w-3.5 h-3.5 text-red-500" />
                  Prévia do vídeo
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Material de apoio (PDF, opcional)</label>
            <div className="relative">
              <input type="file" accept=".pdf" onChange={e => setLessonForm({ ...lessonForm, pdfFile: e.target.files?.[0] || null })}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-purple-300 transition-colors bg-gray-50">
                <Upload className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">{lessonForm.pdfFile ? lessonForm.pdfFile.name : 'Clique para selecionar um PDF'}</p>
                  <p className="text-xs text-gray-400">{lessonForm.pdfFile ? `${(lessonForm.pdfFile.size / 1024).toFixed(0)} KB` : 'ou arraste o arquivo aqui'}</p>
                </div>
                {lessonForm.pdfFile && (
                  <button onClick={(e) => { e.preventDefault(); setLessonForm({ ...lessonForm, pdfFile: null }) }}
                    className="ml-auto p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowLessonModal(false)} className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm">Cancelar</button>
            <button onClick={handleAddLesson} disabled={!lessonForm.moduleId || !lessonForm.title.trim() || !lessonForm.videoUrl.trim()}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium text-sm">
              Criar Aula
            </button>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <button onClick={() => setShowPlaylist(!showPlaylist)}
              className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
              {showPlaylist ? 'Ocultar' : 'Importar múltiplos vídeos do YouTube'}
            </button>

            {showPlaylist && (
              <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <select value={playlistModuleId} onChange={e => setPlaylistModuleId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm">
                  <option value="">Módulo destino</option>
                  {myModules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
                <textarea value={videoUrls} onChange={e => setVideoUrls(e.target.value)}
                  placeholder="Cole os links dos vídeos, um por linha:&#10;https://www.youtube.com/watch?v=...&#10;https://youtu.be/..."
                  rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm" />
                <button onClick={handleFetchVideos} disabled={!videoUrls.trim() || loadingPlaylist || !playlistModuleId}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium text-sm">
                  {loadingPlaylist ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                  {loadingPlaylist ? 'Buscando...' : 'Buscar dados dos vídeos'}
                </button>
                {playlistError && <p className="text-sm text-red-600">{playlistError}</p>}
                {playlistVideos.length > 0 && (
                  <>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 border border-gray-200 rounded-xl p-2 bg-white">
                      {playlistVideos.map((v, i) => (
                        <label key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                          <input type="checkbox" checked={v.selected}
                            onChange={() => { const u = [...playlistVideos]; u[i].selected = !u[i].selected; setPlaylistVideos(u) }}
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{v.title}</p>
                            <p className="text-xs text-gray-500 truncate">youtube.com/watch?v={v.videoId}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{playlistVideos.filter(v => v.selected).length} selecionados</span>
                      <button onClick={handleImportPlaylist} disabled={!playlistVideos.some(v => v.selected)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium text-sm">
                        <CheckCircle className="w-4 h-4" /> Importar
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal: Nova Questão */}
      <Modal open={showQuestionModal} onClose={() => setShowQuestionModal(false)} title="Nova Questão">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Módulo</label>
            <select value={questionForm.moduleId} onChange={e => setQuestionForm({ ...questionForm, moduleId: e.target.value, assunto: '' })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
              <option value="">Selecione o módulo</option>
              {myModules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assunto</label>
            <select value={questionForm.assunto} onChange={e => setQuestionForm({ ...questionForm, assunto: e.target.value })}
              disabled={!questionForm.moduleId}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60">
              <option value="">{questionForm.moduleId ? 'Selecione o assunto...' : 'Primeiro selecione o módulo'}</option>
              {(() => {
                const mod = modules.find(m => m.id === questionForm.moduleId)
                const title = mod ? mod.title : questionForm.moduleId
                if (!title) return null
                const key = normalizeKey(title)
                let topicos: string[] = []
                if (key.includes('portugues')) topicos = TOPICOS_POR_DISCIPLINA.portugues
                else if (key.includes('legislacao')) topicos = TOPICOS_POR_DISCIPLINA.legislacao
                else if (key.includes('educacional') || key.includes('pedagogia') || key.includes('conhecimento')) topicos = TOPICOS_POR_DISCIPLINA.conhecimentos_educacionais
                return topicos.map(t => <option key={t} value={t}>{t}</option>)
              })()}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Enunciado</label>
            <textarea value={questionForm.question} onChange={e => setQuestionForm({ ...questionForm, question: e.target.value })}
              placeholder="Digite a questão..."
              rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alternativas</label>
            <div className="space-y-2">
              {questionForm.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button onClick={() => setQuestionForm({ ...questionForm, correctAnswer: i })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${i === questionForm.correctAnswer ? 'bg-green-500 text-white ring-2 ring-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {String.fromCharCode(65 + i)}
                  </button>
                  <input value={opt} onChange={e => { const o = [...questionForm.options]; o[i] = e.target.value; setQuestionForm({ ...questionForm, options: o }) }}
                    placeholder={`Alternativa ${String.fromCharCode(65 + i)}`}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                  {i === questionForm.correctAnswer && (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg flex-shrink-0">Correta</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowQuestionModal(false)} className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm">Cancelar</button>
            <button onClick={handleAddQuestion} disabled={!questionForm.moduleId || !questionForm.question.trim() || questionForm.options.some(o => !o.trim())}
              className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50 font-medium text-sm">
              Criar Questão
            </button>
          </div>
        </div>
      </Modal>

      {successMsg && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {successMsg}
        </div>
      )}

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget || !user || !course) return
          requestContentDeletion({
            courseId: course.id,
            moduleId: deleteTarget.type === 'question' ? deleteTarget.moduleId : (deleteTarget.type === 'lesson' ? lessons.find(l => l.id === deleteTarget.id)?.moduleId : undefined),
            lessonId: deleteTarget.type === 'lesson' ? deleteTarget.id : undefined,
            teacherName: user.name,
            targetType: deleteTarget.type,
            targetName: deleteTarget.name,
          })
          setDeleteTarget(null)
          setSuccessMsg(`Solicitação de exclusão do ${deleteTarget.type === 'module' ? 'módulo' : deleteTarget.type === 'lesson' ? 'aula' : 'questão'} enviada ao admin para aprovação.`)
        }}
        title={`Solicitar exclusão de ${deleteTarget?.type === 'module' ? 'módulo' : deleteTarget?.type === 'lesson' ? 'aula' : 'questão'}`}
        message={`Solicitar exclusão de "${deleteTarget?.name}"? O admin será notificado para aprovação.`}
        confirmText="Solicitar Exclusão"
        confirmColor="bg-orange-600 hover:bg-orange-700" />
    </div>
  )
}
