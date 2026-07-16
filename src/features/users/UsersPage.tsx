import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Card,
  Table,
  Input,
  Avatar,
  Tag,
  Typography,
  Alert,
  Button,
  Modal,
  Select,
  App,
} from 'antd'
import { UserOutlined, CrownOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { getApiError } from '@/api/client'
import { formatDate } from '@/lib/format'
import { localize, formatUZS } from '@/lib/localize'
import { useAuthStore } from '@/stores/auth'
import { ActiveTag } from '@/components/common/ActiveTag'
import { plansApi } from '@/features/plans/api'
import type { AppUser, AuthProvider } from '@/types/user'
import type { Role } from '@/types/auth'
import { listUsers, grantSubscription } from './api'

const PROVIDER_COLOR: Record<AuthProvider, string> = {
  PHONE: 'default',
  GOOGLE: 'red',
  APPLE: 'black',
}

const ROLE_COLOR: Record<Role, string> = {
  USER: 'default',
  ADMIN: 'blue',
  SUPER_ADMIN: 'gold',
}

export function UsersPage() {
  const lang = useAuthStore((s) => s.lang)
  const { message } = App.useApp()
  const [search, setSearch] = useState('')
  const [grantUser, setGrantUser] = useState<AppUser | null>(null)
  const [planId, setPlanId] = useState<string | undefined>()
  const [granting, setGranting] = useState(false)

  const usersQ = useQuery({
    queryKey: ['users', { search }],
    queryFn: () => listUsers(search),
    placeholderData: (prev) => prev,
  })

  // Obuna berish modali ochilganда faol tariflarni yuklaymiz.
  const plansQ = useQuery({
    queryKey: ['plans', 'grant-options'],
    queryFn: () => plansApi.list(),
    enabled: !!grantUser,
  })
  const planOptions = (plansQ.data?.items ?? [])
    .filter((p) => p.isActive)
    .map((p) => ({
      value: p.id,
      label: `${localize(p.name, lang)} — ${formatUZS(p.price)} / ${p.periodDays} kun`,
    }))

  function openGrant(user: AppUser) {
    setGrantUser(user)
    setPlanId(undefined)
  }

  async function confirmGrant() {
    if (!grantUser || !planId) return
    setGranting(true)
    try {
      const m = await grantSubscription(grantUser.id, planId)
      message.success(m || 'Obuna biriktirildi')
      setGrantUser(null)
    } catch (e) {
      const { status } = getApiError(e)
      message.error(
        status === 400
          ? 'Foydalanuvchida allaqachon faol obuna bor yoki tarif faol emas'
          : getApiError(e).message,
      )
    } finally {
      setGranting(false)
    }
  }

  const columns: ColumnsType<AppUser> = [
    {
      title: '',
      dataIndex: 'avatarUrl',
      key: 'avatarUrl',
      width: 56,
      render: (url: string | null) => <Avatar src={url ?? undefined} icon={<UserOutlined />} />,
    },
    {
      title: 'Ism',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (v: string | null) => v || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (v: string | null) => v || '—',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (v: string | null) => v || '—',
    },
    {
      title: 'Provayder',
      dataIndex: 'authProvider',
      key: 'authProvider',
      width: 110,
      render: (p: AuthProvider) => <Tag color={PROVIDER_COLOR[p]}>{p}</Tag>,
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (r: Role) => <Tag color={ROLE_COLOR[r]}>{r}</Tag>,
    },
    {
      title: 'Holat',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (v: boolean) => <ActiveTag active={v} />,
    },
    {
      title: "Ro'yxatdan",
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Amallar',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_, r) =>
        r.role === 'USER' ? (
          <Button size="small" icon={<CrownOutlined />} onClick={() => openGrant(r)}>
            Obuna
          </Button>
        ) : null,
    },
  ]

  return (
    <Card
      title={<Typography.Title level={4} style={{ margin: 0 }}>Foydalanuvchilar</Typography.Title>}
      extra={
        <Input.Search
          placeholder="Telefon / ism / email"
          allowClear
          style={{ width: 260 }}
          onSearch={setSearch}
        />
      }
    >
      {usersQ.isError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Foydalanuvchilarni yuklab bo'lmadi"
          description={getApiError(usersQ.error).message}
        />
      )}
      <Table<AppUser>
        rowKey="id"
        size="middle"
        loading={usersQ.isLoading}
        dataSource={usersQ.data ?? []}
        columns={columns}
        scroll={{ x: 'max-content' }}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `Jami: ${t}` }}
      />

      <Modal
        title="Obuna berish"
        open={!!grantUser}
        onCancel={() => setGrantUser(null)}
        onOk={confirmGrant}
        okText="Biriktirish"
        cancelText="Bekor"
        okButtonProps={{ loading: granting, disabled: !planId }}
      >
        <Typography.Paragraph type="secondary">
          {grantUser?.fullName || grantUser?.phone || grantUser?.email} — to'lovsiz obuna
          (avto-yangilanmaydi).
        </Typography.Paragraph>
        <Select
          style={{ width: '100%' }}
          placeholder="Tarif tanlang"
          loading={plansQ.isLoading}
          options={planOptions}
          value={planId}
          onChange={setPlanId}
        />
      </Modal>
    </Card>
  )
}
