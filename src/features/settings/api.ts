import { http, httpMsg } from '@/api/client'
import type { LocalizedText } from '@/types/api'
import type { ContactSettings, SocialLink } from '@/types/settings'

const EMPTY: ContactSettings = { phones: [], socials: [] }

/** Ixtiyoriy shakldagi obyektni ContactSettings ga keltiradi (zararsiz default'lar). */
function asContacts(src: unknown): ContactSettings {
  if (!src || typeof src !== 'object') return { ...EMPTY }
  const o = src as Record<string, unknown>

  const phones = Array.isArray(o.phones)
    ? o.phones.filter((p): p is string => typeof p === 'string')
    : []

  const socials: SocialLink[] = Array.isArray(o.socials)
    ? o.socials
        .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
        .map((s) => ({
          name:
            s.name && typeof s.name === 'object'
              ? (s.name as LocalizedText)
              : { uz: typeof s.name === 'string' ? s.name : '' },
          link: typeof s.link === 'string' ? s.link : '',
        }))
    : []

  return { phones, socials }
}

/**
 * GET /settings ichidan aloqa ma'lumotlarini ajratadi. Backend key-value store
 * bo'lgani uchun `contacts` bir nechта shaklда bo'lishi mumkin:
 *   { contacts: { phones, socials } } | { contacts: { value: {...} } } | { value: {...} } | {...}
 */
function pickContactsSource(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data
  const o = data as Record<string, unknown>
  const contacts = o.contacts as Record<string, unknown> | undefined
  const candidates = [contacts, contacts?.value, o.value, o]
  for (const c of candidates) {
    if (c && typeof c === 'object' && ('phones' in c || 'socials' in c)) return c
  }
  return o
}

/** GET /settings — ochiq endpoint (tokensiz ham ishlaydi). Aloqa qismini qaytaradi. */
export async function getContacts(): Promise<ContactSettings> {
  const data = await http.get<unknown>('/settings')
  return asContacts(pickContactsSource(data))
}

/**
 * PUT /admin/settings/contacts — butun `value` ni almashtiradi (PATCH emas).
 * ADMIN / SUPER_ADMIN uchun. Backend `message` ni qaytaradi (success toast).
 */
export function updateContacts(value: ContactSettings) {
  return httpMsg.put<unknown>('/admin/settings/contacts', { value })
}
