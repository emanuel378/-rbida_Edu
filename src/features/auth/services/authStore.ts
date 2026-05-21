import { create } from 'zustand'
import { mockUsers, type User } from '../../courses/data/mock'

const initUsers = () => {
  const saved = localStorage.getItem('users')
  if (!saved) {
    localStorage.setItem('users', JSON.stringify(mockUsers))
    return mockUsers
  }
  return JSON.parse(saved)
}

interface AuthState {
  user: User | null
  users: User[]
  login: (user: User) => void
  logout: () => void
  approveTeacher: (userId: string) => void
  loadUsers: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })(),
  users: initUsers(),

  login: (user) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const updated = users.map((u: User) => u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u)
    localStorage.setItem('users', JSON.stringify(updated))
    localStorage.setItem('user', JSON.stringify({ ...user, lastLogin: new Date().toISOString() }))
    set({ user: { ...user, lastLogin: new Date().toISOString() }, users: updated })
  },

  logout: () => {
    localStorage.removeItem('user')
    set({ user: null })
  },

  approveTeacher: (userId) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const updated = users.map((u: User) => u.id === userId ? { ...u, approved: true } : u)
    localStorage.setItem('users', JSON.stringify(updated))
    set({ users: updated })
  },

  loadUsers: () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    set({ users })
  },
}))
