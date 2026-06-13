import { createCrudApi } from '@/lib/crud'
import type { Author, CreateAuthorInput, UpdateAuthorInput } from '@/types/catalog'

export const authorsApi = createCrudApi<Author, CreateAuthorInput, UpdateAuthorInput>({
  basePath: '/authors',
  imageSegment: 'photo',
})
