import type { LocalizedText } from '@/types/api'

export const LT_LANGS = ['uz', 'uz-Cyrl', 'ru', 'en'] as const
export type LtLang = (typeof LT_LANGS)[number]

const LABEL: Record<LtLang, string> = {
  uz: 'lotin',
  'uz-Cyrl': 'kirill',
  ru: 'ruscha',
  en: 'inglizcha',
}

/** To'ldirilmagan tillar (bo'sh yoki faqat probel). */
export function missingLangs(v?: LocalizedText | null): LtLang[] {
  return LT_LANGS.filter((l) => !v?.[l]?.trim())
}

/**
 * LocalizedText ni yuborishga tayyorlaydi: bo'sh maydonlarni olib tashlaydi.
 * `uz` (majburiy) bo'sh bo'lsa null qaytaradi (ixtiyoriy maydonlar uchun).
 */
export function normalizeLT(v?: LocalizedText | null): LocalizedText | null {
  if (!v || !v.uz?.trim()) return null
  const out: LocalizedText = { uz: v.uz.trim() }
  if (v['uz-Cyrl']?.trim()) out['uz-Cyrl'] = v['uz-Cyrl'].trim()
  if (v.ru?.trim()) out.ru = v.ru.trim()
  if (v.en?.trim()) out.en = v.en.trim()
  return out
}

/** Majburiy LocalizedText (validatsiya `uz` borligini ta'minlagan bo'ladi). */
export function requireLT(v?: LocalizedText | null): LocalizedText {
  const n = normalizeLT(v)
  if (!n) throw new Error('Nom (lotin) majburiy')
  return n
}

/**
 * MAJBURIY maydon uchun rule: 4 til ham (uz, uz-Cyrl, ru, en) to'ldirilishi shart.
 * `uz` umuman bo'sh bo'lsa "majburiy", aks holda qaysi tarjima yetishmasligini aytadi.
 */
export const requiredLTRule = {
  validator: (_: unknown, value: LocalizedText | undefined) => {
    const missing = missingLangs(value)
    if (missing.length === 0) return Promise.resolve()
    if (!value?.uz?.trim()) return Promise.reject(new Error('Majburiy maydon (lotincha)'))
    return Promise.reject(
      new Error(`Tarjima to'liq emas — yetishmaydi: ${missing.map((l) => LABEL[l]).join(', ')}`),
    )
  },
}

/**
 * IXTIYORIY maydon uchun rule: butunlay bo'sh bo'lsa OK, lekin to'ldirilsa —
 * 4 tilda ham to'liq bo'lishi shart ("bir tilda yozib, qolganini tashlab ketish" mumkin emas).
 */
export const optionalLTRule = {
  validator: (_: unknown, value: LocalizedText | undefined) => {
    const missing = missingLangs(value)
    if (missing.length === 0 || missing.length === LT_LANGS.length) return Promise.resolve()
    return Promise.reject(
      new Error(`To'ldirilsa hamma tilda — yetishmaydi: ${missing.map((l) => LABEL[l]).join(', ')}`),
    )
  },
}
