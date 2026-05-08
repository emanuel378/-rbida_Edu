import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../auth/services/authStore'
import { useCourseStore } from '../data/courseStore'
import { useQuestionStore } from '../data/questionStore'
import { ArrowLeft, FileDown, CheckCircle, Send, MessageCircle, Play, Menu, X } from 'lucide-react'
import Breadcrumb from '../../../shared/components/Breadcrumb'

export default function Lesson() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { lessons, completeLesson, modules, courses } = useCourseStore()
  const { comments, addComment, getComments } = useQuestionStore()
  const user = useAuthStore(s => s.user)

  const lesson = lessons.find(l => l.id === id)
  const [commentText, setCommentText] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const lessonComments = getComments(id || '')

  const module = modules.find(m => m.id === lesson?.moduleId)
  const course = module ? courses.find(c => c.id === module.courseId) : null
  const courseLessons = lessons.filter(l => l.moduleId === lesson?.moduleId)

  useEffect(() => {
    if (lesson && module && course) {
    }
  }, [lesson, module, course])

  const handleComplete = () => {
    if (user && lesson && module) {
      completeLesson(user.id, module.courseId, lesson.id)
    }
  }

  const handleComment = () => {
    if (!user || !lesson || !commentText.trim()) return
    addComment({
      id: Date.now().toString(),
      lessonId: lesson.id,
      userId: user.id,
      userName: user.name,
      text: commentText,
      createdAt: new Date().toISOString(),
    })
    setCommentText('')
  }

  if (!lesson) return (
    <div className="text-center py-20">
      <p className="text-gray-500 text-lg">Aula não encontrada</p>
      <Link to="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">
        Voltar ao Dashboard
      </Link>
    </div>
  )

  const videoId = lesson.videoUrl.includes('youtube.com/watch?v=')
    ? lesson.videoUrl.split('v=')[1]
    : lesson.videoUrl.split('/').pop()

  const currentIndex = courseLessons.findIndex(l => l.id === lesson.id)
  const prevLesson = currentIndex > 0 ? courseLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < courseLessons.length - 1 ? courseLessons[currentIndex + 1] : null

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)]">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-20 left-4 z-40 p-2 bg-white rounded-lg shadow-md"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <aside className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform duration-300
        fixed lg:relative top-16 left-0 z-30
        w-72 h-[calc(100vh-4rem)] lg:h-auto
        bg-white border-r border-gray-100 shadow-sm lg:shadow-none
        overflow-y-auto flex-shrink-0
      `}>
        <div className="p-4 border-b border-gray-100">
          <Link
            to={`/dashboard/course/${course?.id}`}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            onClick={() => setSidebarOpen(false)}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Curso
          </Link>
          {module && (
            <p className="text-sm text-gray-500 mt-2">{module.title}</p>
          )}
        </div>
        <div className="p-2">
          {courseLessons.map((l, index) => (
            <Link
              key={l.id}
              to={`/dashboard/lesson/${l.id}`}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                l.id === lesson.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                l.id === lesson.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{l.title}</p>
                {l.id === lesson.id && (
                  <p className="text-xs text-blue-600">Assistindo agora</p>
                )}
              </div>
              {l.id === lesson.id && <Play className="w-4 h-4 text-blue-600 flex-shrink-0" />}
            </Link>
          ))}
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 max-w-4xl w-full p-4 sm:p-6 mx-auto">
        {course && module && (
          <Breadcrumb items={[
            { label: 'Meus Cursos', to: '/dashboard/cursos' },
            { label: course.title, to: `/dashboard/course/${course.id}` },
            { label: module.title },
          ]} />
        )}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
        </div>

        <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl mb-6">
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
              className="w-full h-full"
              allowFullScreen
              title={lesson.title}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <a
            href={lesson.pdfUrl}
            download
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-sm hover:shadow-md text-sm font-medium"
          >
            <FileDown className="w-4 h-4" />
            Material em PDF
          </a>

          <button
            onClick={handleComplete}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-all text-sm font-medium"
          >
            <CheckCircle className="w-4 h-4" />
            Marcar como Concluída
          </button>

          <button
            onClick={() => navigate(`/dashboard/course/${course?.id}/messages?lesson=${lesson.id}`)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-50 border-2 border-orange-600 text-orange-600 rounded-xl hover:bg-orange-100 transition-all text-sm font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            Enviar Dúvida desta Aula
          </button>
        </div>

        {prevLesson || nextLesson ? (
          <div className="flex flex-col sm:flex-row justify-between gap-3 mb-8">
            {prevLesson ? (
              <Link
                to={`/dashboard/lesson/${prevLesson.id}`}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium"
              >
                ← {prevLesson.title}
              </Link>
            ) : <div />}
            {nextLesson ? (
              <Link
                to={`/dashboard/lesson/${nextLesson.id}`}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Próxima: {nextLesson.title} →
              </Link>
            ) : <div />}
          </div>
        ) : null}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Dúvidas e Comentários
            </h2>
          </div>

          <div className="p-4 sm:p-6">
            <div className="mb-6 max-h-60 overflow-y-auto space-y-4">
              {lessonComments.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">Nenhum comentário ainda. Seja o primeiro!</p>
              ) : (
                lessonComments.map(c => (
                  <div key={c.id} className="flex gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700">{c.userName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{c.userName}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-3">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Digite sua dúvida ou comentário..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                onKeyPress={e => e.key === 'Enter' && handleComment()}
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Enviar
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
