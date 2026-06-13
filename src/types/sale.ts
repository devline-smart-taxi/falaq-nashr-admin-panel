import type { LocalizedText } from './api'

// Swagger'da typed emas — backend boyitilgan shaklni qaytaradi (kitob/foydalanuvchi
// bilan). Maydonlar himoyaviy (optional) — mavjudini ko'rsatamiz.
export interface SaleBook {
  id?: string
  title?: LocalizedText | string
}

export interface SaleUser {
  id?: string
  fullName?: string | null
  phone?: string | null
  email?: string | null
}

export interface Sale {
  id: string
  amount?: number
  price?: number
  status?: string
  paidAt?: string | null
  createdAt?: string
  bookId?: string
  book?: SaleBook
  user?: SaleUser
}
