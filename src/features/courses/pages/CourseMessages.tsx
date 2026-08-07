import { useState, useEffect } from 'react'
import { useCourseStore } from '../data/courseStore'
import { useAuthStore } from '../../auth/services/authStore'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { generateId } from '../../../lib/id'
import { Send, ArrowLeft, MessageCircle, Video, BookOpen, HelpCircle } from 'lucide-react'
import Breadcrumb from '../../../shared/components/Breadcrumb'

type Origin = { icon: typeof Video; label: string; classes: string }

function getOrigin(msg: { lessonId?: string; moduleId?: string; targetType?: string }): Origin {
  if (msg.targetType === 'question') {
    return { icon: HelpCircle, label: 'Questão', classes: 'bg-purple-50 text-purple-700 border-purple-100' }
  }
  if (msg.lessonId) {
    return { icon: Video, label: 'Aula', classes: 'bg-orange-50 text-orange-700 border-orange-100' }
  }
  if (msg.moduleId) {
    return { icon: BookOpen, label: 'Módulo', classes: 'bg-blue-50 text-blue-700 border-blue-100' }
  }
  return { icon: MessageCircle, label: 'Curso', classes: 'bg-gray-100 text-gray-700 border-gray-200' }
}

export default function CourseMessages() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  const { courses, modules, lessons, messages, addMessage } = useCourseStore()
  const navigate = useNavigate()

  const course = courses.find(c => c.id === id)
  const courseModules = modules.filter(m => m.courseId === id)

  const [text, setText] = useState('')
  const [moduleId, setModuleId] = useState('')
  const [lessonId, setLessonId] = useState('')
  const [type, setType] = useState<'course' | 'module' | 'lesson'>('course')

  useEffect(() => {
    const lessonFromUrl = searchParams.get('lesson')
    const moduleFromUrl = searchParams.get('module')
    if (lessonFromUrl) {
      const lesson = lessons.find(l => l.id === lessonFromUrl)
      if (lesson) {
        setLessonId(lesson.id)
        setModuleId(lesson.moduleId)
        setType('lesson')
      }
    } else if (moduleFromUrl) {
      const mod = modules.find(m => m.id === moduleFromUrl)
      if (mod) {
        setModuleId(mod.id)
        setType('module')
      }
    }
  }, [searchParams, lessons, modules])

  const selectedModuleLessons = lessons.filter(l => l.moduleId === moduleId)

  const myMessages = messages
    .filter(m => (!m.type || m.type === 'question') && m.fromUserId === user?.id && m.courseId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleSend = () => {
    if (!text || !user || !course) return
    let toTeacherId = course.teacherId
    if (type === 'module' && moduleId) {
      const mod = courseModules.find(m => m.id === moduleId)
      if (mod) toTeacherId = mod.teacherId
    } else if (type === 'lesson' && lessonId) {
      const lesson = lessons.find(l => l.id === lessonId)
      const mod = courseModules.find(m => m.id === lesson?.moduleId)
      if (mod) toTeacherId = mod.teacherId
    }
    addMessage({
      id: generateId(),
      courseId: course.id,
      moduleId: type !== 'course' ? moduleId : undefined,
      lessonId: type === 'lesson' ? lessonId : undefined,
      fromUserId: user.id,
      fromUserName: user.name,
      toTeacherId,
      text,
      createdAt: new Date().toISOString(),
      type: 'question',
      status: 'pending',
    })
    setText('')
  }

  if (!course) return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto text-center py-20">
      <p className="text-gray-500 text-lg">Curso não encontrado</p>
      <Link to="/dashboard/cursos" className="text-blue-600 hover:underline mt-4 inline-block">
        Voltar aos Meus Cursos
      </Link>
    </div>
  )

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <Breadcrumb items={[
        { label: 'Meus Cursos', to: '/dashboard/cursos' },
        { label: course.title, to: `/dashboard/course/${id}` },
        { label: 'Dúvidas' },
      ]} />

      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(`/dashboard/course/${id}`)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dúvidas - {course.title}</h1>
          <p className="text-gray-600">Envie suas dúvidas para os professores</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-4">Nova Dúvida</h3>
        <select
          value={type}
          onChange={e => { setType(e.target.value as 'course' | 'module' | 'lesson'); setModuleId(''); setLessonId('') }}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl mb-3 bg-white"
        >
          <option value="course">Dúvida Geral do Curso</option>
          <option value="module">Dúvida de um Módulo</option>
          <option value="lesson">Dúvida de uma Aula</option>
        </select>

        {type !== 'course' && (
          <select
            value={moduleId}
            onChange={e => { setModuleId(e.target.value); setLessonId('') }}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl mb-3 bg-white"
          >
            <option value="">Selecione o módulo</option>
            {courseModules.map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        )}

        {type === 'lesson' && moduleId && (
          <select
            value={lessonId}
            onChange={e => setLessonId(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl mb-3 bg-white"
          >
            <option value="">Selecione a aula</option>
            {selectedModuleLessons.map(l => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        )}

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Digite sua dúvida..."
          rows={4}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
        />
        <button
          onClick={handleSend}
          disabled={!text}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
        >
          <Send className="w-4 h-4" />
          Enviar Dúvida
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Minhas Dúvidas</h3>
        {myMessages.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nenhuma dúvida enviada ainda.</p>
        ) : (
          <div className="space-y-3">
            {myMessages.map(msg => {
              const origin = getOrigin(msg)
              const OriginIcon = origin.icon
              return (
                <div key={msg.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${origin.classes}`}>
                      <OriginIcon className="w-3.5 h-3.5" />
                      {origin.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{msg.text}</p>
                  {msg.reply ? (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">Resposta do professor:</p>
                      <p className="text-sm text-blue-800">{msg.reply}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-yellow-600">Aguardando resposta...</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
