import { useQuery } from '@tanstack/react-query'
import {
  App,
  Alert,
  Button,
  Card,
  Form,
  Input,
  Space,
  Spin,
  Typography,
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  PhoneOutlined,
  ShareAltOutlined,
} from '@ant-design/icons'
import { getApiError } from '@/api/client'
import { LocalizedTextInput } from '@/components/form/LocalizedTextInput'
import { requireLT, requiredLTRule } from '@/lib/lt'
import type { LocalizedText } from '@/types/api'
import type { ContactSettings } from '@/types/settings'
import { getContacts, updateContacts } from './api'

interface FormValues {
  phones: string[]
  socials: { name: LocalizedText; link: string }[]
}

/**
 * Sozlamalar — mobil ilovaning "Yordam / Support" ekranidagi telefon raqamlar va
 * ijtimoiy tarmoqlar. GET /settings (ochiq) o'qiydi, PUT /admin/settings/contacts saqlaydi.
 */
export function SettingsPage() {
  const { message } = App.useApp()
  const [form] = Form.useForm<FormValues>()

  const query = useQuery({ queryKey: ['settings', 'contacts'], queryFn: getContacts })

  async function onFinish(values: FormValues) {
    const value: ContactSettings = {
      phones: (values.phones ?? []).map((p) => (p ?? '').trim()).filter(Boolean),
      socials: (values.socials ?? [])
        .filter((s) => s?.link?.trim())
        .map((s) => ({ name: requireLT(s.name), link: s.link.trim() })),
    }
    try {
      const { message: m } = await updateContacts(value)
      // Formani saqlangan (tozalangan) qiymatlar bilan yangilaymiz.
      form.setFieldsValue(value)
      message.success(m || 'Sozlamalar saqlandi')
    } catch (e) {
      message.error(getApiError(e).message)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 760 }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Sozlamalar
      </Typography.Title>

      {query.isError ? (
        <Alert
          type="error"
          showIcon
          message="Sozlamalarni yuklab bo'lmadi"
          description={getApiError(query.error).message}
          action={
            <Button size="small" onClick={() => void query.refetch()}>
              Qayta urinish
            </Button>
          }
        />
      ) : (
        <Spin spinning={query.isLoading}>
          {query.data && (
            <Form<FormValues>
              form={form}
              layout="vertical"
              initialValues={query.data}
              onFinish={onFinish}
              onFinishFailed={() =>
                message.error("Formada xatolar bor — qizil maydonlarni to'ldiring")
              }
            >
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message="Bu ma'lumotlar mobil ilovaning “Yordam / Support” ekranida ko'rinadi."
              />

              {/* --- Telefon raqamlar --- */}
              <Card
                size="small"
                title={
                  <Space>
                    <PhoneOutlined />
                    Telefon raqamlar
                  </Space>
                }
                style={{ marginBottom: 16 }}
              >
                <Form.List name="phones">
                  {(fields, { add, remove }) => (
                    <Space direction="vertical" style={{ width: '100%' }} size={8}>
                      {fields.map((field) => (
                        <Space key={field.key} align="baseline" style={{ width: '100%' }}>
                          <Form.Item
                            name={field.name}
                            style={{ marginBottom: 0, flex: 1 }}
                            rules={[{ required: true, message: 'Raqam kiriting' }]}
                          >
                            <Input
                              placeholder="+998 90 123 45 67"
                              style={{ width: 280 }}
                              allowClear
                            />
                          </Form.Item>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(field.name)}
                            aria-label="Raqamni o'chirish"
                          />
                        </Space>
                      ))}
                      <Button type="dashed" icon={<PlusOutlined />} onClick={() => add('')}>
                        Raqam qo'shish
                      </Button>
                    </Space>
                  )}
                </Form.List>
              </Card>

              {/* --- Ijtimoiy tarmoqlar --- */}
              <Card
                size="small"
                title={
                  <Space>
                    <ShareAltOutlined />
                    Ijtimoiy tarmoqlar
                  </Space>
                }
                style={{ marginBottom: 16 }}
              >
                <Form.List name="socials">
                  {(fields, { add, remove }) => (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      {fields.map((field, i) => (
                        <Card
                          key={field.key}
                          size="small"
                          type="inner"
                          title={`${i + 1}-tarmoq`}
                          extra={
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => remove(field.name)}
                            >
                              O'chirish
                            </Button>
                          }
                        >
                          <Form.Item
                            name={[field.name, 'name']}
                            label="Nom (ko'p tilli)"
                            required
                            rules={[requiredLTRule]}
                          >
                            <LocalizedTextInput placeholder="Masalan: Telegram orqali bog'lanish" />
                          </Form.Item>
                          <Form.Item
                            name={[field.name, 'link']}
                            label="Havola"
                            style={{ marginBottom: 0 }}
                            rules={[
                              { required: true, message: 'Havola majburiy' },
                              { type: 'url', message: "To'g'ri havola kiriting (https://...)" },
                            ]}
                          >
                            <Input placeholder="https://t.me/falaq" allowClear />
                          </Form.Item>
                        </Card>
                      ))}
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={() => add({ name: { uz: '' }, link: '' })}
                      >
                        Tarmoq qo'shish
                      </Button>
                    </Space>
                  )}
                </Form.List>
              </Card>

              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Saqlash
              </Button>
            </Form>
          )}
        </Spin>
      )}
    </Space>
  )
}
