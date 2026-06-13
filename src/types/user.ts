import type { Role } from './auth'

export type AuthProvider = 'PHONE' | 'GOOGLE' | 'APPLE'

export interface AppUser {
  id: string
  phone: string | null
  email: string | null
  fullName: string | null
  avatarUrl: string | null
  authProvider: AuthProvider
  role: Role
  isActive: boolean
  createdAt: string
  updatedAt: string
}
