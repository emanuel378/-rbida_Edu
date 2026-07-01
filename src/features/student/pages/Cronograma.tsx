import { useState, useMemo } from 'react'
import {
  Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle,
  BookOpen, Plus, Trash2, X as XIcon,
} from 'lucide-react'
import { useAuthStore } from '../../auth/services/authStore'
import { useCourseStore } from '../../courses/data/courseStore'
import { useScheduleStore, type ScheduleEntry } from '../data/scheduleStore'
import Breadcrumb from '../../../shared/components/Breadcrumb'

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '19:00', '20:00',
]

const TYPES = ['aula', 'simulado', 'revisao', 'prova'] as const

const typeConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  aula: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: BookOpen },
  simulado: { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: CalendarIcon },
  revisao: { color: 'bg-green-50 text-green-700 border-green-200', icon: Clock },
  prova: { color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
}

export default function Cronograma() {
  const [selectedDay, setSelectedDay] = useState<string>('Segunda')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { user } = useAuthStore()
  const { courses, modules, lessons, enrollments } = useCourseStore()
  const { entries, addEntry, removeEntry, updateEntry, toggleComplete } = useScheduleStore()

  const userEntries = useMemo(
    () => entries.filter(e => e.userId === user?.id),
    [entries, user]
  )

  const enrolledCourses = useMemo(() => {
    return courses.filter(c =>
      enrollments.some(e => e.userId === user?.id && e.courseId === c.id)
    )
  }, [courses, enrollments, user])

  const enrolledCourseIds = useMemo(() => enrolledCourses.map(c => c.id), [enrolledCourses])
  const courseModules = useMemo(
    () => modules.filter(m => enrolledCourseIds.includes(m.courseId)),
    [modules, enrolledCourseIds]
  )
  const courseModuleIds = useMemo(() => courseModules.map(m => m.id), [courseModules])
  const availableLessons = useMemo(
    () => lessons.filter(l => courseModuleIds.includes(l.moduleId)),
    [lessons, courseModuleIds]
  )

  const completedCount = userEntries.filter(e => e.completed).length
  const totalCount = userEntries.length
  const dayEntries = userEntries.filter(e => e.day === selectedDay)

  const getCourseName = (entry: ScheduleEntry) => entry.courseName

  const notScheduled = useMemo(() => {
    const scheduledIds = new Set(userEntries.map(e => e.lessonId))
    return availableLessons.filter(l => !scheduledIds.has(l.id))
  }, [availableLessons, userEntries])

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
          Organize seus estudos escolhendo dia e horário para cada atividade.
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

      {enrolledCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <CalendarIcon className="w-12 h-12 text-gray-200 mb-3" />
          <p className="text-gray-500 text-sm">Nenhum curso matriculado. Matricule-se em um curso para montar seu cronograma.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Dias da Semana</h2>
              </div>
              <div className="p-3">
                {DAYS.map((day) => {
                  const dayItems = userEntries.filter(e => e.day === day)
                  const dayCompleted = dayItems.filter(e => e.completed).length
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
                              style={{ width: `${(dayCompleted / dayItems.length) * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              onClick={() => { setEditingId(null); setShowModal(true) }}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Adicionar Atividade
            </button>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">{selectedDay}</h2>
                <span className="text-sm text-gray-500">
                  {dayEntries.length} {dayEntries.length === 1 ? 'atividade' : 'atividades'}
                </span>
              </div>
              <div className="p-5">
                {dayEntries.length > 0 ? (
                  <div className="space-y-3">
                    {dayEntries
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((entry) => {
                        const config = typeConfig[entry.type] || typeConfig.aula
                        const Icon = config.icon

                        return (
                          <div
                            key={entry.id}
                            className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                              entry.completed
                                ? 'bg-gray-50 border-gray-100 opacity-60'
                                : 'bg-white border-gray-200 hover:border-blue-200'
                            }`}
                          >
                            <button
                              onClick={() => toggleComplete(entry.id)}
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                                entry.completed
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'border-gray-300 hover:border-blue-400'
                              }`}
                            >
                              {entry.completed && <CheckCircle2 className="w-4 h-4" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${entry.completed ? 'text-gray-400 border-gray-200' : config.color}`}>
                                  {entry.type}
                                </span>
                                <span className="text-xs text-gray-400">{entry.courseName}</span>
                              </div>
                              <h3 className={`font-semibold ${entry.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                {entry.title}
                              </h3>
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-sm text-gray-500">{entry.time}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <select
                                value={entry.time}
                                onChange={e => updateEntry(entry.id, { time: e.target.value })}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                {TIME_SLOTS.map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>

                              <button
                                onClick={() => {
                                  const idx = DAYS.indexOf(entry.day)
                                  const nextDay = DAYS[(idx + 1) % DAYS.length]
                                  updateEntry(entry.id, { day: nextDay })
                                }}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs"
                                title="Mover para o próximo dia"
                              >
                                {">"}
                              </button>

                              <button
                                onClick={() => removeEntry(entry.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <CalendarIcon className="w-12 h-12 text-gray-200 mb-3" />
                    <p className="text-gray-500 text-sm mb-4">Nenhuma atividade para {selectedDay.toLowerCase()}.</p>
                    <button
                      onClick={() => { setEditingId(null); setShowModal(true) }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Adicionar Atividade</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <XIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {notScheduled.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  Todas as aulas dos seus cursos já estão no cronograma.
                </p>
              ) : (
                notScheduled.map(lesson => {
                  const mod = courseModules.find(m => m.id === lesson.moduleId)
                  const course = enrolledCourses.find(c => c.id === mod?.courseId)

                  return (
                    <div key={lesson.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{lesson.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{course?.title}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <select
                          id={`day-${lesson.id}`}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select
                          id={`time-${lesson.id}`}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select
                          id={`type-${lesson.id}`}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button
                          onClick={() => {
                            const dayEl = document.getElementById(`day-${lesson.id}`) as HTMLSelectElement
                            const timeEl = document.getElementById(`time-${lesson.id}`) as HTMLSelectElement
                            const typeEl = document.getElementById(`type-${lesson.id}`) as HTMLSelectElement
                            addEntry({
                              lessonId: lesson.id,
                              day: dayEl.value,
                              time: timeEl.value,
                              type: typeEl.value as ScheduleEntry['type'],
                              completed: false,
                              userId: user?.id || 'unknown',
                              title: lesson.title,
                              courseName: course?.title || '',
                            })
                            dayEl.value = DAYS[0]
                            timeEl.value = TIME_SLOTS[0]
                            typeEl.value = 'aula'
                          }}
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
