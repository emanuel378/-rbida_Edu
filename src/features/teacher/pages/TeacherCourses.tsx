import { useState, useEffect } from 'react'
import { useCourseStore } from '../../courses/data/courseStore'
import { useAuthStore } from '../../auth/services/authStore'
import { BookOpen, Plus, Trash2, ArrowLeft, X, Layers, Video, GraduationCap, AlertTriangle, Clock, CheckCircle, XCircle, DollarSign, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText = 'Excluir', confirmColor = 'bg-red-600 hover:bg-red-700' }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmText?: string; confirmColor?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm">Cancelar</button>
          <button onClick={() => { onConfirm(); onClose() }} className={`px-4 py-2.5 text-white rounded-xl transition-colors font-medium text-sm ${confirmColor}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}

const courseColors = [
  { gradient: 'from-blue-500 to-cyan-400', light: 'bg-blue-50 text-blue-600' },
  { gradient: 'from-purple-500 to-pink-400', light: 'bg-purple-50 text-purple-600' },
  { gradient: 'from-green-500 to-emerald-400', light: 'bg-green-50 text-green-600' },
  { gradient: 'from-orange-500 to-amber-400', light: 'bg-orange-50 text-orange-600' },
]

export default function TeacherCourses() {
  const { user } = useAuthStore()
  const { courses, modules, lessons, messages, addCourse, requestCoursePrice, requestContentDeletion, getTeacherName } = useCourseStore()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteTitle, setDeleteTitle] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const myCourses = courses.filter(c => c.teacherId === user?.id)

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 4000)
      return () => clearTimeout(t)
    }
  }, [successMsg])

  useEffect(() => {
    if (showModal) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [showModal])

  const handleCreate = () => {
    if (!user || !title.trim()) return
    const courseId = Date.now().toString()
    addCourse({
      id: courseId,
      title: title.trim(),
      description: description.trim(),
      teacherId: user.id,
      price: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      published: false,
    })
    requestCoursePrice(courseId, user.name)
    setTitle('')
    setDescription('')
    setShowModal(false)
    setSuccessMsg('Curso criado! O admin será notificado para definir o preço.')
  }

  const getPendingDeletion = (courseId: string) =>
    messages.find(m => m.courseId === courseId && m.type === 'delete_request' && m.status === 'pending')

  const handleDeleteRequest = () => {
    if (!deleteId || !user) return
    const course = courses.find(c => c.id === deleteId)
    if (!course) return
    requestContentDeletion({
      courseId: deleteId,
      teacherName: user.name,
      targetType: 'course',
      targetName: course.title,
    })
    setDeleteId(null)
    setSuccessMsg('Solicitação de exclusão enviada ao admin para aprovação.')
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/teacher')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Meus Cursos</h1>
          <p className="text-gray-500 text-sm">Crie e gerencie seus cursos</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium text-sm shadow-sm shadow-blue-200">
          <Plus className="w-4 h-4" /> Novo Curso
        </button>
      </div>

      {myCourses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum curso criado</h3>
          <p className="text-gray-500 mb-6">Crie seu primeiro curso para começar</p>
          <button onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm">
            <Plus className="w-4 h-4" /> Criar Curso
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {myCourses.map((course, idx) => {
            const courseModules = modules.filter(m => m.courseId === course.id)
            const courseLessons = lessons.filter(l => courseModules.some(m => m.id === l.moduleId))
            const color = courseColors[idx % courseColors.length]
            const pendingDel = getPendingDeletion(course.id)
            return (
              <div key={course.id}
                className="group bg-white rounded-2xl border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-300 overflow-hidden">
                <div className={`h-1.5 bg-gradient-to-r ${color.gradient}`} />
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${color.light} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/teacher/course/${course.id}`)}>
                      <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">{course.title}</h3>
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{course.description || 'Sem descrição'}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5" /> {courseModules.length} módulos
                        </span>
                        <span className="flex items-center gap-1">
                          <Video className="w-3.5 h-3.5" /> {courseLessons.length} aulas
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" /> {getTeacherName(course.teacherId)}
                        </span>
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
                           'Pendente'}
                        </span>
                        {pendingDel && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                            <Clock className="w-3 h-3" /> Exclusão solicitada
                          </span>
                        )}
                        {course.price === 0 && course.status === 'pending' && (
                          <span className="text-gray-400 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> Aguardando preço
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => navigate(`/teacher/course/${course.id}`)}
                        className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors opacity-0 group-hover:opacity-100">
                        Gerenciar
                      </button>
                      {!pendingDel && (
                        <button onClick={() => { setDeleteId(course.id); setDeleteTitle(course.title) }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Novo Curso</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Título do curso</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                  placeholder="Ex: Preparatório ENEM 2026"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição (opcional)</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Descreva o objetivo do curso..."
                  rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <Send className="w-4 h-4 flex-shrink-0" />
                  O preço será definido pelo admin após a criação do curso.
                </p>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm">Cancelar</button>
                <button onClick={handleCreate} disabled={!title.trim()}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium text-sm">
                  Criar Curso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {successMsg}
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteRequest}
        title="Solicitar exclusão"
        message={`Solicitar exclusão de "${deleteTitle}"? O admin será notificado para aprovação.`}
        confirmText="Solicitar Exclusão"
        confirmColor="bg-orange-600 hover:bg-orange-700" />
    </div>
  )
}
