import type { LocalizedText } from './api'

// FRONTEND_REACT.md §2a. Pul qiymatlari — butun som (UZS).

export interface StatsOverview {
  users: { total: number; active: number; newToday: number; newThisMonth: number }
  sales: {
    paidCount: number
    revenue: number
    revenueToday: number
    revenueThisWeek: number
    revenueThisMonth: number
  }
  subscriptions: { active: number; revenue: number; expiringSoon: number }
  books: { total: number; published: number }
  content: { ready: number; processing: number; failed: number }
  engagement: { activeReaders: number; completedReads: number }
}

export type TimeseriesMetric = 'revenue' | 'signups' | 'subscriptions'
export type TimeseriesInterval = 'day' | 'month'

export interface TimeseriesPoint {
  date: string
  count: number
  /** `signups` metrikasida bo'lmaydi. */
  amount?: number
}

export interface TimeseriesParams {
  metric: TimeseriesMetric
  interval: TimeseriesInterval
  from?: string
  to?: string
}

export type TopBooksBy = 'sales' | 'rating' | 'reads'

export interface TopBookRow {
  bookId: string
  title: LocalizedText | string
  salesCount?: number
  revenue?: number
  avgRating?: number
  reviewCount?: number
  readers?: number
}

export interface StatsBreakdown {
  booksByStatus: Record<string, number>
  booksByAccessType: Record<string, number>
  editionsByFormat: Record<string, number>
  devicesByPlatform: Record<string, number>
  ratingDistribution: Record<string, number>
  subscriptionsByPlan: { planId: string; name: LocalizedText | string; activeCount: number }[]
}
