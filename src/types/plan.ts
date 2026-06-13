import type { LocalizedText } from './api'

export interface Plan {
  id: string
  name: LocalizedText
  description: LocalizedText | null
  price: number
  periodDays: number
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CreatePlanInput {
  name: LocalizedText
  description?: LocalizedText | null
  price: number
  periodDays: number
  isActive?: boolean
  sortOrder?: number
}
export type UpdatePlanInput = Partial<CreatePlanInput>
