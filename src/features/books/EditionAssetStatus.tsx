import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, Tag, Space, Typography, Switch, Alert, Spin, App } from 'antd'
import { getApiError } from '@/api/client'
import { localize } from '@/lib/localize'
import { useAuthStore } from '@/stores/auth'
import type { Asset } from '@/types/book'
import { ASSET_STATUS_COLOR, ASSET_STATUS_LABEL } from './constants'
import { getEditionAssets, setPreviewAccess } from './api'

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
}

function StatusRow({ label, asset }: { label: string; asset?: Asset }) {
  return (
    <Space wrap>
      <Typography.Text type="secondary">{label}:</Typography.Text>
      {asset ? (
        <Tag color={ASSET_STATUS_COLOR[asset.status]}>{ASSET_STATUS_LABEL[asset.status]}</Tag>
      ) : (
        <Tag>Yuklanmagan</Tag>
      )}
      {asset?.sizeBytes ? (
        <Typography.Text type="secondary">{formatBytes(asset.sizeBytes)}</Typography.Text>
      ) : null}
    </Space>
  )
}

/** Edition kontenti holati (jonli poll) + namuna pullik kaliti. Faqat saqlangan kitob uchun. */
export function EditionAssetStatus({ editionId }: { editionId: string }) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const lang = useAuthStore((s) => s.lang)
  const [lockSaving, setLockSaving] = useState(false)

  const assetsQuery = useQuery({
    queryKey: ['edition-assets', editionId],
    queryFn: () => getEditionAssets(editionId),
    refetchInterval: (q) =>
      q.state.data?.some((a) => a.status === 'PROCESSING') ? 4000 : false,
  })

  const assets = assetsQuery.data ?? []
  const contentChapters = assets
    .filter((a) => a.kind === 'CONTENT')
    .sort((a, b) => a.order - b.order)
  const preview = assets.find((a) => a.kind === 'PREVIEW')

  async function toggleLock(locked: boolean) {
    setLockSaving(true)
    try {
      await setPreviewAccess(editionId, locked)
      message.success(locked ? 'Namuna pullik qilindi' : 'Namuna bepul qilindi')
      void queryClient.invalidateQueries({ queryKey: ['edition-assets', editionId] })
    } catch (e) {
      message.error(getApiError(e).message)
    } finally {
      setLockSaving(false)
    }
  }

  return (
    <Card size="small" type="inner" title="Yuklangan kontent holati">
      <Spin spinning={assetsQuery.isLoading}>
        <Space direction="vertical" style={{ width: '100%' }} size={8}>
          {contentChapters.length === 0 ? (
            <StatusRow label="To'liq fayl" />
          ) : (
            contentChapters.map((a) => (
              <div key={a.id}>
                <StatusRow
                  label={
                    contentChapters.length > 1
                      ? `${a.order + 1}-bob${a.title ? ` · ${localize(a.title, lang)}` : ''}`
                      : "To'liq fayl"
                  }
                  asset={a}
                />
                {a.status === 'FAILED' && a.processingError && (
                  <Alert type="error" showIcon message={a.processingError} />
                )}
              </div>
            ))
          )}

          <StatusRow label="Namuna" asset={preview} />
          {preview?.status === 'FAILED' && preview.processingError && (
            <Alert type="error" showIcon message={preview.processingError} />
          )}

          <Space>
            <Typography.Text type="secondary">Namuna pullik:</Typography.Text>
            <Switch
              checked={preview?.previewLocked ?? false}
              loading={lockSaving}
              disabled={!preview}
              onChange={toggleLock}
            />
          </Space>
        </Space>
      </Spin>
    </Card>
  )
}
