import { useQuery } from '@tanstack/react-query'
import type { TimeseriesParams, TopBooksBy } from '@/types/stats'
import {
  getStatsBreakdown,
  getStatsOverview,
  getStatsTimeseries,
  getTopBooks,
} from './api'

export function useStatsOverview() {
  return useQuery({ queryKey: ['stats', 'overview'], queryFn: getStatsOverview })
}

export function useStatsTimeseries(params: TimeseriesParams) {
  return useQuery({
    queryKey: ['stats', 'timeseries', params],
    queryFn: () => getStatsTimeseries(params),
  })
}

export function useTopBooks(by: TopBooksBy, limit = 10) {
  return useQuery({
    queryKey: ['stats', 'top-books', by, limit],
    queryFn: () => getTopBooks(by, limit),
  })
}

export function useStatsBreakdown() {
  return useQuery({ queryKey: ['stats', 'breakdown'], queryFn: getStatsBreakdown })
}
