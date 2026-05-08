import { useState } from 'react'
import { useCourseStore } from '../../courses/data/courseStore'
import { useAuthStore } from '../../auth/services/authStore'
import { BookOpen, Plus, ArrowLeft, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function TeacherCourses() {
  const { user } = useAuthStore()
  const { courses, addCourse, deleteCourse, getTeacherName } = useCourseStore()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const myCourses = courses.filter(c => c.teacherId === user?.id)

  const handleDelete = (courseId: string) => {
    if (confirm('Tem certeza que deseja excluir este curso?')) {
      deleteCourse(courseId)
    }
  }

  const handleCreate = () => {
    if (!user || !title) return
    addCourse({
      id: Date.now().toString(),
      title,
      description,
      teacherId: user.id,
      createdAt: new Date().toISOString(),
    })
    setTitle('')
    setDescription('')
    setShowForm(false)
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/teacher')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Cursos</h1>
          <p className="text-gray-600">Crie e gerencie seus cursos</p>
        </div>
      </div>

      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-6 flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        Novo Curso
      </button>

        {showForm && (
          <div className="mb-6 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Título do curso"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descrição do curso"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              onClick={handleCreate}
              disabled={!title}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Criar Curso
            </button>
          </div>
        )}

      <div className="space-y-3">
        {myCourses.map(course => (
          <div key={course.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center cursor-pointer"
              onClick={() => navigate(`/teacher/course/${course.id}`)}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1 cursor-pointer" onClick={() => navigate(`/teacher/course/${course.id}`)}>
              <p className="font-medium text-gray-900">{course.title}</p>
              <p className="text-sm text-gray-500">{course.description}</p>
              <p className="text-xs text-blue-600 mt-1">Professor: {getTeacherName(course.teacherId)}</p>
            </div>
            <span className="text-sm text-blue-600 cursor-pointer" onClick={() => navigate(`/teacher/course/${course.id}`)}>Gerenciar →</span>
            <button onClick={() => handleDelete(course.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {myCourses.length === 0 && (
          <p className="text-center text-gray-500 py-8">Nenhum curso criado ainda.</p>
        )}
      </div>
    </div>
  )
}
