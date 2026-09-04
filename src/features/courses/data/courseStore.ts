import { create } from 'zustand'
import { mockCourses, mockModules, mockLessons, mockTopics, mockUsers } from './mock'
import type { Course, Module, Lesson, Topic, Enrollment, Comment, Message, User } from './mock'
import { supabase, isSupabaseConfigured } from '../../../lib/supabase'
import { generateId } from '../../../lib/id'
import { useQuestionStore } from './questionStore'

const QUESTION_BANK_TITLE = 'banco de questoes'

const normalizeTitle = (title: string) => {
  let result = ''
  for (const ch of title.trim().toLowerCase().normalize('NFD')) {
    const code = ch.codePointAt(0) || 0
    if (code < 0x300 || code > 0x36f) result += ch
  }
  return result
}

export const isQuestionBankCourse = (course: Course) => normalizeTitle(course.title) === QUESTION_BANK_TITLE

export const getQuestionBankCourse = (courses: Course[]) => courses.find(isQuestionBankCourse)

export const isEnrollmentExpired = (enrollment: Enrollment | undefined): boolean =>
  !!enrollment?.expiresAt && new Date(enrollment.expiresAt) <= new Date()

export const hasQuestionBankAccess = (
  user: { id: string; role: string } | null,
  courses: Course[],
  getEnrollment: (userId: string, courseId: string) => Enrollment | undefined
): boolean => {
  if (!user) return false
  if (user.role !== 'aluno') return true
  const course = getQuestionBankCourse(courses)
  if (!course) return false
  const enrollment = getEnrollment(user.id, course.id)
  if (!enrollment) return false
  return !isEnrollmentExpired(enrollment)
}

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
  supabaseReady: boolean
  addCourse: (course: Course) => void
  approveCourse: (courseId: string) => void
  rejectCourse: (courseId: string) => void
  updateCoursePrice: (courseId: string, price: number) => void
  adminUpdateCoursePrice: (courseId: string, price: number) => void
  updateCourseCover: (courseId: string, coverImageUrl: string) => void
  addModule: (module: Module) => void
  addLesson: (lesson: Lesson) => Promise<string | null>
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
  askQuestionDoubt: (params: { questionId: string; moduleId: string; questionCode?: string; fromUserId: string; fromUserName: string; text: string }) => void
  getTeacherName: (teacherId: string) => string
  requestCoursePrice: (courseId: string, teacherName: string) => void
  requestContentDeletion: (params: { courseId: string; moduleId?: string; lessonId?: string; teacherName: string; targetType: 'course' | 'module' | 'lesson' | 'question'; targetName: string }) => void
  requestCoursePublish: (courseId: string, teacherName: string) => void
  adminSetCoursePrice: (courseId: string, price: number, messageId: string) => void
  adminApprovePublish: (messageId: string, courseId: string) => void
  adminApproveDeletion: (messageId: string) => void
  adminRejectRequest: (messageId: string) => void
  adminResolveReport: (messageId: string) => void
  loadFromSupabase: () => Promise<void>
}

