import { createCrudApi } from '@/lib/crud'
import type { AppUser } from '@/types/user'

export interface CreateAdminInput {
  email: string
  password: string
  fullName: string
  isActive?: boolean
}

export interface UpdateAdminInput {
  fullName?: string
  password?: string
  isActive?: boolean
}

// Faqat ADMIN rolidagilarni o'zgartirish mumkin — SUPER_ADMIN himoyalangan (backend 403).
export const adminsApi = createCrudApi<AppUser, CreateAdminInput, UpdateAdminInput>({
  basePath: '/admin/admins',
})
