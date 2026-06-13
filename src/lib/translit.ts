// O'zbek lotin → kirill (uz-Cyrl) avto-transliteratsiya (FRONTEND_REACT.md §3).
// Taxminiy — admin panel kerak bo'lsa qo'lda tuzatishi mumkin.

// Uzunroq kombinatsiyalar oldin tekshirilishi shart.
const PAIRS: [string, string][] = [
  ["o'", 'ў'],
  ['oʻ', 'ў'],
  ["g'", 'ғ'],
  ['gʻ', 'ғ'],
  ['sh', 'ш'],
  ['ch', 'ч'],
  ['yo', 'ё'],
  ['yu', 'ю'],
  ['ya', 'я'],
  ['ye', 'е'],
  ['ts', 'ц'],
  ['a', 'а'],
  ['b', 'б'],
  ['d', 'д'],
  ['e', 'е'],
  ['f', 'ф'],
  ['g', 'г'],
  ['h', 'ҳ'],
  ['i', 'и'],
  ['j', 'ж'],
  ['k', 'к'],
  ['l', 'л'],
  ['m', 'м'],
  ['n', 'н'],
  ['o', 'о'],
  ['p', 'п'],
  ['q', 'қ'],
  ['r', 'р'],
  ['s', 'с'],
  ['t', 'т'],
  ['u', 'у'],
  ['v', 'в'],
  ['x', 'х'],
  ['y', 'й'],
  ['z', 'з'],
  ['c', 'к'],
  ["'", 'ъ'],
  ['ʻ', 'ъ'],
]

const MAP = [...PAIRS].sort((a, b) => b[0].length - a[0].length)

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function isUpper(ch: string): boolean {
  return ch !== ch.toLowerCase() && ch === ch.toUpperCase()
}

export function toCyrillic(text: string): string {
  if (!text) return ''
  const lower = text.toLowerCase()
  let result = ''
  let i = 0
  while (i < text.length) {
    let matched = false
    for (const [lat, cyr] of MAP) {
      if (lower.startsWith(lat, i)) {
        const segment = text.substr(i, lat.length)
        result += isUpper(segment[0]) ? capitalizeFirst(cyr) : cyr
        i += lat.length
        matched = true
        break
      }
    }
    if (!matched) {
      result += text[i]
      i++
    }
  }
  return result
}
