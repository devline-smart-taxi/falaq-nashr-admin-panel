import type {
  AccessType,
  AssetStatus,
  BookStatus,
  EditionFormat,
} from '@/types/book'

export const ACCESS_TYPE_OPTIONS: { value: AccessType; label: string }[] = [
  { value: 'FREE', label: 'Bepul' },
  { value: 'SUBSCRIPTION', label: 'Obuna' },
  { value: 'PURCHASE', label: 'Xarid' },
]

export const ACCESS_TYPE_COLOR: Record<AccessType, string> = {
  FREE: 'green',
  SUBSCRIPTION: 'blue',
  PURCHASE: 'gold',
}

export const ACCESS_TYPE_LABEL: Record<AccessType, string> = {
  FREE: 'Bepul',
  SUBSCRIPTION: 'Obuna',
  PURCHASE: 'Xarid',
}

export const STATUS_OPTIONS: { value: BookStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Qoralama' },
  { value: 'PROCESSING', label: 'Jarayonda' },
  { value: 'PUBLISHED', label: 'Chop etilgan' },
]

export const STATUS_COLOR: Record<BookStatus, string> = {
  DRAFT: 'default',
  PROCESSING: 'processing',
  PUBLISHED: 'success',
}

export const STATUS_LABEL: Record<BookStatus, string> = {
  DRAFT: 'Qoralama',
  PROCESSING: 'Jarayonda',
  PUBLISHED: 'Chop etilgan',
}

export const FORMAT_OPTIONS: { value: EditionFormat; label: string }[] = [
  { value: 'AUDIO', label: 'Audio' },
  { value: 'EBOOK', label: 'E-kitob' },
]

export const FORMAT_LABEL: Record<EditionFormat, string> = {
  AUDIO: 'Audio',
  EBOOK: 'E-kitob',
}

export const ASSET_STATUS_COLOR: Record<AssetStatus, string> = {
  AWAITING_UPLOAD: 'default',
  PROCESSING: 'processing',
  READY: 'success',
  FAILED: 'error',
}

export const ASSET_STATUS_LABEL: Record<AssetStatus, string> = {
  AWAITING_UPLOAD: 'Kutilmoqda',
  PROCESSING: 'Qayta ishlanmoqda',
  READY: 'Tayyor',
  FAILED: 'Xato',
}

const MB = 1024 * 1024

// CONTENT_PIPELINE.md cheklovlari.
const AUDIO_MIMES = ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav']
// E-kitob: faqat EPUB (mobil reader to'liq qo'llaydi). PDF qabul qilinmaydi.
const EBOOK_MIMES = ['application/epub+zip']

/** Format + tur (CONTENT/PREVIEW) bo'yicha ruxsat etilgan MIME va maks hajm. */
export function uploadLimits(
  format: EditionFormat,
  kind: 'CONTENT' | 'PREVIEW',
): { accept: string[]; maxBytes: number } {
  const accept = format === 'AUDIO' ? AUDIO_MIMES : EBOOK_MIMES
  if (kind === 'PREVIEW') return { accept, maxBytes: 50 * MB }
  return { accept, maxBytes: format === 'AUDIO' ? 500 * MB : 100 * MB }
}

const MIME_LABEL: Record<string, string> = {
  'audio/mpeg': 'MP3',
  'audio/mp4': 'M4A',
  'audio/aac': 'AAC',
  'audio/ogg': 'OGG',
  'audio/wav': 'WAV',
  'application/epub+zip': 'EPUB',
  'application/pdf': 'PDF',
}

/** Fayl maydoni tagiga ko'rsatish uchun: "MP3, M4A, … · maks 500 MB". */
export function uploadHint(format: EditionFormat, kind: 'CONTENT' | 'PREVIEW'): string {
  const { accept, maxBytes } = uploadLimits(format, kind)
  const names = accept.map((m) => MIME_LABEL[m] ?? m).join(', ')
  return `${names} · maks ${Math.round(maxBytes / MB)} MB`
}
