import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { queryClient } from '@/lib/queryClient'
import { logoutRequest } from './api'
import { PATHS } from '@/router/paths'

export function useLogout() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  return async function doLogout() {
    await logoutRequest() // server sessiyasini bekor qiladi (xato bo'lsa ham davom etadi)
    logout()
    queryClient.clear()
    navigate(PATHS.login, { replace: true })
  }
}
