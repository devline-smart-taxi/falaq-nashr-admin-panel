import { http } from '@/api/client'
import type {
  StatsBreakdown,
  StatsOverview,
  TimeseriesParams,
  TimeseriesPoint,
  TopBookRow,
  TopBooksBy,
} from '@/types/stats'

export function getStatsOverview(): Promise<StatsOverview> {
  return http.get<StatsOverview>('/admin/stats')
}

export function getStatsTimeseries(params: TimeseriesParams): Promise<TimeseriesPoint[]> {
  return http.get<TimeseriesPoint[]>('/admin/stats/timeseries', { params })
}

export function getTopBooks(by: TopBooksBy, limit = 10): Promise<TopBookRow[]> {
  return http.get<TopBookRow[]>('/admin/stats/top-books', { params: { by, limit } })
}

export function getStatsBreakdown(): Promise<StatsBreakdown> {
  return http.get<StatsBreakdown>('/admin/stats/breakdown')
}
