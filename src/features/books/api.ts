import { http, httpMsg } from '@/api/client'
import { createCrudApi } from '@/lib/crud'
import type { LocalizedText, Paginated } from '@/types/api'
import type {
  Asset,
  AssetKind,
  Book,
  BookListParams,
  CreateBookInput,
  RequestUploadInput,
  TocEntry,
  UpdateBookInput,
  UploadUrl,
} from '@/types/book'

export const booksApi = createCrudApi<Book, CreateBookInput, UpdateBookInput>({
  basePath: '/books',
  imageSegment: 'cover',
})

/** Admin jadval — barcha holatdagi kitoblar (DRAFT/PROCESSING/PUBLISHED) + filtrlar. */
export function listAdminBooks(params: BookListParams): Promise<Paginated<Book>> {
  return http.get<Paginated<Book>>('/books/admin', { params })
}

// --- Edition kontent oqimi (CONTENT_PIPELINE.md) ---

export function getEditionAssets(editionId: string): Promise<Asset[]> {
  return http.get<Asset[]>(`/editions/${editionId}/assets`)
}

export function requestUploadUrl(
  editionId: string,
  body: RequestUploadInput,
): Promise<UploadUrl> {
  return http.post<UploadUrl>(`/editions/${editionId}/upload-url`, body)
}

/** Faylni to'g'ridan-to'g'ri R2'ga (presigned URL) yuklaydi — API'dan o'tmaydi. */
export async function putToR2(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!res.ok) throw new Error(`R2 yuklash xatosi (HTTP ${res.status})`)
}

export function processEdition(
  editionId: string,
  kind: AssetKind,
  order = 0,
): Promise<unknown> {
  return http.post(`/editions/${editionId}/process`, undefined, {
    params: { kind, order },
  })
}

/**
 * To'liq kontent yuklash oqimi (3 bosqich) bitta chaqiruvда.
 * Audio boblar uchun `order` (0,1,2...) va `title` beriladi; bitta fayl uchun order 0.
 */
export async function uploadEditionContent(
  editionId: string,
  file: File,
  kind: AssetKind,
  order = 0,
  title?: LocalizedText,
): Promise<void> {
  const { uploadUrl } = await requestUploadUrl(editionId, {
    kind,
    mime: file.type,
    sizeBytes: file.size,
    order,
    title,
  })
  await putToR2(uploadUrl, file)
  await processEdition(editionId, kind, order)
}

export function setPreviewAccess(editionId: string, locked: boolean): Promise<unknown> {
  return http.patch(`/editions/${editionId}/preview-access`, { locked })
}

// --- E-kitob mundarijasi (TOC) ---

export function getEditionToc(editionId: string): Promise<TocEntry[]> {
  return http
    .get<{ toc: TocEntry[] | null }>(`/editions/${editionId}/toc`)
    .then((d) => d.toc ?? [])
}

/** TOC'ни to'liq almashtiradi. Backend xabarini qaytaradi. */
export function updateEditionToc(editionId: string, toc: TocEntry[]): Promise<string> {
  return httpMsg.put<unknown>(`/editions/${editionId}/toc`, { toc }).then((r) => r.message)
}
