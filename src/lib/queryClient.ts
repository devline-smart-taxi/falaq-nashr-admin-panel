import { QueryClient } from '@tanstack/react-query'
import { getApiError } from '@/api/client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        // Auth/ruxsat xatolarini qayta urinmaymiz; faqat tarmoq/server xatolarini.
        const status = getApiError(error).status
        if (status && status >= 400 && status < 500) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
  },
})
