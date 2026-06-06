import { create } from 'zustand'
import { mockCourses, mockModules, mockLessons, mockTopics, mockUsers } from './mock'
import type { Course, Module, Lesson, Topic, Enrollment, Comment, Message, User } from './mock'

const initData = <T>(key: string, mockData: T[]): T[] => {
  if (key === 'modules') {
    const oldData = localStorage.getItem('disciplines')
    if (oldData) {
      const migrated = JSON.parse(oldData).map((item: any) => ({
        ...item,
        moduleId: item.disciplineId || item.id,
      }))
      localStorage.setItem('modules', JSON.stringify(migrated))
      localStorage.removeItem('disciplines')
      return migrated as T[]
    }
  }

  const saved = localStorage.getItem(key)
  if (!saved) {
    localStorage.setItem(key, JSON.stringify(mockData))
    return mockData
  }
  const data = JSON.parse(saved)

  if (key === 'lessons' && data.length > 0 && 'disciplineId' in data[0]) {
    const migrated = data.map((item: any) => ({
      ...item,
      moduleId: item.disciplineId,
    }))
    localStorage.setItem(key, JSON.stringify(migrated))
    return migrated as T[]
  }

  if (key === 'messages' && data.length > 0 && 'disciplineId' in data[0]) {
    const migrated = data.map((item: any) => ({
      ...item,
      moduleId: item.disciplineId,
    }))
    localStorage.setItem(key, JSON.stringify(migrated))
    return migrated as T[]
  }

  return data
}

interface CourseState {
  courses: Course[]
  modules: Module[]
  lessons: Lesson[]
  topics: Topic[]
  enrollments: Enrollment[]
  comments: Comment[]
  messages: Message[]
  users: User[]
  addCourse: (course: Course) => void
  approveCourse: (courseId: string) => void
  rejectCourse: (courseId: string) => void
  updateCoursePrice: (courseId: string, price: number) => void
  addModule: (module: Module) => void
  addLesson: (lesson: Lesson) => void
  deleteCourse: (courseId: string) => void
  deleteModule: (moduleId: string) => void
  deleteLesson: (lessonId: string) => void
  updateModule: (id: string, data: Partial<Module>) => void
  updateLesson: (id: string, data: Partial<Lesson>) => void
  addTopic: (topic: Topic) => void
  deleteTopic: (topicId: string) => void
  updateTopic: (id: string, data: Partial<Topic>) => void
  enroll: (enrollment: Enrollment) => void
  completeLesson: (userId: string, courseId: string, lessonId: string) => void
  getEnrollment: (userId: string, courseId: string) => Enrollment | undefined
  addMessage: (message: Message) => void
  replyMessage: (messageId: string, reply: string) => void
  getTeacherName: (teacherId: string) => string
  requestCoursePrice: (courseId: string, teacherName: string) => void
  requestContentDeletion: (params: { courseId: string; moduleId?: string; lessonId?: string; teacherName: string; targetType: 'course' | 'module' | 'lesson' | 'question'; targetName: string }) => void
  requestCoursePublish: (courseId: string, teacherName: string) => void
  adminSetCoursePrice: (courseId: string, price: number, messageId: string) => void
  adminApprovePublish: (messageId: string, courseId: string) => void
  adminApproveDeletion: (messageId: string) => void
  adminRejectRequest: (messageId: string) => void
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: initData('courses', mockCourses),
  modules: initData('modules', mockModules),
  lessons: initData('lessons', mockLessons),
  topics: initData('topics', mockTopics),
  enrollments: initData('enrollments', []),
  comments: initData('comments', []),
  messages: initData('messages', []),
  users: initData('users', mockUsers),

  addCourse: (course) => {
    const courses = [...get().courses, course]
    localStorage.setItem('courses', JSON.stringify(courses))
    set({ courses })
  },

  approveCourse: (courseId) => {
    const courses = get().courses.map(c =>
      c.id === courseId ? { ...c, status: 'approved' as const } : c
    )
    localStorage.setItem('courses', JSON.stringify(courses))
    set({ courses })
  },

  rejectCourse: (courseId) => {
    const courses = get().courses.map(c =>
      c.id === courseId ? { ...c, status: 'rejected' as const } : c
    )
    localStorage.setItem('courses', JSON.stringify(courses))
    set({ courses })
  },

  updateCoursePrice: (courseId, price) => {
    const courses = get().courses.map(c =>
      c.id === courseId
        ? { ...c, price, status: (c.status === 'approved' ? 'pending' : c.status) as Course['status'] }
        : c
    )
    localStorage.setItem('courses', JSON.stringify(courses))
    set({ courses })
  },

  addModule: (module) => {
    const modules = [...get().modules, module]
    localStorage.setItem('modules', JSON.stringify(modules))
    set({ modules })
  },

  addLesson: (lesson) => {
    const lessons = [...get().lessons, lesson]
    localStorage.setItem('lessons', JSON.stringify(lessons))
    set({ lessons })
  },

