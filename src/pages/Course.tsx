import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useCourseStore } from '../store/courseStore'
import { BookOpen, Play, FileText } from 'lucide-react'
import ProgressBar from '../components/ProgressBar'
import Breadcrumb from '../components/Breadcrumb'

export default function Course() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { courses, disciplines, lessons, enrollments } = useCourseStore()

  const course = courses.find(c => c.id === id)
  const courseDisciplines = disciplines.filter(d => d.courseId === id)

  const enrollment = user && id ? enrollments.find(e => e.userId === user.id && e.courseId === id) : null
  const totalLessons = lessons.filter(l => courseDisciplines.some(d => d.id === l.disciplineId)).length

  if (!course) return (
    <div className="text-center py-20">
      <p className="text-gray-500 text-lg">Curso não encontrado</p>
      <Link to="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">
        Voltar ao Dashboard
      </Link>
    </div>
  )

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <Breadcrumb items={[
        { label: 'Meus Cursos', to: '/dashboard/cursos' },
        { label: course.title },
      ]} />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="h-32 sm:h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-end">
          <div className="p-4 sm:p-8 w-full">
            <h1 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">{course.title}</h1>
            <p className="text-blue-100 text-sm sm:text-base">{course.description}</p>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          {enrollment && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progresso do curso</span>
                <span className="text-sm text-gray-500">{enrollment.progress}%</span>
              </div>
              <ProgressBar progress={enrollment.progress} size="lg" />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>{courseDisciplines.length} disciplinas</span>
            </div>
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              <span>{totalLessons} aulas</span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-blue-600" />
        Disciplinas
      </h2>

      {courseDisciplines.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma disciplina cadastrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courseDisciplines.map((discipline, index) => {
            const disciplineLessons = lessons.filter(l => l.disciplineId === discipline.id)
            return (
              <div key={discipline.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{discipline.title}</h3>
                      <p className="text-sm text-gray-500">{disciplineLessons.length} aulas</p>
                    </div>
                  </div>

                  {disciplineLessons.length > 0 ? (
                    <div className="space-y-2 ml-2">
                      {disciplineLessons.map((lesson, lessonIndex) => (
                        <Link
                          key={lesson.id}
                          to={`/dashboard/lesson/${lesson.id}`}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group"
                        >
                          <div className="w-8 h-8 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center text-xs font-medium text-gray-600 group-hover:text-blue-600 transition-colors flex-shrink-0">
                            {lessonIndex + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Play className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <span className="text-xs text-gray-500">Vídeo</span>
                              {lesson.pdfUrl && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                  <span className="text-xs text-gray-500">PDF</span>
                                </>
                              )}
                            </div>
                          </div>
                          <Play className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 ml-2">Nenhuma aula cadastrada nesta disciplina.</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
