import { useState } from 'react'
import { useCourseStore } from '../../courses/data/courseStore'
import { useQuestionStore } from '../../courses/data/questionStore'
import { useAuthStore } from '../../auth/services/authStore'
import { useTeacherSimuladoStore } from '../data/teacherSimuladoStore'
import { BookOpen, Plus, Clock, Save, Trash2, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Course, Module, Question } from '../../courses/data/mock'
import Breadcrumb from '../../../shared/components/Breadcrumb'

function ConfirmModal({ open, onClose, onConfirm, title, message }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm">Cancelar</button>
          <button onClick={() => { onConfirm(); onClose() }} className="px-4 py-2.5 text-white rounded-xl transition-colors font-medium text-sm bg-red-600 hover:bg-red-700">Excluir</button>
        </div>
      </div>
    </div>
  )
}

export default function TeacherSimulados() {
  const { user } = useAuthStore()
  const { courses, modules } = useCourseStore()
  const { questions } = useQuestionStore()
  const { addSimulado, deleteSimulado, simulados } = useTeacherSimuladoStore()
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

  const myCourses: Course[] = courses.filter((c: Course) => c.teacherId === user?.id)
  const myModules: Module[] = modules.filter((m: Module) => myCourses.some((c: Course) => c.id === m.courseId))
  const myQuestions: Question[] = questions.filter((q: Question) => myModules.some((m: Module) => m.id === q.moduleId))

  const mySimulados = simulados.filter(s => s.teacherId === user?.id)

  const [showCreate, setShowCreate] = useState(false)
  const [simuladoTitle, setSimuladoTitle] = useState('')
  const [selectedModule, setSelectedModule] = useState('')
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [timeLimit, setTimeLimit] = useState(30)

  const availableQuestions = selectedModule
    ? questions.filter(q => q.moduleId === selectedModule && myModules.some(m => m.id === q.moduleId))
    : myQuestions

  const toggleQuestion = (id: string) => {
    if (selectedQuestions.includes(id)) {
      setSelectedQuestions(selectedQuestions.filter(q => q !== id))
    } else {
      setSelectedQuestions([...selectedQuestions, id])
    }
  }

  const handleCreate = () => {
    if (!simuladoTitle || selectedQuestions.length === 0 || !user) return
    addSimulado({
      title: simuladoTitle,
      teacherId: user.id,
      moduleId: selectedModule || undefined,
      questionIds: selectedQuestions,
      timeLimit,
    })
    setSimuladoTitle('')
    setSelectedQuestions([])
    setSelectedModule('')
    setShowCreate(false)
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <Breadcrumb items={[{ label: 'Simulados' }]} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Simulados</h1>
          <p className="text-gray-600">Crie simulados personalizados para seus alunos</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Novo Simulado
        </button>
      </div>

      {showCreate && (
        <div className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Criar Novo Simulado</h2>

          <div className="space-y-4 mb-6">
            <input
              value={simuladoTitle}
              onChange={e => setSimuladoTitle(e.target.value)}
              placeholder="Título do simulado"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Módulo</label>
                <select
                  value={selectedModule}
                  onChange={e => {
                    setSelectedModule(e.target.value)
                    setSelectedQuestions([])
                  }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Todos os meus módulos</option>
                  {myModules.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tempo (minutos)</label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={e => setTimeLimit(Number(e.target.value))}
                  min={10}
                  max={180}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Questões selecionadas: {selectedQuestions.length}
              </label>
              <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-xl p-3">
                {availableQuestions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Nenhuma questão disponível. Crie questões primeiro.</p>
                ) : (
                  availableQuestions.map(q => (
                    <div
                      key={q.id}
                      onClick={() => toggleQuestion(q.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedQuestions.includes(q.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 ${
                          selectedQuestions.includes(q.id)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedQuestions.includes(q.id) && (
                            <svg className="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{q.question}</p>

                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={!simuladoTitle || selectedQuestions.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            >
              <Save className="w-4 h-4" />
              Criar Simulado
            </button>
            <button
              onClick={() => {
                setShowCreate(false)
                setSimuladoTitle('')
                setSelectedQuestions([])
              }}
              className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Simulados Criados</h2>
        {mySimulados.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhum simulado criado ainda. Clique em "Novo Simulado" para começar.
          </p>
        ) : (
          <div className="space-y-3">
            {mySimulados.map(sim => (
              <div key={sim.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{sim.title}</p>
                  <p className="text-sm text-gray-500">
                    {sim.questionIds.length} questões • {sim.timeLimit} min
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(sim.createdAt).toLocaleDateString('pt-BR')}
                </span>
                <button
                  onClick={() => setDeleteTarget({ id: sim.id, title: sim.title })}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir simulado"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) deleteSimulado(deleteTarget.id) }}
        title="Excluir simulado"
        message={`Tem certeza que deseja excluir o simulado "${deleteTarget?.title}"? Essa ação não pode ser desfeita.`}
      />
    </div>
  )
}