  deleteCourse: (courseId) => {
    const courses = get().courses.filter(c => c.id !== courseId)
    const modules = get().modules.filter(m => m.courseId !== courseId)
    const modIds = modules.map(m => m.id)
    const lessons = get().lessons.filter(l => !modIds.includes(l.moduleId))
    const topics = get().topics.filter(t => !modIds.includes(t.moduleId))
    localStorage.setItem('courses', JSON.stringify(courses))
    localStorage.setItem('modules', JSON.stringify(modules))
    localStorage.setItem('lessons', JSON.stringify(lessons))
    localStorage.setItem('topics', JSON.stringify(topics))
    set({ courses, modules, lessons, topics })
  },

  deleteModule: (moduleId) => {
    const modules = get().modules.filter(m => m.id !== moduleId)
    const lessons = get().lessons.filter(l => l.moduleId !== moduleId)
    const topics = get().topics.filter(t => t.moduleId !== moduleId)
    localStorage.setItem('modules', JSON.stringify(modules))
    localStorage.setItem('lessons', JSON.stringify(lessons))
    localStorage.setItem('topics', JSON.stringify(topics))
    set({ modules, lessons, topics })
  },

  deleteLesson: (lessonId) => {
    const lessons = get().lessons.filter(l => l.id !== lessonId)
    localStorage.setItem('lessons', JSON.stringify(lessons))
    set({ lessons })
  },

  updateModule: (id, data) => {
    const modules = get().modules.map(m => m.id === id ? { ...m, ...data } : m)
    localStorage.setItem('modules', JSON.stringify(modules))
    set({ modules })
  },

  updateLesson: (id, data) => {
    const lessons = get().lessons.map(l => l.id === id ? { ...l, ...data } : l)
    localStorage.setItem('lessons', JSON.stringify(lessons))
    set({ lessons })
  },

  addTopic: (topic) => {
    const topics = [...get().topics, topic]
    localStorage.setItem('topics', JSON.stringify(topics))
    set({ topics })
  },

  deleteTopic: (topicId) => {
    const topics = get().topics.filter(t => t.id !== topicId)
    localStorage.setItem('topics', JSON.stringify(topics))
    set({ topics })
  },

  updateTopic: (id, data) => {
    const topics = get().topics.map(t => t.id === id ? { ...t, ...data } : t)
    localStorage.setItem('topics', JSON.stringify(topics))
    set({ topics })
  },

  enroll: (enrollment) => {
    const enrollments = [...get().enrollments, { ...enrollment, createdAt: enrollment.createdAt || new Date().toISOString() }]
    localStorage.setItem('enrollments', JSON.stringify(enrollments))
    set({ enrollments })
  },