export const useCourseStore = create<CourseState>((set, get) => {
  if (isSupabaseConfigured()) {
    const tables = [
      { key: 'courses', table: 'courses' as const },
      { key: 'modules', table: 'modules' as const },
      { key: 'lessons', table: 'lessons' as const },
      { key: 'topics', table: 'topics' as const },
      { key: 'enrollments', table: 'enrollments' as const },
      { key: 'comments', table: 'comments' as const },
      { key: 'messages', table: 'messages' as const },
    ] as const

    Promise.all(
      tables.map(async ({ key, table }) => {
        const { data } = await supabase.from(table).select('*')
        if (data && data.length > 0) {
          return { key, data: data.map((r: any) => mapRowToModel(key, r)) }
        }
        return null
      })
    ).then((results) => {
      const updates: Record<string, any> = { supabaseReady: true }
      for (const r of results) {
        if (r) updates[r.key] = r.data
      }
      set(updates as any)
    })
  }

  return {
  courses: initData('courses', mockCourses),
  modules: initData('modules', mockModules),
  lessons: initData('lessons', mockLessons),
  topics: initData('topics', mockTopics),
  enrollments: initData('enrollments', []),
  comments: initData('comments', []),
  messages: initData('messages', []),
  users: initData('users', mockUsers),
  supabaseReady: false,

  addCourse: (course) => {
    const courses = [...get().courses, course]
    set({ courses })
    if (isSupabaseConfigured()) {
      supabase.from('courses').insert({
        id: course.id,
        title: course.title,
        description: course.description,
        teacher_id: course.teacherId,
        price: course.price,
        status: course.status,
        published: course.published,
        created_at: course.createdAt,
      }).then(({ error }) => { if (error) console.error('Erro ao salvar course no Supabase:', error) })
    }
  },

  approveCourse: (courseId) => {
    const courses = get().courses.map(c =>
      c.id === courseId ? { ...c, status: 'approved' as const } : c
    )
    set({ courses })
    if (isSupabaseConfigured()) {
      supabase.from('courses').update({ status: 'approved' }).eq('id', courseId)
        .then(({ error }) => { if (error) console.error(error) })
    }
  },

  rejectCourse: (courseId) => {
    const courses = get().courses.map(c =>
      c.id === courseId ? { ...c, status: 'rejected' as const } : c
    )
    set({ courses })
    if (isSupabaseConfigured()) {
      supabase.from('courses').update({ status: 'rejected' }).eq('id', courseId)
        .then(({ error }) => { if (error) console.error(error) })
    }
  },

  updateCoursePrice: (courseId, price) => {
    const courses = get().courses.map(c =>
      c.id === courseId
        ? { ...c, price, status: (c.status === 'approved' ? 'pending' : c.status) as Course['status'] }
        : c
    )
    set({ courses })
    if (isSupabaseConfigured()) {
      supabase.from('courses').update({
        price,
        status: get().courses.find(c => c.id === courseId)?.status === 'approved' ? 'pending' : undefined,
      }).eq('id', courseId).then(({ error }) => { if (error) console.error(error) })
    }
  },

  adminUpdateCoursePrice: (courseId, price) => {
    const courses = get().courses.map(c =>
      c.id === courseId ? { ...c, price } : c
    )
    set({ courses })
    if (isSupabaseConfigured()) {
      supabase.from('courses').update({ price }).eq('id', courseId)
        .then(({ error }) => { if (error) console.error(error) })
    }
  },

  updateCourseCover: (courseId, coverImageUrl) => {
    const courses = get().courses.map(c =>
      c.id === courseId ? { ...c, coverImageUrl } : c
    )
    set({ courses })
    if (isSupabaseConfigured()) {
      supabase.from('courses').update({ cover_image_url: coverImageUrl }).eq('id', courseId)
        .then(({ error }) => { if (error) console.error(error) })
    }
  },

  addModule: (module) => {
    const modules = [...get().modules, module]
    set({ modules })
    if (isSupabaseConfigured()) {
      supabase.from('modules').insert({
        id: module.id,
        course_id: module.courseId,
        title: module.title,
        order_index: module.order,
        teacher_id: module.teacherId,
      }).then(({ error }) => { if (error) console.error(error) })
    }
  },

  addLesson: async (lesson) => {
    const lessons = [...get().lessons, lesson]
    set({ lessons })
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('lessons').insert({
        id: lesson.id,
        module_id: lesson.moduleId,
        title: lesson.title,
        video_url: lesson.videoUrl,
        pdf_url: lesson.pdfUrl,
        order_index: lesson.order,
        video_provider: lesson.videoProvider,
        bunny_video_id: lesson.bunnyVideoId,
        video_status: lesson.videoStatus,
      })
      if (error) {
        console.error(error)
        return error.message
      }
    }
    return null
  },

  deleteCourse: (courseId) => {
    const modules = get().modules.filter(m => m.courseId !== courseId)
    const modIds = modules.map(m => m.id)
    const lessons = get().lessons.filter(l => !modIds.includes(l.moduleId))
    const topics = get().topics.filter(t => !modIds.includes(t.moduleId))
    const courses = get().courses.filter(c => c.id !== courseId)
    set({ courses, modules, lessons, topics })
    if (isSupabaseConfigured()) {
      supabase.from('courses').delete().eq('id', courseId)
        .then(({ error }) => { if (error) console.error(error) })
    }
  },

  deleteModule: (moduleId) => {
    const modules = get().modules.filter(m => m.id !== moduleId)
    const lessons = get().lessons.filter(l => l.moduleId !== moduleId)
    const topics = get().topics.filter(t => t.moduleId !== moduleId)
    set({ modules, lessons, topics })
    if (isSupabaseConfigured()) {
      supabase.from('modules').delete().eq('id', moduleId)
        .then(({ error }) => { if (error) console.error(error) })
    }
  },

  deleteLesson: (lessonId) => {
    const lesson = get().lessons.find(l => l.id === lessonId)
    const lessons = get().lessons.filter(l => l.id !== lessonId)
    set({ lessons })
    if (isSupabaseConfigured()) {
      supabase.from('lessons').delete().eq('id', lessonId)
        .then(({ error }) => { if (error) console.error(error) })
      if (lesson?.videoProvider === 'bunny' && lesson.bunnyVideoId) {
        supabase.functions.invoke('bunny-delete-video', { body: { videoId: lesson.bunnyVideoId } })
          .catch(err => console.error('Erro ao apagar vídeo no Bunny:', err))
      }
    }
  },

  updateModule: (id, data) => {
    const modules = get().modules.map(m => m.id === id ? { ...m, ...data } : m)
    set({ modules })
    if (isSupabaseConfigured()) {
      const updateData: any = {}
      if (data.title !== undefined) updateData.title = data.title
      if (data.order !== undefined) updateData.order_index = data.order
      supabase.from('modules').update(updateData).eq('id', id)
        .then(({ error }) => { if (error) console.error(error) })
    }
  },

  updateLesson: (id, data) => {
    const lessons = get().lessons.map(l => l.id === id ? { ...l, ...data } : l)
    set({ lessons })
    if (isSupabaseConfigured()) {
      const updateData: any = {}
      if (data.title !== undefined) updateData.title = data.title
      if (data.videoUrl !== undefined) updateData.video_url = data.videoUrl
      if (data.pdfUrl !== undefined) updateData.pdf_url = data.pdfUrl
      if (data.order !== undefined) updateData.order_index = data.order
      if (data.videoProvider !== undefined) updateData.video_provider = data.videoProvider
      if (data.bunnyVideoId !== undefined) updateData.bunny_video_id = data.bunnyVideoId
      if (data.videoStatus !== undefined) updateData.video_status = data.videoStatus
      supabase.from('lessons').update(updateData).eq('id', id)
        .then(({ error }) => { if (error) console.error(error) })
    }
  },

  addTopic: (topic) => {
    const topics = [...get().topics, topic]
    set({ topics })
    if (isSupabaseConfigured()) {
      supabase.from('topics').insert({
        id: topic.id,
        module_id: topic.moduleId,
        title: topic.title,
      }).then(({ error }) => { if (error) console.error(error) })
    }
  },

  deleteTopic: (topicId) => {
    const topics = get().topics.filter(t => t.id !== topicId)
    set({ topics })
    if (isSupabaseConfigured()) {
      supabase.from('topics').delete().eq('id', topicId)
        .then(({ error }) => { if (error) console.error(error) })
    }
  },

  updateTopic: (id, data) => {
    const topics = get().topics.map(t => t.id === id ? { ...t, ...data } : t)
    set({ topics })
    if (isSupabaseConfigured()) {
      supabase.from('topics').update({ title: data.title }).eq('id', id)
        .then(({ error }) => { if (error) console.error(error) })
    }
  },

  enroll: (enrollment) => {
    const enrollments = [...get().enrollments, { ...enrollment, createdAt: enrollment.createdAt || new Date().toISOString() }]
    set({ enrollments })
    if (isSupabaseConfigured()) {
      supabase.from('enrollments').insert({
        id: enrollment.id,
        user_id: enrollment.userId,
        course_id: enrollment.courseId,
        progress: enrollment.progress,
        completed_lessons: enrollment.completedLessons,
        created_at: enrollment.createdAt || new Date().toISOString(),
      }).then(({ error }) => { if (error) console.error('Erro ao salvar matrícula no Supabase:', error) })
    }
  },

  completeLesson: (userId, courseId, lessonId) => {
    const enrollments = get().enrollments
    let enrollment = enrollments.find(e => e.userId === userId && e.courseId === courseId)

    if (!enrollment) {
      enrollment = { id: generateId(), userId, courseId, progress: 0, completedLessons: [], createdAt: new Date().toISOString() }
      enrollments.push(enrollment)
    }

    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId)
    }

    const courseLessons = get().lessons.filter(l =>
      get().modules.filter(m => m.courseId === courseId).some(m => m.id === l.moduleId)
    )
    enrollment.progress = Math.round((enrollment.completedLessons.length / courseLessons.length) * 100)

    set({ enrollments: [...enrollments] })

    if (isSupabaseConfigured()) {
      supabase.from('enrollments').upsert({
        id: enrollment.id,
        user_id: userId,
        course_id: courseId,
        progress: enrollment.progress,
        completed_lessons: enrollment.completedLessons,
        created_at: enrollment.createdAt,
      }, { onConflict: 'user_id,course_id' }).then(({ error }) => { if (error) console.error(error) })
    }
  },

  getEnrollment: (userId, courseId) => {
    // Só conta como acesso ativo: não bloqueada pelo admin (revokedAt) e dentro
    // do prazo (expiresAt). A linha continua no banco quando expira/bloqueia
    // para preservar o progresso caso o acesso seja renovado.
    const enrollment = get().enrollments.find(e => e.userId === userId && e.courseId === courseId)
    if (!enrollment || enrollment.revokedAt || isEnrollmentExpired(enrollment)) return undefined
    return enrollment
  },

  addMessage: (message) => {
    const messages = [...get().messages, message]
    set({ messages })
    if (isSupabaseConfigured()) {
      supabase.from('messages').insert({
        id: message.id,
        course_id: message.courseId,
        module_id: message.moduleId ?? null,
        lesson_id: message.lessonId ?? null,
        question_id: message.questionId ?? null,
        from_user_id: message.fromUserId,
        from_user_name: message.fromUserName,
        to_teacher_id: message.toTeacherId,
        text: message.text,
        type: message.type ?? null,
        status: message.status ?? 'pending',
        target_type: message.targetType ?? null,
        target_name: message.targetName ?? null,
        created_at: message.createdAt,
      }).then(({ error }) => { if (error) console.error(error) })
    }
  },

  replyMessage: (messageId, reply) => {
    const messages = get().messages.map(m =>
      m.id === messageId ? { ...m, reply, repliedAt: new Date().toISOString() } : m
    )
    set({ messages })
    if (isSupabaseConfigured()) {
      supabase.from('messages').update({
        reply,
        replied_at: new Date().toISOString(),
      }).eq('id', messageId).then(({ error }) => { if (error) console.error(error) })
    }
  },

  askQuestionDoubt: ({ questionId, moduleId, questionCode, fromUserId, fromUserName, text }) => {
    const mod = get().modules.find(m => m.id === moduleId)
    const course = get().courses.find(c => c.id === mod?.courseId)
    if (!course) return
    const message: Message = {
      id: generateId(),
      courseId: course.id,
      moduleId: mod?.id,
      questionId,
      fromUserId,
      fromUserName,
      toTeacherId: course.teacherId,
      text,
      createdAt: new Date().toISOString(),
      type: 'question',
      status: 'pending',
      targetType: 'question',
      targetName: `Questão ${questionCode ?? questionId}`,
    }
    get().addMessage(message)
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
      id: generateId(),
      courseId,
      fromUserId: course.teacherId,
      fromUserName: teacherName,
      toTeacherId: admin.id,
      text: `O professor ${teacherName} criou o curso "${course.title}" e aguarda a definição do preço.`,
      createdAt: new Date().toISOString(),
      type: 'price_request',
      status: 'pending',
    }
    get().addMessage(message)
  },

  requestContentDeletion: ({ courseId, moduleId, lessonId, teacherName, targetType, targetName }) => {
    const admin = get().users.find(u => u.role === 'admin')
    const course = get().courses.find(c => c.id === courseId)
    if (!admin || !course) return
    const typeLabel = { course: 'curso', module: 'módulo', lesson: 'aula', question: 'questão' }[targetType]
    const message: Message = {
      id: generateId(),
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
    get().addMessage(message)
  },

  requestCoursePublish: (courseId, teacherName) => {
    const admin = get().users.find(u => u.role === 'admin')
    const course = get().courses.find(c => c.id === courseId)
    if (!admin || !course) return
    const message: Message = {
      id: generateId(),
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
    get().addMessage(message)
  },

  adminSetCoursePrice: (courseId, price, messageId) => {
    const courses = get().courses.map(c =>
      c.id === courseId ? { ...c, price, status: 'approved' as const, published: false } : c
    )
    const messages = get().messages.map(m =>
      m.id === messageId ? { ...m, status: 'approved' as const, resolvedAt: new Date().toISOString() } : m
    )
    set({ courses, messages })
    if (isSupabaseConfigured()) {
      supabase.from('courses').update({ price, status: 'approved' }).eq('id', courseId)
        .then(({ error }) => { if (error) console.error(error) })
      supabase.from('messages').update({ status: 'approved', resolved_at: new Date().toISOString() }).eq('id', messageId)
        .then(({ error }) => { if (error) console.error(error) })
    }
  },

  adminApprovePublish: (messageId, courseId) => {
    const courses = get().courses.map(c =>
      c.id === courseId ? { ...c, published: true } : c
    )
    const messages = get().messages.map(m =>
      m.id === messageId ? { ...m, status: 'approved' as const, resolvedAt: new Date().toISOString() } : m
    )
    set({ courses, messages })
    if (isSupabaseConfigured()) {
      supabase.from('courses').update({ published: true }).eq('id', courseId)
        .then(({ error }) => { if (error) console.error(error) })
      supabase.from('messages').update({ status: 'approved', resolved_at: new Date().toISOString() }).eq('id', messageId)
        .then(({ error }) => { if (error) console.error(error) })
    }
  },

  adminApproveDeletion: (messageId) => {
    const msg = get().messages.find(m => m.id === messageId)
    if (!msg) return
    const messages = get().messages.map(m =>
      m.id === messageId ? { ...m, status: 'approved' as const, resolvedAt: new Date().toISOString() } : m
    )
    let updates: Partial<ReturnType<typeof get>> = { messages }

    if (msg.targetType === 'question') {
      const { questions, approveQuestionDeletion } = useQuestionStore.getState()
      const q = questions.find(q => q.code === msg.targetName?.replace('Questão #', '') || q.id === msg.targetName?.replace('Questão #', ''))
      approveQuestionDeletion(q?.id || '', messageId).catch(console.error)
      set({ messages })
      return
    }

    if (msg.targetType === 'course') {
      const courses = get().courses.filter(c => c.id !== msg.courseId)
      const modules = get().modules.filter(m => m.courseId !== msg.courseId)
      const modIds = modules.map(m => m.id)
      const lessons = get().lessons.filter(l => !modIds.includes(l.moduleId))
      updates = { ...updates, courses, modules, lessons }
    } else if (msg.targetType === 'module' && msg.moduleId) {
      const modules = get().modules.filter(m => m.id !== msg.moduleId)
      const lessons = get().lessons.filter(l => l.moduleId !== msg.moduleId)
      const topics = get().topics.filter(t => t.moduleId !== msg.moduleId)
      updates = { ...updates, modules, lessons, topics }
    } else if (msg.targetType === 'lesson' && msg.lessonId) {
      const lessons = get().lessons.filter(l => l.id !== msg.lessonId)
      updates = { ...updates, lessons }
    }

    set(updates as any)

    if (isSupabaseConfigured()) {
      supabase.from('messages').update({ status: 'approved', resolved_at: new Date().toISOString() }).eq('id', messageId)
        .then(({ error }) => { if (error) console.error(error) })
    }
  },

  adminRejectRequest: (messageId) => {
    const messages = get().messages.map(m =>
      m.id === messageId ? { ...m, status: 'rejected' as const, resolvedAt: new Date().toISOString() } : m
    )
    set({ messages })
    if (isSupabaseConfigured()) {
      supabase.from('messages').update({ status: 'rejected', resolved_at: new Date().toISOString() }).eq('id', messageId)
        .then(({ error }) => { if (error) console.error(error) })
    }
  },

  adminResolveReport: (messageId) => {
    const messages = get().messages.map(m =>
      m.id === messageId ? { ...m, status: 'approved' as const, resolvedAt: new Date().toISOString() } : m
    )
    set({ messages })
    if (isSupabaseConfigured()) {
      supabase.from('messages').update({ status: 'approved', resolved_at: new Date().toISOString() }).eq('id', messageId)
        .then(({ error }) => { if (error) console.error(error) })
    }
  },

  loadFromSupabase: async () => {
    if (!isSupabaseConfigured()) return

    const tables = [
      { key: 'courses', table: 'courses' as const },
      { key: 'modules', table: 'modules' as const },
      { key: 'lessons', table: 'lessons' as const },
      { key: 'topics', table: 'topics' as const },
      { key: 'enrollments', table: 'enrollments' as const },
      { key: 'comments', table: 'comments' as const },
      { key: 'messages', table: 'messages' as const },
    ] as const

    for (const { key, table } of tables) {
      const { data } = await supabase.from(table).select('*')
      if (data && data.length > 0) {
        const mapped = data.map((r: any) => mapRowToModel(key, r))
        set({ [key]: mapped } as any)
      }
    }

    set({ supabaseReady: true })
  },
}
})

