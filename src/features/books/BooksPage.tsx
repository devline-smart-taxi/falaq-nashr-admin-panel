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
  Spin,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { getApiError } from '@/api/client'
import { saveResource } from '@/lib/crud'
import { requireLT, normalizeLT } from '@/lib/lt'
import { toCyrillic } from '@/lib/translit'
import { localize, formatUZS } from '@/lib/localize'
import { formatDate } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'
import type { ImageValue } from '@/components/form/ImageUpload'
import type { LocalizedText } from '@/types/api'
import type {
  AccessType,
  Book,
  BookListParams,
  BookStatus,
  CreateBookInput,
  EditionFormat,
} from '@/types/book'
import { authorsApi } from '@/features/authors/api'
import { categoriesApi } from '@/features/categories/api'
import { collectionsApi } from '@/features/collections/api'
import { booksApi, listAdminBooks, uploadEditionContent } from './api'
import { BookFormFields, type SelectOption } from './BookFormFields'
import {
  ACCESS_TYPE_COLOR,
  ACCESS_TYPE_LABEL,
  ACCESS_TYPE_OPTIONS,
  FORMAT_LABEL,
  FORMAT_OPTIONS,
  STATUS_COLOR,
  STATUS_LABEL,
  STATUS_OPTIONS,
  uploadLimits,
} from './constants'

// Audio bobi — tartib + nom + fayl (Saqlашда yuklanadi). durationSeconds avtomat.
interface AudioChapter {
  order?: number
  title?: string
  file?: File | null
}
interface AudioGroup {
  narrator?: string
  chapters?: AudioChapter[]
  previewFile?: File | null
}
interface EbookGroup {
  pageCount?: number
  contentFile?: File | null
  previewFile?: File | null
}

interface BookFormValues {
  title: LocalizedText
  description?: LocalizedText
  accessType: AccessType
  price?: number
  publishedYear?: number
  isbn?: string
  sortOrder: number
  status: BookStatus
  authorIds?: string[]
  categoryIds?: string[]
  collectionIds?: string[]
  hasAudio: boolean
  audio?: AudioGroup
  hasEbook: boolean
  ebook?: EbookGroup
  cover?: ImageValue
}

