import { useNavigate } from 'react-router-dom'
import { useCourseStore } from '../../courses/data/courseStore'
import { useAuthStore } from '../../auth/services/authStore'
import { Card, CardHeader, CardContent, Badge } from '../../../shared/components/Card'
import ProgressBar from '../../../shared/components/ProgressBar'
import Breadcrumb from '../../../shared/components/Breadcrumb'
import { BookOpen, ArrowRight, Layers } from 'lucide-react'

export default function MeusCursos() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { courses, modules, lessons, getEnrollment } = useCourseStore()

  const visibleCourses = courses.filter(c => c.status === 'approved')
  const enrolledCourses = visibleCourses.filter((course) => getEnrollment(user?.id || '', course.id))

  const getCourseStats = (courseId: string) => {
    const courseModules = modules.filter((m) => m.courseId === courseId)
    const courseLessons = lessons.filter((l) =>
      courseModules.some((m) => m.id === l.moduleId)
    )
    return {
      modules: courseModules.length,
      lessons: courseLessons.length,
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <Breadcrumb items={[{ label: 'Meus Cursos' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          Meus Cursos
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie seus cursos e acompanhe seu progresso.
        </p>
      </div>

      {enrolledCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map((course) => {
            const enrollment = getEnrollment(user?.id || '', course.id)
            const stats = getCourseStats(course.id)
            const totalLessons = stats.lessons
            const progress = totalLessons > 0
              ? Math.round((enrollment?.completedLessons.length || 0) / totalLessons * 100)
              : 0

            const badgeColor = progress === 100 ? 'green' : progress > 50 ? 'blue' : 'yellow'

            return (
              <Card key={course.id} hoverable>
                <div className="h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-2xl" />
                <CardHeader
                  title={course.title}
                  subtitle={course.description}
                  icon={BookOpen}
                  action={<Badge text={`${progress}%`} color={badgeColor} />}
                />
                <CardContent>
                   <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                     <span className="flex items-center gap-1">
                       <Layers className="w-3.5 h-3.5" />
                       {stats.modules} módulos
                     </span>
                     <span>{stats.lessons} aulas</span>
                   </div>
                  <div className="mb-4">
                    <ProgressBar progress={progress} size="sm" />
                  </div>
                  <button
                    onClick={() => navigate(`/dashboard/course/${course.id}`)}
                    className="w-full flex items-center justify-center gap-2 bg-[#1a3a5c] hover:bg-[#15304d] text-white py-2.5 rounded-xl transition-colors text-sm font-medium"
                  >
                    Acessar Curso
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Nenhum curso matriculado</h3>
          <p className="text-gray-500 text-sm mb-4">Matricule-se em um curso para começar a estudar.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl transition-colors text-sm font-medium"
          >
            Ver Cursos Disponíveis
          </button>
        </div>
      )}
    </div>
  )
}