  completeLesson: (userId, courseId, lessonId) => {
    const enrollments = get().enrollments
    let enrollment = enrollments.find(e => e.userId === userId && e.courseId === courseId)

    if (!enrollment) {
      enrollment = { id: Date.now().toString(), userId, courseId, progress: 0, completedLessons: [], createdAt: new Date().toISOString() }
      enrollments.push(enrollment)
    }

    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId)
    }

    const courseLessons = get().lessons.filter(l =>
      get().modules.filter(m => m.courseId === courseId).some(m => m.id === l.moduleId)
    )
    enrollment.progress = Math.round((enrollment.completedLessons.length / courseLessons.length) * 100)

    localStorage.setItem('enrollments', JSON.stringify(enrollments))
    set({ enrollments: [...enrollments] })
  },

  getEnrollment: (userId, courseId) => {
    return get().enrollments.find(e => e.userId === userId && e.courseId === courseId)
  },

  addMessage: (message) => {
    const messages = [...get().messages, message]
    localStorage.setItem('messages', JSON.stringify(messages))
    set({ messages })
  },

  replyMessage: (messageId, reply) => {
    const messages = get().messages.map(m =>
      m.id === messageId ? { ...m, reply, repliedAt: new Date().toISOString() } : m
    )
    localStorage.setItem('messages', JSON.stringify(messages))
    set({ messages })
  },

  getTeacherName: (teacherId) => {
    const user = get().users.find(u => u.id === teacherId)
    return user ? user.name : 'Professor'
  },

  requestCoursePrice: (courseId, teacherName) => {
    const admin = get().users.find(u => u.role === 'admin')
    const course = get().courses.find(c => c.id === courseId)
    if (!admin || !course) return
    const message: Message = {
      id: Date.now().toString(),
      courseId,
      fromUserId: course.teacherId,
      fromUserName: teacherName,
      toTeacherId: admin.id,
      text: `O professor ${teacherName} criou o curso "${course.title}" e aguarda a definição do preço.`,
      createdAt: new Date().toISOString(),
      type: 'price_request',
      status: 'pending',
    }
    const messages = [...get().messages, message]
    localStorage.setItem('messages', JSON.stringify(messages))
    set({ messages })
  },

  requestContentDeletion: ({ courseId, moduleId, lessonId, teacherName, targetType, targetName }) => {
    const admin = get().users.find(u => u.role === 'admin')
    const course = get().courses.find(c => c.id === courseId)
    if (!admin || !course) return
    const typeLabel = { course: 'curso', module: 'módulo', lesson: 'aula', question: 'questão' }[targetType]
    const message: Message = {
      id: Date.now().toString(),
      courseId,
      moduleId,
      lessonId,
      fromUserId: course.teacherId,
      fromUserName: teacherName,
      toTeacherId: admin.id,
      text: `O professor ${teacherName} solicita a exclusão do ${typeLabel} "${targetName}" do curso "${course.title}".`,
      createdAt: new Date().toISOString(),
      type: 'delete_request',
      status: 'pending',
      targetType,
      targetName,
    }
    const messages = [...get().messages, message]
    localStorage.setItem('messages', JSON.stringify(messages))
    set({ messages })
  },

  requestCoursePublish: (courseId, teacherName) => {
    const admin = get().users.find(u => u.role === 'admin')
    const course = get().courses.find(c => c.id === courseId)
    if (!admin || !course) return
    const message: Message = {
      id: Date.now().toString(),
      courseId,
      fromUserId: course.teacherId,
      fromUserName: teacherName,
      toTeacherId: admin.id,
      text: `O professor ${teacherName} solicita a publicação do curso "${course.title}" (R$ ${course.price.toFixed(2)}).`,
      createdAt: new Date().toISOString(),
      type: 'publish_request',
      status: 'pending',
      targetType: 'course',
      targetName: course.title,
    }
    const messages = [...get().messages, message]
    localStorage.setItem('messages', JSON.stringify(messages))
    set({ messages })
  },

  adminSetCoursePrice: (courseId, price, messageId) => {
    const courses = get().courses.map(c =>
      c.id === courseId ? { ...c, price, status: 'approved' as const, published: false } : c
    )
    const messages = get().messages.map(m =>
      m.id === messageId ? { ...m, status: 'approved' as const, resolvedAt: new Date().toISOString() } : m
    )
    localStorage.setItem('courses', JSON.stringify(courses))
    localStorage.setItem('messages', JSON.stringify(messages))
    set({ courses, messages })
  },

  adminApprovePublish: (messageId, courseId) => {
    const courses = get().courses.map(c =>
      c.id === courseId ? { ...c, published: true } : c
    )
    const messages = get().messages.map(m =>
      m.id === messageId ? { ...m, status: 'approved' as const, resolvedAt: new Date().toISOString() } : m
    )
    localStorage.setItem('courses', JSON.stringify(courses))
    localStorage.setItem('messages', JSON.stringify(messages))
    set({ courses, messages })
  },

  adminApproveDeletion: (messageId) => {
    const msg = get().messages.find(m => m.id === messageId)
    if (!msg) return
    const messages = get().messages.map(m =>
      m.id === messageId ? { ...m, status: 'approved' as const, resolvedAt: new Date().toISOString() } : m
    )
    localStorage.setItem('messages', JSON.stringify(messages))
    let updates: Partial<ReturnType<typeof get>> = { messages }

    if (msg.targetType === 'course') {
      const courses = get().courses.filter(c => c.id !== msg.courseId)
      const modules = get().modules.filter(m => m.courseId !== msg.courseId)
      const modIds = modules.map(m => m.id)
      const lessons = get().lessons.filter(l => !modIds.includes(l.moduleId))
      localStorage.setItem('courses', JSON.stringify(courses))
      localStorage.setItem('modules', JSON.stringify(modules))
      localStorage.setItem('lessons', JSON.stringify(lessons))
      updates = { ...updates, courses, modules, lessons }
    } else if (msg.targetType === 'module' && msg.moduleId) {
      const modules = get().modules.filter(m => m.id !== msg.moduleId)
      const lessons = get().lessons.filter(l => l.moduleId !== msg.moduleId)
      const topics = get().topics.filter(t => t.moduleId !== msg.moduleId)
      localStorage.setItem('modules', JSON.stringify(modules))
      localStorage.setItem('lessons', JSON.stringify(lessons))
      localStorage.setItem('topics', JSON.stringify(topics))
      updates = { ...updates, modules, lessons, topics }
    } else if (msg.targetType === 'lesson' && msg.lessonId) {
      const lessons = get().lessons.filter(l => l.id !== msg.lessonId)
      localStorage.setItem('lessons', JSON.stringify(lessons))
      updates = { ...updates, lessons }
    }

    set(updates as any)
  },

  adminRejectRequest: (messageId) => {
    const messages = get().messages.map(m =>
      m.id === messageId ? { ...m, status: 'rejected' as const, resolvedAt: new Date().toISOString() } : m
    )
    localStorage.setItem('messages', JSON.stringify(messages))
    set({ messages })
  },
}))
