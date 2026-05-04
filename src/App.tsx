import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Pending from './pages/Pending'
import DashboardHome from './pages/dashboard/DashboardHome'
import MeusCursos from './pages/dashboard/MeusCursos'
import Cronograma from './pages/dashboard/Cronograma'
import Desempenho from './pages/dashboard/Desempenho'
import Configuracoes from './pages/dashboard/Configuracoes'
import Dashboard from './pages/Dashboard'
import Course from './pages/Course'
import Lesson from './pages/Lesson'
import QuestionBank from './pages/QuestionBank'
import Simulado from './pages/Simulado'
import Teacher from './pages/Teacher'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/pending" element={<Pending />} />
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
          <Route path="lesson/:id" element={<Lesson />} />
          <Route path="questions" element={<QuestionBank />} />
          <Route path="teacher" element={
            <ProtectedRoute roles={['professor']}>
              <Teacher />
            </ProtectedRoute>
          } />
          <Route path="admin" element={
            <ProtectedRoute roles={['admin']}>
              <Admin />
            </ProtectedRoute>
          } />
        </Route>
        <Route path="*" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  )
}
