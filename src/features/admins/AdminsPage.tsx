import { Form, Input, Switch, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ResourceListPage } from '@/components/crud/ResourceListPage'
import { ActiveTag } from '@/components/common/ActiveTag'
import { formatDate } from '@/lib/format'
import type { AppUser } from '@/types/user'
import type { Role } from '@/types/auth'
import { adminsApi, type CreateAdminInput, type UpdateAdminInput } from './api'

interface FormValues {
  email: string
  password?: string
  fullName: string
  isActive: boolean
}

const ROLE_COLOR: Record<Role, string> = {
  USER: 'default',
  ADMIN: 'blue',
  SUPER_ADMIN: 'gold',
}

export function AdminsPage() {
  const columns: ColumnsType<AppUser> = [
    {
      title: 'Ism',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (v: string | null) => v || '—',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (v: string | null) => v || '—',
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      width: 140,
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
      title: "Qo'shilgan",
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (v: string) => formatDate(v),
    },
  ]

  return (
    <ResourceListPage<AppUser, FormValues>
      title="Adminlar"
      queryKey="admins"
      api={adminsApi}
      columns={columns}
      searchable={false}
      newButtonLabel="Yangi admin"
      rowReadonly={(r) => r.role === 'SUPER_ADMIN'}
      initialValues={{ email: '', password: '', fullName: '', isActive: true }}
      toFormValues={(r) => ({
        email: r.email ?? '',
        fullName: r.fullName ?? '',
        isActive: r.isActive,
      })}
      onSubmit={async (values, editing) => {
        if (editing) {
          const input: UpdateAdminInput = {
            fullName: values.fullName.trim(),
            isActive: values.isActive,
          }
          if (values.password?.trim()) input.password = values.password.trim()
          await adminsApi.update(editing.id, input)
        } else {
          const input: CreateAdminInput = {
            email: values.email.trim(),
            password: values.password ?? '',
            fullName: values.fullName.trim(),
            isActive: values.isActive,
          }
          await adminsApi.create(input)
        }
      }}
      renderFields={(editing) => (
        <>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Email kiriting' },
              { type: 'email', message: 'Email noto‘g‘ri' },
            ]}
          >
            <Input disabled={!!editing} placeholder="admin@falaq.uz" />
          </Form.Item>

          <Form.Item name="fullName" label="To'liq ism" rules={[{ required: true, message: 'Ism kiriting' }]}>
            <Input placeholder="Ism Familiya" />
          </Form.Item>

          <Form.Item
            name="password"
            label={editing ? 'Yangi parol (ixtiyoriy)' : 'Parol'}
            rules={
              editing
                ? [{ min: 8, message: 'Kamida 8 belgi' }]
                : [
                    { required: true, message: 'Parol kiriting' },
                    { min: 8, message: 'Kamida 8 belgi' },
                  ]
            }
            tooltip={editing ? "Bo'sh qoldiring — parol o'zgarmaydi" : undefined}
          >
            <Input.Password
              placeholder={editing ? "Bo'sh qoldiring — o'zgarmaydi" : '••••••••'}
            />
          </Form.Item>

          <Form.Item name="isActive" label="Faol" valuePropName="checked">
            <Switch />
          </Form.Item>
        </>
      )}
    />
  )
}
