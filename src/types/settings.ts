import type { LocalizedText } from './api'

/** Ijtimoiy tarmoq — ko'p tilli nom + havola (mobil "Yordam" ekrani uchun). */
export interface SocialLink {
  name: LocalizedText
  link: string
}

/**
 * Aloqa sozlamalari — mobil ilovaning "Yordam / Support" ekranida chiqadi.
 * `contacts` kaliti ostida saqlanadi (PUT /admin/settings/contacts, GET /settings).
 */
export interface ContactSettings {
  phones: string[]
  socials: SocialLink[]
}
