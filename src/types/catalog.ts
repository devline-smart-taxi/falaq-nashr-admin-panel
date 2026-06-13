import type { LocalizedText } from './api'

// FRONTEND_REACT.md §4. Soft-delete; rasm alohida endpoint bilan yuklanadi.

export interface Author {
  id: string
  name: LocalizedText
  bio: LocalizedText | null
  photoUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateAuthorInput {
  name: LocalizedText
  bio?: LocalizedText | null
  photoUrl?: string | null
  isActive?: boolean
}
export type UpdateAuthorInput = Partial<CreateAuthorInput>

export interface Category {
  id: string
  name: LocalizedText
  iconUrl: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCategoryInput {
  name: LocalizedText
  iconUrl?: string | null
  sortOrder?: number
  isActive?: boolean
}
export type UpdateCategoryInput = Partial<CreateCategoryInput>

export interface Collection {
  id: string
  name: LocalizedText
  description: LocalizedText | null
  coverUrl: string | null
  sortOrder: number
  isExclusive: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCollectionInput {
  name: LocalizedText
  description?: LocalizedText | null
  coverUrl?: string | null
  sortOrder?: number
  isExclusive?: boolean
  isActive?: boolean
}
export type UpdateCollectionInput = Partial<CreateCollectionInput>
