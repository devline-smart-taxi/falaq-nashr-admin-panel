import type { LocalizedText } from './api'

export interface Review {
  id: string
  bookId: string
  bookTitle: LocalizedText | null
  userName: string
  rating: number
  text: string | null
  createdAt: string
}
