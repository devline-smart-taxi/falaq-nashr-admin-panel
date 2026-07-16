import { Avatar, Form, Switch } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { ResourceListPage } from '@/components/crud/ResourceListPage'
import { LocalizedTextInput } from '@/components/form/LocalizedTextInput'
import { ImageUpload, type ImageValue } from '@/components/form/ImageUpload'
import { ActiveTag } from '@/components/common/ActiveTag'
import { useAuthStore } from '@/stores/auth'
import { localize } from '@/lib/localize'
import { formatDate } from '@/lib/format'
import { saveResource } from '@/lib/crud'
import { normalizeLT, requireLT, requiredLTRule } from '@/lib/lt'
import type { Author, CreateAuthorInput } from '@/types/catalog'
import type { LocalizedText } from '@/types/api'
import { authorsApi } from './api'

interface FormValues {
  name: LocalizedText
  bio?: LocalizedText
  isActive: boolean
  image?: ImageValue
}

export function AuthorsPage() {
  const lang = useAuthStore((s) => s.lang)

  const columns: ColumnsType<Author> = [
    {
      title: 'Rasm',
      dataIndex: 'photoUrl',
      key: 'photoUrl',
      width: 72,
      render: (url: string | null) => (
        <Avatar src={url ?? undefined} icon={<UserOutlined />} />
      ),
    },
    {
      title: 'Ism',
      dataIndex: 'name',
      key: 'name',
      render: (_, r) => localize(r.name, lang),
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
      width: 160,
      render: (v: string) => formatDate(v),
    },
  ]

  return (
    <ResourceListPage<Author, FormValues>
      title="Mualliflar"
      queryKey="authors"
      api={authorsApi}
      columns={columns}
      newButtonLabel="Yangi muallif"
      initialValues={{ name: { uz: '' }, bio: { uz: '' }, isActive: true }}
      toFormValues={(r) => ({
        name: r.name,
        bio: r.bio ?? { uz: '' },
        isActive: r.isActive,
        image: r.photoUrl ?? undefined,
      })}
      onSubmit={async (values, editing) => {
        const buildInput = (): CreateAuthorInput => ({
          name: requireLT(values.name),
          bio: normalizeLT(values.bio),
          isActive: values.isActive,
          ...(values.image === null ? { photoUrl: null } : {}),
        })
        return (await saveResource({ api: authorsApi, editing, buildInput, image: values.image }))
          .message
      }}
      renderFields={() => (
        <>
          <Form.Item name="name" label="Ism" required rules={[requiredLTRule]}>
            <LocalizedTextInput placeholder="Masalan: Abdulla Qodiriy" />
          </Form.Item>
          <Form.Item name="bio" label="Bio">
            <LocalizedTextInput multiline placeholder="Muallif haqida" />
          </Form.Item>
          <Form.Item name="image" label="Rasm">
            <ImageUpload />
          </Form.Item>
          <Form.Item name="isActive" label="Faol" valuePropName="checked">
            <Switch />
          </Form.Item>
        </>
      )}
    />
  )
}
