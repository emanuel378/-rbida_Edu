import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { ProtectedRoute, AppLayout } from './shared'
import { Landing } from './features/landing'
import { Login, Pending } from './features/auth'
import { DashboardHome, MeusCursos, Cronograma, Desempenho, Configuracoes, StudentQuestionBank, QuestionDetail } from './features/student'
import { Course, Lesson, QuestionBank, QuestionBrowser, QuestionGeneratorAI, CourseMessages } from './features/courses'
import { Simulado } from './features/simulado'
import { TeacherDashboard, TeacherCourses, TeacherCourseDetail, TeacherSimulados, TeacherMessages } from './features/teacher'
import { Admin, AdminAnalytics, AdminMessages, AdminInstitutions } from './features/admin'
import { useQuestionStore } from './features/courses/data/questionStore'
import { useInstitutionStore } from './features/courses/data/institutionStore'
import { useTeacherSimuladoStore } from './features/teacher/data/teacherSimuladoStore'

export default function App() {
  const loadQuestions = useQuestionStore(s => s.loadQuestions)
  const loadAnswerHistory = useQuestionStore(s => s.loadAnswerHistory)
  const loadInstitutions = useInstitutionStore(s => s.loadInstitutions)
  const loadSimulados = useTeacherSimuladoStore(s => s.loadFromSupabase)

  useEffect(() => {
    loadQuestions().catch(() => {})
    loadAnswerHistory()
    loadInstitutions()
    loadSimulados()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login defaultSignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/pending" element={<Pending />} />

        {/* Rotas do Aluno */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="cursos" element={<MeusCursos />} />
          <Route path="simulados" element={<Simulado />} />
          <Route path="cronograma" element={<Cronograma />} />
          <Route path="desempenho" element={<Desempenho />} />
          <Route path="configuracoes" element={<Configuracoes />} />
          <Route path="course/:id" element={<Course />} />
          <Route path="course/:id/messages" element={<CourseMessages />} />
          <Route path="lesson/:id" element={<Lesson />} />
          <Route path="question/:id" element={<QuestionDetail />} />
          <Route path="questions" element={<StudentQuestionBank />} />
        </Route>

        {/* Rotas do Professor */}
        <Route path="/teacher" element={
          <ProtectedRoute roles={['professor', 'admin']}>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<TeacherDashboard />} />
          <Route path="courses" element={<TeacherCourses />} />
          <Route path="course/:id" element={<TeacherCourseDetail />} />
          <Route path="questions" element={<QuestionBank />} />
          <Route path="questions/editar" element={<QuestionBank />} />
          <Route path="question-bank" element={<QuestionBrowser />} />
          <Route path="question-generator" element={<QuestionGeneratorAI />} />
          <Route path="messages" element={<TeacherMessages />} />
          <Route path="simulados" element={<TeacherSimulados />} />
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>

        {/* Rotas do Admin */}
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Admin />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="institutions" element={<AdminInstitutions />} />
          <Route path="questions" element={<QuestionBank />} />
          <Route path="questions/editar" element={<QuestionBank />} />
          <Route path="question-bank" element={<QuestionBrowser />} />
          <Route path="question-generator" element={<QuestionGeneratorAI />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>

        <Route path="*" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  )
}