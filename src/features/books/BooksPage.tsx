import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Drawer,
  Form,
  Popconfirm,
  App,
  Typography,
  Alert,
  Image,
  Tag,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons'
import { getApiError } from '@/api/client'
import { saveResource } from '@/lib/crud'
import { requireLT, normalizeLT } from '@/lib/lt'
import { localize, formatUZS } from '@/lib/localize'
import { formatDate } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'
import type { ImageValue } from '@/components/form/ImageUpload'
import type { LocalizedText } from '@/types/api'
import type {
  AccessType,
  Book,
  BookEditionInput,
  BookListParams,
  BookStatus,
  CreateBookInput,
  EditionFormat,
} from '@/types/book'
import { authorsApi } from '@/features/authors/api'
import { categoriesApi } from '@/features/categories/api'
import { collectionsApi } from '@/features/collections/api'
import { booksApi, listAdminBooks } from './api'
import { BookFormFields, type SelectOption } from './BookFormFields'
import { BookContentDrawer } from './BookContentDrawer'
import {
  ACCESS_TYPE_COLOR,
  ACCESS_TYPE_LABEL,
  ACCESS_TYPE_OPTIONS,
  FORMAT_LABEL,
  FORMAT_OPTIONS,
  STATUS_COLOR,
  STATUS_LABEL,
  STATUS_OPTIONS,
} from './constants'

interface BookFormValues {
  title: LocalizedText
  description?: LocalizedText
  accessType: AccessType
  price?: number
  publishedYear?: number
  isbn?: string
  sortOrder: number
  status: BookStatus
  authorId?: string
  categoryIds?: string[]
  collectionIds?: string[]
  editions: BookEditionInput[]
  cover?: ImageValue
}

const EMPTY_FORM: BookFormValues = {
  title: { uz: '' },
  description: { uz: '' },
  accessType: 'PURCHASE',
  sortOrder: 0,
  status: 'DRAFT',
  categoryIds: [],
  collectionIds: [],
  editions: [{ format: 'EBOOK', isActive: true }],
}

type Filters = Pick<
  BookListParams,
  'status' | 'accessType' | 'format' | 'authorId' | 'categoryId' | 'collectionId'
>

function toOptions(
  items: { id: string; name: LocalizedText }[],
  lang: Parameters<typeof localize>[1],
): SelectOption[] {
  return items.map((i) => ({ value: i.id, label: localize(i.name, lang) }))
}

