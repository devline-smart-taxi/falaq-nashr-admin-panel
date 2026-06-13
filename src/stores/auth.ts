import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang } from '@/types/api'
import type { AuthResult, AuthUser, Role, TokenPair } from '@/types/auth'
import { ADMIN_ROLES } from '@/types/auth'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  lang: Lang

  setAuth: (result: AuthResult) => void
  setTokens: (tokens: TokenPair) => void
  setLang: (lang: Lang) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      lang: 'uz',

      setAuth: (result) =>
        set({
          user: result.user,
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
        }),

      // Token rotation: refresh'dan kelgan yangi juftlikni saqlaymiz.
      setTokens: (tokens) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }),

      setLang: (lang) => set({ lang }),

      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: 'falaq-admin-auth',
      // `lang` ham saqlanadi — foydalanuvchi tanlovi sessiyalar orasida qoladi.
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        lang: s.lang,
      }),
    },
  ),
)

/** React'dan tashqarida (interceptor) o'qish uchun qulay yordamchilar. */
export const authStore = {
  get: useAuthStore.getState,
  set: useAuthStore.setState,
}

export function isAdminRole(role: Role | undefined | null): boolean {
  return !!role && ADMIN_ROLES.includes(role)
}

export function selectIsAuthenticated(s: AuthState): boolean {
  return !!s.accessToken && !!s.user && isAdminRole(s.user.role)
}