const EMPTY_FORM: BookFormValues = {
  title: { uz: '' },
  description: { uz: '' },
  accessType: 'PURCHASE',
  sortOrder: 0,
  status: 'DRAFT',
  authorIds: [],
  categoryIds: [],
  collectionIds: [],
  hasAudio: false,
  audio: { chapters: [{ order: 0 }] },
  hasEbook: false,
  ebook: {},
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
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const [formError, setFormError] = useState<string[] | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
    const audioEd = book.editions.find((e) => e.format === 'AUDIO')
    const ebookEd = book.editions.find((e) => e.format === 'EBOOK')
    form.setFieldsValue({
      title: book.title,
      description: book.description ?? { uz: '' },
      accessType: book.accessType,
      price: book.price ?? undefined,
      publishedYear: book.publishedYear ?? undefined,
      isbn: book.isbn ?? '',
      sortOrder: book.sortOrder,
      status: book.status,
      authorIds: book.authors.map((a) => a.id),
      categoryIds: book.categories.map((c) => c.id),
      collectionIds: book.collections.map((c) => c.id),
      hasAudio: !!audioEd,
      // Mavjud boblar holat panelida ko'rinadi; bu yerда yangi/almashtiruv qo'shiladi.
      audio: { narrator: audioEd?.narrator ?? undefined, chapters: [] },
      hasEbook: !!ebookEd,
      ebook: { pageCount: ebookEd?.pageCount ?? undefined },
      cover: book.coverUrl ?? undefined,
    })
    setDrawerOpen(true)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await booksApi.remove(id)
      message.success(res.message || "O'chirildi")
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
      // 1) Kamida bitta format.
      if (!values.hasAudio && !values.hasEbook) {
        throw new Error('Kamida bitta format (audio yoki e-kitob) yoqing')
      }

      // Yoqilgan format uchun kontent fayli majburiy (yaratишда yoki yangi yoqilган
      // formatда). Tahrirlашда mavjud format uchun talab qilinmaydi — fayli bor.
      const audioExisted = !!editing?.editions.some((e) => e.format === 'AUDIO')
      const ebookExisted = !!editing?.editions.some((e) => e.format === 'EBOOK')
      if (values.hasAudio && !audioExisted) {
        const hasAudioFile = (values.audio?.chapters ?? []).some((c) => c.file)
        if (!hasAudioFile) {
          throw new Error('Audio format yoqilgan — kamida bitta audio fayl yuklang')
        }
      }
      if (values.hasEbook && !ebookExisted) {
        if (!values.ebook?.contentFile) {
          throw new Error('E-kitob format yoqilgan — e-kitob faylini yuklang')
        }
      }

      // Muqovasiz PUBLISHED bo'lmaydi (backend 400 cover_required_to_publish).
      const hasCover = values.cover instanceof File || typeof values.cover === 'string'
      if (values.status === 'PUBLISHED' && !hasCover) {
        throw new Error("Chop etish (PUBLISHED) uchun avval muqova yuklang")
      }

      // Yuklanadigan fayllarni (format + tur) yig'amiz va oldindan tekshiramiz.
      const fileChecks: { format: EditionFormat; kind: 'CONTENT' | 'PREVIEW'; file: File }[] = []
      if (values.hasAudio) {
        for (const ch of values.audio?.chapters ?? []) {
          if (ch.file) fileChecks.push({ format: 'AUDIO', kind: 'CONTENT', file: ch.file })
        }
        if (values.audio?.previewFile)
          fileChecks.push({ format: 'AUDIO', kind: 'PREVIEW', file: values.audio.previewFile })
      }
      if (values.hasEbook) {
        if (values.ebook?.contentFile)
          fileChecks.push({ format: 'EBOOK', kind: 'CONTENT', file: values.ebook.contentFile })
        if (values.ebook?.previewFile)
          fileChecks.push({ format: 'EBOOK', kind: 'PREVIEW', file: values.ebook.previewFile })
      }
      for (const fc of fileChecks) {
        const { accept, maxBytes } = uploadLimits(fc.format, fc.kind)
        if (!accept.includes(fc.file.type)) {
          throw new Error(`${FORMAT_LABEL[fc.format]} (${fc.kind}): format mos emas`)
        }
        if (fc.file.size > maxBytes) {
          const mb = Math.round(maxBytes / 1024 / 1024)
          throw new Error(`${FORMAT_LABEL[fc.format]} (${fc.kind}): fayl ${mb} MB dan katta`)
        }
      }

      // PUBLISHED + yangi muqova fayli: muqova create'дан KEYIN yuklanadi, shuning
      // uchun avval DRAFT/PROCESSING saqlaymiz, muqova yuklangach PUBLISHED qilamiz
      // (aks holda backend "cover_required_to_publish" beradi).
      const deferPublish = values.status === 'PUBLISHED' && values.cover instanceof File
      const effectiveStatus: BookStatus = deferPublish ? 'DRAFT' : values.status

      // 2) Kitobni saqlaymiz (+muqova) — javobda editions[].id keladi.
      const isPurchase = values.accessType === 'PURCHASE'
      const buildInput = (): CreateBookInput => {
        const editions: CreateBookInput['editions'] = []
        if (values.hasAudio) {
          // durationSeconds yuborilmaydi — audio fayldan avtomat aniqlanadi.
          editions.push({
            format: 'AUDIO',
            narrator: values.audio?.narrator?.trim() || null,
            isActive: true,
          })
        }
        if (values.hasEbook) {
          editions.push({
            format: 'EBOOK',
            pageCount: values.ebook?.pageCount ?? null,
            isActive: true,
          })
        }
        return {
          title: requireLT(values.title),
          description: normalizeLT(values.description),
          accessType: values.accessType,
          price: isPurchase ? (values.price ?? null) : null,
          publishedYear: values.publishedYear ?? null,
          isbn: values.isbn?.trim() || null,
          sortOrder: values.sortOrder ?? 0,
          status: effectiveStatus,
          authorIds: values.authorIds ?? [],
          categoryIds: values.categoryIds ?? [],
          collectionIds: values.collectionIds ?? [],
          editions,
          ...(values.cover === null ? { coverUrl: null } : {}),
        }
      }
      const saveRes = await saveResource({
        api: booksApi,
        editing,
        buildInput,
        image: values.cover,
      })
      const saved = saveRes.data
      // Qayta saqlash dublikat yaratmasligi uchun tahrirlash rejimiga o'tamiz.
      setEditing(saved)
      void queryClient.invalidateQueries({ queryKey: ['books'] })

      // 3) Kontent fayllarini orqada yuklaymiz (format bo'yicha edition'ga moslab).
      interface Job {
        editionId: string
        file: File
        kind: 'CONTENT' | 'PREVIEW'
        order: number
        title?: LocalizedText
      }
      const jobs: Job[] = []
      const audioEd = values.hasAudio
        ? saved.editions.find((e) => e.format === 'AUDIO')
        : undefined
      const ebookEd = values.hasEbook
        ? saved.editions.find((e) => e.format === 'EBOOK')
        : undefined
      if (audioEd) {
        ;(values.audio?.chapters ?? []).forEach((ch, i) => {
          if (!ch.file) return
          const t = ch.title?.trim()
          jobs.push({
            editionId: audioEd.id,
            file: ch.file,
            kind: 'CONTENT',
            order: ch.order ?? i,
            title: t ? { uz: t, 'uz-Cyrl': toCyrillic(t) } : undefined,
          })
        })
        if (values.audio?.previewFile)
          jobs.push({ editionId: audioEd.id, file: values.audio.previewFile, kind: 'PREVIEW', order: 0 })
      }
      if (ebookEd) {
        if (values.ebook?.contentFile)
          jobs.push({ editionId: ebookEd.id, file: values.ebook.contentFile, kind: 'CONTENT', order: 0 })
        if (values.ebook?.previewFile)
          jobs.push({ editionId: ebookEd.id, file: values.ebook.previewFile, kind: 'PREVIEW', order: 0 })
      }

      for (let i = 0; i < jobs.length; i++) {
        setUploadMsg(`Fayl yuklanmoqda (${i + 1}/${jobs.length})…`)
        await uploadEditionContent(
          jobs[i].editionId,
          jobs[i].file,
          jobs[i].kind,
          jobs[i].order,
          jobs[i].title,
        )
      }
      setUploadMsg(null)

      // Muqova yuklangach — kechiktirilган PUBLISHED'ни qo'llaymiz.
      if (deferPublish) {
        await booksApi.update(saved.id, { status: 'PUBLISHED' })
      }

      // Fayl yuklangan bo'lsa ham drawer darrov yopiladi; kontent fonда qayta
      // ishlanadi (holatни kitobни tahrirlab ochsangiz kuzatasiz).
      message.success(
        jobs.length
          ? 'Saqlandi — fayllar yuklandi, qayta ishlanmoqda'
          : saveRes.message || (editing ? 'Saqlandi' : "Qo'shildi"),
      )
      setDrawerOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['books'] })
    } catch (e) {
      const err = getApiError(e)
      setFormError(err.errors?.length ? err.errors : [err.message])
    } finally {
      setUploadMsg(null)
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
      title: 'Mualliflar',
      key: 'authors',
      render: (_, r) =>
        r.authors.length ? r.authors.map((a) => localize(a.name, lang)).join(', ') : '—',
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
      width: 120,
      fixed: 'right',
      render: (_, r) => (
        <Space>
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
        {uploadMsg ? (
          <Alert
            type="info"
            showIcon
            icon={<Spin size="small" />}
            style={{ marginBottom: 16 }}
            message={uploadMsg}
          />
        ) : (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Audio/e-kitob fayllarini formatlar bo'limida tanlang — Saqlашда avtomatik yuklanadi. Yuklash holatini (qayta ishlash) 'Kontent' tugmasида kuzating."
          />
        )}
        <Form<BookFormValues> form={form} layout="vertical" onFinish={handleFinish}>
          <BookFormFields
            authorOptions={authorOptions}
            categoryOptions={categoryOptions}
            collectionOptions={collectionOptions}
            optionsLoading={optionsLoading}
            editionIds={
              editing
                ? {
                    AUDIO: editing.editions.find((e) => e.format === 'AUDIO')?.id,
                    EBOOK: editing.editions.find((e) => e.format === 'EBOOK')?.id,
                  }
                : undefined
            }
          />
        </Form>
      </Drawer>
    </Card>
  )
}