function mapRowToModel(key: string, row: any): any {
  switch (key) {
    case 'courses':
      return {
        id: row.id,
        title: row.title,
        description: row.description ?? '',
        teacherId: row.teacher_id,
        price: row.price ?? 0,
        status: row.status ?? 'pending',
        createdAt: row.created_at ?? '',
        published: row.published ?? false,
        coverImageUrl: row.cover_image_url ?? '',
        cardCashPrice: row.card_cash_price ?? undefined,
        card3xPrice: row.card_3x_price ?? undefined,
      }
    case 'modules':
      return {
        id: row.id,
        courseId: row.course_id,
        title: row.title,
        order: row.order_index,
        teacherId: row.teacher_id,
      }
    case 'lessons':
      return {
        id: row.id,
        moduleId: row.module_id,
        title: row.title,
        videoUrl: row.video_url ?? '',
        pdfUrl: row.pdf_url ?? '',
        order: row.order_index,
        videoProvider: row.video_provider ?? 'youtube',
        bunnyVideoId: row.bunny_video_id ?? '',
        videoStatus: row.video_status ?? 'ready',
      }
    case 'topics':
      return {
        id: row.id,
        moduleId: row.module_id,
        title: row.title,
      }
    case 'enrollments':
      return {
        id: row.id,
        userId: row.user_id,
        courseId: row.course_id,
        progress: row.progress ?? 0,
        completedLessons: row.completed_lessons ?? [],
        createdAt: row.created_at ?? '',
        expiresAt: row.expires_at ?? undefined,
        revokedAt: row.revoked_at ?? undefined,
        source: row.source ?? undefined,
      }
    case 'comments':
      return {
        id: row.id,
        lessonId: row.lesson_id,
        userId: row.user_id,
        userName: row.user_name,
        text: row.text,
        createdAt: row.created_at ?? '',
      }
    case 'messages':
      return {
        id: row.id,
        courseId: row.course_id,
        moduleId: row.module_id,
        lessonId: row.lesson_id,
        questionId: row.question_id,
        fromUserId: row.from_user_id,
        fromUserName: row.from_user_name,
        toTeacherId: row.to_teacher_id,
        text: row.text,
        reply: row.reply,
        createdAt: row.created_at ?? '',
        repliedAt: row.replied_at,
        type: row.type,
        status: row.status,
        resolvedAt: row.resolved_at,
        targetType: row.target_type,
        targetName: row.target_name,
      }
    default:
      return row
  }
}
