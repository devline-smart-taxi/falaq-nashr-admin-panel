import { useMemo, useState } from 'react'
import { Select, Button, Modal, Form, Divider, App } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { LocalizedText } from '@/types/api'
import { getApiError } from '@/api/client'
import { requiredLTRule } from '@/lib/lt'
import { LocalizedTextInput } from './LocalizedTextInput'

export interface QuickSelectOption {
  value: string
  label: string
}

interface Props {
  /** Form.Item injektsiya qiladi. */
  value?: string[]
  onChange?: (value: string[]) => void
  options: QuickSelectOption[]
  loading?: boolean
  placeholder?: string
  disabled?: boolean
  /** Modal/tugma matni uchun, masalan "muallif" (kichik harflar bilan). */
  entityLabel: string
  /**
   * Nomдан yangi element yaratadi va yangi {value,label} qaytaradi.
   * Bu yerда parent api.create + query invalidatsiyani bajaradi.
   */
  createFn: (name: LocalizedText) => Promise<QuickSelectOption>
}

/**
 * Ko'p-tanlovli Select — ro'yxat pastida "+ Yangi qo'shish" tugmasi bilan.
 * Kerakli muallif/kategoriya/kolleksiya ro'yxatда yo'q bo'lsa, kitob formasidan
 * chiqmasдан shu yerда yaratiladi va avtomat tanlanadi (kiritilgan ma'lumot yo'qolmaydi).
 */
export function QuickCreateSelect({
  value,
  onChange,
  options,
  loading,
  placeholder,
  disabled,
  entityLabel,
  createFn,
}: Props) {
  const { message } = App.useApp()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [extra, setExtra] = useState<QuickSelectOption[]>([])
  const [modalForm] = Form.useForm<{ name: LocalizedText }>()

  // Yangi yaratilganlar refetch tugagunча ro'yxatда ko'rinib tursin (id emas, nom).
  const mergedOptions = useMemo(() => {
    const seen = new Set(options.map((o) => o.value))
    return [...options, ...extra.filter((e) => !seen.has(e.value))]
  }, [options, extra])

  async function onCreate() {
    let values: { name: LocalizedText }
    try {
      values = await modalForm.validateFields()
    } catch {
      return // validatsiya xatosi — modal ochiq qoladi
    }
    setSaving(true)
    try {
      const created = await createFn(values.name)
      setExtra((prev) => [...prev, created])
      onChange?.([...(value ?? []), created.value])
      message.success('Qo‘shildi')
      setOpen(false)
      modalForm.resetFields()
    } catch (e) {
      message.error(getApiError(e).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Select
        mode="multiple"
        allowClear
        showSearch
        optionFilterProp="label"
        placeholder={placeholder}
        options={mergedOptions}
        loading={loading}
        disabled={disabled}
        value={value}
        onChange={onChange}
        popupRender={(menu) => (
          <>
            {menu}
            <Divider style={{ margin: '4px 0' }} />
            <Button
              type="text"
              icon={<PlusOutlined />}
              block
              style={{ textAlign: 'left' }}
              // Dropdown yopilib modal ochiladi — bu yerда to'xtatish shart emas.
              onClick={() => setOpen(true)}
            >
              Yangi {entityLabel} qo‘shish
            </Button>
          </>
        )}
      />

      <Modal
        title={`Yangi ${entityLabel}`}
        open={open}
        onOk={onCreate}
        onCancel={() => {
          setOpen(false)
          modalForm.resetFields()
        }}
        okText="Qo‘shish"
        cancelText="Bekor"
        confirmLoading={saving}
        maskClosable={false}
        destroyOnHidden
      >
        <Form form={modalForm} layout="vertical" preserve={false}>
          <Form.Item name="name" label="Nom" required rules={[requiredLTRule]}>
            <LocalizedTextInput placeholder={`${entityLabel} nomi`} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
