import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../auth/services/authStore'
import { useCourseStore } from '../../courses/data/courseStore'
import { mockCourses } from '../../courses/data/mock'
import ProgressBar from '../../../shared/components/ProgressBar'
import { BookOpen, Plus, ArrowRight, Play } from 'lucide-react'

export default function Dashboard() {
  const user = useAuthStore(s => s.user)
  const { courses, enrollments, getEnrollment, enroll } = useCourseStore()
  const [allCourses, setAllCourses] = useState(mockCourses)

  useEffect(() => {
    setAllCourses([...mockCourses, ...courses])
  }, [courses])

  const handleEnroll = (courseId: string) => {
    if (!user) return
    enroll({
      id: Date.now().toString(),
      userId: user.id,
      courseId,
      progress: 0,
      completedLessons: [],
      createdAt: new Date().toISOString(),
    })
  }

  const visibleCourses = allCourses.filter(c => c.status === 'approved')
  const enrolledCourses = user ? visibleCourses.filter(c => getEnrollment(user.id, c.id)) : []
  const availableCourses = user ? visibleCourses.filter(c => !getEnrollment(user.id, c.id)) : visibleCourses

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-gray-600">Continue seus estudos e alcance seus objetivos</p>
      </div>

      {user?.role === 'aluno' && enrolledCourses.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Play className="w-5 h-5 text-blue-600" />
              Meus Cursos
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map(course => {
              const enrollment = getEnrollment(user.id, course.id)
              return (
                <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 group">
                  <div className="h-3 bg-gradient-to-r from-blue-500 to-blue-600">
                    <ProgressBar progress={enrollment?.progress || 0} size="lg" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{course.title}</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <ProgressBar progress={enrollment?.progress || 0} showLabel size="sm" />
                      </div>
                      <Link
                        to={`/course/${course.id}`}
                        className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                      >
                        Continuar
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">
            {user?.role === 'aluno' ? 'Cursos Disponíveis' : 'Todos os Cursos'}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableCourses.map(course => {
            const enrollment = user ? getEnrollment(user.id, course.id) : undefined
            return (
              <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group">
                <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-end">
                  <div className="p-6 w-full">
                    <h3 className="font-bold text-xl text-white mb-1">{course.title}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                  {enrollment && (
                    <div className="mb-4">
                      <ProgressBar progress={enrollment.progress} showLabel size="sm" />
                    </div>
                  )}
                  {user?.role === 'aluno' && (
                    enrollment ? (
                      <Link
                        to={`/course/${course.id}`}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        Continuar
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white border-2 border-blue-600 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Matricular
                      </button>
                    )
                  )}
                  {user?.role !== 'aluno' && (
                    <Link
                      to={`/course/${course.id}`}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Ver Curso
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
