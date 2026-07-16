import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Card,
  Button,
  Input,
  InputNumber,
  Space,
  Typography,
  Alert,
  Spin,
  App,
} from 'antd'
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons'
import { getApiError } from '@/api/client'
import type { TocEntry } from '@/types/book'
import { getEditionToc, updateEditionToc } from './api'

/**
 * E-kitob mundarijasi (TOC) — backend EPUB'дан avtomat ajratadi, admin tuzatadi.
 * Faqat READY bo'lgan e-kitob edition uchun ma'noga ega.
 */
export function EbookTocEditor({ editionId }: { editionId: string }) {
  const { message } = App.useApp()
  const [rows, setRows] = useState<TocEntry[]>([])
  const [syncedData, setSyncedData] = useState<TocEntry[] | null>(null)
  const [saving, setSaving] = useState(false)

  const tocQuery = useQuery({
    queryKey: ['edition-toc', editionId],
    queryFn: () => getEditionToc(editionId),
  })

  // Server ma'lumoti kelganда/yangilanганда mahalliy holatni moslaymiz (render paytida).
  if (tocQuery.data && tocQuery.data !== syncedData) {
    setSyncedData(tocQuery.data)
    setRows(tocQuery.data)
  }

  function patch(i: number, p: Partial<TocEntry>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...p } : r)))
  }
  function add() {
    setRows((rs) => [...rs, { title: '', anchor: '', percent: 0 }])
  }
  function remove(i: number) {
    setRows((rs) => rs.filter((_, idx) => idx !== i))
  }

  async function save() {
    setSaving(true)
    try {
      const clean = rows
        .map((r) => ({ ...r, title: r.title.trim(), anchor: r.anchor.trim() }))
        .filter((r) => r.title)
      const m = await updateEditionToc(editionId, clean)
      setRows(clean)
      message.success(m || 'Mundarija saqlandi')
    } catch (e) {
      message.error(getApiError(e).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card
      size="small"
      type="inner"
      title="E-kitob mundarijasi (TOC)"
      extra={
        <Button
          type="primary"
          size="small"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={save}
        >
          Saqlash
        </Button>
      }
    >
      <Spin spinning={tocQuery.isLoading}>
        <Space direction="vertical" style={{ width: '100%' }} size={8}>
          {rows.length === 0 && (
            <Alert
              type="warning"
              showIcon
              message="Boblar topilmadi — qo'lда qo'shing (publish'дан oldin tavsiya etiladi)."
            />
          )}

          {rows.map((row, i) => (
            <Space key={i} align="start" wrap>
              <Typography.Text type="secondary" style={{ width: 24, paddingTop: 6 }}>
                {i + 1}.
              </Typography.Text>
              <Input
                placeholder="Bob nomi"
                value={row.title}
                onChange={(e) => patch(i, { title: e.target.value })}
                style={{ width: 220 }}
              />
              <Input
                placeholder="Anchor (toza matn)"
                value={row.anchor}
                onChange={(e) => patch(i, { anchor: e.target.value })}
                style={{ width: 200 }}
              />
              <InputNumber
                placeholder="%"
                min={0}
                max={100}
                value={row.percent}
                onChange={(v) => patch(i, { percent: v ?? 0 })}
                style={{ width: 72 }}
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => remove(i)}
              />
            </Space>
          ))}

          <Button type="dashed" icon={<PlusOutlined />} onClick={add}>
            Bob qo'shish
          </Button>
        </Space>
      </Spin>
    </Card>
  )
}
