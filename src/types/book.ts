import type { LocalizedText, PaginationParams } from './api'
import type { Author, Category, Collection } from './catalog'

export type AccessType = 'FREE' | 'SUBSCRIPTION' | 'PURCHASE'
export type BookStatus = 'DRAFT' | 'PROCESSING' | 'PUBLISHED'
export type EditionFormat = 'AUDIO' | 'EBOOK'
export type AssetKind = 'CONTENT' | 'PREVIEW'
export type AssetStatus = 'AWAITING_UPLOAD' | 'PROCESSING' | 'READY' | 'FAILED'

export interface BookEdition {
  id: string
  format: EditionFormat
  narrator: string | null
  durationSeconds: number | null
  pageCount: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface BookEditionInput {
  format: EditionFormat
  narrator?: string | null
  durationSeconds?: number | null
  pageCount?: number | null
  isActive?: boolean
}

export interface Book {
  id: string
  title: LocalizedText
  description: LocalizedText | null
  coverUrl: string | null
  accessType: AccessType
  price: number | null
  publishedYear: number | null
  isbn: string | null
  sortOrder: number
  status: BookStatus
  avgRating: string
  reviewCount: number
  authors: Author[]
  categories: Category[]
  collections: Collection[]
  editions: BookEdition[]
  createdAt: string
  updatedAt: string
}

export interface CreateBookInput {
  title: LocalizedText
  description?: LocalizedText | null
  coverUrl?: string | null
  accessType?: AccessType
  price?: number | null
  publishedYear?: number | null
  isbn?: string | null
  sortOrder?: number
  status?: BookStatus
  authorIds: string[]
  categoryIds: string[]
  collectionIds: string[]
  editions: BookEditionInput[]
}
export type UpdateBookInput = Partial<CreateBookInput>

export interface BookListParams extends PaginationParams {
  status?: BookStatus
  accessType?: AccessType
  format?: EditionFormat
  authorId?: string
  categoryId?: string
  collectionId?: string
}

// --- Kontent (audio/e-kitob) assetlari (CONTENT_PIPELINE.md) ---

export interface Asset {
  id: string
  kind: AssetKind
  status: AssetStatus
  /** Bob tartibi (audio bo'lib yuklash). Bitta faylда 0. */
  order: number
  /** Bob nomi (ko'p bobli audio). */
  title: LocalizedText | null
  durationSeconds: number | null
  mime: string | null
  sizeBytes: number | null
  previewLocked: boolean
  processingError: string | null
}

export interface RequestUploadInput {
  kind: AssetKind
  mime: string
  sizeBytes: number
  /** Bob tartibi (audio CONTENT bo'lib yuklash). Default 0. */
  order?: number
  /** Bob nomi (ko'p bobli audio). */
  title?: LocalizedText
}

export interface UploadUrl {
  assetId: string
  uploadUrl: string
  expiresIn: number
}

// E-kitob mundarijasi (TOC). Backend EPUB'дан avtomat ajratadi; admin tahrirlaydi.
export interface TocEntry {
  title: string
  /** Bob boshidan ~50 belgilik toza matn (mobil shu bilan sakraydi). */
  anchor: string
  /** 0–100 (zaxira navigatsiya). */
  percent: number
}