export function BooksPage() {
  const lang = useAuthStore((s) => s.lang)
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<BookFormValues>()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Filters>({})
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Book | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string[] | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [contentBook, setContentBook] = useState<Book | null>(null)
  const [contentOpen, setContentOpen] = useState(false)

  const params: BookListParams = {
    page,
    limit,
    search: search || undefined,
    ...filters,
  }

  const booksQuery = useQuery({
    queryKey: ['books', 'admin', params],
    queryFn: () => listAdminBooks(params),
    placeholderData: (prev) => prev,
  })

  // Select'lar uchun ma'lumotnomalar (faol yozuvlar yetarli).
  const authorsQ = useQuery({
    queryKey: ['authors', 'options'],
    queryFn: () => authorsApi.list({ limit: 100 }),
  })
  const categoriesQ = useQuery({
    queryKey: ['categories', 'options'],
    queryFn: () => categoriesApi.list({ limit: 100 }),
  })
  const collectionsQ = useQuery({
    queryKey: ['collections', 'options'],
    queryFn: () => collectionsApi.list({ limit: 100 }),
  })

  const authorOptions = useMemo(
    () => toOptions(authorsQ.data?.items ?? [], lang),
    [authorsQ.data, lang],
  )
  const categoryOptions = useMemo(
    () => toOptions(categoriesQ.data?.items ?? [], lang),
    [categoriesQ.data, lang],
  )
  const collectionOptions = useMemo(
    () => toOptions(collectionsQ.data?.items ?? [], lang),
    [collectionsQ.data, lang],
  )
  const optionsLoading =
    authorsQ.isLoading || categoriesQ.isLoading || collectionsQ.isLoading

  function setFilter(patch: Partial<Filters>) {
    setFilters((f) => ({ ...f, ...patch }))
    setPage(1)
  }

  function openCreate() {
    setEditing(null)
    setFormError(null)
    form.resetFields()
    form.setFieldsValue(EMPTY_FORM)
    setDrawerOpen(true)
  }

  function openEdit(book: Book) {
    setEditing(book)
    setFormError(null)
    form.resetFields()
    form.setFieldsValue({
      title: book.title,
      description: book.description ?? { uz: '' },
      accessType: book.accessType,
      price: book.price ?? undefined,
      publishedYear: book.publishedYear ?? undefined,
      isbn: book.isbn ?? '',
      sortOrder: book.sortOrder,
      status: book.status,
      authorId: book.author?.id,
      categoryIds: book.categories.map((c) => c.id),
      collectionIds: book.collections.map((c) => c.id),
      editions: book.editions.map((e) => ({
        format: e.format,
        narrator: e.narrator ?? undefined,
        durationSeconds: e.durationSeconds ?? undefined,
        pageCount: e.pageCount ?? undefined,
        isActive: e.isActive,
      })),
      cover: book.coverUrl ?? undefined,
    })
    setDrawerOpen(true)
  }

  function openContent(book: Book) {
    setContentBook(book)
    setContentOpen(true)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await booksApi.remove(id)
      message.success("O'chirildi")
      void queryClient.invalidateQueries({ queryKey: ['books'] })
    } catch (e) {
      message.error(getApiError(e).message)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleFinish(values: BookFormValues) {
    setSaving(true)
    setFormError(null)
    try {
      const isPurchase = values.accessType === 'PURCHASE'
      const buildInput = (): CreateBookInput => ({
        title: requireLT(values.title),
        description: normalizeLT(values.description),
        accessType: values.accessType,
        price: isPurchase ? (values.price ?? null) : null,
        publishedYear: values.publishedYear ?? null,
        isbn: values.isbn?.trim() || null,
        sortOrder: values.sortOrder ?? 0,
        status: values.status,
        authorId: values.authorId ?? null,
        categoryIds: values.categoryIds ?? [],
        collectionIds: values.collectionIds ?? [],
        editions: (values.editions ?? []).map((e) => ({
          format: e.format,
          narrator: e.format === 'AUDIO' ? e.narrator?.trim() || null : null,
          durationSeconds: e.format === 'AUDIO' ? (e.durationSeconds ?? null) : null,
          pageCount: e.format === 'EBOOK' ? (e.pageCount ?? null) : null,
          isActive: e.isActive ?? true,
        })),
        ...(values.cover === null ? { coverUrl: null } : {}),
      })
      await saveResource({ api: booksApi, editing, buildInput, image: values.cover })
      message.success(editing ? 'Saqlandi' : "Qo'shildi")
      setDrawerOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['books'] })
    } catch (e) {
      const err = getApiError(e)
      setFormError(err.errors?.length ? err.errors : [err.message])
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnsType<Book> = [
    {
      title: 'Muqova',
      dataIndex: 'coverUrl',
      key: 'coverUrl',
      width: 64,
      render: (url: string | null) =>
        url ? (
          <Image src={url} width={40} height={56} style={{ objectFit: 'cover' }} />
        ) : (
          <Tag>yo'q</Tag>
        ),
    },
    {
      title: 'Sarlavha',
      dataIndex: 'title',
      key: 'title',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{localize(r.title, lang)}</Typography.Text>
          {r.isbn && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {r.isbn}
            </Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Muallif',
      key: 'author',
      render: (_, r) => (r.author ? localize(r.author.name, lang) : '—'),
    },
    {
      title: 'Holat',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (s: BookStatus) => <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s]}</Tag>,
    },
    {
      title: 'Kirish',
      dataIndex: 'accessType',
      key: 'accessType',
      width: 100,
      render: (a: AccessType) => (
        <Tag color={ACCESS_TYPE_COLOR[a]}>{ACCESS_TYPE_LABEL[a]}</Tag>
      ),
    },
    {
      title: 'Narx',
      dataIndex: 'price',
      key: 'price',
      width: 130,
      align: 'right',
      render: (price: number | null, r) =>
        r.accessType === 'PURCHASE' ? formatUZS(price) : '—',
    },
    {
      title: 'Formatlar',
      key: 'editions',
      width: 130,
      render: (_, r) => (
        <Space size={4} wrap>
          {r.editions.map((e) => (
            <Tag key={e.id} color={e.format === 'AUDIO' ? 'blue' : 'geekblue'}>
              {FORMAT_LABEL[e.format]}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Qo'shilgan",
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Amallar',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button
            size="small"
            icon={<CloudUploadOutlined />}
            title="Kontent"
            onClick={() => openContent(r)}
          />
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm
            title="O'chirilsinmi?"
            description="Yozuv yashiriladi (soft-delete)."
            okText="O'chirish"
            okButtonProps={{ danger: true }}
            cancelText="Bekor"
            onConfirm={() => handleDelete(r.id)}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deletingId === r.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const meta = booksQuery.data?.meta

  return (
    <Card
      title={<Typography.Title level={4} style={{ margin: 0 }}>Kitoblar</Typography.Title>}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Yangi kitob
        </Button>
      }
    >
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Qidirish..."
          allowClear
          style={{ width: 220 }}
          onSearch={(v) => {
            setSearch(v)
            setPage(1)
          }}
        />
        <Select
          placeholder="Holat"
          allowClear
          style={{ width: 150 }}
          options={STATUS_OPTIONS}
          onChange={(status) => setFilter({ status })}
        />
        <Select
          placeholder="Kirish"
          allowClear
          style={{ width: 130 }}
          options={ACCESS_TYPE_OPTIONS}
          onChange={(accessType) => setFilter({ accessType })}
        />
        <Select
          placeholder="Format"
          allowClear
          style={{ width: 120 }}
          options={FORMAT_OPTIONS}
          onChange={(format) => setFilter({ format: format as EditionFormat })}
        />
        <Select
          placeholder="Muallif"
          allowClear
          showSearch
          optionFilterProp="label"
          style={{ width: 170 }}
          options={authorOptions}
          onChange={(authorId) => setFilter({ authorId })}
        />
        <Select
          placeholder="Kategoriya"
          allowClear
          showSearch
          optionFilterProp="label"
          style={{ width: 170 }}
          options={categoryOptions}
          onChange={(categoryId) => setFilter({ categoryId })}
        />
        <Select
          placeholder="Kolleksiya"
          allowClear
          showSearch
          optionFilterProp="label"
          style={{ width: 170 }}
          options={collectionOptions}
          onChange={(collectionId) => setFilter({ collectionId })}
        />
      </Space>

      {booksQuery.isError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Ro'yxatni yuklab bo'lmadi"
          description={getApiError(booksQuery.error).message}
        />
      )}

      <Table<Book>
        rowKey="id"
        size="middle"
        loading={booksQuery.isLoading}
        dataSource={booksQuery.data?.items ?? []}
        columns={columns}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: meta?.page ?? page,
          pageSize: meta?.limit ?? limit,
          total: meta?.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `Jami: ${total}`,
          onChange: (p, ps) => {
            setPage(p)
            setLimit(ps)
          },
        }}
      />

      <Drawer
        title={editing ? 'Kitobni tahrirlash' : 'Yangi kitob'}
        width={680}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Bekor</Button>
            <Button type="primary" loading={saving} onClick={() => form.submit()}>
              Saqlash
            </Button>
          </Space>
        }
      >
        {formError && (
          <Alert
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            message="Xato"
            description={
              formError.length > 1 ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {formError.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              ) : (
                formError[0]
              )
            }
          />
        )}
        {editing && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Audio/e-kitob fayllarini saqlagandan so'ng 'Kontent' tugmasi orqali yuklang."
          />
        )}
        <Form<BookFormValues> form={form} layout="vertical" onFinish={handleFinish}>
          <BookFormFields
            authorOptions={authorOptions}
            categoryOptions={categoryOptions}
            collectionOptions={collectionOptions}
            optionsLoading={optionsLoading}
          />
        </Form>
      </Drawer>

      <BookContentDrawer
        book={contentBook}
        open={contentOpen}
        onClose={() => setContentOpen(false)}
      />
    </Card>
  )
}
