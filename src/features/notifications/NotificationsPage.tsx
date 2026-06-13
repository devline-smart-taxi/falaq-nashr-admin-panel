import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Form, Input, Select, Button, App, Typography, Alert, Space } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { getApiError } from '@/api/client'
import { localize } from '@/lib/localize'
import { useAuthStore } from '@/stores/auth'
import { booksApi } from '@/features/books/api'
import { sendBroadcast, type BroadcastInput, type NotificationType } from './api'

const TYPE_OPTIONS: { value: NotificationType; label: string }[] = [
  { value: 'NEW_BOOK', label: 'Yangi kitob' },
  { value: 'PROMO', label: 'Aksiya / promo' },
  { value: 'REMINDER', label: 'Eslatma' },
  { value: 'LICENSE_EXPIRY', label: 'Litsenziya tugashi' },
]

export function NotificationsPage() {
  const lang = useAuthStore((s) => s.lang)
  const { message } = App.useApp()
  const [form] = Form.useForm<BroadcastInput>()
  const [sending, setSending] = useState(false)

  const booksQ = useQuery({
    queryKey: ['books', 'notify-options'],
    queryFn: () => booksApi.list({ limit: 100 }),
  })
  const bookOptions = (booksQ.data?.items ?? []).map((b) => ({
    value: b.id,
    label: localize(b.title, lang),
  }))

  async function onFinish(values: BroadcastInput) {
    setSending(true)
    try {
      await sendBroadcast({ ...values, refId: values.refId || undefined })
      message.success('Bildirishnoma navbatga qo‘shildi')
      form.resetFields()
    } catch (e) {
      message.error(getApiError(e).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <Card title={<Typography.Title level={4} style={{ margin: 0 }}>Bildirishnoma yuborish</Typography.Title>}>
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="Diqqat: bu barcha foydalanuvchilarga yuboriladi."
      />
      <Form<BroadcastInput>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ maxWidth: 560 }}
        initialValues={{ type: 'NEW_BOOK' }}
      >
        <Form.Item name="type" label="Turi" rules={[{ required: true }]}>
          <Select options={TYPE_OPTIONS} />
        </Form.Item>

        <Form.Item
          name="title"
          label="Sarlavha"
          rules={[{ required: true, message: 'Sarlavha majburiy' }]}
        >
          <Input placeholder="Bildirishnoma sarlavhasi" maxLength={120} showCount />
        </Form.Item>

        <Form.Item
          name="body"
          label="Matn"
          rules={[{ required: true, message: 'Matn majburiy' }]}
        >
          <Input.TextArea
            placeholder="Bildirishnoma matni"
            autoSize={{ minRows: 3, maxRows: 6 }}
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="refId"
          label="Bog'liq kitob (ixtiyoriy)"
          tooltip="Ilovada chuqur havola uchun — odatda 'Yangi kitob' turi bilan"
        >
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Kitob tanlang"
            options={bookOptions}
            loading={booksQ.isLoading}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={sending}
            >
              Yuborish
            </Button>
            <Button onClick={() => form.resetFields()}>Tozalash</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}
