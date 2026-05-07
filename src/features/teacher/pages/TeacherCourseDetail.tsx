import { useState } from 'react'
import { useCourseStore } from '../../courses/data/courseStore'
import { useQuestionStore } from '../../courses/data/questionStore'
import { useAuthStore } from '../../auth/services/authStore'
import { BookOpen, Plus, Video, HelpCircle, Trash2, ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

export default function TeacherCourseDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const { courses, disciplines, lessons, addDiscipline, addLesson } = useCourseStore()
  const { questions, addQuestion } = useQuestionStore()
  const navigate = useNavigate()

  const course = courses.find(c => c.id === id)
  const myDisciplines = disciplines.filter(d => d.courseId === id)
  const [expandedDiscipline, setExpandedDiscipline] = useState<string | null>(null)

  const [newDiscipline, setNewDiscipline] = useState('')
  const [showDisciplineForm, setShowDisciplineForm] = useState(false)

  const [newLesson, setNewLesson] = useState({ disciplineId: '', title: '', videoUrl: '', pdfUrl: '' })
  const [showLessonForm, setShowLessonForm] = useState(false)

  const [newQuestion, setNewQuestion] = useState<{
    disciplineId: string
    question: string
    options: string[]
    correctAnswer: number
    difficulty: 'facil' | 'medio' | 'dificil'
  }>({
    disciplineId: '',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    difficulty: 'facil',
  })
  const [showQuestionForm, setShowQuestionForm] = useState(false)

  if (!course) return <p className="text-center py-8">Curso não encontrado</p>

  const handleAddDiscipline = () => {
    if (!newDiscipline) return
    addDiscipline({
      id: Date.now().toString(),
      courseId: course.id,
      title: newDiscipline,
      order: myDisciplines.length + 1,
    })
    setNewDiscipline('')
    setShowDisciplineForm(false)
  }

  const handleAddLesson = () => {
    if (!newLesson.disciplineId || !newLesson.title || !newLesson.videoUrl) return
    addLesson({
      id: Date.now().toString(),
      disciplineId: newLesson.disciplineId,
      title: newLesson.title,
      videoUrl: newLesson.videoUrl,
      pdfUrl: newLesson.pdfUrl || '#',
      order: lessons.filter(l => l.disciplineId === newLesson.disciplineId).length + 1,
    })
    setNewLesson({ disciplineId: '', title: '', videoUrl: '', pdfUrl: '' })
    setShowLessonForm(false)
  }

  const handleAddQuestion = () => {
    if (!newQuestion.disciplineId || !newQuestion.question || newQuestion.options.some(o => !o)) return
    addQuestion({
      id: Date.now().toString(),
      disciplineId: newQuestion.disciplineId,
      question: newQuestion.question,
      options: newQuestion.options,
      correctAnswer: newQuestion.correctAnswer,
      difficulty: newQuestion.difficulty,
    })
    setNewQuestion({ disciplineId: '', question: '', options: ['', '', '', ''], correctAnswer: 0, difficulty: 'facil' })
    setShowQuestionForm(false)
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/teacher/courses')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-gray-600">{course.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button onClick={() => setShowDisciplineForm(!showDisciplineForm)}
          className="p-4 bg-white rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Disciplinas</p>
              <p className="text-sm text-gray-500">{myDisciplines.length} criadas</p>
            </div>
          </div>
        </button>
        <button onClick={() => setShowLessonForm(!showLessonForm)}
          className="p-4 bg-white rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Aulas</p>
              <p className="text-sm text-gray-500">{lessons.filter(l => myDisciplines.some(d => d.id === l.disciplineId)).length} criadas</p>
            </div>
          </div>
        </button>
        <button onClick={() => setShowQuestionForm(!showQuestionForm)}
          className="p-4 bg-white rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Questões</p>
              <p className="text-sm text-gray-500">{questions.filter(q => myDisciplines.some(d => d.id === q.disciplineId)).length} criadas</p>
            </div>
          </div>
        </button>
      </div>

      {showDisciplineForm && (
        <div className="mb-6 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Nova Disciplina</h3>
          <input
            value={newDiscipline}
            onChange={e => setNewDiscipline(e.target.value)}
            placeholder="Nome da disciplina"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
          />
          <button onClick={handleAddDiscipline} disabled={!newDiscipline}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium">
            Criar Disciplina
          </button>
        </div>
      )}

      {showLessonForm && (
        <div className="mb-6 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-3">
          <h3 className="font-bold text-gray-900 mb-2">Nova Aula</h3>
          <select
            value={newLesson.disciplineId}
            onChange={e => setNewLesson({ ...newLesson, disciplineId: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Selecione a disciplina</option>
            {myDisciplines.map(d => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>
          <input value={newLesson.title} onChange={e => setNewLesson({ ...newLesson, title: e.target.value })}
            placeholder="Título da aula" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={newLesson.videoUrl} onChange={e => setNewLesson({ ...newLesson, videoUrl: e.target.value })}
            placeholder="URL do vídeo" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={newLesson.pdfUrl} onChange={e => setNewLesson({ ...newLesson, pdfUrl: e.target.value })}
            placeholder="URL do PDF (opcional)" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={handleAddLesson} disabled={!newLesson.disciplineId || !newLesson.title || !newLesson.videoUrl}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium">
            Criar Aula
          </button>
        </div>
      )}

      {showQuestionForm && (
        <div className="mb-6 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-3">
          <h3 className="font-bold text-gray-900 mb-2">Nova Questão</h3>
          <select
            value={newQuestion.disciplineId}
            onChange={e => setNewQuestion({ ...newQuestion, disciplineId: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Selecione a disciplina</option>
            {myDisciplines.map(d => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>
          <textarea value={newQuestion.question} onChange={e => setNewQuestion({ ...newQuestion, question: e.target.value })}
            placeholder="Digite a questão" rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          {newQuestion.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${i === newQuestion.correctAnswer ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {String.fromCharCode(97 + i)}
              </span>
              <input value={opt} onChange={e => {
                const opts = [...newQuestion.options]
                opts[i] = e.target.value
                setNewQuestion({ ...newQuestion, options: opts })
              }} placeholder={`Opção ${i + 1}`} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => setNewQuestion({ ...newQuestion, correctAnswer: i })}
                className={`px-3 py-1.5 text-xs rounded-lg ${i === newQuestion.correctAnswer ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {i === newQuestion.correctAnswer ? 'Correta' : 'Marcar'}
              </button>
            </div>
          ))}
          <select value={newQuestion.difficulty} onChange={e => setNewQuestion({ ...newQuestion, difficulty: e.target.value as 'facil' | 'medio' | 'dificil' })}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="facil">Fácil</option>
            <option value="medio">Médio</option>
            <option value="dificil">Difícil</option>
          </select>
          <button onClick={handleAddQuestion} disabled={!newQuestion.disciplineId || !newQuestion.question || newQuestion.options.some(o => !o)}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium">
            Criar Questão
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Disciplinas e Conteúdos</h2>
        {myDisciplines.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhuma disciplina criada ainda.</p>
        ) : (
          <div className="space-y-3">
            {myDisciplines.map(disc => {
              const discLessons = lessons.filter(l => l.disciplineId === disc.id)
              const discQuestions = questions.filter(q => q.disciplineId === disc.id)
              return (
                <div key={disc.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedDiscipline(expandedDiscipline === disc.id ? null : disc.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{disc.title}</p>
                        <p className="text-sm text-gray-500">{discLessons.length} aulas • {discQuestions.length} questões</p>
                      </div>
                    </div>
                    {expandedDiscipline === disc.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {expandedDiscipline === disc.id && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50">
                      {discLessons.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Aulas:</p>
                          {discLessons.map(lesson => (
                            <div key={lesson.id} className="flex items-center gap-2 text-sm text-gray-600 ml-4 mb-1">
                              <Video className="w-3 h-3" />
                              <span>{lesson.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {discQuestions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Questões:</p>
                          {discQuestions.map(q => (
                            <p key={q.id} className="text-sm text-gray-600 ml-4 mb-1">• {q.question}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
