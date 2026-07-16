import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Drawer,
  Form,
  Popconfirm,
  App,
  Typography,
  Alert,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import type { CrudApi } from '@/lib/crud'
import { getApiError } from '@/api/client'

interface WithId {
  id: string
}

export interface ResourceListPageProps<T extends WithId, V extends object> {
  title: string
  /** React Query kesh kaliti (masalan 'authors'). */
  queryKey: string
  /** Faqat ro'yxat va o'chirish kerak — yaratish/yangilash `onSubmit` ichida. */
  api: Pick<CrudApi<T, unknown, unknown>, 'list' | 'remove'>
  /** Ma'lumot ustunlari (amallar ustuni avtomatik qo'shiladi). */
  columns: ColumnsType<T>
  searchable?: boolean
  newButtonLabel?: string
  drawerWidth?: number
  /** Drawer ichidagi forma maydonlari (Form konteksti orqali bog'lanadi). */
  renderFields: (editing: T | null) => React.ReactNode
  /** Tahrirlашда yozuvni forma qiymatlariga aylantiradi. */
  toFormValues: (record: T) => V
  /** Yangi yozuv uchun boshlang'ich forma qiymatlari. */
  initialValues: V
  /** Saqlash ketma-ketligi (create/update + rasm yuklash). Backend xabarini qaytarsa — toast'да ishlatiladi. */
  onSubmit: (values: V, editing: T | null) => Promise<string | void>
  /** Berilgan qator uchun tahrirlash/o'chirish o'chirib qo'yiladi (masalan SUPER_ADMIN). */
  rowReadonly?: (record: T) => boolean
}

export function ResourceListPage<T extends WithId, V extends object>({
  title,
  queryKey,
  api,
  columns,
  searchable = true,
  newButtonLabel = 'Yangi',
  drawerWidth = 520,
  renderFields,
  toFormValues,
  initialValues,
  onSubmit,
  rowReadonly,
}: ResourceListPageProps<T, V>) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<V>()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string[] | null>(null)

  const listKey = [queryKey, { page, limit, search }] as const
  const query = useQuery({
    queryKey: listKey,
    queryFn: () => api.list({ page, limit, search: search || undefined }),
    placeholderData: (prev) => prev,
  })

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: [queryKey] })
  }

  function openCreate() {
    setEditing(null)
    setFormError(null)
    form.resetFields()
    form.setFieldsValue(initialValues as never)
    setDrawerOpen(true)
  }

  function openEdit(record: T) {
    setEditing(record)
    setFormError(null)
    form.resetFields()
    form.setFieldsValue(toFormValues(record) as never)
    setDrawerOpen(true)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await api.remove(id)
      message.success(res.message || "O'chirildi")
      invalidate()
    } catch (e) {
      message.error(getApiError(e).message)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleFinish(values: V) {
    setSaving(true)
    setFormError(null)
    try {
      const msg = await onSubmit(values, editing)
      message.success(msg || (editing ? 'Saqlandi' : "Qo'shildi"))
      setDrawerOpen(false)
      invalidate()
    } catch (e) {
      const err = getApiError(e)
      setFormError(err.errors?.length ? err.errors : [err.message])
    } finally {
      setSaving(false)
    }
  }

  const actionColumn: ColumnsType<T>[number] = {
    title: 'Amallar',
    key: 'actions',
    width: 120,
    fixed: 'right',
    render: (_, record) => {
      const readonly = rowReadonly?.(record) ?? false
      return (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            disabled={readonly}
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="O'chirilsinmi?"
            description="Yozuv yashiriladi (soft-delete)."
            okText="O'chirish"
            okButtonProps={{ danger: true }}
            cancelText="Bekor"
            disabled={readonly}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              size="small"
              danger
              disabled={readonly}
              icon={<DeleteOutlined />}
              loading={deletingId === record.id}
            />
          </Popconfirm>
        </Space>
      )
    },
  }

  const meta = query.data?.meta

  return (
    <Card
      title={<Typography.Title level={4} style={{ margin: 0 }}>{title}</Typography.Title>}
      extra={
        <Space>
          {searchable && (
            <Input.Search
              placeholder="Qidirish..."
              allowClear
              style={{ width: 240 }}
              onSearch={(val) => {
                setSearch(val)
                setPage(1)
              }}
            />
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {newButtonLabel}
          </Button>
        </Space>
      }
    >
      {query.isError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Ro'yxatni yuklab bo'lmadi"
          description={getApiError(query.error).message}
        />
      )}

      <Table<T>
        rowKey="id"
        size="middle"
        loading={query.isLoading}
        dataSource={query.data?.items ?? []}
        columns={[...columns, actionColumn]}
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
        title={editing ? 'Tahrirlash' : newButtonLabel}
        width={drawerWidth}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose={false}
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
        <Form<V> form={form} layout="vertical" onFinish={handleFinish}>
          {renderFields(editing)}
        </Form>
      </Drawer>
    </Card>
  )
}
