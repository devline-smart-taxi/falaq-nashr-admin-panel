import { http } from '@/api/client'
import type { Paginated, PaginationParams } from '@/types/api'

export interface CrudApi<T, C, U> {
  list: (params?: PaginationParams) => Promise<Paginated<T>>
  get: (id: string) => Promise<T>
  create: (input: C) => Promise<T>
  update: (id: string, input: U) => Promise<T>
  remove: (id: string) => Promise<void>
  /** Rasm yuklash — yozuv yaratilgach/ olingach (multipart `file`). */
  uploadImage?: (id: string, file: File) => Promise<T>
}

interface CreateCrudOptions {
  /** Masalan `/authors`. */
  basePath: string
  /** Rasm endpoint segmenti: `photo` | `icon` | `cover` → `/authors/:id/photo`. */
  imageSegment?: string
  /** Ro'yxat boshqa yo'lда bo'lsa (masalan `/banners/admin`). Default `basePath`. */
  listPath?: string
  /** GET ro'yxat paginatsiyasiz massiv qaytarsa — Paginated shaklga o'raydi. */
  listIsArray?: boolean
}

function wrapArray<T>(items: T[]): Paginated<T> {
  return {
    items,
    meta: {
      total: items.length,
      page: 1,
      limit: items.length || 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  }
}

/**
 * Ro'yxat javobini Paginated shaklга keltiradi — backend massiv ham,
 * `{ items, meta }` ham qaytarishi mumkin (Swagger har doim aniq emas).
 */
function normalizeList<T>(data: unknown): Paginated<T> {
  if (Array.isArray(data)) return wrapArray(data as T[])
  if (data && typeof data === 'object' && Array.isArray((data as Paginated<T>).items)) {
    return data as Paginated<T>
  }
  return wrapArray<T>([])
}

/**
 * Saqlash ketma-ketligi (FRONTEND_REACT.md §5): avval yozuv yaratiladi/yangilanadi,
 * so'ng tanlangan rasm (brauzerда turgan File) yuklanadi. id 1-javobdan olinadi.
 */
export async function saveResource<T extends { id: string }, C, U>(opts: {
  api: CrudApi<T, C, U>
  editing: { id: string } | null
  buildInput: () => C & U
  /** File = yangi rasm; null/undefined/string = yuklash shart emas. */
  image?: File | string | null
}): Promise<T> {
  const { api, editing, buildInput, image } = opts
  const record = editing
    ? await api.update(editing.id, buildInput())
    : await api.create(buildInput())
  if (image instanceof File && api.uploadImage) {
    return api.uploadImage(record.id, image)
  }
  return record
}

export function createCrudApi<T, C, U>(opts: CreateCrudOptions): CrudApi<T, C, U> {
  const { basePath, imageSegment, listPath, listIsArray } = opts
  const path = listPath ?? basePath
  return {
    list: listIsArray
      ? (params) => http.get<unknown>(path, { params }).then(normalizeList<T>)
      : (params) => http.get<Paginated<T>>(path, { params }),
    get: (id) => http.get<T>(`${basePath}/${id}`),
    create: (input) => http.post<T>(basePath, input),
    update: (id, input) => http.patch<T>(`${basePath}/${id}`, input),
    remove: (id) => http.delete<void>(`${basePath}/${id}`),
    uploadImage: imageSegment
      ? (id, file) => {
          const fd = new FormData()
          fd.append('file', file)
          return http.post<T>(`${basePath}/${id}/${imageSegment}`, fd)
        }
      : undefined,
  }
}
