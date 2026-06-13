import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { env } from '@/config/env'
import { authStore } from '@/stores/auth'
import type { ApiErrorResponse, ApiResponse } from '@/types/api'
import type { TokenPair } from '@/types/auth'

export const api = axios.create({
  baseURL: env.apiBaseUrl,
})

// --- Request: Authorization + x-lang (FRONTEND_REACT.md §2 namunasi) ---
api.interceptors.request.use((cfg) => {
  const { accessToken, lang } = authStore.get()
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`
  cfg.headers['x-lang'] = lang ?? 'uz'
  return cfg
})

// --- Response: 401 da bitta marta refresh (single-flight) ---
// Bir vaqtning o'zida bir nechta so'rov 401 olса ham refresh faqat bir marta ketadi.
let refreshPromise: Promise<string | null> | null = null

async function refreshTokens(): Promise<string | null> {
  const { refreshToken } = authStore.get()
  if (!refreshToken) return null
  try {
    // Bare axios — interceptorlar (va eski access token) ishlamasligi uchun.
    const res = await axios.post<ApiResponse<TokenPair>>(
      `${env.apiBaseUrl}/auth/refresh`,
      { refreshToken },
      { headers: { 'x-lang': authStore.get().lang } },
    )
    authStore.get().setTokens(res.data.data) // rotation — yangi juftlikni saqlaymiz
    return res.data.data.accessToken
  } catch {
    authStore.get().logout() // ProtectedRoute avtomatik login'ga yo'naltiradi
    return null
  }
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const isAuthEndpoint = original?.url?.includes('/auth/')

    if (status === 401 && original && !original._retried && !isAuthEndpoint) {
      original._retried = true
      refreshPromise ??= refreshTokens().finally(() => {
        refreshPromise = null
      })
      const newToken = await refreshPromise
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      }
    }

    return Promise.reject(error)
  },
)

// --- Typed helpers: envelope (`data.data`) ni avtomatik ochadi ---
function pickData<T>(p: Promise<AxiosResponse<ApiResponse<T>>>): Promise<T> {
  return p.then((r) => r.data.data)
}

export const http = {
  get: <T>(url: string, config?: Parameters<typeof api.get>[1]) =>
    pickData<T>(api.get<ApiResponse<T>>(url, config)),
  post: <T>(url: string, body?: unknown, config?: Parameters<typeof api.post>[2]) =>
    pickData<T>(api.post<ApiResponse<T>>(url, body, config)),
  patch: <T>(url: string, body?: unknown, config?: Parameters<typeof api.patch>[2]) =>
    pickData<T>(api.patch<ApiResponse<T>>(url, body, config)),
  put: <T>(url: string, body?: unknown, config?: Parameters<typeof api.put>[2]) =>
    pickData<T>(api.put<ApiResponse<T>>(url, body, config)),
  delete: <T>(url: string, config?: Parameters<typeof api.delete>[1]) =>
    pickData<T>(api.delete<ApiResponse<T>>(url, config)),
}

export interface NormalizedApiError {
  message: string
  errors?: string[]
  status?: number
}

/**
 * Foydalanuvchiga ko'rsatiladigan umumiy xabar. Server ichki xatolari (5xx),
 * tarmoq va ruxsat (403→404) detallari oshkor qilinmaydi.
 */
function genericMessage(status: number | undefined): string {
  if (status === undefined) return "Aloqa xatosi. Internet aloqasini tekshiring."
  if (status === 403 || status === 404) return "So'ralgan ma'lumot topilmadi."
  if (status === 401) return "Sessiya tugadi. Qaytadan kiring."
  if (status === 409) return "Bu qiymat allaqachon mavjud."
  if (status === 413) return 'Fayl juda katta.'
  if (status === 429) return "Juda ko'p so'rov. Birozdan keyin qayta urinib ko'ring."
  return "Xatolik yuz berdi. Birozdan keyin qayta urinib ko'ring."
}

/** Xatoni forma/notifikatsiya uchun bir xil shaklга keltiradi. */
export function getApiError(error: unknown): NormalizedApiError {
  if (axios.isAxiosError(error)) {
    let status = error.response?.status
    const data = error.response?.data as ApiErrorResponse | undefined

    // Server/tarmoq xatolari foydalanuvchiga oshkor qilinmaydi — faqat console (dev).
    const isServerOrNetwork = status === undefined || status >= 500
    if (isServerOrNetwork) console.error('[API error]', error)

    // 403 → 404: resurs mavjudligini yashiramiz.
    if (status === 403) status = 404

    // Faqat validatsiya (400/422) xabari foydalanuvchiga ko'rsatiladi — u amaliy.
    const isValidation = status === 400 || status === 422
    const message = (isValidation && data?.message) || genericMessage(status)
    const errors = isValidation ? data?.errors : undefined

    return { message, errors, status }
  }
  // JS/render xatosi — detalsiz.
  console.error('[App error]', error)
  return { message: 'Xatolik yuz berdi.' }
}
