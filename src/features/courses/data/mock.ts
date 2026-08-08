export interface User {
  id: string
  name: string
  email: string
  role: 'aluno' | 'professor' | 'admin'
  approved?: boolean
  lastLogin?: string
  phone?: string
  cpf?: string
  avatarUrl?: string
}

export interface Course {
  id: string
  title: string
  description: string
  teacherId: string
  price: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  published: boolean
  coverImageUrl?: string
  // Preço promocional fixo no cartão, por curso (substitui o cálculo automático
  // de repasse de taxa quando preenchido). Null/undefined = usa o cálculo padrão.
  cardCashPrice?: number
  card3xPrice?: number
}

export interface Module {
  id: string
  courseId: string
  title: string
  order: number
  teacherId: string
}

export type VideoProvider = 'youtube' | 'bunny'
export type BunnyVideoStatus = 'uploading' | 'processing' | 'ready' | 'error'

export interface Lesson {
  id: string
  moduleId: string
  title: string
  videoUrl: string
  pdfUrl: string
  order: number
  videoProvider: VideoProvider
  bunnyVideoId: string
  videoStatus: BunnyVideoStatus
}

export interface Topic {
  id: string
  moduleId: string
  title: string
}

export interface Institution {
  id: string
  name: string
  createdAt?: string
}

export interface Question {
  id: string
  code: string
  moduleId?: string
  topicId?: string
  lessonId?: string
  question: string
  options: string[]
  correctAnswer: number
  banca?: string
  institutionId?: string
  assunto?: string
  nivel?: string
  ano?: string
  imageUrl?: string
  gabaritoComentado?: string
  aulasRelacionadas?: string[]
  materialUrl?: string
  materialType?: 'image' | 'pdf' | ''
  aulaRelacionada?: string
  questionImageUrl?: string
  optionImages?: (string | undefined)[]
}

export interface QuestionAnswerRecord {
  questionId: string
  correct: boolean
  userId: string
  timestamp: string
}

export interface QuestionStats {
  questionId: string
  answers: Record<number, number>
  total: number
  correct: number
}

export interface Comment {
  id: string
  lessonId?: string
  questionId?: string
  userId: string
  userName: string
  text: string
  createdAt: string
}

export interface Message {
  id: string
  courseId: string
  moduleId?: string
  lessonId?: string
  questionId?: string
  fromUserId: string
  fromUserName: string
  toTeacherId: string
  text: string
  reply?: string
  createdAt: string
  repliedAt?: string
  type?: 'question' | 'price_request' | 'delete_request' | 'publish_request' | 'question_report'
  status?: 'pending' | 'approved' | 'rejected'
  resolvedAt?: string
  targetType?: 'course' | 'module' | 'lesson' | 'question'
  targetName?: string
}

export interface Enrollment {
  id: string
  userId: string
  courseId: string
  progress: number
  completedLessons: string[]
  createdAt: string
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
  { id: 'c1', title: 'Preparatório IFSP', description: 'Curso completo para concursos do IFSP', teacherId: '3', price: 0, status: 'approved', createdAt: '2026-01-15', published: true },
  { id: 'c2', title: 'Preparatório IFMG', description: 'Matemática e Português para IFMG', teacherId: '3', price: 49.90, status: 'approved', createdAt: '2026-02-20', published: true },
]

export const mockModules: Module[] = [
  { id: 'd1', courseId: 'c1', title: 'Matemática', order: 1, teacherId: '3' },
  { id: 'd2', courseId: 'c1', title: 'Português', order: 2, teacherId: '4' },
  { id: 'd3', courseId: 'c2', title: 'Matemática', order: 1, teacherId: '3' },
]

export const mockTopics: Topic[] = [
  { id: 't1', moduleId: 'd1', title: 'Álgebra' },
  { id: 't2', moduleId: 'd1', title: 'Geometria' },
  { id: 't3', moduleId: 'd1', title: 'Aritmética' },
  { id: 't4', moduleId: 'd2', title: 'Morfologia' },
  { id: 't5', moduleId: 'd2', title: 'Sintaxe' },
  { id: 't6', moduleId: 'd2', title: 'Interpretação Textual' },
  { id: 't7', moduleId: 'd3', title: 'Álgebra' },
  { id: 't8', moduleId: 'd3', title: 'Geometria' },
]

