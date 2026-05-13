import { create } from 'zustand'
import { mockCourses, mockModules, mockLessons, mockUsers } from './mock'
import type { Course, Module, Lesson, Enrollment, Comment, Message, User } from './mock'

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
  enrollments: Enrollment[]
  comments: Comment[]
  messages: Message[]
  users: User[]
  addCourse: (course: Course) => void
  addModule: (module: Module) => void
  addLesson: (lesson: Lesson) => void
  deleteCourse: (courseId: string) => void
  deleteModule: (moduleId: string) => void
  deleteLesson: (lessonId: string) => void
  enroll: (enrollment: Enrollment) => void
  completeLesson: (userId: string, courseId: string, lessonId: string) => void
  getEnrollment: (userId: string, courseId: string) => Enrollment | undefined
  addMessage: (message: Message) => void
  replyMessage: (messageId: string, reply: string) => void
  getTeacherName: (teacherId: string) => string
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: initData('courses', mockCourses),
  modules: initData('modules', mockModules),
  lessons: initData('lessons', mockLessons),
  enrollments: initData('enrollments', []),
  comments: initData('comments', []),
  messages: initData('messages', []),
  users: initData('users', mockUsers),

  addCourse: (course) => {
    const courses = [...get().courses, course]
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
    localStorage.setItem('courses', JSON.stringify(courses))
    localStorage.setItem('modules', JSON.stringify(modules))
    localStorage.setItem('lessons', JSON.stringify(lessons))
    set({ courses, modules, lessons })
  },

  deleteModule: (moduleId) => {
    const modules = get().modules.filter(m => m.id !== moduleId)
    const lessons = get().lessons.filter(l => l.moduleId !== moduleId)
    localStorage.setItem('modules', JSON.stringify(modules))
    localStorage.setItem('lessons', JSON.stringify(lessons))
    set({ modules, lessons })
  },

  deleteLesson: (lessonId) => {
    const lessons = get().lessons.filter(l => l.id !== lessonId)
    localStorage.setItem('lessons', JSON.stringify(lessons))
    set({ lessons })
  },

  enroll: (enrollment) => {
    const enrollments = [...get().enrollments, enrollment]
    localStorage.setItem('enrollments', JSON.stringify(enrollments))
    set({ enrollments })
  },

  completeLesson: (userId, courseId, lessonId) => {
    const enrollments = get().enrollments
    let enrollment = enrollments.find(e => e.userId === userId && e.courseId === courseId)

    if (!enrollment) {
      enrollment = { id: Date.now().toString(), userId, courseId, progress: 0, completedLessons: [] }
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
}))
