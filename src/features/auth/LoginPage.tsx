import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Button, Card, Form, Input, Typography, Alert } from 'antd'
import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { getApiError } from '@/api/client'
import { isAdminRole, useAuthStore, selectIsAuthenticated } from '@/stores/auth'
import { adminLogin } from './api'
import type { AdminLoginInput } from '@/types/auth'
import { PATHS } from '@/router/paths'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Allaqachon kirgan bo'lsa — dashboard'ga.
  if (isAuthenticated) return <Navigate to={PATHS.dashboard} replace />

  const from = (location.state as { from?: string } | null)?.from ?? PATHS.dashboard

  async function onFinish(values: AdminLoginInput) {
    setLoading(true)
    setError(null)
    try {
      const result = await adminLogin(values)
      if (!isAdminRole(result.user.role)) {
        setError('Bu hisob admin paneliga kirish huquqiga ega emas.')
        return
      }
      setAuth(result)
      navigate(from, { replace: true })
    } catch (e) {
      const { message, status } = getApiError(e)
      if (status === 429) {
        setError('Juda ko‘p urinish. Bir daqiqadan so‘ng qayta urinib ko‘ring.')
      } else if (status === 401 || status === 400) {
        setError('Email yoki parol noto‘g‘ri.')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
        padding: 16,
      }}
    >
      <Card style={{ width: 400, maxWidth: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            Falaq Admin
          </Typography.Title>
          <Typography.Text type="secondary">Boshqaruv paneliga kirish</Typography.Text>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setError(null)}
          />
        )}

        <Form<AdminLoginInput> layout="vertical" onFinish={onFinish} disabled={loading}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Email kiriting' },
              { type: 'email', message: 'Email noto‘g‘ri' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="admin@falaq.uz" autoComplete="email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Parol"
            rules={[{ required: true, message: 'Parol kiriting' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Kirish
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
