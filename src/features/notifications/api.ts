import { httpMsg } from '@/api/client'
import type { LocalizedText } from '@/types/api'

export type NotificationType = 'NEW_BOOK' | 'PROMO' | 'REMINDER' | 'LICENSE_EXPIRY'

export interface BroadcastInput {
  type: NotificationType
  title: LocalizedText
  body: LocalizedText
  refId?: string
}

/** Hammaga push/in-app yuboradi (background navbatga tushadi). Backend xabarini qaytaradi. */
export function sendBroadcast(input: BroadcastInput): Promise<string> {
  return httpMsg.post<null>('/notifications/broadcast', input).then((r) => r.message)
}
