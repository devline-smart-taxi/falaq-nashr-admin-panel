import { createCrudApi } from '@/lib/crud'
import type { Banner, CreateBannerInput, UpdateBannerInput } from '@/types/banner'

export const bannersApi = createCrudApi<Banner, CreateBannerInput, UpdateBannerInput>({
  basePath: '/banners',
  listPath: '/banners/admin', // ommaviy GET /banners faqat faollarni qaytaradi
  imageSegment: 'image',
})
