export interface CadernoFilters {
  moduleId: string[]
  topicId: string[]
  banca: string[]
  institutionId: string[]
  cargo: string[]
  nivel: string[]
  ano: string[]
}

export const emptyCadernoFilters = (): CadernoFilters => ({
  moduleId: [], topicId: [], banca: [], institutionId: [], cargo: [], nivel: [], ano: [],
})

export interface Caderno {
  id: string
  userId: string
  title: string
  filters: CadernoFilters
  questionIds: string[]
  createdAt: string
}

export interface CadernoAttempt {
  id: string
  notebookId: string
  userId: string
  answers: Record<string, number>
  currentIndex: number
  startedAt: string
  finishedAt?: string
  timeSpentSeconds: number
}
