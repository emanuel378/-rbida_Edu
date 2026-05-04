import { useState } from 'react'
import { useCourseStore } from '../store/courseStore'
import { useQuestionStore } from '../store/questionStore'
import { useAuthStore } from '../store/authStore'
import { BookOpen, Plus, Trash2, Video, FileText, HelpCircle, Check, X } from 'lucide-react'

export default function Teacher() {
  const { user } = useAuthStore()
  const { courses, addCourse, disciplines, addDiscipline, lessons, addLesson } = useCourseStore()
  const { questions, addQuestion } = useQuestionStore()

  const myCourses = courses.filter(c => c.teacherId === user?.id)

  const [newCourse, setNewCourse] = useState({ title: '', description: '' })
  const [newDiscipline, setNewDiscipline] = useState({ courseId: '', title: '' })
  const [newLesson, setNewLesson] = useState({ disciplineId: '', title: '', videoUrl: '', pdfUrl: '#' })
  const [newQuestion, setNewQuestion] = useState({
    disciplineId: '',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    difficulty: 'facil' as 'facil' | 'medio' | 'dificil',
  })
  const [activeTab, setActiveTab] = useState<'courses' | 'disciplines' | 'lessons' | 'questions'>('courses')

  const handleAddCourse = () => {
    if (!user || !newCourse.title) return
    addCourse({
      id: Date.now().toString(),
      title: newCourse.title,
      description: newCourse.description,
      teacherId: user.id,
      createdAt: new Date().toISOString(),
    })
    setNewCourse({ title: '', description: '' })
  }

  const handleAddDiscipline = () => {
    if (!newDiscipline.courseId || !newDiscipline.title) return
    addDiscipline({
      id: Date.now().toString(),
      courseId: newDiscipline.courseId,
      title: newDiscipline.title,
      order: disciplines.filter(d => d.courseId === newDiscipline.courseId).length + 1,
    })
    setNewDiscipline({ courseId: '', title: '' })
  }

  const handleAddLesson = () => {
    if (!newLesson.disciplineId || !newLesson.title || !newLesson.videoUrl) return
    addLesson({
      id: Date.now().toString(),
      disciplineId: newLesson.disciplineId,
      title: newLesson.title,
      videoUrl: newLesson.videoUrl,
      pdfUrl: newLesson.pdfUrl,
      order: lessons.filter(l => l.disciplineId === newLesson.disciplineId).length + 1,
    })
    setNewLesson({ disciplineId: '', title: '', videoUrl: '', pdfUrl: '#' })
  }

  const handleAddQuestion = () => {
    if (!newQuestion.disciplineId || !newQuestion.question || newQuestion.options.some(o => !o)) return
    addQuestion({
      id: Date.now().toString(),
      ...newQuestion,
    })
    setNewQuestion({ disciplineId: '', question: '', options: ['', '', '', ''], correctAnswer: 0, difficulty: 'facil' })
  }

  const tabs = [
    { id: 'courses' as const, label: 'Cursos', icon: BookOpen, count: myCourses.length },
    { id: 'disciplines' as const, label: 'Disciplinas', icon: BookOpen, count: disciplines.filter(d => myCourses.some(c => c.id === d.courseId)).length },
    { id: 'lessons' as const, label: 'Aulas', icon: Video, count: lessons.filter(l => disciplines.some(d => d.id === l.disciplineId && myCourses.some(c => c.id === d.courseId))).length },
    { id: 'questions' as const, label: 'Questões', icon: HelpCircle, count: questions.filter(q => disciplines.some(d => d.id === q.disciplineId && myCourses.some(c => c.id === d.courseId))).length },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel do Professor</h1>
        <p className="text-gray-600">Gerencie seus cursos e conteúdos</p>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {activeTab === 'courses' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Criar Novo Curso
          </h2>
          <div className="space-y-4">
            <input
              value={newCourse.title}
              onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
              placeholder="Título do curso"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={newCourse.description}
              onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
              placeholder="Descrição do curso"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              onClick={handleAddCourse}
              disabled={!newCourse.title}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Criar Curso
            </button>
          </div>

          {myCourses.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">Meus Cursos</h3>
              <div className="space-y-3">
                {myCourses.map(course => (
                  <div key={course.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{course.title}</p>
                      <p className="text-sm text-gray-500">{course.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'disciplines' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Criar Nova Disciplina
          </h2>
          <div className="space-y-4">
            <select
              value={newDiscipline.courseId}
              onChange={e => setNewDiscipline({ ...newDiscipline, courseId: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Selecione o curso</option>
              {myCourses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <input
              value={newDiscipline.title}
              onChange={e => setNewDiscipline({ ...newDiscipline, title: e.target.value })}
              placeholder="Título da disciplina"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddDiscipline}
              disabled={!newDiscipline.courseId || !newDiscipline.title}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Criar Disciplina
            </button>
          </div>
        </div>
      )}

      {activeTab === 'lessons' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-600" />
            Criar Nova Aula
          </h2>
          <div className="space-y-4">
            <select
              value={newLesson.disciplineId}
              onChange={e => setNewLesson({ ...newLesson, disciplineId: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Selecione a disciplina</option>
              {disciplines.filter(d => myCourses.some(c => c.id === d.courseId)).map(d => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
            <input
              value={newLesson.title}
              onChange={e => setNewLesson({ ...newLesson, title: e.target.value })}
              placeholder="Título da aula"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              value={newLesson.videoUrl}
              onChange={e => setNewLesson({ ...newLesson, videoUrl: e.target.value })}
              placeholder="URL do vídeo (YouTube)"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              value={newLesson.pdfUrl}
              onChange={e => setNewLesson({ ...newLesson, pdfUrl: e.target.value })}
              placeholder="URL do PDF (opcional)"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddLesson}
              disabled={!newLesson.disciplineId || !newLesson.title || !newLesson.videoUrl}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Criar Aula
            </button>
          </div>
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            Criar Nova Questão
          </h2>
          <div className="space-y-4">
            <select
              value={newQuestion.disciplineId}
              onChange={e => setNewQuestion({ ...newQuestion, disciplineId: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Selecione a disciplina</option>
              {disciplines.filter(d => myCourses.some(c => c.id === d.courseId)).map(d => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>
            <textarea
              value={newQuestion.question}
              onChange={e => setNewQuestion({ ...newQuestion, question: e.target.value })}
              placeholder="Digite a questão..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {newQuestion.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  i === newQuestion.correctAnswer ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {String.fromCharCode(97 + i)}
                </span>
                <input
                  value={opt}
                  onChange={e => {
                    const opts = [...newQuestion.options]
                    opts[i] = e.target.value
                    setNewQuestion({ ...newQuestion, options: opts })
                  }}
                  placeholder={`Opção ${i + 1}`}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setNewQuestion({ ...newQuestion, correctAnswer: i })}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    i === newQuestion.correctAnswer
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {i === newQuestion.correctAnswer ? <Check className="w-3 h-3" /> : 'Correta'}
                </button>
              </div>
            ))}
            <div className="flex gap-3">
              <select
                value={newQuestion.difficulty}
                onChange={e => setNewQuestion({ ...newQuestion, difficulty: e.target.value as 'facil' | 'medio' | 'dificil' })}
                className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="facil">🟢 Fácil</option>
                <option value="medio">🟡 Médio</option>
                <option value="dificil">🔴 Difícil</option>
              </select>
              <button
                onClick={handleAddQuestion}
                disabled={!newQuestion.disciplineId || !newQuestion.question || newQuestion.options.some(o => !o)}
                className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Criar Questão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
