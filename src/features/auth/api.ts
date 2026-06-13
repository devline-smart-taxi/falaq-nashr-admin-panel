import { http } from '@/api/client'
import type { AdminLoginInput, AuthResult } from '@/types/auth'

export function adminLogin(input: AdminLoginInput): Promise<AuthResult> {
  return http.post<AuthResult>('/auth/admin/login', input)
}

export async function logoutRequest(): Promise<void> {
  try {
    await http.post('/auth/logout')
  } catch {
    // Server xato bersa ham lokal sessiyani tozalaymiz — chiqish baribir bo'ladi.
  }
}
