import { useCourseStore } from '../../courses/data/courseStore'
import { useQuestionStore } from '../../courses/data/questionStore'
import { useAuthStore } from '../../auth/services/authStore'
import { BookOpen, Video, HelpCircle, Plus, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Module, Lesson } from '../../courses/data/mock'

export default function TeacherDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { courses, modules, lessons } = useCourseStore()
  const { questions } = useQuestionStore()

  const myCourses = courses.filter(c => c.teacherId === user?.id)
  const myModules: Module[] = modules.filter(m => myCourses.some(c => c.id === m.courseId))
  const myLessons: Lesson[] = lessons.filter(l => myModules.some(m => m.id === l.moduleId))
  const myQuestions = questions.filter(q =>
    myModules.some(m => m.id === q.moduleId)
  )
  const pendingCourses = myCourses.filter(c => c.status === 'pending')
  const rejectedCourses = myCourses.filter(c => c.status === 'rejected')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel do Professor</h1>
        <p className="text-gray-600">Gerencie seus cursos e conteúdos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{myCourses.length}</p>
              <p className="text-sm text-gray-500">Cursos</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{myModules.length}</p>
              <p className="text-sm text-gray-500">Módulos</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{myLessons.length}</p>
              <p className="text-sm text-gray-500">Aulas</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{myQuestions.length}</p>
              <p className="text-sm text-gray-500">Questões</p>
            </div>
          </div>
        </div>
      </div>

      {(pendingCourses.length > 0 || rejectedCourses.length > 0) && (
        <div className="space-y-3 mb-8">
          {pendingCourses.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">{pendingCourses.length} curso(s) aguardando aprovação do admin</p>
                <p className="text-xs text-yellow-600">Os cursos precisam ser aprovados antes de ficarem visíveis para os alunos.</p>
              </div>
            </div>
          )}
          {rejectedCourses.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">{rejectedCourses.length} curso(s) foram rejeitados</p>
                <p className="text-xs text-red-600">Edite e reenvie para aprovação.</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Meus Cursos</h2>
          <button
            onClick={() => navigate('/teacher/courses')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Novo Curso
          </button>
        </div>
        {myCourses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhum curso criado ainda.</p>
        ) : (
          <div className="space-y-3">
            {myCourses.map(course => (
              <div key={course.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => navigate(`/teacher/course/${course.id}`)}>
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{course.title}</p>
                  <p className="text-sm text-gray-500">{course.description}</p>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium mt-1 ${
                    course.status === 'approved' ? 'text-green-600' :
                    course.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {course.status === 'approved' ? <CheckCircle className="w-3 h-3" /> :
                     course.status === 'rejected' ? <XCircle className="w-3 h-3" /> :
                     <Clock className="w-3 h-3" />}
                    {course.status === 'approved' ? 'Aprovado' :
                     course.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                  </span>
                </div>
                <span className="text-sm text-blue-600">Gerenciar →</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
