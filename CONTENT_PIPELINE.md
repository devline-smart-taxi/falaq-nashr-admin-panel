# Kontent pipeline — fayl yuklash, shifrlash, delivery

Bu hujjat kitob **kontent fayllari** (audio/e-kitob) qanday yuklanishi, shifrlanishi
va yetkazilishini tavsiflaydi. Asosiy qoida (TZ §6): **R2'da hech qachon ochiq fayl
turmaydi** — faqat shifrlangan (ciphertext) holatda. Bepul namuna (preview) ham
shifrlanadi: bugun bepul bo'lgan qism ertaga pullik qilinishi mumkin.

## Shifrlash modeli — envelope encryption

```
Har fayl  ──AES-256-CTR(DEK, IV)──▶  ciphertext (R2'da)
DEK       ──AES-256-GCM(KEK)──────▶  wrappedDek + wrapIv + wrapAuthTag (bazada)
KEK       ── config (CONTENT_MASTER_KEK), bazaga hech qachon tushmaydi
```

- **DEK** (Data-Encryption-Key) — har fayl uchun alohida tasodifiy 256-bit kalit.
  Fayl shu DEK bilan **AES-256-CTR**'da shifrlanadi (CTR — audio surish / HTTP Range
  uchun seekable).
- **KEK** (Key-Encryption-Key) — master kalit, `CONTENT_MASTER_KEK` (base64, 32 bayt).
  DEK shu KEK bilan **AES-256-GCM**'da o'raladi (GCM auth tag yaxlitlikni ta'minlaydi).
- Bazada faqat **o'ralgan** DEK saqlanadi. KEK rotatsiyasida faqat kichik DEK'lar
  qayta o'raladi — 500MB fayllarni qayta shifrlash shart emas. `kekId` har asset
  qaysi KEK versiyasi bilan o'ralganini biladi.
- **Har asset o'z DEK'iga ega.** Shuning uchun bepul preview kalitini berish pullik
  kontentni ochmaydi (alohida kalitlar).

> KMS-ready: hozir KEK config'dan keladi. Kelajakda `CryptoService` ichidagi yagona
> KEK-resolver'ni AWS KMS / Vault'ga ulash kifoya — qolgan kod o'zgarmaydi.

## Ma'lumotlar modeli

`EncryptedAsset` (jadval `encrypted_assets`) — har shifrlangan blob bitta yozuv:

| Maydon | Izoh |
|--------|------|
| `editionId`, `kind` | qaysi format (`BookEdition`) va tur (`CONTENT` / `PREVIEW`) |
| `status` | `AWAITING_UPLOAD → PROCESSING → READY` (yoki `FAILED`) |
| `r2Key` | shifrlangan obyekt kaliti R2'da (ommaviy URL emas — maxfiy) |
| `iv` | kontent CTR IV (hex) |
| `wrappedDek`, `wrapIv`, `wrapAuthTag`, `kekId` | o'ralgan DEK |
| `rawKey` | vaqtinchalik xom yuklash kaliti — shifrlangach o'chiriladi |
| `mime`, `sizeBytes` | metadata |
| `previewLocked` | preview pullik qilinganmi (free → paid "flip") |
| `processingError` | xato sababi (FAILED bo'lganda) |

`kind` bo'yicha audio boblari / ko'p treklar kelajakda `order` bilan kengayadi.

## Yuklash oqimi (admin)

Katta fayllar **server orqali o'tmaydi** — brauzer to'g'ridan-to'g'ri R2'ga yuklaydi
(presigned PUT). Bu performance uchun: 500MB fayl API xotirasini band qilmaydi.

```
1. POST /editions/:editionId/upload-url   { kind, mime, sizeBytes }
   → { assetId, uploadUrl, expiresIn }     (status: AWAITING_UPLOAD)

2. PUT <uploadUrl>   (fayl tanasi)          ← brauzer → R2 (raw/ prefiks)
   Header: Content-Type = yuqoridagi mime

3. POST /editions/:editionId/process?kind=CONTENT
   → { status: PROCESSING }                 (xom fayl borligini tekshiradi)

4. (worker) raw stream → AES-256-CTR → R2 content/ → DEK o'raladi → raw o'chadi
   → status: READY

5. GET /editions/:editionId/assets          (holatni kuzatish: poll)
```

Har format (audio / e-kitob) uchun bitta `CONTENT` va ixtiyoriy bitta `PREVIEW`
asset yuklanadi. Barcha kerakli asset `READY` bo'lgach, admin kitobni
`PUBLISHED` qiladi (mavjud `PATCH /books/:id`).

### Cheklovlar
- Audio: ≤ 500 MB — `audio/mpeg, audio/mp4, audio/aac, audio/ogg, audio/wav`
- E-kitob: ≤ 100 MB — `application/epub+zip` (**standart**), `application/pdf`
- Preview: ≤ 50 MB (formatga mos MIME)

> **E-kitob formati siyosati:** standart — **EPUB** (`application/epub+zip`),
> chunki mobil reader reflowable EPUB bilan shrift/o'lcham/fon temasi va sahifa
> qayta oqishini qo'llaydi. **PDF** — qotirilgan maket; faqat jurnal/albom kabi
> maxsus nashrlar uchun qoldiriladi (PDF rejimida reader sozlamalari ishlamaydi,
> faqat zoom). Backend formatdan qat'i nazar baytlarni shifrlaydi —
> konvertatsiya qilmaydi; EPUB yuklashdan oldin tayyorlanadi (pastga qarang).

## Bepul preview (ommaviy)

```
GET /books/:bookId/preview?format=AUDIO
→ { url, key, iv, algo: "aes-256-ctr", expiresIn }
```

- `url` — shifrlangan namunaga qisqa muddatli **signed GET URL**.
- `key` — DEK (base64). Bepul bo'lgani uchun kalit ochiq beriladi; ilova faylni
  yuklab, `key`+`iv` bilan **AES-256-CTR**'da ochib o'ynaydi.
- Faqat `PUBLISHED` kitob va `READY` preview uchun ishlaydi.

### Free → paid "flip"
`PATCH /editions/:editionId/preview-access  { locked: true }` — namunani pullik
qiladi. Shundan keyin preview kaliti berilmaydi (HTTP 403), lekin **ciphertext
qayta shifrlanmaydi** — at-rest fayl o'zgarmaydi, faqat kalit berish to'xtaydi.
To'liq pullik delivery (litsenziya + qurilma) — 3-bosqich.

## 3-bosqichga tayyor (delivery / licensing)
- `CryptoService.unwrapDek()` va `createContentDecipher()` allaqachon tayyor.
- To'liq kontent delivery'da: purchase/subscription tekshiruvi → DEK'ni qurilma
  ochiq kaliti bilan qayta o'rash → `content` signed URL + `License(expiresAt 30d)`.
- CTR rejimi tufayli ilova HTTP Range bilan kerakli baytdan boshlab ochib,
  audioni sura oladi.

## Sozlash (env)
```
CONTENT_MASTER_KEK   # base64, aniq 32 bayt. Yaratish:
                     #   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
CONTENT_KEK_ID=v1    # KEK versiyasi (rotatsiya uchun)
CONTENT_UPLOAD_URL_TTL=3600
CONTENT_PREVIEW_URL_TTL=600
```
KEK bo'sh bo'lsa shifrlash o'chiq (dev/CI) — yuklash/qayta ishlash 503 beradi.
Productionда `CONTENT_MASTER_KEK` majburiy (aks holda ilova ishga tushmaydi).
Qayta ishlash navbati uchun **Redis** (BullMQ) talab qilinadi.

## R2 bucketlar (production — MUHIM)
Ikki **alohida** bucket ishlatiladi:
| Env | Bucket | Public-read | Mazmun |
|-----|--------|-------------|--------|
| `R2_BUCKET` | ommaviy | **YOQILGAN** (r2.dev/custom domen) | rasmlar (muqova, avatar, banner, ikonka) — to'g'ridan URL |
| `R2_CONTENT_BUCKET` | maxfiy | **O'CHIQ** | `raw/`, `content/`, `backup/` — faqat signed URL bilan |

- Rasmlar sezgir emas → public bucket, CDN tez yetkazadi (signed-URL overhead'siz).
- Kontent (xom yuklash, shifrlangan fayl, original zaxira) → **public-read o'chiq**
  private bucket. Shifrlangan fayl ham, xom `raw/` ham tashqaridan ochilmaydi.
- `R2_CONTENT_BUCKET` bo'sh bo'lsa hammasi bitta bucketda ishlaydi (faqat
  dev/test) — server ishga tushganda ogohlantirish beradi.
- Ikkala bucket bitta R2 akkaunti/kredensiallari bilan ishlaydi (qo'shimcha
  kalit shart emas).
```
