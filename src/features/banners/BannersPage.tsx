import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Form, Input, InputNumber, Select, Switch, DatePicker, Image, Tag, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { ResourceListPage } from '@/components/crud/ResourceListPage'
import { LocalizedTextInput } from '@/components/form/LocalizedTextInput'
import { ImageUpload, type ImageValue } from '@/components/form/ImageUpload'
import { ActiveTag } from '@/components/common/ActiveTag'
import { useAuthStore } from '@/stores/auth'
import { localize } from '@/lib/localize'
import { formatDate } from '@/lib/format'
import { saveResource } from '@/lib/crud'
import { normalizeLT, requireLT, requiredLTRule } from '@/lib/lt'
import { booksApi } from '@/features/books/api'
import { collectionsApi } from '@/features/collections/api'
import type { Banner, BannerTargetType, CreateBannerInput } from '@/types/banner'
import type { LocalizedText } from '@/types/api'
import { bannersApi } from './api'

const TARGET_OPTIONS: { value: BannerTargetType; label: string }[] = [
  { value: 'BOOK', label: 'Kitob' },
  { value: 'COLLECTION', label: 'Kolleksiya' },
  { value: 'URL', label: 'Havola (URL)' },
]

const TARGET_COLOR: Record<BannerTargetType, string> = {
  BOOK: 'blue',
  COLLECTION: 'purple',
  URL: 'default',
}

interface FormValues {
  title: LocalizedText
  subtitle?: LocalizedText
  targetType: BannerTargetType
  targetBookId?: string
  targetCollectionId?: string
  targetUrl?: string
  sortOrder: number
  isActive: boolean
  startsAt?: Dayjs
  endsAt?: Dayjs
  image?: ImageValue
}

