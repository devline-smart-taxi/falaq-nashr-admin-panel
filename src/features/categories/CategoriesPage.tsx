import { Avatar, Form, InputNumber, Switch } from 'antd'
import { TagsOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { ResourceListPage } from '@/components/crud/ResourceListPage'
import { LocalizedTextInput } from '@/components/form/LocalizedTextInput'
import { ImageUpload, type ImageValue } from '@/components/form/ImageUpload'
import { ActiveTag } from '@/components/common/ActiveTag'
import { useAuthStore } from '@/stores/auth'
import { localize } from '@/lib/localize'
import { saveResource } from '@/lib/crud'
import { requireLT, requiredLTRule } from '@/lib/lt'
import type { Category, CreateCategoryInput } from '@/types/catalog'
import type { LocalizedText } from '@/types/api'
import { categoriesApi } from './api'

interface FormValues {
  name: LocalizedText
  sortOrder: number
  isActive: boolean
  image?: ImageValue
}

export function CategoriesPage() {
  const lang = useAuthStore((s) => s.lang)

  const columns: ColumnsType<Category> = [
    {
      title: 'Ikonka',
      dataIndex: 'iconUrl',
      key: 'iconUrl',
      width: 72,
      render: (url: string | null) => (
        <Avatar shape="square" src={url ?? undefined} icon={<TagsOutlined />} />
      ),
    },
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      render: (_, r) => localize(r.name, lang),
    },
    {
      title: 'Tartib',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 90,
      sorter: (a, b) => a.sortOrder - b.sortOrder,
    },
    {
      title: 'Holat',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (v: boolean) => <ActiveTag active={v} />,
    },
  ]

  return (
    <ResourceListPage<Category, FormValues>
      title="Kategoriyalar"
      queryKey="categories"
      api={categoriesApi}
      columns={columns}
      newButtonLabel="Yangi kategoriya"
      initialValues={{ name: { uz: '' }, sortOrder: 0, isActive: true }}
      toFormValues={(r) => ({
        name: r.name,
        sortOrder: r.sortOrder,
        isActive: r.isActive,
        image: r.iconUrl ?? undefined,
      })}
      onSubmit={async (values, editing) => {
        const buildInput = (): CreateCategoryInput => ({
          name: requireLT(values.name),
          sortOrder: values.sortOrder ?? 0,
          isActive: values.isActive,
          ...(values.image === null ? { iconUrl: null } : {}),
        })
        await saveResource({ api: categoriesApi, editing, buildInput, image: values.image })
      }}
      renderFields={() => (
        <>
          <Form.Item name="name" label="Nom" required rules={[requiredLTRule]}>
            <LocalizedTextInput placeholder="Masalan: Badiiy" />
          </Form.Item>
          <Form.Item name="image" label="Ikonka">
            <ImageUpload />
          </Form.Item>
          <Form.Item name="sortOrder" label="Tartib raqami" tooltip="Kichik — oldinroq">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isActive" label="Faol" valuePropName="checked">
            <Switch />
          </Form.Item>
        </>
      )}
    />
  )
}
