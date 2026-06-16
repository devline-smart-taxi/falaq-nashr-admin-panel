import { useState } from 'react'
import { Input, Button, Space, Tooltip, Typography, Form } from 'antd'
import { SyncOutlined, GlobalOutlined } from '@ant-design/icons'
import type { LocalizedText } from '@/types/api'
import { toCyrillic } from '@/lib/translit'

interface Props {
  value?: LocalizedText
  onChange?: (value: LocalizedText) => void
  multiline?: boolean
  placeholder?: string
  /** uz dan uz-Cyrl avtomatik to'ldirilsinmi (default true). */
  autoCyrillic?: boolean
}

/**
 * LocalizedText (ko'p tilli) maydon. Foydalanuvchi lotinда yozadi —
 * `uz-Cyrl` avto-transliteratsiya qilinadi (qo'lda tahrirlasa bosilmaydi).
 * `ru`/`en` ixtiyoriy, "Boshqa tillar" tugmasi ostida.
 */
export function LocalizedTextInput({
  value,
  onChange,
  multiline,
  placeholder,
  autoCyrillic = true,
}: Props) {
  const v: LocalizedText = value ?? { uz: '' }
  const [cyrTouched, setCyrTouched] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const { status } = Form.Item.useStatus() // uz maydonини xatoда qizartirish uchun

  const Field = multiline ? Input.TextArea : Input

  function emit(patch: Partial<LocalizedText>) {
    onChange?.({ ...v, ...patch })
  }

  function onUz(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const uz = e.target.value
    const patch: Partial<LocalizedText> = { uz }
    if (autoCyrillic && !cyrTouched) patch['uz-Cyrl'] = toCyrillic(uz)
    emit(patch)
  }

  function resync() {
    setCyrTouched(false)
    emit({ 'uz-Cyrl': toCyrillic(v.uz) })
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={6}>
      <Field
        value={v.uz}
        onChange={onUz}
        status={status === 'error' ? 'error' : undefined}
        placeholder={placeholder ?? "O'zbekcha (lotin)"}
        autoSize={multiline ? { minRows: 2, maxRows: 6 } : undefined}
      />

      <Field
        value={v['uz-Cyrl'] ?? ''}
        onChange={(e) => {
          setCyrTouched(true)
          emit({ 'uz-Cyrl': e.target.value })
        }}
        placeholder="Ўзбекча (кирилл) — авто"
        autoSize={multiline ? { minRows: 2, maxRows: 6 } : undefined}
        addonAfter={
          <Tooltip title="Lotin'dan qayta hisoblash">
            <SyncOutlined onClick={resync} style={{ cursor: 'pointer' }} />
          </Tooltip>
        }
      />

      {showMore ? (
        <>
          <Field
            value={v.ru ?? ''}
            onChange={(e) => emit({ ru: e.target.value })}
            placeholder="Русский (ixtiyoriy)"
            autoSize={multiline ? { minRows: 2, maxRows: 6 } : undefined}
          />
          <Field
            value={v.en ?? ''}
            onChange={(e) => emit({ en: e.target.value })}
            placeholder="English (ixtiyoriy)"
            autoSize={multiline ? { minRows: 2, maxRows: 6 } : undefined}
          />
        </>
      ) : (
        <Button
          type="link"
          size="small"
          icon={<GlobalOutlined />}
          onClick={() => setShowMore(true)}
          style={{ paddingLeft: 0 }}
        >
          <Typography.Text type="secondary">Boshqa tillar (ru/en)</Typography.Text>
        </Button>
      )}
    </Space>
  )
}
