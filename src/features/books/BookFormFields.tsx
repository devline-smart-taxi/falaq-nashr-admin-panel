import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Card,
  Divider,
  Typography,
} from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { LocalizedTextInput } from '@/components/form/LocalizedTextInput'
import { ImageUpload } from '@/components/form/ImageUpload'
import { requiredLTRule } from '@/lib/lt'
import {
  ACCESS_TYPE_OPTIONS,
  STATUS_OPTIONS,
  FORMAT_OPTIONS,
} from './constants'
import type { EditionFormat } from '@/types/book'

export interface SelectOption {
  value: string
  label: string
}

interface Props {
  authorOptions: SelectOption[]
  categoryOptions: SelectOption[]
  collectionOptions: SelectOption[]
  optionsLoading?: boolean
}

export function BookFormFields({
  authorOptions,
  categoryOptions,
  collectionOptions,
  optionsLoading,
}: Props) {
  return (
    <>
      <Form.Item name="title" label="Sarlavha" rules={[requiredLTRule]}>
        <LocalizedTextInput placeholder="Masalan: Oʻtkan kunlar" />
      </Form.Item>

      <Form.Item name="description" label="Tavsif">
        <LocalizedTextInput multiline placeholder="Kitob haqida" />
      </Form.Item>

      <Form.Item name="cover" label="Muqova">
        <ImageUpload />
      </Form.Item>

      <Space size="middle" style={{ display: 'flex' }} align="start">
        <Form.Item name="accessType" label="Kirish modeli" style={{ flex: 1 }}>
          <Select options={ACCESS_TYPE_OPTIONS} style={{ minWidth: 160 }} />
        </Form.Item>

        {/* Narx faqat PURCHASE'da */}
        <Form.Item
          noStyle
          shouldUpdate={(p, c) => p.accessType !== c.accessType}
        >
          {({ getFieldValue }) =>
            getFieldValue('accessType') === 'PURCHASE' ? (
              <Form.Item
                name="price"
                label="Narx (so'm)"
                rules={[{ required: true, message: 'Narx majburiy' }]}
                style={{ flex: 1 }}
              >
                <InputNumber<number>
                  min={0}
                  step={1000}
                  style={{ width: '100%', minWidth: 160 }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                  parser={(v) => Number((v ?? '').replace(/\s/g, ''))}
                />
              </Form.Item>
            ) : null
          }
        </Form.Item>
      </Space>

      <Space size="middle" wrap>
        <Form.Item name="status" label="Holat">
          <Select options={STATUS_OPTIONS} style={{ width: 160 }} />
        </Form.Item>
        <Form.Item name="publishedYear" label="Nashr yili">
          <InputNumber min={0} max={9999} style={{ width: 120 }} controls={false} />
        </Form.Item>
        <Form.Item name="sortOrder" label="Tartib">
          <InputNumber min={0} style={{ width: 100 }} />
        </Form.Item>
      </Space>

      <Form.Item name="isbn" label="ISBN">
        <Input placeholder="978-9943-..." />
      </Form.Item>

      <Form.Item name="authorId" label="Muallif">
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Muallif tanlang"
          options={authorOptions}
          loading={optionsLoading}
        />
      </Form.Item>

      <Form.Item name="categoryIds" label="Kategoriyalar">
        <Select
          mode="multiple"
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Kategoriyalar"
          options={categoryOptions}
          loading={optionsLoading}
        />
      </Form.Item>

      <Form.Item name="collectionIds" label="Kolleksiyalar">
        <Select
          mode="multiple"
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Kolleksiyalar"
          options={collectionOptions}
          loading={optionsLoading}
        />
      </Form.Item>

      <Divider titlePlacement="left">Formatlar (editions)</Divider>
      <Typography.Paragraph type="secondary" style={{ marginTop: -8 }}>
        Kamida bitta format. Har format (Audio / E-kitob) bir martadan ortiq bo'lmasin.
      </Typography.Paragraph>

      <Form.List
        name="editions"
        rules={[
          {
            validator: async (_, editions) => {
              const list = (editions ?? []) as { format?: EditionFormat }[]
              if (list.length < 1) {
                return Promise.reject(new Error('Kamida bitta format qo‘shing'))
              }
              const formats = list.map((e) => e?.format).filter(Boolean)
              if (new Set(formats).size !== formats.length) {
                return Promise.reject(new Error('Har format faqat bir marta bo‘lsin'))
              }
              return Promise.resolve()
            },
          },
        ]}
      >
        {(fields, { add, remove }, { errors }) => (
          <Space direction="vertical" style={{ width: '100%' }}>
            {fields.map((field) => (
              <Card
                key={field.key}
                size="small"
                extra={
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => remove(field.name)}
                  />
                }
              >
                <Space align="start" wrap>
                  <Form.Item
                    name={[field.name, 'format']}
                    label="Format"
                    rules={[{ required: true, message: 'Format' }]}
                  >
                    <Select options={FORMAT_OPTIONS} style={{ width: 140 }} />
                  </Form.Item>

                  <Form.Item
                    noStyle
                    shouldUpdate={(p, c) =>
                      p.editions?.[field.name]?.format !==
                      c.editions?.[field.name]?.format
                    }
                  >
                    {({ getFieldValue }) => {
                      const fmt = getFieldValue(['editions', field.name, 'format'])
                      if (fmt === 'AUDIO') {
                        return (
                          <Space align="start" wrap>
                            <Form.Item name={[field.name, 'narrator']} label="Diktor">
                              <Input placeholder="Diktor ismi" style={{ width: 180 }} />
                            </Form.Item>
                            <Form.Item
                              name={[field.name, 'durationSeconds']}
                              label="Davomiyligi (soniya)"
                            >
                              <InputNumber min={0} style={{ width: 160 }} />
                            </Form.Item>
                          </Space>
                        )
                      }
                      if (fmt === 'EBOOK') {
                        return (
                          <Form.Item
                            name={[field.name, 'pageCount']}
                            label="Sahifalar soni"
                          >
                            <InputNumber min={0} style={{ width: 160 }} />
                          </Form.Item>
                        )
                      }
                      return null
                    }}
                  </Form.Item>
                </Space>
              </Card>
            ))}

            <Button
              type="dashed"
              block
              icon={<PlusOutlined />}
              onClick={() => add({ format: undefined, isActive: true })}
            >
              Format qo'shish
            </Button>
            <Form.ErrorList errors={errors} />
          </Space>
        )}
      </Form.List>
    </>
  )
}
