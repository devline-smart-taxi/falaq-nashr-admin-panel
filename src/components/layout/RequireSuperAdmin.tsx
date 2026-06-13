import { useNavigate } from 'react-router-dom'
import { Button, Result } from 'antd'
import { useAuthStore } from '@/stores/auth'
import { PATHS } from '@/router/paths'

/** Faqat SUPER_ADMIN kira oladigan sahifalar uchun qo'riqchi. */
export function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const role = useAuthStore((s) => s.user?.role)
  const navigate = useNavigate()

  if (role !== 'SUPER_ADMIN') {
    // 403 emas, 404 — bo'lim mavjudligini oshkor qilmaymiz.
    return (
      <Result
        status="404"
        title="Topilmadi"
        subTitle="So'ralgan sahifa topilmadi."
        extra={
          <Button type="primary" onClick={() => navigate(PATHS.dashboard)}>
            Dashboard'ga qaytish
          </Button>
        }
      />
    )
  }

  return <>{children}</>
}
