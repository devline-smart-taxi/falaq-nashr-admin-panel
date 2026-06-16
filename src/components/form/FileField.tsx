import { Upload, Button, Space, Typography } from 'antd'
import { UploadOutlined, PaperClipOutlined, DeleteOutlined } from '@ant-design/icons'

interface Props {
  value?: File | null
  onChange?: (file: File | null) => void
  accept?: string
  placeholder?: string
}

/**
 * Bitta fayl tanlash (avto-upload yo'q) — File brauzerда state'да turadi,
 * "Saqlash"да yuklanadi. Form.Item bilan controlled ishlaydi.
 */
export function FileField({ value, onChange, accept, placeholder }: Props) {
  return (
    <Space wrap>
      <Upload
        showUploadList={false}
        accept={accept}
        maxCount={1}
        beforeUpload={(file) => {
          onChange?.(file as File)
          return false // avto-upload o'chiq
        }}
      >
        <Button icon={<UploadOutlined />}>
          {value ? 'Almashtirish' : (placeholder ?? 'Fayl tanlash')}
        </Button>
      </Upload>

      {value && (
        <Space size={4}>
          <PaperClipOutlined />
          <Typography.Text ellipsis style={{ maxWidth: 180 }}>
            {value.name}
          </Typography.Text>
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => onChange?.(null)}
          />
        </Space>
      )}
    </Space>
  )
}
