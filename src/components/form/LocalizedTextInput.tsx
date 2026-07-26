import { useState } from 'react'
import { Input, Space, Tooltip, Form } from 'antd'
import { SyncOutlined } from '@ant-design/icons'
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
 * LocalizedText (ko'p tilli) maydon. To'rt til ham (uz lotin, uz kirill, ru, en)
 * doim ko'rinib turadi. Foydalanuvchi lotinда yozadi — `uz-Cyrl` avto-transliteratsiya
 * qilinadi (qo'lda tahrirlasa bosilmaydi). Validatsiya xatosida to'ldirilmagan
 * maydonlar qizil chegara oladi.
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
  const { status } = Form.Item.useStatus()

  const Field = multiline ? Input.TextArea : Input
  const autoSize = multiline ? { minRows: 2, maxRows: 6 } : undefined

  // Xato bo'lganда bo'sh maydonni qizartirish uchun.
  const errIfEmpty = (text?: string) =>
    status === 'error' && !text?.trim() ? 'error' : undefined

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
        status={errIfEmpty(v.uz)}
        placeholder={placeholder ?? "O'zbekcha (lotin)"}
        autoSize={autoSize}
      />

      <Field
        value={v['uz-Cyrl'] ?? ''}
        onChange={(e) => {
          setCyrTouched(true)
          emit({ 'uz-Cyrl': e.target.value })
        }}
        status={errIfEmpty(v['uz-Cyrl'])}
        placeholder="Ўзбекча (кирилл) — авто"
        autoSize={autoSize}
        addonAfter={
          <Tooltip title="Lotin'dan qayta hisoblash">
            <SyncOutlined onClick={resync} style={{ cursor: 'pointer' }} />
          </Tooltip>
        }
      />

      <Field
        value={v.ru ?? ''}
        onChange={(e) => emit({ ru: e.target.value })}
        status={errIfEmpty(v.ru)}
        placeholder="Русский"
        autoSize={autoSize}
      />

      <Field
        value={v.en ?? ''}
        onChange={(e) => emit({ en: e.target.value })}
        status={errIfEmpty(v.en)}
        placeholder="English"
        autoSize={autoSize}
      />
    </Space>
  )
}
