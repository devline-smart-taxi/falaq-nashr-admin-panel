import { createCrudApi } from '@/lib/crud'
import type {
  Collection,
  CreateCollectionInput,
  UpdateCollectionInput,
} from '@/types/catalog'

export const collectionsApi = createCrudApi<
  Collection,
  CreateCollectionInput,
  UpdateCollectionInput
>({
  basePath: '/collections',
  imageSegment: 'cover',
})
