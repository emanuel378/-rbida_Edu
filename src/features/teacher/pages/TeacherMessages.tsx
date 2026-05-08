import { useState } from 'react'
import { useCourseStore } from '../../courses/data/courseStore'
import { useAuthStore } from '../../auth/services/authStore'
import { Reply, MessageCircle, BookOpen, Video } from 'lucide-react'

export default function TeacherMessages() {
  const { user } = useAuthStore()
  const { courses, modules, lessons, messages, replyMessage } = useCourseStore()
  const [selectedMsg, setSelectedMsg] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  const myCourses = courses.filter(c => c.teacherId === user?.id)
  const myModuleIds = modules.filter(m => myCourses.some(c => c.id === m.courseId)).map(m => m.id)

  const myMessages = messages.filter(m => {
    if (m.toTeacherId !== user?.id) return false
    if (m.moduleId) return myModuleIds.includes(m.moduleId)
    return myCourses.some(c => c.id === m.courseId)
  })
  const unreplied = myMessages.filter(m => !m.reply)
  const replied = myMessages.filter(m => m.reply)

  const handleReply = (msgId: string) => {
    if (!replyText) return
    replyMessage(msgId, replyText)
    setReplyText('')
    setSelectedMsg(null)
  }

  const getContext = (msg: any) => {
    const course = courses.find(c => c.id === msg.courseId)
    if (msg.lessonId) {
      const lesson = lessons.find(l => l.id === msg.lessonId)
      const mod = modules.find(m => m.id === lesson?.moduleId)
      return `Aula "${lesson?.title}", Módulo "${mod?.title}" - ${course?.title}`
    } else if (msg.moduleId) {
      const mod = modules.find(m => m.id === msg.moduleId)
      return `Módulo "${mod?.title}" - ${course?.title}`
    }
    return `Curso: ${course?.title}`
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Mensagens dos Alunos</h1>
      <p className="text-gray-600 mb-8">Responda às dúvidas dos alunos dos seus módulos</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
          <p className="text-2xl font-bold text-yellow-700">{unreplied.length}</p>
          <p className="text-sm text-yellow-600">Pendentes</p>
        </div>
        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
          <p className="text-2xl font-bold text-green-700">{replied.length}</p>
          <p className="text-sm text-green-600">Respondidas</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-2xl font-bold text-blue-700">{myMessages.length}</p>
          <p className="text-sm text-blue-600">Total</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">Pendentes</h2>
        {unreplied.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nenhuma mensagem pendente.</p>
        ) : (
          unreplied.map(msg => (
            <div key={msg.id} className="p-4 bg-white rounded-xl border border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900">{msg.fromUserName}</p>
                  <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                    <MessageCircle className="w-3 h-3" />
                    {getContext(msg)}
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(msg.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <p className="text-gray-700 mb-3">{msg.text}</p>
              {selectedMsg === msg.id ? (
                <div className="space-y-2">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Digite sua resposta..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReply(msg.id)}
                      disabled={!replyText}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                    >
                      Enviar Resposta
                    </button>
                    <button
                      onClick={() => { setSelectedMsg(null); setReplyText('') }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedMsg(msg.id)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Reply className="w-4 h-4" />
                  Responder
                </button>
              )}
            </div>
          ))
        )}

        <h2 className="text-lg font-bold text-gray-900 mt-6">Respondidas</h2>
        {replied.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nenhuma mensagem respondida.</p>
        ) : (
          replied.map(msg => (
            <div key={msg.id} className="p-4 bg-white rounded-xl border border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900">{msg.fromUserName}</p>
                  <p className="text-xs text-blue-600 mt-1">{getContext(msg)}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(msg.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <p className="text-gray-700 mb-3">{msg.text}</p>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 mb-1">Sua resposta:</p>
                <p className="text-sm text-blue-900">{msg.reply}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
