import { http } from '@/api/client'
import type { Paginated, PaginationMeta } from '@/types/api'
import type { Sale } from '@/types/sale'

export interface SalesResult {
  items: Sale[]
  meta?: PaginationMeta
}

function isPaginated(d: unknown): d is Paginated<Sale> {
  return (
    !!d &&
    typeof d === 'object' &&
    Array.isArray((d as { items?: unknown }).items)
  )
}

/** GET /admin/sales — Swagger typed emas; massiv ham, paginatsiya ham kelishi mumkin. */
export async function listSales(params: {
  page?: number
  limit?: number
}): Promise<SalesResult> {
  const data = await http.get<unknown>('/admin/sales', { params })
  if (Array.isArray(data)) return { items: data as Sale[] }
  if (isPaginated(data)) return { items: data.items, meta: data.meta }
  return { items: [] }
}
