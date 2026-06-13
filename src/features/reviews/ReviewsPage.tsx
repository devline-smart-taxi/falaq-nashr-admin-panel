import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  Table,
  Button,
  Select,
  Popconfirm,
  App,
  Typography,
  Alert,
  Rate,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined } from '@ant-design/icons'
import { getApiError } from '@/api/client'
import { localize } from '@/lib/localize'
import { formatDate } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'
import { booksApi } from '@/features/books/api'
import type { Review } from '@/types/review'
import { listReviews, deleteReview } from './api'

export function ReviewsPage() {
  const lang = useAuthStore((s) => s.lang)
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [bookId, setBookId] = useState<string | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const booksQ = useQuery({
    queryKey: ['books', 'review-options'],
    queryFn: () => booksApi.list({ limit: 100 }),
  })

  const bookMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const b of booksQ.data?.items ?? []) m.set(b.id, localize(b.title, lang))
    return m
  }, [booksQ.data, lang])

  const bookOptions = useMemo(
    () => (booksQ.data?.items ?? []).map((b) => ({ value: b.id, label: localize(b.title, lang) })),
    [booksQ.data, lang],
  )

  const reviewsQ = useQuery({
    queryKey: ['reviews', { page, limit, bookId }],
    queryFn: () => listReviews({ page, limit, bookId }),
    placeholderData: (prev) => prev,
  })

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteReview(id)
      message.success("Sharh o'chirildi")
      void queryClient.invalidateQueries({ queryKey: ['reviews'] })
    } catch (e) {
      message.error(getApiError(e).message)
    } finally {
      setDeletingId(null)
    }
  }

  const columns: ColumnsType<Review> = [
    {
      title: 'Reyting',
      dataIndex: 'rating',
      key: 'rating',
      width: 150,
      render: (v: number) => <Rate disabled value={v} style={{ fontSize: 14 }} />,
    },
    {
      title: 'Foydalanuvchi',
      dataIndex: 'userName',
      key: 'userName',
      width: 160,
    },
    {
      title: 'Kitob',
      dataIndex: 'bookId',
      key: 'bookId',
      width: 200,
      render: (id: string) => bookMap.get(id) ?? id,
    },
    {
      title: 'Matn',
      dataIndex: 'text',
      key: 'text',
      render: (t: string | null) => t || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Sana',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Amallar',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, r) => (
        <Popconfirm
          title="Sharh o'chirilsinmi?"
          okText="O'chirish"
          okButtonProps={{ danger: true }}
          cancelText="Bekor"
          onConfirm={() => handleDelete(r.id)}
        >
          <Button size="small" danger icon={<DeleteOutlined />} loading={deletingId === r.id} />
        </Popconfirm>
      ),
    },
  ]

  const meta = reviewsQ.data?.meta

  return (
    <Card
      title={<Typography.Title level={4} style={{ margin: 0 }}>Sharhlar</Typography.Title>}
      extra={
        <Select
          placeholder="Kitob bo'yicha filtr"
          allowClear
          showSearch
          optionFilterProp="label"
          style={{ width: 260 }}
          options={bookOptions}
          loading={booksQ.isLoading}
          onChange={(v) => {
            setBookId(v)
            setPage(1)
          }}
        />
      }
    >
      {reviewsQ.isError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Sharhlarni yuklab bo'lmadi"
          description={getApiError(reviewsQ.error).message}
        />
      )}

      <Table<Review>
        rowKey="id"
        size="middle"
        loading={reviewsQ.isLoading}
        dataSource={reviewsQ.data?.items ?? []}
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
    </Card>
  )
}
