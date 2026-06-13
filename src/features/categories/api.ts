import { createCrudApi } from '@/lib/crud'
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types/catalog'

export const categoriesApi = createCrudApi<
  Category,
  CreateCategoryInput,
  UpdateCategoryInput
>({
  basePath: '/categories',
  imageSegment: 'icon',
})
