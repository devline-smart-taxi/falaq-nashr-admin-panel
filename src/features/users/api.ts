import { http, httpMsg } from '@/api/client'
import type { Paginated, PaginationParams } from '@/types/api'
import type { AppUser } from '@/types/user'

/** Foydalanuvchiga to'lovsiz obuna biriktirish (admin grant). Backend xabarini qaytaradi. */
export function grantSubscription(userId: string, planId: string): Promise<string> {
  return httpMsg
    .post<null>(`/admin/users/${userId}/subscription`, { planId })
    .then((r) => r.message)
}

function isPaginated(d: unknown): d is Paginated<AppUser> {
  return !!d && typeof d === 'object' && Array.isArray((d as { items?: unknown }).items)
}

/**
 * GET /admin/users — server-side paginatsiya ({ items, meta }). Backend eski
 * massiv shaklида ham qaytarsa, Paginated shaklga o'raymiz (meta'siz).
 */
export async function listUsers(params: PaginationParams): Promise<Paginated<AppUser>> {
  const data = await http.get<unknown>('/admin/users', { params })
  if (isPaginated(data)) return data
  const items = Array.isArray(data) ? (data as AppUser[]) : []
  return {
    items,
    meta: {
      total: items.length,
      page: params.page ?? 1,
      limit: params.limit ?? (items.length || 1),
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  }
}
