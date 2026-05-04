import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Pending from './pages/Pending'
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
        <Route path="/login" element={<Login />} />
        <Route path="/pending" element={<Pending />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/course/:id" element={
            <ProtectedRoute>
              <Course />
            </ProtectedRoute>
          } />
          <Route path="/lesson/:id" element={
            <ProtectedRoute>
              <Lesson />
            </ProtectedRoute>
          } />
          <Route path="/questions" element={
            <ProtectedRoute>
              <QuestionBank />
            </ProtectedRoute>
          } />
          <Route path="/simulado" element={
            <ProtectedRoute>
              <Simulado />
            </ProtectedRoute>
          } />
          <Route path="/teacher" element={
            <ProtectedRoute roles={['professor']}>
              <Teacher />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <Admin />
            </ProtectedRoute>
          } />
        </Route>
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}
