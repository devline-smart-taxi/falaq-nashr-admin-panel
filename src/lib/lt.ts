import type { LocalizedText } from '@/types/api'

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

/** AntD Form rule: name.uz to'ldirilganini tekshiradi. */
export const requiredLTRule = {
  validator: (_: unknown, value: LocalizedText | undefined) =>
    value?.uz?.trim()
      ? Promise.resolve()
      : Promise.reject(new Error("Nom (lotin) majburiy")),
}
