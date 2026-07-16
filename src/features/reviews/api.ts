import { http, httpMsg } from '@/api/client'
import type { Paginated } from '@/types/api'
import type { Review } from '@/types/review'

export interface ReviewListParams {
  bookId?: string
  page?: number
  limit?: number
}

export function listReviews(params: ReviewListParams): Promise<Paginated<Review>> {
  return http.get<Paginated<Review>>('/reviews', { params })
}

export function deleteReview(id: string): Promise<string> {
  return httpMsg.delete<null>(`/reviews/${id}`).then((r) => r.message)
}