export function BannersPage() {
  const lang = useAuthStore((s) => s.lang)

  const booksQ = useQuery({
    queryKey: ['books', 'banner-options'],
    queryFn: () => booksApi.list({ limit: 100 }),
  })
  const collectionsQ = useQuery({
    queryKey: ['collections', 'options'],
    queryFn: () => collectionsApi.list({ limit: 100 }),
  })

  const bookOptions = useMemo(
    () =>
      (booksQ.data?.items ?? []).map((b) => ({
        value: b.id,
        label: localize(b.title, lang),
      })),
    [booksQ.data, lang],
  )
  const collectionOptions = useMemo(
    () =>
      (collectionsQ.data?.items ?? []).map((c) => ({
        value: c.id,
        label: localize(c.name, lang),
      })),
    [collectionsQ.data, lang],
  )

  const columns: ColumnsType<Banner> = [
    {
      title: 'Rasm',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 90,
      render: (url: string | null) =>
        url ? (
          <Image src={url} width={72} height={40} style={{ objectFit: 'cover' }} />
        ) : (
          <Tag>yo'q</Tag>
        ),
    },
    {
      title: 'Sarlavha',
      dataIndex: 'title',
      key: 'title',
      render: (_, r) => localize(r.title, lang),
    },
    {
      title: 'Target',
      dataIndex: 'targetType',
      key: 'targetType',
      width: 120,
      render: (t: BannerTargetType) => (
        <Tag color={TARGET_COLOR[t]}>{TARGET_OPTIONS.find((o) => o.value === t)?.label}</Tag>
      ),
    },
    {
      title: 'Davr',
      key: 'period',
      width: 240,
      render: (_, r) =>
        r.startsAt || r.endsAt ? (
          <Space size={4}>
            {formatDate(r.startsAt)} — {formatDate(r.endsAt)}
          </Space>
        ) : (
          '—'
        ),
    },
    {
      title: 'Tartib',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
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
    <ResourceListPage<Banner, FormValues>
      title="Bannerlar"
      queryKey="banners"
      api={bannersApi}
      columns={columns}
      searchable={false}
      newButtonLabel="Yangi banner"
      drawerWidth={560}
      initialValues={{
        title: { uz: '' },
        subtitle: { uz: '' },
        targetType: 'BOOK',
        sortOrder: 0,
        isActive: true,
      }}
      toFormValues={(r) => ({
        title: r.title,
        subtitle: r.subtitle ?? { uz: '' },
        targetType: r.targetType,
        targetBookId: r.targetBookId ?? undefined,
        targetCollectionId: r.targetCollectionId ?? undefined,
        targetUrl: r.targetUrl ?? undefined,
        sortOrder: r.sortOrder,
        isActive: r.isActive,
        startsAt: r.startsAt ? dayjs(r.startsAt) : undefined,
        endsAt: r.endsAt ? dayjs(r.endsAt) : undefined,
        image: r.imageUrl ?? undefined,
      })}
      onSubmit={async (values, editing) => {
        const buildInput = (): CreateBannerInput => ({
          title: requireLT(values.title),
          subtitle: normalizeLT(values.subtitle),
          targetType: values.targetType,
          targetBookId: values.targetType === 'BOOK' ? values.targetBookId : null,
          targetCollectionId:
            values.targetType === 'COLLECTION' ? values.targetCollectionId : null,
          targetUrl: values.targetType === 'URL' ? values.targetUrl?.trim() || null : null,
          sortOrder: values.sortOrder ?? 0,
          isActive: values.isActive,
          startsAt: values.startsAt ? values.startsAt.toISOString() : null,
          endsAt: values.endsAt ? values.endsAt.toISOString() : null,
        })
        return (await saveResource({ api: bannersApi, editing, buildInput, image: values.image }))
          .message
      }}
      renderFields={() => (
        <>
          <Form.Item name="title" label="Sarlavha" required rules={[requiredLTRule]}>
            <LocalizedTextInput placeholder="Banner sarlavhasi" />
          </Form.Item>
          <Form.Item name="subtitle" label="Sub-sarlavha">
            <LocalizedTextInput placeholder="Qo'shimcha matn" />
          </Form.Item>
          <Form.Item
            name="image"
            label="Rasm"
            required
            tooltip="Rasmsiz banner mobil karuselда ko'rinmaydi"
            rules={[
              {
                validator: (_, v) =>
                  v instanceof File || typeof v === 'string'
                    ? Promise.resolve()
                    : Promise.reject(new Error('Banner rasmi majburiy')),
              },
            ]}
          >
            <ImageUpload />
          </Form.Item>

          <Form.Item name="targetType" label="Target turi">
            <Select options={TARGET_OPTIONS} />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(p, c) => p.targetType !== c.targetType}>
            {({ getFieldValue }) => {
              const t = getFieldValue('targetType') as BannerTargetType
              if (t === 'BOOK')
                return (
                  <Form.Item
                    name="targetBookId"
                    label="Kitob"
                    rules={[{ required: true, message: 'Kitob tanlang' }]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Kitob"
                      options={bookOptions}
                      loading={booksQ.isLoading}
                    />
                  </Form.Item>
                )
              if (t === 'COLLECTION')
                return (
                  <Form.Item
                    name="targetCollectionId"
                    label="Kolleksiya"
                    rules={[{ required: true, message: 'Kolleksiya tanlang' }]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Kolleksiya"
                      options={collectionOptions}
                      loading={collectionsQ.isLoading}
                    />
                  </Form.Item>
                )
              return (
                <Form.Item
                  name="targetUrl"
                  label="Havola (URL)"
                  rules={[
                    { required: true, message: 'URL kiriting' },
                    { type: 'url', message: 'URL noto‘g‘ri' },
                  ]}
                >
                  <Input placeholder="https://..." />
                </Form.Item>
              )
            }}
          </Form.Item>

          <Space size="middle" wrap>
            <Form.Item name="startsAt" label="Boshlanish">
              <DatePicker showTime style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="endsAt" label="Tugash">
              <DatePicker showTime style={{ width: 200 }} />
            </Form.Item>
          </Space>

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
