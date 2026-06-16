import { http } from '@/api/client'
import type { AppUser } from '@/types/user'

/** Foydalanuvchiga to'lovsiz obuna biriktirish (admin grant). */
export function grantSubscription(userId: string, planId: string): Promise<unknown> {
  return http.post(`/admin/users/${userId}/subscription`, { planId })
}

function isItemsWrapper(d: unknown): d is { items: AppUser[] } {
  return !!d && typeof d === 'object' && Array.isArray((d as { items?: unknown }).items)
}

/**
 * GET /admin/users — Swagger massiv deydi, lekin backend `{ items, meta }`
 * (paginatsiya) qaytarishi mumkin. Ikkala shaklni ham massivga keltiramiz.
 */
export async function listUsers(search?: string): Promise<AppUser[]> {
  const data = await http.get<unknown>('/admin/users', {
    params: { search: search || undefined },
  })
  if (Array.isArray(data)) return data as AppUser[]
  if (isItemsWrapper(data)) return data.items
  return []
}
