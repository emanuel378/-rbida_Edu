export interface User {
  id: string
  name: string
  email: string
  role: 'aluno' | 'professor' | 'admin'
  approved?: boolean
}

export interface Course {
  id: string
  title: string
  description: string
  teacherId: string
  createdAt: string
}

export interface Discipline {
  id: string
  courseId: string
  title: string
  order: number
}

export interface Lesson {
  id: string
  disciplineId: string
  title: string
  videoUrl: string
  pdfUrl: string
  order: number
}

export interface Question {
  id: string
  disciplineId: string
  question: string
  options: string[]
  correctAnswer: number
  difficulty: 'facil' | 'medio' | 'dificil'
}

export interface Comment {
  id: string
  lessonId: string
  userId: string
  userName: string
  text: string
  createdAt: string
}

export interface Enrollment {
  id: string
  userId: string
  courseId: string
  progress: number
  completedLessons: string[]
}

export interface SimuladoResult {
  userId: string
  userName: string
  score: number
  total: number
  date: string
}

export const mockUsers: User[] = [
  { id: '1', name: 'Ana Aluna', email: 'ana@email.com', role: 'aluno' },
  { id: '2', name: 'Bruno Aluno', email: 'bruno@email.com', role: 'aluno' },
  { id: '3', name: 'Carlos Professor', email: 'carlos@email.com', role: 'professor', approved: true },
  { id: '4', name: 'Daniela Prof', email: 'daniela@email.com', role: 'professor', approved: false },
  { id: '5', name: 'Eduardo Admin', email: 'eduardo@email.com', role: 'admin' },
]

export const mockCourses: Course[] = [
  { id: 'c1', title: 'Preparatório IFSP', description: 'Curso completo para concursos do IFSP', teacherId: '3', createdAt: '2026-01-15' },
  { id: 'c2', title: 'Preparatório IFMG', description: 'Matemática e Português para IFMG', teacherId: '3', createdAt: '2026-02-20' },
]

export const mockDisciplines: Discipline[] = [
  { id: 'd1', courseId: 'c1', title: 'Matemática', order: 1 },
  { id: 'd2', courseId: 'c1', title: 'Português', order: 2 },
  { id: 'd3', courseId: 'c2', title: 'Matemática', order: 1 },
]

export const mockLessons: Lesson[] = [
  { id: 'l1', disciplineId: 'd1', title: 'Álgebra Básica', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', pdfUrl: '#', order: 1 },
  { id: 'l2', disciplineId: 'd1', title: 'Geometria Plana', videoUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0', pdfUrl: '#', order: 2 },
  { id: 'l3', disciplineId: 'd2', title: 'Interpretação de Texto', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', pdfUrl: '#', order: 1 },
]

export const mockQuestions: Question[] = [
  { id: 'q1', disciplineId: 'd1', question: 'Quanto é 2 + 2?', options: ['3', '4', '5', '6'], correctAnswer: 1, difficulty: 'facil' },
  { id: 'q2', disciplineId: 'd1', question: 'Quanto é 5 x 3?', options: ['10', '12', '15', '18'], correctAnswer: 2, difficulty: 'facil' },
  { id: 'q3', disciplineId: 'd1', question: 'Resolva: x² - 4 = 0', options: ['x=±1', 'x=±2', 'x=±3', 'x=±4'], correctAnswer: 1, difficulty: 'medio' },
  { id: 'q4', disciplineId: 'd2', question: 'Qual a classe gramatical de "bonito"?', options: ['Substantivo', 'Adjetivo', 'Advérbio', 'Verbo'], correctAnswer: 1, difficulty: 'facil' },
  { id: 'q5', disciplineId: 'd2', question: 'O pronome relativo "que" pode substituir:', options: ['Apenas pessoas', 'Apenas objetos', 'Pessoas e objetos', 'Apenas lugares'], correctAnswer: 2, difficulty: 'medio' },
]
