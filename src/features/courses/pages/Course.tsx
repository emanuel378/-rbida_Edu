import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../auth/services/authStore'
import { useCourseStore } from '../data/courseStore'
import { useQuestionStore } from '../data/questionStore'
import type { Question } from '../data/mock'
import { BookOpen, Play, FileText, MessageCircle, HelpCircle, CheckCircle, DollarSign, X } from 'lucide-react'
import ProgressBar from '../../../shared/components/ProgressBar'
import Breadcrumb from '../../../shared/components/Breadcrumb'

export default function Course() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { courses, modules, lessons, enrollments, getTeacherName } = useCourseStore()
  const { questions } = useQuestionStore()

  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)

  const course = courses.find(c => c.id === id)
  const courseModules = modules.filter(m => m.courseId === id)

  const enrollment = user && id ? enrollments.find(e => e.userId === user.id && e.courseId === id) : null
  const totalLessons = lessons.filter(l => courseModules.some(m => m.id === l.moduleId)).length

  if (!course) return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto text-center py-20">
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
              <span>{courseModules.length} módulos</span>
            </div>
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              <span>{totalLessons} aulas</span>
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <span>Professor: {getTeacherName(course.teacherId)}</span>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <DollarSign className="w-4 h-4" />
              <span>{course.price > 0 ? `R$ ${course.price.toFixed(2)}` : 'Gratuito'}</span>
            </div>
            <button
              onClick={() => navigate(`/dashboard/course/${id}/messages`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Enviar Dúvida
            </button>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-blue-600" />
        Módulos
      </h2>

      {courseModules.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum módulo cadastrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courseModules.map((module, index) => {
            const moduleLessons = lessons.filter(l => l.moduleId === module.id)
            const moduleQuestions = questions.filter(q => q.moduleId === module.id)
            return (
              <div key={module.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{module.title}</h3>
                        <p className="text-sm text-gray-500">{moduleLessons.length} aulas • {moduleQuestions.length} atividades</p>
                        <p className="text-xs text-blue-600">Professor: {getTeacherName(module.teacherId)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/dashboard/course/${id}/messages?module=${module.id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-xs font-medium flex-shrink-0"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Tirar dúvida do módulo</span>
                    </button>
                  </div>

                  {moduleLessons.length > 0 ? (
                    <div className="space-y-2 ml-2 mb-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Aulas</p>
                      {moduleLessons.map((lesson, lessonIndex) => {
                        const completed = enrollment?.completedLessons.includes(lesson.id)
                        return (
                        <Link
                          key={lesson.id}
                          to={`/dashboard/lesson/${lesson.id}`}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-colors group ${
                            completed ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-blue-50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors flex-shrink-0 ${
                            completed
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 group-hover:bg-blue-100 text-gray-600 group-hover:text-blue-600'
                          }`}>
                            {completed ? <CheckCircle className="w-4 h-4" /> : lessonIndex + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium transition-colors truncate ${
                              completed
                                ? 'text-green-700 line-through'
                                : 'text-gray-800 group-hover:text-blue-600'
                            }`}>
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {completed ? (
                                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                              ) : (
                                <Play className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              )}
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
                          {completed ? (
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <Play className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                          )}
                        </Link>
                      )})}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 ml-2 mb-4">Nenhuma aula cadastrada neste módulo.</p>
                  )}

                      {moduleQuestions.length > 0 ? (
                        <div className="space-y-2 ml-2">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Atividades</p>
                          {moduleQuestions.map((q, qIndex) => (
                            <button
                              key={q.id}
                              onClick={() => { setSelectedQuestion(q); setSelectedAnswer(null); setAnswered(false) }}
                              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-orange-100 transition-colors group text-left"
                            >
                              <div className="w-8 h-8 bg-orange-100 group-hover:bg-orange-200 rounded-lg flex items-center justify-center text-xs font-medium text-orange-600 flex-shrink-0">
                                {qIndex + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 group-hover:text-orange-600 transition-colors truncate">
                                  {q.question}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <HelpCircle className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 ml-2">Nenhuma atividade cadastrada neste módulo.</p>
                      )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setSelectedQuestion(null); setSelectedAnswer(null); setAnswered(false) }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Questão</h2>
              <button onClick={() => { setSelectedQuestion(null); setSelectedAnswer(null); setAnswered(false) }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{selectedQuestion.question}</p>
              <div className="space-y-2">
                {selectedQuestion.options.map((opt, i) => {
                  const isCorrect = i === selectedQuestion.correctAnswer
                  const isSelected = i === selectedAnswer
                  let bg = 'bg-white border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                  if (answered) {
                    if (isCorrect) bg = 'bg-green-50 border-green-300'
                    else if (isSelected && !isCorrect) bg = 'bg-red-50 border-red-300'
                    else bg = 'bg-gray-50 border-gray-200 opacity-50'
                  } else if (isSelected) {
                    bg = 'bg-orange-50 border-orange-400 ring-2 ring-orange-200'
                  }
                  return (
                    <button key={i} disabled={answered}
                      onClick={() => setSelectedAnswer(i)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${bg}`}>
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        answered && isCorrect ? 'bg-green-500 text-white' :
                        answered && isSelected && !isCorrect ? 'bg-red-500 text-white' :
                        isSelected ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-sm text-gray-700">{opt}</span>
                    </button>
                  )
                })}
              </div>
              {answered && selectedQuestion.gabaritoComentado && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs font-medium text-blue-700 mb-1">Gabarito Comentado</p>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">{selectedQuestion.gabaritoComentado}</p>
                </div>
              )}
              {!answered ? (
                <button onClick={() => setAnswered(true)} disabled={selectedAnswer === null}
                  className="w-full py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                  Confirmar Resposta
                </button>
              ) : (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
                  selectedAnswer === selectedQuestion.correctAnswer
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {selectedAnswer === selectedQuestion.correctAnswer ? (
                    <><CheckCircle className="w-5 h-5" /> Resposta Correta!</>
                  ) : (
                    <>Resposta Incorreta. A alternativa correta é {String.fromCharCode(65 + selectedQuestion.correctAnswer)}.</>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
