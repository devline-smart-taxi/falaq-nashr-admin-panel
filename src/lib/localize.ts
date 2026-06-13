import type { Lang, LocalizedText } from '@/types/api'

/**
 * LocalizedText obyektidan (yoki oddiy stringdan) tanlangan tildagi matnni oladi.
 * Backend ba'zan allaqachon lokalizatsiya qilingan string qaytarishi mumkin —
 * ikkala holatni ham qo'llaymiz. Tanlangan til bo'sh bo'lsa `uz` ga tushadi.
 */
export function localize(
  value: LocalizedText | string | null | undefined,
  lang: Lang = 'uz',
): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  return value[lang] || value.uz || Object.values(value).find(Boolean) || ''
}

const UZS = new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 })

/** Butun som (UZS) ni " so'm" bilan formatlaydi. */
export function formatUZS(amount: number | null | undefined): string {
  return `${UZS.format(amount ?? 0)} so'm`
}

export function formatNumber(value: number | null | undefined): string {
  return UZS.format(value ?? 0)
}
