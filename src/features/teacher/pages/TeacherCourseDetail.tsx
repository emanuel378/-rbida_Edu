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
import { isSupabaseConfigured } from '../../../lib/supabase'
import { uploadLessonPdf } from '../../../lib/supabase-storage'
import { uploadVideoToBunny } from '../../../lib/bunny-upload'
import { generateId } from '../../../lib/id'
import { DISCIPLINAS, TOPICOS_POR_DISCIPLINA } from '../../courses/data/taxonomy'
import type { Question } from '../../courses/data/mock'

const BANCAS_PREDEFINIDAS = [
  'Cebraspe', 'Fundação Getúlio Vargas - FGV', 'Fundação Carlos Chagas - FCC', 'Fundação Cesgranrio',
  'Instituto AOCP', 'IDECAN', 'IBFC', 'Quadrix', 'Consulplan', 'Consulpam', 'FUNDEP', 'VUNESP',
  'IADES', 'FUNCAB', 'FUNRIO', 'Fundação CEFETMINAS', 'IFPI', 'Objetiva Concursos', 'FAURGS',
  'COPEVE-UFAL', 'Fundatec', 'FAU', 'COPESE/COPED', 'UFRN', 'UFSM', 'UFPE', 'UFAL', 'UFAM',
  'IFSertãoPE', 'IFMG', 'IFSP', 'IF Goiano', 'IFPR', 'IFAC', 'IFAL', 'IFAM', 'IFAP', 'IF Baiano',
  'IFBA', 'IFB', 'IFCE', 'IFES', 'IF Fluminense', 'IFG', 'IFMA', 'IFMT', 'IFMS', 'IFNMG', 'IFPA',
  'IFPB', 'IFPE', 'IFRN', 'IFRO', 'IFRR', 'IFRS', 'IFSul', 'IF Sudeste MG', 'IFS', 'IFTO', 'IFC',
  'IF Farroupilha',
]

const getUniqueBancas = (questions: any[]): string[] => {
  const bancas = new Set<string>()
  questions.forEach(q => {
    if (q.banca && q.banca.trim()) bancas.add(q.banca.trim())
  })
  return Array.from(bancas).sort()
}

