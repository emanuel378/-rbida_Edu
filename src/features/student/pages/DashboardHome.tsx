import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCourseStore } from '../../courses/data/courseStore'
import { useAuthStore } from '../../auth/services/authStore'
import { Card, CardHeader, CardContent, Badge } from '../../../shared/components/Card'
import ProgressBar from '../../../shared/components/ProgressBar'
import Breadcrumb from '../../../shared/components/Breadcrumb'
import CheckoutModal from '../../courses/components/CheckoutModal'
import type { Course } from '../../courses/data/mock'
import { BookOpen, ArrowRight, Clock, AlertCircle, ShoppingCart, Mail, Phone } from 'lucide-react'
import {
  CONTACT_EMAIL,
  CONTACT_WHATSAPP_DISPLAY,
  CONTACT_WHATSAPP_LINK,
  CONTACT_INSTAGRAM_HANDLE,
  CONTACT_INSTAGRAM_LINK,
} from '../../../shared/constants/contact'

export default function DashboardHome() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { courses, enrollments, modules, lessons, getEnrollment, loadFromSupabase } = useCourseStore()
  const [checkoutCourse, setCheckoutCourse] = useState<Course | null>(null)

  const firstName = user?.name.split(' ')[0] || 'Aluno'

  const visibleCourses = courses.filter(c => c.published)
  const enrolledCourses = visibleCourses.filter((course) => getEnrollment(user?.id || '', course.id))
  const availableCourses = visibleCourses.filter(
    (course) => !getEnrollment(user?.id || '', course.id)
  )

  const getCourseStats = (courseId: string) => {
    const courseModules = modules.filter((m) => m.courseId === courseId)

    return {
      lessons: lessons.filter((l) =>
        courseModules.some((m) => m.id === l.moduleId)
      ).length,
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <Breadcrumb items={[{ label: 'Dashboard' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bem-vindo, {firstName}!
        </h1>
        <p className="text-gray-600 mt-1">
          Continue seus estudos ou explore novos cursos.
        </p>
      </div>

      {enrolledCourses.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Meus Cursos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((course) => {
              const enrollment = getEnrollment(user?.id || '', course.id)
              const stats = getCourseStats(course.id)
              const progress = stats.lessons > 0
                ? Math.round((enrollment?.completedLessons.length || 0) / stats.lessons * 100)
                : 0

              return (
                <Card key={course.id} hoverable>
                  <CardHeader
                    title={course.title}
                    subtitle={course.description}
                    icon={BookOpen}
                    action={
                      <Badge
                        text={progress === 100 ? 'Concluído' : progress > 0 ? 'Em andamento' : 'Novo'}
                        color={progress === 100 ? 'green' : progress > 0 ? 'blue' : 'yellow'}
                      />
                    }
                  />
                  <CardContent>
                    <div className="mb-4">
                      <ProgressBar progress={progress} size="md" />
                    </div>
                    <button
                      onClick={() => navigate(`/dashboard/course/${course.id}`)}
                      className="w-full flex items-center justify-center gap-2 bg-[#1a3a5c] hover:bg-[#15304d] text-white py-2.5 rounded-xl transition-colors text-sm font-medium"
                    >
                      Continuar
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {availableCourses.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-600" />
            Cursos Disponíveis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCourses.map((course) => (
              <Card key={course.id}>
                <div className="h-32 rounded-t-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  {course.coverImageUrl ? (
                    <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-12 h-12 text-white/80" />
                  )}
                </div>
                <CardContent>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{course.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                  <p className="text-sm font-medium text-gray-700 mb-4">
                    {course.price > 0 ? `R$ ${course.price.toFixed(2)}` : 'Gratuito'}
                  </p>
                  {course.price > 0 ? (
                    <button
                      onClick={() => setCheckoutCourse(course)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl transition-colors text-sm font-medium"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Comprar
                    </button>
                  ) : (
                    <button
                      onClick={() => useCourseStore.getState().enroll({
                        id: Date.now().toString(),
                        userId: user?.id || '',
                        courseId: course.id,
                        progress: 0,
                        completedLessons: [],
                        createdAt: new Date().toISOString(),
                      })}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl transition-colors text-sm font-medium"
                    >
                      Matricular-se
                    </button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {enrolledCourses.length === 0 && availableCourses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Nenhum curso disponível</h3>
          <p className="text-gray-500 text-sm">Entre em contato com o administrador para acessar os cursos.</p>
        </div>
      )}

      {checkoutCourse && user && (
        <CheckoutModal
          course={checkoutCourse}
          user={user}
          onClose={() => setCheckoutCourse(null)}
          onPaid={() => loadFromSupabase()}
        />
      )}

      <section className="mt-12 pt-8 border-t border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Precisa de ajuda? Fale com a gente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="flex items-center gap-3 bg-white hover:bg-gray-50 rounded-xl p-4 border border-gray-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">E-mail</p>
              <p className="text-xs text-gray-500 truncate">{CONTACT_EMAIL}</p>
            </div>
          </a>

          <a
            href={CONTACT_WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white hover:bg-gray-50 rounded-xl p-4 border border-gray-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">WhatsApp</p>
              <p className="text-xs text-gray-500 truncate">{CONTACT_WHATSAPP_DISPLAY}</p>
            </div>
          </a>

          <a
            href={CONTACT_INSTAGRAM_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white hover:bg-gray-50 rounded-xl p-4 border border-gray-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">Instagram</p>
              <p className="text-xs text-gray-500 truncate">{CONTACT_INSTAGRAM_HANDLE}</p>
            </div>
          </a>
        </div>
      </section>
    </div>
  )
}
