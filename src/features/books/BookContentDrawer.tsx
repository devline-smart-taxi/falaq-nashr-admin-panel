import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Drawer,
  Card,
  Tag,
  Upload,
  Button,
  Space,
  Typography,
  Switch,
  Alert,
  Spin,
  Empty,
  App,
} from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { getApiError } from '@/api/client'
import { localize } from '@/lib/localize'
import { useAuthStore } from '@/stores/auth'
import type { AssetKind, Book, BookEdition } from '@/types/book'
import {
  ASSET_STATUS_COLOR,
  ASSET_STATUS_LABEL,
  FORMAT_LABEL,
  uploadLimits,
} from './constants'
import {
  getEditionAssets,
  processEdition,
  putToR2,
  requestUploadUrl,
  setPreviewAccess,
} from './api'

interface Props {
  book: Book | null
  open: boolean
  onClose: () => void
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
}

export function BookContentDrawer({ book, open, onClose }: Props) {
  const lang = useAuthStore((s) => s.lang)

  return (
    <Drawer
      title={book ? `Kontent: ${localize(book.title, lang)}` : 'Kontent'}
      width={640}
      open={open}
      onClose={onClose}
    >
      {!book ? null : book.editions.length === 0 ? (
        <Empty description="Bu kitobда format (edition) yo'q. Avval tahrirlab format qo'shing." />
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="Barcha CONTENT assetlar 'Tayyor' bo'lgach, kitobni tahrirlab holatini 'Chop etilgan' qiling."
          />
          {book.editions.map((edition) => (
            <EditionPanel key={edition.id} edition={edition} enabled={open} />
          ))}
        </Space>
      )}
    </Drawer>
  )
}

function EditionPanel({ edition, enabled }: { edition: BookEdition; enabled: boolean }) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [uploadingKind, setUploadingKind] = useState<AssetKind | null>(null)
  const [lockSaving, setLockSaving] = useState(false)

  const assetsQuery = useQuery({
    queryKey: ['edition-assets', edition.id],
    queryFn: () => getEditionAssets(edition.id),
    enabled,
    refetchInterval: (q) =>
      q.state.data?.some((a) => a.status === 'PROCESSING') ? 4000 : false,
  })

  const assets = assetsQuery.data ?? []
  const contentAsset = assets.find((a) => a.kind === 'CONTENT')
  const previewAsset = assets.find((a) => a.kind === 'PREVIEW')

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['edition-assets', edition.id] })
  }

  async function handleUpload(file: File, kind: AssetKind) {
    const { accept, maxBytes } = uploadLimits(edition.format, kind)
    if (!accept.includes(file.type)) {
      message.error(`Format mos emas. Ruxsat: ${accept.join(', ')}`)
      return
    }
    if (file.size > maxBytes) {
      message.error(`Fayl juda katta (maks ${Math.round(maxBytes / 1024 / 1024)} MB)`)
      return
    }
    setUploadingKind(kind)
    try {
      const { uploadUrl } = await requestUploadUrl(edition.id, {
        kind,
        mime: file.type,
        sizeBytes: file.size,
      })
      await putToR2(uploadUrl, file)
      await processEdition(edition.id, kind)
      message.success('Yuklandi — qayta ishlanmoqda')
      invalidate()
    } catch (e) {
      message.error(getApiError(e).message)
    } finally {
      setUploadingKind(null)
    }
  }

  async function toggleLock(locked: boolean) {
    setLockSaving(true)
    try {
      await setPreviewAccess(edition.id, locked)
      message.success(locked ? 'Namuna pullik qilindi' : 'Namuna bepul qilindi')
      invalidate()
    } catch (e) {
      message.error(getApiError(e).message)
    } finally {
      setLockSaving(false)
    }
  }

  function renderUpload(kind: AssetKind, label: string) {
    const asset = kind === 'CONTENT' ? contentAsset : previewAsset
    return (
      <Card size="small" title={label} style={{ width: '100%' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space wrap>
            <Typography.Text type="secondary">Holat:</Typography.Text>
            {asset ? (
              <Tag color={ASSET_STATUS_COLOR[asset.status]}>
                {ASSET_STATUS_LABEL[asset.status]}
              </Tag>
            ) : (
              <Tag>Yuklanmagan</Tag>
            )}
            {asset?.sizeBytes ? (
              <Typography.Text type="secondary">
                {formatBytes(asset.sizeBytes)}
              </Typography.Text>
            ) : null}
          </Space>

          {asset?.status === 'FAILED' && asset.processingError && (
            <Alert type="error" showIcon message={asset.processingError} />
          )}

          <Upload
            showUploadList={false}
            beforeUpload={(file) => {
              void handleUpload(file as File, kind)
              return false
            }}
          >
            <Button
              icon={<UploadOutlined />}
              loading={uploadingKind === kind}
              disabled={asset?.status === 'PROCESSING'}
            >
              {asset ? 'Qayta yuklash' : 'Fayl yuklash'}
            </Button>
          </Upload>
        </Space>
      </Card>
    )
  }

  const limits = uploadLimits(edition.format, 'CONTENT')

  return (
    <Card
      title={
        <Space>
          <Tag color={edition.format === 'AUDIO' ? 'blue' : 'geekblue'}>
            {FORMAT_LABEL[edition.format]}
          </Tag>
          <Typography.Text type="secondary">
            maks {Math.round(limits.maxBytes / 1024 / 1024)} MB
          </Typography.Text>
        </Space>
      }
    >
      <Spin spinning={assetsQuery.isLoading}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {edition.format === 'EBOOK' && (
            <Alert
              type="info"
              showIcon
              message="E-kitobni EPUB formatда yuklang"
              description="Mobil reader (shrift, o'lcham, tun rejimi) faqat EPUB bilan to'liq ishlaydi. PDF — qotirilgan maket (faqat zoom). Backend konvertatsiya qilmaydi — tayyor EPUB yuklang (masalan Calibre bilan)."
            />
          )}
          {renderUpload('CONTENT', "To'liq kontent")}
          {renderUpload('PREVIEW', 'Bepul namuna (preview)')}

          <Space>
            <Typography.Text>Namuna pullik (locked):</Typography.Text>
            <Switch
              checked={previewAsset?.previewLocked ?? false}
              loading={lockSaving}
              disabled={!previewAsset}
              onChange={toggleLock}
            />
          </Space>
        </Space>
      </Spin>
    </Card>
  )
}
