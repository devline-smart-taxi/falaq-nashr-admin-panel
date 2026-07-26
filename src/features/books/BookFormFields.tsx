import {
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Card,
  Divider,
  Switch,
  Typography,
  Button,
} from 'antd'
import {
  SoundOutlined,
  ReadOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { LocalizedTextInput } from '@/components/form/LocalizedTextInput'
import { QuickCreateSelect } from '@/components/form/QuickCreateSelect'
import { ImageUpload } from '@/components/form/ImageUpload'
import { FileField } from '@/components/form/FileField'
import { EditionAssetStatus } from './EditionAssetStatus'
import { EbookTocEditor } from './EbookTocEditor'
import { requiredLTRule, optionalLTRule } from '@/lib/lt'
import { ACCESS_TYPE_OPTIONS, STATUS_OPTIONS, uploadLimits, uploadHint } from './constants'
import type { EditionFormat } from '@/types/book'
import type { LocalizedText } from '@/types/api'

export interface SelectOption {
  value: string
  label: string
}

const AUDIO_ACCEPT = uploadLimits('AUDIO', 'CONTENT').accept.join(',')

/** AntD validator: massiv bo'sh bo'lmasligini tekshiradi (ko'p-tanlovли select). */
const requireNonEmpty =
  (message: string) =>
  (_: unknown, value: unknown[] | undefined) =>
    value && value.length ? Promise.resolve() : Promise.reject(new Error(message))

interface Props {
  authorOptions: SelectOption[]
  categoryOptions: SelectOption[]
  collectionOptions: SelectOption[]
  optionsLoading?: boolean
  /** Select ichида tez yaratish — nomдан yangi element yaratib {value,label} qaytaradi. */
  createAuthor: (name: LocalizedText) => Promise<SelectOption>
  createCategory: (name: LocalizedText) => Promise<SelectOption>
  createCollection: (name: LocalizedText) => Promise<SelectOption>
  /** Tahrirlашда mavjud edition id'lari (holat paneli ko'rsatish uchun). */
  editionIds?: Partial<Record<EditionFormat, string>>
}

/** Format fayllari (to'liq + namuna) — Saqlашда avtomatik yuklanadi. */
function ContentFileFields({
  group,
  format,
}: {
  group: 'audio' | 'ebook'
  format: EditionFormat
}) {
  const acceptStr = uploadLimits(format, 'CONTENT').accept.join(',')
  return (
    <Space align="start" wrap>
      <Form.Item
        name={[group, 'contentFile']}
        label="To'liq fayl"
        extra={uploadHint(format, 'CONTENT')}
      >
        <FileField accept={acceptStr} />
      </Form.Item>
      <Form.Item
        name={[group, 'previewFile']}
        label="Namuna (ixtiyoriy)"
        extra={uploadHint(format, 'PREVIEW')}
      >
        <FileField accept={acceptStr} placeholder="Namuna fayli" />
      </Form.Item>
    </Space>
  )
}

export function BookFormFields({
  authorOptions,
  categoryOptions,
  collectionOptions,
  optionsLoading,
  createAuthor,
  createCategory,
  createCollection,
  editionIds,
}: Props) {
  return (
    <>
      <Form.Item name="title" label="Sarlavha" required rules={[requiredLTRule]}>
        <LocalizedTextInput placeholder="Masalan: Oʻtkan kunlar" />
      </Form.Item>

      <Form.Item name="description" label="Tavsif" required rules={[requiredLTRule]}>
        <LocalizedTextInput multiline placeholder="Kitob haqida" />
      </Form.Item>

      <Form.Item
        name="cover"
        label="Muqova"
        required
        rules={[
          {
            validator: (_, v) =>
              v instanceof File || typeof v === 'string'
                ? Promise.resolve()
                : Promise.reject(new Error('Muqova majburiy')),
          },
        ]}
      >
        <ImageUpload />
      </Form.Item>

      <Space size="middle" style={{ display: 'flex' }} align="start">
        <Form.Item name="accessType" label="Kirish modeli" style={{ flex: 1 }}>
          <Select options={ACCESS_TYPE_OPTIONS} style={{ minWidth: 160 }} />
        </Form.Item>

        {/* Narx faqat PURCHASE'da */}
        <Form.Item noStyle shouldUpdate={(p, c) => p.accessType !== c.accessType}>
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

      <Form.Item
        name="authorIds"
        label="Mualliflar"
        required
        rules={[{ validator: requireNonEmpty('Kamida bitta muallif') }]}
      >
        <QuickCreateSelect
          placeholder="Muallif(lar) tanlang"
          options={authorOptions}
          loading={optionsLoading}
          entityLabel="muallif"
          createFn={createAuthor}
        />
      </Form.Item>

      <Form.Item
        name="categoryIds"
        label="Kategoriyalar"
        required
        rules={[{ validator: requireNonEmpty('Kamida bitta kategoriya') }]}
      >
        <QuickCreateSelect
          placeholder="Kategoriyalar"
          options={categoryOptions}
          loading={optionsLoading}
          entityLabel="kategoriya"
          createFn={createCategory}
        />
      </Form.Item>

      <Form.Item
        name="collectionIds"
        label="Kolleksiyalar"
        required
        rules={[{ validator: requireNonEmpty('Kamida bitta kolleksiya') }]}
      >
        <QuickCreateSelect
          placeholder="Kolleksiyalar"
          options={collectionOptions}
          loading={optionsLoading}
          entityLabel="kolleksiya"
          createFn={createCollection}
        />
      </Form.Item>

      <Divider titlePlacement="left">
        Formatlar <span style={{ color: '#ff4d4f' }}>*</span>
      </Divider>
      <Typography.Paragraph type="secondary" style={{ marginTop: -8 }}>
        Kitobда qaysi format(lar) borligini yoqing — kamida bittasi.
      </Typography.Paragraph>
      <Form.Item
        noStyle
        shouldUpdate={(p, c) => p.hasAudio !== c.hasAudio || p.hasEbook !== c.hasEbook}
      >
        {({ getFieldValue }) =>
          !getFieldValue('hasAudio') && !getFieldValue('hasEbook') ? (
            <Typography.Paragraph type="danger" style={{ marginTop: -8 }}>
              Kamida bitta format (audio yoki e-kitob) yoqilishi shart.
            </Typography.Paragraph>
          ) : null
        }
      </Form.Item>

      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* AUDIO */}
        <Card
          size="small"
          title={
            <Space>
              <SoundOutlined /> Audio
            </Space>
          }
          extra={
            <Form.Item name="hasAudio" valuePropName="checked" noStyle>
              <Switch checkedChildren="Bor" unCheckedChildren="Yo'q" />
            </Form.Item>
          }
        >
          <Form.Item noStyle shouldUpdate={(p, c) => p.hasAudio !== c.hasAudio}>
            {({ getFieldValue }) =>
              getFieldValue('hasAudio') ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form.Item
                    name={['audio', 'narrator']}
                    label="Diktor"
                    tooltip="Davomiyligi audio fayldan avtomat aniqlanadi — qo'lda kiritish shart emas."
                  >
                    <Input placeholder="Diktor ismi" style={{ width: 180 }} />
                  </Form.Item>

                  <Typography.Text strong>Audio fayl(lar)</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Bitta fayl bo'lsa — bitta bob (tartib 0, nom shart emas). Ko'p bobli
                    bo'lsa, har bobni tartib bilan qo'shing.
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Qabul qilinadi: {uploadHint('AUDIO', 'CONTENT')}
                  </Typography.Text>

                  <Form.List name={['audio', 'chapters']}>
                    {(chapters, { add, remove }) => (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {chapters.map((ch, i) => (
                          <Card
                            key={ch.key}
                            size="small"
                            type="inner"
                            title={`${i + 1}-bob`}
                            extra={
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => remove(ch.name)}
                              >
                                O'chirish
                              </Button>
                            }
                          >
                            <Space align="start" wrap>
                              <Form.Item
                                name={[ch.name, 'order']}
                                label="Tartib"
                                initialValue={ch.name}
                              >
                                <InputNumber min={0} style={{ width: 80 }} />
                              </Form.Item>
                              <Form.Item
                                name={[ch.name, 'title']}
                                label="Bob nomi (ixtiyoriy)"
                                style={{ width: 260 }}
                                rules={[optionalLTRule]}
                              >
                                <LocalizedTextInput placeholder="masalan: 1-bob" />
                              </Form.Item>
                              <Form.Item name={[ch.name, 'file']} label="Fayl">
                                <FileField accept={AUDIO_ACCEPT} />
                              </Form.Item>
                            </Space>
                          </Card>
                        ))}
                        <Button
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={() => add({ order: chapters.length })}
                        >
                          Bob / fayl qo'shish
                        </Button>
                      </Space>
                    )}
                  </Form.List>

                  <Form.Item
                    name={['audio', 'previewFile']}
                    label="Namuna (ixtiyoriy)"
                    extra={uploadHint('AUDIO', 'PREVIEW')}
                  >
                    <FileField accept={AUDIO_ACCEPT} placeholder="Namuna fayli" />
                  </Form.Item>

                  {editionIds?.AUDIO && <EditionAssetStatus editionId={editionIds.AUDIO} />}
                </Space>
              ) : (
                <Typography.Text type="secondary">
                  O'chiq — yoqish uchun yuqoridagi kalitni bosing.
                </Typography.Text>
              )
            }
          </Form.Item>
        </Card>

        {/* E-KITOB */}
        <Card
          size="small"
          title={
            <Space>
              <ReadOutlined /> E-kitob
            </Space>
          }
          extra={
            <Form.Item name="hasEbook" valuePropName="checked" noStyle>
              <Switch checkedChildren="Bor" unCheckedChildren="Yo'q" />
            </Form.Item>
          }
        >
          <Form.Item noStyle shouldUpdate={(p, c) => p.hasEbook !== c.hasEbook}>
            {({ getFieldValue }) =>
              getFieldValue('hasEbook') ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form.Item
                    name={['ebook', 'pageCount']}
                    label="Sahifalar soni"
                    tooltip="Taxminiy (EPUB reflowable — qat'iy bet yo'q)"
                  >
                    <InputNumber min={0} style={{ width: 160 }} />
                  </Form.Item>
                  <ContentFileFields group="ebook" format="EBOOK" />
                  {editionIds?.EBOOK && (
                    <>
                      <EditionAssetStatus editionId={editionIds.EBOOK} />
                      <EbookTocEditor editionId={editionIds.EBOOK} />
                    </>
                  )}
                </Space>
              ) : (
                <Typography.Text type="secondary">
                  O'chiq — yoqish uchun yuqoridagi kalitni bosing.
                </Typography.Text>
              )
            }
          </Form.Item>
        </Card>
      </Space>
    </>
  )
}
