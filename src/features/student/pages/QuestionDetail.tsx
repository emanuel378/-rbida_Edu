import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuestionStore } from '../../courses/data/questionStore'
import { useAuthStore } from '../../auth/services/authStore'
import { useCourseStore, hasQuestionBankAccess } from '../../courses/data/courseStore'
import QuestionCard from '../components/QuestionCard'
import Breadcrumb from '../../../shared/components/Breadcrumb'
import { ArrowLeft, HelpCircle } from 'lucide-react'

export default function QuestionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { questions } = useQuestionStore()
  const { user } = useAuthStore()
  const { courses, getEnrollment } = useCourseStore()

  const canAccess = hasQuestionBankAccess(user, courses, getEnrollment)

  useEffect(() => {
    if (!canAccess) navigate('/dashboard/questions', { replace: true })
  }, [canAccess, navigate])

  const question = questions.find(q => q.id === id)

  if (!canAccess) return null

  if (!question) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: 'Banco de Questões', to: '/dashboard/questions' }, { label: 'Questão' }]} />
        <div className="text-center py-20">
          <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Questão não encontrada</p>
          <button onClick={() => navigate('/dashboard/questions')} className="mt-4 text-blue-600 hover:underline text-sm">
            Voltar ao Banco de Questões
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <Breadcrumb items={[
        { label: 'Banco de Questões', to: '/dashboard/questions' },
        { label: `Questão ${question.code || ''}` },
      ]} />

      <button
        onClick={() => navigate('/dashboard/questions')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao Banco de Questões
      </button>

      <QuestionCard question={question} />
    </div>
  )
}
