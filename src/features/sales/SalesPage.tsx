import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Table, Typography, Alert, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { getApiError } from '@/api/client'
import { localize, formatUZS } from '@/lib/localize'
import { formatDate } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'
import type { Sale } from '@/types/sale'
import { listSales } from './api'

const STATUS_COLOR: Record<string, string> = {
  PAID: 'success',
  PENDING: 'processing',
  FAILED: 'error',
}

export function SalesPage() {
  const lang = useAuthStore((s) => s.lang)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const salesQ = useQuery({
    queryKey: ['sales', { page, limit }],
    queryFn: () => listSales({ page, limit }),
    placeholderData: (prev) => prev,
  })

  const columns: ColumnsType<Sale> = [
    {
      title: 'Kitob',
      key: 'book',
      render: (_, r) =>
        r.book?.title ? localize(r.book.title, lang) : (r.bookId ?? '—'),
    },
    {
      title: 'Foydalanuvchi',
      key: 'user',
      render: (_, r) =>
        r.user?.fullName || r.user?.phone || r.user?.email || '—',
    },
    {
      title: 'Summa',
      key: 'amount',
      width: 150,
      align: 'right',
      render: (_, r) => formatUZS(r.amount ?? r.price ?? 0),
    },
    {
      title: 'Holat',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s?: string) =>
        s ? <Tag color={STATUS_COLOR[s] ?? 'default'}>{s}</Tag> : '—',
    },
    {
      title: 'Sana',
      key: 'date',
      width: 160,
      render: (_, r) => formatDate(r.paidAt ?? r.createdAt),
    },
  ]

  const meta = salesQ.data?.meta

  return (
    <Card title={<Typography.Title level={4} style={{ margin: 0 }}>Sotuvlar</Typography.Title>}>
      {salesQ.isError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Sotuvlarni yuklab bo'lmadi"
          description={getApiError(salesQ.error).message}
        />
      )}
      <Table<Sale>
        rowKey="id"
        size="middle"
        loading={salesQ.isLoading}
        dataSource={salesQ.data?.items ?? []}
        columns={columns}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: meta?.page ?? page,
          pageSize: meta?.limit ?? limit,
          total: meta?.total ?? salesQ.data?.items.length ?? 0,
          showSizeChanger: true,
          showTotal: (t) => `Jami: ${t}`,
          onChange: (p, ps) => {
            setPage(p)
            setLimit(ps)
          },
        }}
      />
    </Card>
  )
}
