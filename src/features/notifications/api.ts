import { http } from '@/api/client'
import type { LocalizedText } from '@/types/api'

export type NotificationType = 'NEW_BOOK' | 'PROMO' | 'REMINDER' | 'LICENSE_EXPIRY'

export interface BroadcastInput {
  type: NotificationType
  title: LocalizedText
  body: LocalizedText
  refId?: string
}

/** Hammaga push/in-app yuboradi (background navbatga tushadi). */
export function sendBroadcast(input: BroadcastInput): Promise<unknown> {
  return http.post('/notifications/broadcast', input)
}
