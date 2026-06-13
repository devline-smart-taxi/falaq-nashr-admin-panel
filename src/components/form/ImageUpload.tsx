import { Upload, App } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'

export type ImageValue = File | string | null | undefined

interface Props {
  value?: ImageValue
  onChange?: (value: File | null) => void
}

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB (FRONTEND_REACT.md §5)
const ACCEPT = 'image/jpeg,image/png,image/webp'

/**
 * Rasm tanlash. Fayl darrov yuklanmaydi — brauzerда (state) turadi va
 * "Saqlash"да yozuv yaratilgach yuklanadi. `value` string bo'lsa — mavjud rasm URL.
 */
export function ImageUpload({ value, onChange }: Props) {
  const { message } = App.useApp()

  const previewUrl =
    typeof value === 'string'
      ? value
      : value instanceof File
        ? URL.createObjectURL(value)
        : null

  const fileList: UploadFile[] = previewUrl
    ? [{ uid: '-1', name: 'rasm', status: 'done', url: previewUrl }]
    : []

  return (
    <Upload
      listType="picture-card"
      accept={ACCEPT}
      maxCount={1}
      fileList={fileList}
      beforeUpload={(file) => {
        const okType = ACCEPT.split(',').includes(file.type)
        if (!okType) {
          message.error('Faqat JPEG / PNG / WebP')
          return Upload.LIST_IGNORE
        }
        if (file.size > MAX_BYTES) {
          message.error('Rasm 5 MB dan katta bo‘lmasligi kerak')
          return Upload.LIST_IGNORE
        }
        onChange?.(file)
        return false // avto-upload o'chiq
      }}
      onRemove={() => {
        onChange?.(null)
        return true
      }}
    >
      {previewUrl ? null : (
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>Yuklash</div>
        </div>
      )}
    </Upload>
  )
}
