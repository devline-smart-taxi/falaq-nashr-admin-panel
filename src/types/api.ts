// Backend javob o'rami (FRONTEND_REACT.md §1)

export interface ApiResponse<T> {
  success: true
  statusCode: number
  message: string
  data: T
  timestamp: string
  path: string
}

export interface ApiErrorResponse {
  success: false
  statusCode: number
  message: string
  /** Validatsiya xatolari — forma maydonlariga bog'lash uchun. */
  errors?: string[]
  timestamp: string
  path: string
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface Paginated<T> {
  items: T[]
  meta: PaginationMeta
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
}

// Ko'p tilli matn (FRONTEND_REACT.md §3). `uz` (lotin) majburiy.
export type Lang = 'uz' | 'uz-Cyrl' | 'ru' | 'en'

export interface LocalizedText {
  uz: string
  'uz-Cyrl'?: string
  ru?: string
  en?: string
}
