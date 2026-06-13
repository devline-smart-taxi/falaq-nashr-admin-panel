import type { LocalizedText } from './api'

export type BannerTargetType = 'BOOK' | 'COLLECTION' | 'URL'

export interface Banner {
  id: string
  title: LocalizedText
  subtitle: LocalizedText | null
  imageUrl: string | null
  targetType: BannerTargetType
  targetBookId: string | null
  targetCollectionId: string | null
  targetUrl: string | null
  sortOrder: number
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateBannerInput {
  title: LocalizedText
  subtitle?: LocalizedText | null
  targetType: BannerTargetType
  targetBookId?: string | null
  targetCollectionId?: string | null
  targetUrl?: string | null
  sortOrder?: number
  isActive?: boolean
  startsAt?: string | null
  endsAt?: string | null
}
export type UpdateBannerInput = Partial<CreateBannerInput>
