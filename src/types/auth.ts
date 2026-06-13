export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN'

/** Admin panelga faqat shu rollar kira oladi. */
export const ADMIN_ROLES: Role[] = ['ADMIN', 'SUPER_ADMIN']

export interface AuthUser {
  id: string
  fullName: string | null
  phone: string | null
  role: Role
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface AuthResult {
  user: AuthUser
  tokens: TokenPair
}

export interface AdminLoginInput {
  email: string
  password: string
}