const getUniqueAnos = (questions: any[]): string[] => {
  const anos = new Set<string>()
  questions.forEach(q => {
    if (q.ano && q.ano.trim()) anos.add(q.ano.trim())
  })
  return Array.from(anos).sort((a, b) => parseInt(b) - parseInt(a))
}

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
  const { questions, addQuestion, deleteQuestion, updateQuestion } = useQuestionStore()
  const navigate = useNavigate()

  const course = courses.find(c => c.id === id)
  if (course && course.teacherId !== user?.id) {
    return <p className="text-center py-8 text-red-500">Você não tem permissão para acessar este curso.</p>
  }

  const myModules = modules.filter(m => m.courseId === id).sort((a, b) => a.order - b.order)
  const myLessons = lessons.filter(l => myModules.some(m => m.id === l.moduleId))
  const myQuestions = questions.filter(q => q.lessonId && myLessons.some(l => l.id === q.lessonId))
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
  const [lessonVideoTab, setLessonVideoTab] = useState<'bunny' | 'youtube'>('bunny')
  const [bunnyUploadState, setBunnyUploadState] = useState<{
    status: 'idle' | 'uploading' | 'done' | 'error'
    progress: number
    videoId: string
    error: string
  }>({ status: 'idle', progress: 0, videoId: '', error: '' })
  const [lessonSaveError, setLessonSaveError] = useState('')

  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [questionSaveError, setQuestionSaveError] = useState('')
  const EMPTY_QUESTION_FORM = {
    moduleId: '', assunto: '', question: '', options: ['', '', '', '', ''], correctAnswer: 0,
    banca: '', ano: '', bancaCustom: '', anoCustom: '', lessonId: ''
  }
  const [questionForm, setQuestionForm] = useState({ ...EMPTY_QUESTION_FORM })
  const [questionGabaritoTexto, setQuestionGabaritoTexto] = useState('')
  const [questionAulasRelacionadas, setQuestionAulasRelacionadas] = useState<string[]>([])
  const [novaAulaRelacionada, setNovaAulaRelacionada] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'module' | 'lesson' | 'question'; id: string; name: string; moduleId?: string } | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkLessonId, setLinkLessonId] = useState('')
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<string[]>([])

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
      id: generateId(),
      courseId: course.id,
      title: newModuleTitle.trim(),
      order: myModules.length + 1,
      teacherId: user.id,
    })
    setNewModuleTitle('')
    setShowModuleModal(false)
  }

  const resetLessonVideoState = () => {
    setLessonVideoTab('bunny')
    setBunnyUploadState({ status: 'idle', progress: 0, videoId: '', error: '' })
    setLessonSaveError('')
  }

  const handleVideoFileSelect = async (file: File) => {
    if (!user) return
    setBunnyUploadState({ status: 'uploading', progress: 0, videoId: '', error: '' })
    try {
      const title = lessonForm.title.trim() || file.name
      const { videoId } = await uploadVideoToBunny(file, user.id, title, (percent) => {
        setBunnyUploadState(s => ({ ...s, progress: percent }))
      })
      setBunnyUploadState({ status: 'done', progress: 100, videoId, error: '' })
    } catch (err) {
      setBunnyUploadState({
        status: 'error', progress: 0, videoId: '',
        error: err instanceof Error ? err.message : 'Erro ao enviar vídeo',
      })
    }
  }

  const handleAddLesson = async () => {
    if (!lessonForm.moduleId || !lessonForm.title.trim() || !user) return
    if (lessonVideoTab === 'youtube' && !lessonForm.videoUrl.trim()) return
    if (lessonVideoTab === 'bunny' && bunnyUploadState.status !== 'done') return

    setLessonSaveError('')
    let pdfUrl = ''
    if (lessonForm.pdfFile) {
      if (isSupabaseConfigured() && user) {
        const { url, error } = await uploadLessonPdf(lessonForm.pdfFile, user.id)
        if (error) console.error('Erro ao fazer upload do PDF:', error)
        pdfUrl = url || ''
      }
      if (!pdfUrl) {
        pdfUrl = URL.createObjectURL(lessonForm.pdfFile)
      }
    }

    const saveError = await addLesson({
      id: generateId(),
      moduleId: lessonForm.moduleId,
      title: lessonForm.title.trim(),
      videoUrl: lessonVideoTab === 'youtube' ? lessonForm.videoUrl.trim() : '',
      pdfUrl,
      order: lessons.filter(l => l.moduleId === lessonForm.moduleId).length + 1,
      videoProvider: lessonVideoTab,
      bunnyVideoId: lessonVideoTab === 'bunny' ? bunnyUploadState.videoId : '',
      videoStatus: lessonVideoTab === 'bunny' ? 'processing' : 'ready',
    })

    if (saveError) {
      setLessonSaveError(
        `Não foi possível salvar a aula: ${saveError}` +
        (lessonVideoTab === 'bunny' ? ' O vídeo já foi enviado ao Bunny — tente salvar novamente antes de reenviar o arquivo.' : '')
      )
      return
    }

    setLessonForm({ moduleId: '', title: '', videoUrl: '', pdfFile: null })
    resetLessonVideoState()
    setShowLessonModal(false)
  }

  const resetQuestionForm = () => {
    setQuestionForm({ ...EMPTY_QUESTION_FORM })
    setQuestionGabaritoTexto('')
    setQuestionAulasRelacionadas([])
    setNovaAulaRelacionada('')
    setEditingQuestionId(null)
    setQuestionSaveError('')
  }

  const openNewQuestionModal = (presetLessonId?: string) => {
    resetQuestionForm()
    if (presetLessonId) setQuestionForm(prev => ({ ...prev, lessonId: presetLessonId }))
    setShowQuestionModal(true)
  }

  const openEditQuestionModal = (q: Question) => {
    setEditingQuestionId(q.id)
    setQuestionForm({
      moduleId: q.moduleId || '',
      assunto: q.topicId || '',
      question: q.question || '',
      options: q.options?.length === 5 ? q.options : [...(q.options ?? []), '', '', '', '', ''].slice(0, 5),
      correctAnswer: q.correctAnswer || 0,
      banca: q.banca || '',
      ano: q.ano || '',
      bancaCustom: '',
      anoCustom: '',
      lessonId: q.lessonId || '',
    })
    setQuestionGabaritoTexto(q.gabaritoComentado || '')
    setQuestionAulasRelacionadas(q.aulaRelacionada ? [q.aulaRelacionada] : [])
    setShowQuestionModal(true)
  }

  const handleSaveQuestion = async () => {
    if (!questionForm.moduleId || !questionForm.question.trim() || questionForm.options.some(o => !o.trim())) return
    const data: Record<string, any> = {
      id: editingQuestionId || generateId(),
      code: '',
      moduleId: questionForm.moduleId,
      question: questionForm.question.trim(),
      options: questionForm.options.map(o => o.trim()),
      correctAnswer: questionForm.correctAnswer,
      lessonId: questionForm.lessonId || undefined,
    }
    if (questionForm.assunto) {
      data.topicId = questionForm.assunto
      data.assunto = questionForm.assunto
    }
    if (questionForm.banca) data.banca = questionForm.banca
    if (questionForm.ano) data.ano = questionForm.ano
    if (questionGabaritoTexto) data.gabaritoComentado = questionGabaritoTexto
    if (questionAulasRelacionadas.length > 0) {
      data.aulaRelacionada = questionAulasRelacionadas[0]
    }
    setQuestionSaveError('')
    try {
      if (editingQuestionId) {
        await updateQuestion(data as Question)
        setSuccessMsg('Questão atualizada com sucesso!')
      } else {
        await addQuestion(data as Question)
        setSuccessMsg('Questão criada com sucesso!')
      }
      resetQuestionForm()
      setShowQuestionModal(false)
    } catch (err) {
      setQuestionSaveError(err instanceof Error ? err.message : 'Erro ao salvar questão')
    }
  }

  const handleUnlinkQuestion = async (q: Question) => {
    try {
      await updateQuestion({ ...q, lessonId: undefined })
      setSuccessMsg('Questão removida desta aula (continua disponível no banco de questões).')
    } catch (err) {
      setSuccessMsg('')
      alert(err instanceof Error ? err.message : 'Erro ao remover questão da aula')
    }
  }

  const handleMoveQuestion = async (q: Question, newLessonId: string) => {
    try {
      await updateQuestion({ ...q, lessonId: newLessonId || undefined })
      setSuccessMsg(newLessonId ? 'Questão movida para outra aula.' : 'Questão desvinculada desta aula.')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao mover questão')
    }
  }

  const handleLinkQuestions = async () => {
    if (!linkLessonId) return
    let changed = 0
    try {
      for (const q of questions) {
        const shouldBeLinked = selectedBankQuestions.includes(q.id)
        const isLinkedHere = q.lessonId === linkLessonId
        if (shouldBeLinked && !isLinkedHere) {
          await updateQuestion({ ...q, lessonId: linkLessonId })
          changed++
        } else if (!shouldBeLinked && isLinkedHere) {
          await updateQuestion({ ...q, lessonId: undefined })
          changed++
        }
      }
      setSelectedBankQuestions([])
      setShowLinkModal(false)
      setSuccessMsg(changed > 0 ? `${changed} questão(ões) atualizada(s) com sucesso!` : 'Nenhuma alteração.')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao vincular questões')
    }
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
        id: generateId(),
        moduleId: playlistModuleId,
        title: video.title,
        videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
        pdfUrl: '',
        order,
        videoProvider: 'youtube',
        bunnyVideoId: '',
        videoStatus: 'ready',
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
        <button onClick={() => openNewQuestionModal()}
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
              const modQuestions = questions.filter(q => q.lessonId && modLessons.some(l => l.id === q.lessonId))
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
                          {modLessons.map(lesson => {
                            const lessonQuestions = questions.filter(q => q.lessonId === lesson.id)
                            return (
                            <div key={lesson.id}>
                              <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group">
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
                                    {lessonQuestions.length > 0 && (
                                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full flex-shrink-0">{lessonQuestions.length} questões</span>
                                    )}
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
                              {lessonQuestions.map(q => (
                                <div key={q.id} className="flex items-center gap-2 pl-12 pr-4 py-2 hover:bg-gray-50 transition-colors group">
                                  <HelpCircle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                                  <span className="flex-1 text-sm text-gray-600 truncate">{q.question}</span>
                                  <select
                                    value={q.lessonId || ''}
                                    onChange={e => handleMoveQuestion(q, e.target.value)}
                                    title="Mover para outra aula ou tirar desta aula"
                                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 max-w-[160px]"
                                  >
                                    <option value="">Tirar desta aula</option>
                                    {myModules.map(m => (
                                      <optgroup key={m.id} label={m.title}>
                                        {lessons.filter(l => l.moduleId === m.id).map(l => (
                                          <option key={l.id} value={l.id}>{l.title}</option>
                                        ))}
                                      </optgroup>
                                    ))}
                                  </select>
                                  <button onClick={() => openEditQuestionModal(q)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Editar questão">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => setDeleteTarget({ type: 'question', id: q.id, name: q.question, moduleId: q.moduleId })}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Excluir do banco permanentemente">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                              <div className="pl-12 pr-4 py-1.5 flex items-center gap-4">
                                <button onClick={() => { setLinkLessonId(lesson.id); setSelectedBankQuestions(questions.filter(q => q.lessonId === lesson.id).map(q => q.id)); setShowLinkModal(true) }}
                                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium">
                                  <Plus className="w-3.5 h-3.5" /> Vincular do banco
                                </button>
                                <button onClick={() => openNewQuestionModal(lesson.id)}
                                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium">
                                  <Plus className="w-3.5 h-3.5" /> Nova questão
                                </button>
                              </div>
                            </div>
                            )
                          })}
                          <div className="px-4 py-2">
                            <button onClick={() => openNewQuestionModal()}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium">
                              <Plus className="w-4 h-4" /> Nova questão sem aula vinculada
                            </button>
                          </div>
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
      <Modal open={showLessonModal} onClose={() => { setShowLessonModal(false); setShowPlaylist(false); resetLessonVideoState() }} title="Nova Aula">
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Vídeo da aula</label>
            <div className="flex gap-2 mb-3">
              <button type="button" onClick={() => setLessonVideoTab('bunny')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${lessonVideoTab === 'bunny' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Enviar vídeo
              </button>
              <button type="button" onClick={() => setLessonVideoTab('youtube')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${lessonVideoTab === 'youtube' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Link do YouTube
              </button>
            </div>

            {lessonVideoTab === 'bunny' ? (
              <div className="relative">
                {bunnyUploadState.status !== 'uploading' && (
                  <input type="file" accept="video/mp4,video/webm,video/quicktime"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoFileSelect(f) }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                )}
                <div className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-purple-300 transition-colors bg-gray-50">
                  <Upload className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {bunnyUploadState.status === 'idle' && (
                      <>
                        <p className="text-sm text-gray-600">Clique para selecionar o vídeo da aula</p>
                        <p className="text-xs text-gray-400">MP4, WebM ou MOV</p>
                      </>
                    )}
                    {bunnyUploadState.status === 'uploading' && (
                      <>
                        <p className="text-sm text-gray-600">Enviando vídeo... {bunnyUploadState.progress}%</p>
                        <div className="mt-1.5 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${bunnyUploadState.progress}%` }} />
                        </div>
                      </>
                    )}
                    {bunnyUploadState.status === 'done' && (
                      <p className="text-sm text-green-600 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> Vídeo enviado, aguardando processamento
                      </p>
                    )}
                    {bunnyUploadState.status === 'error' && (
                      <p className="text-sm text-red-600">Falha no envio: {bunnyUploadState.error}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
          {lessonSaveError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{lessonSaveError}</p>
          )}
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
            <button onClick={() => { setShowLessonModal(false); resetLessonVideoState() }} className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm">Cancelar</button>
            <button onClick={handleAddLesson} disabled={
              !lessonForm.moduleId || !lessonForm.title.trim() ||
              (lessonVideoTab === 'youtube' ? !lessonForm.videoUrl.trim() : bunnyUploadState.status !== 'done')
            }
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

      {/* Modal: Nova/Editar Questão */}
      <Modal open={showQuestionModal} onClose={() => { setShowQuestionModal(false); resetQuestionForm() }} title={editingQuestionId ? 'Editar Questão' : 'Nova Questão'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Disciplina</label>
            <select value={questionForm.moduleId} onChange={e => setQuestionForm({ ...questionForm, moduleId: e.target.value, assunto: '' })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
              <option value="">Selecione a disciplina</option>
              {DISCIPLINAS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assunto</label>
            <select value={questionForm.assunto} onChange={e => setQuestionForm({ ...questionForm, assunto: e.target.value })}
              disabled={!questionForm.moduleId}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60">
              <option value="">{questionForm.moduleId ? 'Selecione o assunto...' : 'Primeiro selecione a disciplina'}</option>
              {(TOPICOS_POR_DISCIPLINA[questionForm.moduleId] ?? []).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Vincular a uma aula (opcional)</label>
            <select value={questionForm.lessonId} onChange={e => setQuestionForm({ ...questionForm, lessonId: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
              <option value="">Nenhuma — fica só no banco de questões</option>
              {myModules.map(m => (
                <optgroup key={m.id} label={m.title}>
                  {lessons.filter(l => l.moduleId === m.id).map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Você pode mudar isso depois a qualquer momento, sem apagar a questão.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">BANCA</label>
              <div className="space-y-2">
                <select
                  value={questionForm.banca}
                  onChange={e => {
                    const val = e.target.value
                    setQuestionForm(prev => ({
                      ...prev,
                      banca: val === 'CUSTOM' ? prev.bancaCustom : val,
                      bancaCustom: val === 'CUSTOM' ? '' : prev.bancaCustom
                    }))
                  }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="">Selecione a banca...</option>
                  {BANCAS_PREDEFINIDAS.map(v => <option key={v} value={v}>{v}</option>)}
                  {getUniqueBancas(questions).filter(v => !BANCAS_PREDEFINIDAS.includes(v)).map(v => (
                    <option key={v} value={v}>{v} (salva)</option>
                  ))}
                  <option value="CUSTOM">Outra banca...</option>
                </select>
                {questionForm.banca === 'CUSTOM' && (
                  <input
                    value={questionForm.bancaCustom}
                    onChange={e => setQuestionForm(prev => ({ ...prev, bancaCustom: e.target.value, banca: e.target.value }))}
                    placeholder="Digite o nome da banca"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    autoFocus
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ANO</label>
              <div className="space-y-2">
                <select
                  value={questionForm.ano}
                  onChange={e => {
                    const val = e.target.value
                    setQuestionForm(prev => ({
                      ...prev,
                      ano: val === 'CUSTOM' ? prev.anoCustom : val,
                      anoCustom: val === 'CUSTOM' ? '' : prev.anoCustom
                    }))
                  }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="">Selecione o ano...</option>
                  {[...new Set([...Array.from({ length: 2026 - 2009 + 1 }, (_, i) => String(2009 + i)), ...getUniqueAnos(questions)])].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                  <option value="CUSTOM">Outro ano...</option>
                </select>
                {questionForm.ano === 'CUSTOM' && (
                  <input
                    value={questionForm.anoCustom}
                    onChange={e => setQuestionForm(prev => ({ ...prev, anoCustom: e.target.value, ano: e.target.value }))}
                    placeholder="Digite o ano (ex: 2027)"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    autoFocus
                  />
                )}
              </div>
            </div>
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

          {/* Gabarito Comentado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">GABARITO COMENTADO</label>
            <p className="text-xs text-gray-500 mb-2">Texto exibido quando o aluno responder a questão.</p>
            <textarea value={questionGabaritoTexto} onChange={e => setQuestionGabaritoTexto(e.target.value)}
              placeholder="Escreva a explicação da resposta correta..."
              rows={4} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm" />
          </div>

          {/* Aulas Relacionadas */}
          <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/50">
            <h3 className="text-sm font-semibold text-gray-800">AULAS RELACIONADAS</h3>
            <p className="text-xs text-gray-500">Links ou títulos de aulas relacionadas.</p>
            <div className="flex gap-2">
              <input value={novaAulaRelacionada} onChange={e => setNovaAulaRelacionada(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (novaAulaRelacionada.trim()) { setQuestionAulasRelacionadas(prev => [...prev, novaAulaRelacionada.trim()]); setNovaAulaRelacionada('') } } }}
                placeholder="Título ou link da aula"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm" />
              <button onClick={() => { if (novaAulaRelacionada.trim()) { setQuestionAulasRelacionadas(prev => [...prev, novaAulaRelacionada.trim()]); setNovaAulaRelacionada('') } }}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">Adicionar</button>
            </div>
            {questionAulasRelacionadas.length > 0 && (
              <ul className="space-y-2">
                {questionAulasRelacionadas.map((aula, idx) => (
                  <li key={idx} className="flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700">
                    <span className="truncate">{aula}</span>
                    <button onClick={() => setQuestionAulasRelacionadas(prev => prev.filter((_, i) => i !== idx))}
                      className="text-gray-400 hover:text-red-500 ml-2"><X className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {questionSaveError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{questionSaveError}</p>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => { setShowQuestionModal(false); resetQuestionForm() }} className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm">Cancelar</button>
            <button onClick={handleSaveQuestion} disabled={!questionForm.moduleId || !questionForm.question.trim() || questionForm.options.some(o => !o.trim())}
              className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50 font-medium text-sm">
              {editingQuestionId ? 'Salvar Alterações' : 'Criar Questão'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Vincular Questões do Banco */}
      <Modal open={showLinkModal} onClose={() => { setShowLinkModal(false); setSelectedBankQuestions([]) }} title="Questões do Banco">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecione as questões vinculadas à aula <strong>{lessons.find(l => l.id === linkLessonId)?.title}</strong>. Marque para vincular, desmarque para tirar — questões já vinculadas em outra aula são movidas para cá.
          </p>
          {(() => {
            const bankQuestions = questions
            if (bankQuestions.length === 0) {
              return (
                <div className="text-center py-8">
                  <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Nenhuma questão disponível no banco.</p>
                  <button onClick={() => { setShowLinkModal(false); openNewQuestionModal(linkLessonId) }}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors text-sm font-medium">
                    <Plus className="w-4 h-4" /> Criar nova questão
                  </button>
                </div>
              )
            }
            return (
              <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-xl p-2">
                {bankQuestions.map(q => {
                  const linkedElsewhere = q.lessonId && q.lessonId !== linkLessonId
                    ? lessons.find(l => l.id === q.lessonId)?.title
                    : null
                  return (
                  <label key={q.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors">
                    <input type="checkbox"
                      checked={selectedBankQuestions.includes(q.id)}
                      onChange={() => {
                        setSelectedBankQuestions(prev =>
                          prev.includes(q.id) ? prev.filter(id => id !== q.id) : [...prev, q.id]
                        )
                      }}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 line-clamp-2">{q.question}</p>
                      {q.assunto && <p className="text-xs text-gray-500 mt-1">{q.assunto}</p>}
                      {linkedElsewhere && <p className="text-xs text-orange-500 mt-1">Vinculada em "{linkedElsewhere}" — marcar move para cá</p>}
                    </div>
                  </label>
                  )
                })}
              </div>
            )
          })()}
          <div className="flex items-center justify-between pt-2">
            <button onClick={() => { setShowLinkModal(false); openNewQuestionModal(linkLessonId) }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium">
              <Plus className="w-4 h-4" /> Criar nova questão
            </button>
            <div className="flex gap-3">
              <button onClick={() => { setShowLinkModal(false); setSelectedBankQuestions([]) }}
                className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm">
                Cancelar
              </button>
              <button onClick={handleLinkQuestions}
                disabled={!linkLessonId}
                className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50 font-medium text-sm">
                Salvar vínculos
              </button>
            </div>
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
