import { useState } from 'react'
import { useCourseStore } from '../../courses/data/courseStore'
import { useQuestionStore } from '../../courses/data/questionStore'
import { useAuthStore } from '../../auth/services/authStore'
import { BookOpen, Plus, Video, HelpCircle, Trash2, ArrowLeft, ChevronDown, ChevronRight, FileText } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

export default function TeacherCourseDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const { courses, modules, lessons, addModule, addLesson, deleteModule, deleteLesson, getTeacherName } = useCourseStore()
  const { questions, addQuestion } = useQuestionStore()
  const navigate = useNavigate()

  const course = courses.find(c => c.id === id)
  if (course && course.teacherId !== user?.id) {
    return <p className="text-center py-8 text-red-500">Você não tem permissão para acessar este curso.</p>
  }
  const myModules = modules.filter(m => m.courseId === id)
  const [expandedModule, setExpandedModule] = useState<string | null>(null)

  const [newModule, setNewModule] = useState('')
  const [showModuleForm, setShowModuleForm] = useState(false)

  const [newLesson, setNewLesson] = useState({ moduleId: '', title: '', videoUrl: '', pdfFile: null as File | null })
  const [showLessonForm, setShowLessonForm] = useState(false)

  const [newQuestion, setNewQuestion] = useState<{
    moduleId: string
    question: string
    options: string[]
    correctAnswer: number
    difficulty: 'facil' | 'medio' | 'dificil'
  }>({
    moduleId: '',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    difficulty: 'facil',
  })
  const [showQuestionForm, setShowQuestionForm] = useState(false)

  if (!course) return <p className="text-center py-8">Curso não encontrado</p>

  const handleAddModule = () => {
    if (!newModule || !user) return
    addModule({
      id: Date.now().toString(),
      courseId: course.id,
      title: newModule,
      order: myModules.length + 1,
      teacherId: user.id,
    })
    setNewModule('')
    setShowModuleForm(false)
  }

  const handleAddLesson = () => {
    if (!newLesson.moduleId || !newLesson.title || !newLesson.videoUrl) return
    const pdfUrl = newLesson.pdfFile ? URL.createObjectURL(newLesson.pdfFile) : ''
    addLesson({
      id: Date.now().toString(),
      moduleId: newLesson.moduleId,
      title: newLesson.title,
      videoUrl: newLesson.videoUrl,
      pdfUrl,
      order: lessons.filter(l => l.moduleId === newLesson.moduleId).length + 1,
    })
    setNewLesson({ moduleId: '', title: '', videoUrl: '', pdfFile: null })
    setShowLessonForm(false)
  }

  const handleDeleteModule = (moduleId: string) => {
    if (confirm('Tem certeza que deseja excluir este módulo e todas as suas aulas?')) {
      deleteModule(moduleId)
    }
  }

  const handleDeleteLesson = (lessonId: string) => {
    if (confirm('Tem certeza que deseja excluir esta aula?')) {
      deleteLesson(lessonId)
    }
  }

  const difficultyConfig = {
    facil: { label: 'Fácil', color: 'bg-green-100 text-green-700', icon: '🟢' },
    medio: { label: 'Médio', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
    dificil: { label: 'Difícil', color: 'bg-red-100 text-red-700', icon: '🔴' },
  }

  const handleAddQuestion = () => {
    if (!newQuestion.moduleId || !newQuestion.question || newQuestion.options.some(o => !o)) return
    addQuestion({
      id: Date.now().toString(),
      moduleId: newQuestion.moduleId,
      question: newQuestion.question,
      options: newQuestion.options,
      correctAnswer: newQuestion.correctAnswer,
      difficulty: newQuestion.difficulty,
    })
    setNewQuestion({ moduleId: '', question: '', options: ['', '', '', ''], correctAnswer: 0, difficulty: 'facil' })
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
          <p className="text-sm text-blue-600 mt-1">Professor do curso: {getTeacherName(course.teacherId)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button onClick={() => setShowModuleForm(!showModuleForm)}
          className="p-4 bg-white rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Módulos</p>
              <p className="text-sm text-gray-500">{myModules.length} criados</p>
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
              <p className="text-sm text-gray-500">{lessons.filter(l => myModules.some(m => m.id === l.moduleId)).length} criadas</p>
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
              <p className="text-sm text-gray-500">{questions.filter(q => myModules.some(m => m.id === q.moduleId)).length} criadas</p>
            </div>
          </div>
        </button>
      </div>

      {showModuleForm && (
        <div className="mb-6 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Novo Módulo</h3>
          <input
            value={newModule}
            onChange={e => setNewModule(e.target.value)}
            placeholder="Nome do módulo"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
          />
          <button onClick={handleAddModule} disabled={!newModule}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium">
            Criar Módulo
          </button>
        </div>
      )}

      {showLessonForm && (
        <div className="mb-6 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-3">
          <h3 className="font-bold text-gray-900 mb-2">Nova Aula</h3>
          <select
            value={newLesson.moduleId}
            onChange={e => setNewLesson({ ...newLesson, moduleId: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Selecione o módulo</option>
            {myModules.map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
          <input value={newLesson.title} onChange={e => setNewLesson({ ...newLesson, title: e.target.value })}
            placeholder="Título da aula" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={newLesson.videoUrl} onChange={e => setNewLesson({ ...newLesson, videoUrl: e.target.value })}
            placeholder="URL do vídeo" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 bg-white">
            <input type="file" accept=".pdf" onChange={e => setNewLesson({ ...newLesson, pdfFile: e.target.files?.[0] || null })}
              className="w-full text-sm text-gray-600 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>
          <button onClick={handleAddLesson} disabled={!newLesson.moduleId || !newLesson.title || !newLesson.videoUrl}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium">
            Criar Aula
          </button>
        </div>
      )}

      {showQuestionForm && (
        <div className="mb-6 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-3">
          <h3 className="font-bold text-gray-900 mb-2">Nova Questão</h3>
          <select
            value={newQuestion.moduleId}
            onChange={e => setNewQuestion({ ...newQuestion, moduleId: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Selecione o módulo</option>
            {myModules.map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
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
          <button onClick={handleAddQuestion} disabled={!newQuestion.moduleId || !newQuestion.question || newQuestion.options.some(o => !o)}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium">
            Criar Questão
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Módulos e Conteúdos</h2>
        {myModules.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhum módulo criado ainda.</p>
        ) : (
          <div className="space-y-3">
            {myModules.map(mod => {
              const modLessons = lessons.filter(l => l.moduleId === mod.id)
              const modQuestions = questions.filter(q => q.moduleId === mod.id)
              return (
                <div key={mod.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <button
                    onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{mod.title}</p>
                      <p className="text-sm text-gray-500">{modLessons.length} aulas • {modQuestions.length} questões</p>
                      <p className="text-xs text-blue-600">Professor: {getTeacherName(mod.teacherId)}</p>
                    </div>
                  </button>
                    <div className="flex items-center gap-2">
                      {expandedModule === mod.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <button onClick={() => handleDeleteModule(mod.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {expandedModule === mod.id && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50">
                      {modLessons.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Aulas:</p>
                          {modLessons.map(lesson => (
                            <div key={lesson.id} className="flex items-center gap-2 text-sm text-gray-600 ml-4 mb-1 group">
                              <Video className="w-3 h-3" />
                              <span className="flex-1">{lesson.title}</span>
                              {lesson.pdfUrl && (
                                <a href={lesson.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                                  <FileText className="w-3 h-3" />
                                </a>
                              )}
                              <button onClick={() => handleDeleteLesson(lesson.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-opacity">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {modQuestions.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Questões:</p>
                          {modQuestions.map(q => (
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
