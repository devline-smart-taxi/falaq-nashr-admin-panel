export interface Review {
  id: string
  bookId: string
  userName: string
  rating: number
  text: string | null
  createdAt: string
}
