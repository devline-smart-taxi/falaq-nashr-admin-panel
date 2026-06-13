import { useState } from 'react'
import {
  Row,
  Col,
  Card,
  Statistic,
  Segmented,
  Alert,
  Table,
  Typography,
  Spin,
  Empty,
  Space,
  Tag,
} from 'antd'
import {
  UserOutlined,
  DollarOutlined,
  CrownOutlined,
  BookOutlined,
  WarningOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { ColumnsType } from 'antd/es/table'
import { getApiError } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { localize, formatUZS, formatNumber } from '@/lib/localize'
import type { TimeseriesMetric, TopBookRow } from '@/types/stats'
import {
  useStatsOverview,
  useStatsTimeseries,
  useTopBooks,
} from './hooks'

const METRIC_OPTIONS: { label: string; value: TimeseriesMetric }[] = [
  { label: 'Tushum', value: 'revenue' },
  { label: "Ro'yxatdan o'tish", value: 'signups' },
  { label: 'Obunalar', value: 'subscriptions' },
]

export function DashboardPage() {
  const lang = useAuthStore((s) => s.lang)
  const [metric, setMetric] = useState<TimeseriesMetric>('revenue')

  const overview = useStatsOverview()
  const timeseries = useStatsTimeseries({ metric, interval: 'day' })
  const topBooks = useTopBooks('sales', 10)

  const o = overview.data
  const showAmount = metric !== 'signups'

  const topBookColumns: ColumnsType<TopBookRow> = [
    {
      title: 'Kitob',
      dataIndex: 'title',
      key: 'title',
      render: (_, r) => localize(r.title, lang),
    },
    {
      title: 'Sotuvlar',
      dataIndex: 'salesCount',
      key: 'salesCount',
      width: 120,
      align: 'right',
      render: (v: number) => formatNumber(v),
    },
    {
      title: 'Tushum',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 160,
      align: 'right',
      render: (v: number) => formatUZS(v),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Dashboard
      </Typography.Title>

      {overview.isError && (
        <Alert
          type="error"
          showIcon
          message="Statistikani yuklab bo'lmadi"
          description={getApiError(overview.error).message}
        />
      )}

      {o && o.content.failed > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message={`Kontent yuklashda muammo: ${o.content.failed} ta fayl xato holatda (FAILED).`}
        />
      )}

      <Spin spinning={overview.isLoading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Foydalanuvchilar"
                value={o?.users.total ?? 0}
                prefix={<UserOutlined />}
              />
              <Typography.Text type="secondary">
                Faol: {formatNumber(o?.users.active)} · Bugun +{formatNumber(o?.users.newToday)}
              </Typography.Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Umumiy tushum"
                value={o?.sales.revenue ?? 0}
                formatter={(v) => formatUZS(Number(v))}
                prefix={<DollarOutlined />}
              />
              <Typography.Text type="secondary">
                Bu oy: {formatUZS(o?.sales.revenueThisMonth)}
              </Typography.Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Faol obunalar"
                value={o?.subscriptions.active ?? 0}
                prefix={<CrownOutlined />}
              />
              <Typography.Text type="secondary">
                Tugayotgan: {formatNumber(o?.subscriptions.expiringSoon)}
              </Typography.Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Kitoblar"
                value={o?.books.total ?? 0}
                prefix={<BookOutlined />}
              />
              <Typography.Text type="secondary">
                Chop etilgan: {formatNumber(o?.books.published)}
              </Typography.Text>
            </Card>
          </Col>
        </Row>
      </Spin>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card size="small">
            <Statistic
              title="Bugungi tushum"
              value={o?.sales.revenueToday ?? 0}
              formatter={(v) => formatUZS(Number(v))}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card size="small">
            <Statistic title="To'langan sotuvlar" value={o?.sales.paidCount ?? 0} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card size="small">
            <Space size="large" wrap>
              <Statistic title="Tayyor kontent" value={o?.content.ready ?? 0} />
              <Statistic title="Jarayonda" value={o?.content.processing ?? 0} />
              <Statistic
                title="Faol o'quvchilar"
                value={o?.engagement.activeReaders ?? 0}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title="Trend"
        extra={
          <Segmented
            options={METRIC_OPTIONS}
            value={metric}
            onChange={(v) => setMetric(v as TimeseriesMetric)}
          />
        }
      >
        <Spin spinning={timeseries.isLoading}>
          {timeseries.data && timeseries.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={timeseries.data} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={70} />
                <Tooltip
                  formatter={(value) =>
                    showAmount ? formatUZS(Number(value)) : formatNumber(Number(value))
                  }
                />
                <Line
                  type="monotone"
                  dataKey={showAmount ? 'amount' : 'count'}
                  name={showAmount ? 'Summa' : 'Soni'}
                  stroke="#1677ff"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="Ma'lumot yo'q" />
          )}
        </Spin>
      </Card>

      <Card title="Eng ko'p sotilgan kitoblar">
        {topBooks.isError ? (
          <Alert type="error" showIcon message={getApiError(topBooks.error).message} />
        ) : (
          <Table<TopBookRow>
            rowKey="bookId"
            size="small"
            loading={topBooks.isLoading}
            dataSource={topBooks.data ?? []}
            columns={topBookColumns}
            pagination={false}
            locale={{ emptyText: <Empty description="Sotuvlar yo'q" /> }}
            footer={() => (
              <Tag color="blue">Jami: {topBooks.data?.length ?? 0} ta kitob</Tag>
            )}
          />
        )}
      </Card>
    </Space>
  )
}
