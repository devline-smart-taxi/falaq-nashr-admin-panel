import { Image, Form, InputNumber, Switch, Tag, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ResourceListPage } from '@/components/crud/ResourceListPage'
import { LocalizedTextInput } from '@/components/form/LocalizedTextInput'
import { ImageUpload, type ImageValue } from '@/components/form/ImageUpload'
import { ActiveTag } from '@/components/common/ActiveTag'
import { useAuthStore } from '@/stores/auth'
import { localize } from '@/lib/localize'
import { saveResource } from '@/lib/crud'
import { normalizeLT, requireLT, requiredLTRule } from '@/lib/lt'
import type { Collection, CreateCollectionInput } from '@/types/catalog'
import type { LocalizedText } from '@/types/api'
import { collectionsApi } from './api'

interface FormValues {
  name: LocalizedText
  description?: LocalizedText
  sortOrder: number
  isExclusive: boolean
  isActive: boolean
  image?: ImageValue
}

export function CollectionsPage() {
  const lang = useAuthStore((s) => s.lang)

  const columns: ColumnsType<Collection> = [
    {
      title: 'Muqova',
      dataIndex: 'coverUrl',
      key: 'coverUrl',
      width: 80,
      render: (url: string | null) =>
        url ? (
          <Image src={url} width={56} height={40} style={{ objectFit: 'cover' }} />
        ) : (
          <Tag>yo'q</Tag>
        ),
    },
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      render: (_, r) => (
        <Space>
          {localize(r.name, lang)}
          {r.isExclusive && <Tag color="gold">Exclusive</Tag>}
        </Space>
      ),
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
    <ResourceListPage<Collection, FormValues>
      title="Kolleksiyalar"
      queryKey="collections"
      api={collectionsApi}
      columns={columns}
      newButtonLabel="Yangi kolleksiya"
      initialValues={{
        name: { uz: '' },
        description: { uz: '' },
        sortOrder: 0,
        isExclusive: false,
        isActive: true,
      }}
      toFormValues={(r) => ({
        name: r.name,
        description: r.description ?? { uz: '' },
        sortOrder: r.sortOrder,
        isExclusive: r.isExclusive,
        isActive: r.isActive,
        image: r.coverUrl ?? undefined,
      })}
      onSubmit={async (values, editing) => {
        const buildInput = (): CreateCollectionInput => ({
          name: requireLT(values.name),
          description: normalizeLT(values.description),
          sortOrder: values.sortOrder ?? 0,
          isExclusive: values.isExclusive,
          isActive: values.isActive,
          ...(values.image === null ? { coverUrl: null } : {}),
        })
        await saveResource({ api: collectionsApi, editing, buildInput, image: values.image })
      }}
      renderFields={() => (
        <>
          <Form.Item name="name" label="Nom" required rules={[requiredLTRule]}>
            <LocalizedTextInput placeholder="Masalan: Tavsiya etamiz" />
          </Form.Item>
          <Form.Item name="description" label="Tavsif">
            <LocalizedTextInput multiline placeholder="Kolleksiya haqida" />
          </Form.Item>
          <Form.Item name="image" label="Muqova">
            <ImageUpload />
          </Form.Item>
          <Form.Item name="sortOrder" label="Tartib raqami" tooltip="Kichik — oldinroq">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="isExclusive"
            label="Exclusive (promo to'plam)"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item name="isActive" label="Faol" valuePropName="checked">
            <Switch />
          </Form.Item>
        </>
      )}
    />
  )
}
