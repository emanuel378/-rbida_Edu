import { create } from 'zustand'
import { mockCourses, mockDisciplines, mockLessons } from './mock'
import type { Course, Discipline, Lesson, Enrollment } from './mock'

const initData = <T>(key: string, mockData: T[]): T[] => {
  const saved = localStorage.getItem(key)
  if (!saved) {
    localStorage.setItem(key, JSON.stringify(mockData))
    return mockData
  }
  return JSON.parse(saved)
}

interface CourseState {
  courses: Course[]
  disciplines: Discipline[]
  lessons: Lesson[]
  enrollments: Enrollment[]
  addCourse: (course: Course) => void
  addDiscipline: (discipline: Discipline) => void
  addLesson: (lesson: Lesson) => void
  enroll: (enrollment: Enrollment) => void
  completeLesson: (userId: string, courseId: string, lessonId: string) => void
  getEnrollment: (userId: string, courseId: string) => Enrollment | undefined
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: initData('courses', mockCourses),
  disciplines: initData('disciplines', mockDisciplines),
  lessons: initData('lessons', mockLessons),
  enrollments: initData('enrollments', []),

  addCourse: (course) => {
    const courses = [...get().courses, course]
    localStorage.setItem('courses', JSON.stringify(courses))
    set({ courses })
  },

  addDiscipline: (discipline) => {
    const disciplines = [...get().disciplines, discipline]
    localStorage.setItem('disciplines', JSON.stringify(disciplines))
    set({ disciplines })
  },

  addLesson: (lesson) => {
    const lessons = [...get().lessons, lesson]
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
      get().disciplines.filter(d => d.courseId === courseId).some(d => d.id === l.disciplineId)
    )
    enrollment.progress = Math.round((enrollment.completedLessons.length / courseLessons.length) * 100)

    localStorage.setItem('enrollments', JSON.stringify(enrollments))
    set({ enrollments: [...enrollments] })
  },

  getEnrollment: (userId, courseId) => {
    return get().enrollments.find(e => e.userId === userId && e.courseId === courseId)
  },
}))
