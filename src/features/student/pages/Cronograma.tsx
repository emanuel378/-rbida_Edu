import { useState, useMemo } from 'react'
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react'
import { useAuthStore } from '../../auth/services/authStore'
import { useCourseStore } from '../../courses/data/courseStore'
import Breadcrumb from '../../../shared/components/Breadcrumb'

interface ScheduleItem {
  id: string
  day: string
  time: string
  subject: string
  type: 'aula' | 'simulado' | 'revisao'
  completed: boolean
}

const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const timeSlots = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']

export default function Cronograma() {
  const [selectedDay, setSelectedDay] = useState<string>('Segunda')
  const { user } = useAuthStore()
  const { courses, modules, lessons, enrollments } = useCourseStore()

  const scheduleData = useMemo<ScheduleItem[]>(() => {
    const enrolledCourses = courses.filter(c =>
      enrollments.some(e => e.userId === user?.id && e.courseId === c.id)
    )
    const enrolledCourseIds = enrolledCourses.map(c => c.id)
    const courseModules = modules.filter(m => enrolledCourseIds.includes(m.courseId))
    const courseModuleIds = courseModules.map(m => m.id)
    const allLessons = lessons.filter(l => courseModuleIds.includes(l.moduleId))

    return allLessons.map((lesson, index) => {
      const mod = courseModules.find(m => m.id === lesson.moduleId)
      const course = enrolledCourses.find(c => c.id === mod?.courseId)
      const enrollment = enrollments.find(e => e.userId === user?.id && e.courseId === course?.id)
      const completed = enrollment?.completedLessons.includes(lesson.id) || false

      return {
        id: lesson.id,
        day: days[index % days.length],
        time: timeSlots[Math.floor(index / days.length) % timeSlots.length],
        subject: course ? `${course.title} - ${lesson.title}` : lesson.title,
        type: 'aula' as const,
        completed,
      }
    })
  }, [user, courses, modules, lessons, enrollments])

  const completedCount = scheduleData.filter((item) => item.completed).length
  const totalCount = scheduleData.length
  const todayItems = scheduleData.filter((item) => item.day === selectedDay)

  const typeConfig = {
    aula: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: BookOpen },
    simulado: { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: CalendarIcon },
    revisao: { color: 'bg-green-50 text-green-700 border-green-200', icon: Clock },
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <Breadcrumb items={[{ label: 'Cronograma' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
          </div>
          Cronograma
        </h1>
        <p className="text-gray-600 mt-2">
          Acompanhe suas aulas e atividades da semana.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
              <p className="text-sm text-gray-500">Atividades na semana</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
              <p className="text-sm text-gray-500">Concluídas</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalCount - completedCount}</p>
              <p className="text-sm text-gray-500">Pendentes</p>
            </div>
          </div>
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <CalendarIcon className="w-12 h-12 text-gray-200 mb-3" />
          <p className="text-gray-500 text-sm">Nenhum curso matriculado. Matricule-se em um curso para ver o cronograma.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Visão da Semana</h2>
            </div>
            <div className="p-3">
              {days.map((day) => {
                const dayItems = scheduleData.filter((item) => item.day === day)
                const dayCompleted = dayItems.filter((item) => item.completed).length
                const isSelected = day === selectedDay

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all mb-1 ${
                      isSelected
                        ? 'bg-[#1a3a5c] text-white'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isSelected ? 'bg-white/20' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {day.slice(0, 2)}
                      </div>
                      <span className="text-sm font-medium">{day}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                        {dayCompleted}/{dayItems.length}
                      </span>
                      {dayItems.length > 0 && (
                        <div className={`w-12 h-1.5 rounded-full ${isSelected ? 'bg-white/20' : 'bg-gray-100'}`}>
                          <div
                            className={`h-full rounded-full ${isSelected ? 'bg-lime-400' : 'bg-blue-500'}`}
                            style={{ width: `${dayItems.length > 0 ? (dayCompleted / dayItems.length) * 100 : 0}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{selectedDay}</h2>
              <span className="text-sm text-gray-500">
                {todayItems.length} {todayItems.length === 1 ? 'atividade' : 'atividades'}
              </span>
            </div>
            <div className="p-5">
              {todayItems.length > 0 ? (
                <div className="space-y-4">
                  {todayItems.map((item) => {
                    const config = typeConfig[item.type]
                    const Icon = config.icon

                    return (
                      <div
                        key={item.id}
                        className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                          item.completed
                            ? 'bg-gray-50 border-gray-100 opacity-60'
                            : `${config.color} border`
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          item.completed ? 'bg-gray-200' : 'bg-white/60'
                        }`}>
                          <Icon className={`w-5 h-5 ${item.completed ? 'text-gray-400' : ''}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold uppercase tracking-wide ${
                              item.completed ? 'text-gray-400' : ''
                            }`}>
                              {item.type}
                            </span>
                            {item.completed && (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <h3 className={`font-semibold ${
                            item.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                          }`}>
                            {item.subject}
                          </h3>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm text-gray-500">{item.time}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <CalendarIcon className="w-12 h-12 text-gray-200 mb-3" />
                  <p className="text-gray-500 text-sm">Nenhuma atividade para este dia.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
