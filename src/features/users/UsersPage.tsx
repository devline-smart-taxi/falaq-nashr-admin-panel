import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Table, Input, Avatar, Tag, Typography, Alert } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { getApiError } from '@/api/client'
import { formatDate } from '@/lib/format'
import { ActiveTag } from '@/components/common/ActiveTag'
import type { AppUser, AuthProvider } from '@/types/user'
import type { Role } from '@/types/auth'
import { listUsers } from './api'

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
  const [search, setSearch] = useState('')

  const usersQ = useQuery({
    queryKey: ['users', { search }],
    queryFn: () => listUsers(search),
    placeholderData: (prev) => prev,
  })

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
    </Card>
  )
}