export const mockLessons: Lesson[] = [
  { id: 'l1', moduleId: 'd1', title: 'Álgebra Básica', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', pdfUrl: '', order: 1, videoProvider: 'youtube', bunnyVideoId: '', videoStatus: 'ready' },
  { id: 'l2', moduleId: 'd1', title: 'Geometria Plana', videoUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0', pdfUrl: '', order: 2, videoProvider: 'youtube', bunnyVideoId: '', videoStatus: 'ready' },
  { id: 'l3', moduleId: 'd2', title: 'Interpretação de Texto', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', pdfUrl: '', order: 1, videoProvider: 'youtube', bunnyVideoId: '', videoStatus: 'ready' },
]

export const mockQuestions: Question[] = [
  { id: 'q1', code: 'QST-A1B2', moduleId: 'd1', topicId: 't3', question: 'Quanto é 2 + 2?', options: ['3', '4', '5', '6'], correctAnswer: 1, banca: 'IFSP', nivel: 'Técnico', ano: '2024', gabaritoComentado: 'A soma de 2 + 2 é igual a 4, conforme a operação básica de adição.', aulaRelacionada: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { id: 'q2', code: 'QST-C3D4', moduleId: 'd1', topicId: 't3', question: 'Quanto é 5 x 3?', options: ['10', '12', '15', '18'], correctAnswer: 2, banca: 'IFSP', nivel: 'Técnico', ano: '2024', gabaritoComentado: '5 multiplicado por 3 resulta em 15.' },
  { id: 'q3', code: 'QST-E5F6', moduleId: 'd1', topicId: 't1', question: 'Resolva: x² - 4 = 0', options: ['x=±1', 'x=±2', 'x=±3', 'x=±4'], correctAnswer: 1, banca: 'IFMG', nivel: 'Médio', ano: '2023', gabaritoComentado: 'x² = 4 → x = ±2', aulaRelacionada: 'https://www.youtube.com/watch?v=9bZkp7q19f0' },
  { id: 'q4', code: 'QST-G7H8', moduleId: 'd2', topicId: 't4', question: 'Qual a classe gramatical de "bonito"?', options: ['Substantivo', 'Adjetivo', 'Advérbio', 'Verbo'], correctAnswer: 1, banca: 'IFSP', nivel: 'Médio', ano: '2025', gabaritoComentado: '"Bonito" é um adjetivo, pois caracteriza um substantivo.' },
  { id: 'q5', code: 'QST-I9J0', moduleId: 'd2', topicId: 't5', question: 'O pronome relativo "que" pode substituir:', options: ['Apenas pessoas', 'Apenas objetos', 'Pessoas e objetos', 'Apenas lugares'], correctAnswer: 2, banca: 'IFMG', nivel: 'Superior', ano: '2024', gabaritoComentado: 'O pronome relativo "que" pode substituir tanto pessoas quanto objetos.', aulaRelacionada: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', materialUrl: '#', materialType: 'pdf' },
]

export const mockQuestionStats: QuestionStats[] = [
  { questionId: 'q1', answers: { 0: 5, 1: 42, 2: 3, 3: 2 }, total: 52, correct: 42 },
  { questionId: 'q2', answers: { 0: 8, 1: 4, 2: 35, 3: 3 }, total: 50, correct: 35 },
  { questionId: 'q3', answers: { 0: 6, 1: 30, 2: 10, 3: 4 }, total: 50, correct: 30 },
  { questionId: 'q4', answers: { 0: 12, 1: 28, 2: 8, 3: 2 }, total: 50, correct: 28 },
  { questionId: 'q5', answers: { 0: 3, 1: 5, 2: 40, 3: 2 }, total: 50, correct: 40 },
]
