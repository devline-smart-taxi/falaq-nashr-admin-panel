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
  /** Foydalanuvchida hozir faol (to'langan yoki admin bergan) obuna bormi. */
  hasActiveSubscription?: boolean
  createdAt: string
  updatedAt: string
}
