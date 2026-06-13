import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { selectIsAuthenticated, useAuthStore } from '@/stores/auth'
import { PATHS } from '@/router/paths'

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    // Kirgandan keyin shu sahifaga qaytarish uchun `from` ni eslab qolamiz.
    return <Navigate to={PATHS.login} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
