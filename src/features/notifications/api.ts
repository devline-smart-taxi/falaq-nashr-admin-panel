import { http } from '@/api/client'

export type NotificationType = 'NEW_BOOK' | 'PROMO' | 'REMINDER' | 'LICENSE_EXPIRY'

export interface BroadcastInput {
  type: NotificationType
  title: string
  body: string
  refId?: string
}

/** Hammaga push/in-app yuboradi (background navbatga tushadi). */
export function sendBroadcast(input: BroadcastInput): Promise<unknown> {
  return http.post('/notifications/broadcast', input)
}
