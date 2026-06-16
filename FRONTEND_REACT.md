# Falaq API — Frontend (React) Developer Hujjati

**Admin panel** uchun backend API qo'llanmasi: katalogni (muallif, kategoriya,
kolleksiya, kitob) boshqarish, kontent va rasm yuklash.

> Bu hujjat admin panel (kontent boshqaruvi) uchun. Agar ommaviy web-ilova
> qursangiz — 5-bo'limdagi **ochiq katalog** endpointlari mobil bilan bir xil.

> To'liq interaktiv hujjat (Swagger): **`{BASE}/api/docs`**

---

## 1. Asoslar

|              |                                                                         |
| ------------ | ----------------------------------------------------------------------- |
| **Base URL** | `https://<host>/api/v1`                                                 |
| **Format**   | JSON (yuklash — `multipart/form-data`)                                  |
| **Auth**     | `Authorization: Bearer <accessToken>` (rol: `ADMIN` yoki `SUPER_ADMIN`) |
| **Til**      | `x-lang` header: `uz` (default) · `uz-Cyrl` · `ru` · `en`               |

### Javob o'rami

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {},
  "timestamp": "...",
  "path": "..."
}
```

Xato:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "...",
  "errors": ["..."],
  "timestamp": "...",
  "path": "..."
}
```

> Validatsiya xatolari `errors` massivida (forma maydonlariga bog'lash uchun).

### Sahifalangan ro'yxat (`data`)

```json
{
  "items": [],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 2. Autentifikatsiya (admin kirishi)

Admin panel **email + parol** bilan kiradi (mobil foydalanuvchilardan farqli —
ular OTP/OAuth bilan). Birinchi `SUPER_ADMIN` server ishga tushganda env
(`SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD`) bo'yicha avtomatik yaratiladi;
qolgan adminlarni SUPER_ADMIN panel ichida yaratadi.

```
POST /auth/admin/login   { "email": "admin@falaq.uz", "password": "..." }
```

Javob `data`:

```json
{
  "user": { "id": "...", "fullName": "...", "phone": null, "role": "SUPER_ADMIN" },
  "tokens": { "accessToken": "eyJ...", "refreshToken": "eyJ..." }
}
```

- `user.role`ни tekshiring — `ADMIN`/`SUPER_ADMIN` bo'lmasa admin panelga kiritmang.
- Brute-force himoyasi: **5 urinish/daqiqa** (429 qaytadi).
- Access token ~15 daqiqa; `401`da `POST /auth/refresh { refreshToken }` bilan yangilang
  (**rotation** — yangi refresh'ni saqlang).
- Chiqish: `POST /auth/logout`.

### Adminlarni boshqarish (faqat SUPER_ADMIN)

```
GET    /admin/admins              — ro'yxat (sahifalangan)
POST   /admin/admins              { email, password, fullName, isActive? }
PATCH  /admin/admins/:id          { fullName?, password?, isActive? }
DELETE /admin/admins/:id          — soft-delete (sessiyalari ham bekor qilinadi)
```

- Faqat `ADMIN` rolidagilarni o'zgartirish mumkin — SUPER_ADMIN himoyalangan.
- Bloklash (`isActive:false`) yoki parol almashtirish admin sessiyalarini darhol bekor qiladi.

### axios interceptor namunasi

```ts
api.interceptors.request.use((cfg) => {
  const t = store.accessToken;
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  cfg.headers['x-lang'] = store.lang ?? 'uz';
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401 && store.refreshToken) {
      if (await refreshTokens()) return api(err.config); // POST /auth/refresh
      logout(); // login sahifasiga
    }
    return Promise.reject(err);
  },
);
```

---

## 2a. Statistikalar / Dashboard (admin)

Barcha endpointlar `ADMIN`/`SUPER_ADMIN` ostida. Pul qiymatlari — butun som (UZS).

### Overview — `GET /admin/stats`

Bir so'rovда dashboard sarlavhasi uchun barcha asosiy sonlar:

```json
{
  "users": { "total": 0, "active": 0, "newToday": 0, "newThisMonth": 0 },
  "sales": {
    "paidCount": 0,
    "revenue": 0,
    "revenueToday": 0,
    "revenueThisWeek": 0,
    "revenueThisMonth": 0
  },
  "subscriptions": { "active": 0, "revenue": 0, "expiringSoon": 0 },
  "books": { "total": 0, "published": 0 },
  "content": { "ready": 0, "processing": 0, "failed": 0 },
  "engagement": { "activeReaders": 0, "completedReads": 0 }
}
```

- `content.failed` > 0 — yuklash pipeline'ida muammo (admin'ga signal).
- `subscriptions.expiringSoon` — keyingi 7 kunda tugaydigan obunalar.

### Trend grafiklari — `GET /admin/stats/timeseries`

Query: `metric=revenue|signups|subscriptions` · `interval=day|month` ·
`from`/`to` (ISO sana, ixtiyoriy; default day→30 kun, month→12 oy).

```json
[{ "date": "2026-06-01", "count": 3, "amount": 90000 }]
```

`signups`'da `amount` bo'lmaydi. Grafikда bo'sh kunlarni frontend 0 bilan to'ldiradi.

### Top ro'yxatlar

```
GET /admin/stats/top-books?by=sales|rating|reads&limit=10
GET /admin/stats/top-categories?limit=10
```

- `by=sales` → `{ bookId, title, salesCount, revenue }`
- `by=rating` → `{ bookId, title, avgRating, reviewCount }` (≥3 sharhli)
- `by=reads` → `{ bookId, title, readers }` (distinct o'quvchilar)
- top-categories → `{ categoryId, name, salesCount, revenue }`

### Taqsimotlar — `GET /admin/stats/breakdown`

```json
{
  "booksByStatus": { "DRAFT": 0, "PROCESSING": 0, "PUBLISHED": 0 },
  "booksByAccessType": { "FREE": 0, "SUBSCRIPTION": 0, "PURCHASE": 0 },
  "editionsByFormat": { "AUDIO": 0, "EBOOK": 0 },
  "devicesByPlatform": { "ANDROID": 0, "IOS": 0 },
  "ratingDistribution": { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  "subscriptionsByPlan": [{ "planId": "...", "name": { "uz": "..." }, "activeCount": 0 }]
}
```

### Ro'yxatlar

```
GET /admin/users?search=&page=&limit=   — foydalanuvchilar (telefon/ism/email qidiruv)
GET /admin/sales?page=&limit=           — PAID sotuvlar (kitob/foydalanuvchi bilan)
```

---

## 2b. Bosh sahifa bannerlari (admin)

Promo bannerlar — mobil bosh sahifa karuseli. CRUD `ADMIN`/`SUPER_ADMIN`.

```
GET    /banners                 — ommaviy (faol bannerlar; mobil oladi)
GET    /banners/admin           — barchasi (sahifalangan)
GET    /banners/:id
POST   /banners                 { title, subtitle?, targetType, target..., sortOrder?, isActive?, startsAt?, endsAt? }
PATCH  /banners/:id
POST   /banners/:id/image       — multipart `file` (≤5MB; jpg/png/webp)
DELETE /banners/:id             — soft-delete
```

- **`targetType`** (`BOOK | COLLECTION | URL`) ga mos **bitta** target maydoni
  to'ldirilishi shart: `targetBookId` / `targetCollectionId` / `targetUrl` —
  aks holda `400 common.invalid_reference` (BOOK/COLLECTION uchun mavjudligi ham
  tekshiriladi).
- **Rasm (majburiy):** avval banner yaratiladi (`POST /banners`), so'ng
  `POST /banners/:id/image`. **Rasmsiz banner ommaviy ro'yxatda (mobil karusel)
  ko'rinmaydi** — `isActive: true` bo'lsa ham. Shuning uchun banner yaratgach
  darhol rasm yuklang (UI'da rasm yuklashni majburiy qadam qiling).
- **Tartib**: `sortOrder` (kichik — oldinroq). **Aksiya oynasi**: `startsAt`/`endsAt`
  (ISO, ixtiyoriy) — bu oraliqdan tashqarida banner ommaviy ro'yxatда ko'rinmaydi.

---

## 3. Ko'p tilli maydonlar (LocalizedText)

Tarjimalanadigan maydonlar (`name`, `title`, `description`, `bio`) — **obyekt**:

```json
{ "uz": "Oʻtkan kunlar", "uz-Cyrl": "Ўтган кунлар" }
```

Yuborishda:

- **`uz` (lotin) — majburiy**.
- **`uz-Cyrl`** — admin panel **avto-transliteratsiya** qilib yuborishi tavsiya
  etiladi (foydalanuvchi faqat lotinда yozadi, panel kirillга o'giradi).
- `ru` / `en` — ixtiyoriy (kelajak uchun).

```ts
// Masalan transliteratsiya kutubxonasi bilan:
const name = { uz: input, 'uz-Cyrl': toCyrillic(input) };
```

---

## 4. Katalogni boshqarish (admin CRUD)

Barcha yaratish/yangilash/o'chirish — `Bearer` + `ADMIN`/`SUPER_ADMIN`.
O'chirish — **soft-delete** (yozuv yashiriladi, butunlay o'chmaydi).

### 4.1. Muallif (`/authors`)

```
POST /authors
{ "name": { "uz": "Abdulla Qodiriy", "uz-Cyrl": "Абдулла Қодирий" },
  "bio": { "uz": "..." }, "photoUrl": "https://...", "isActive": true }

PATCH /authors/:id    { ... (istalgan maydon) }
DELETE /authors/:id
```

### 4.2. Kategoriya (`/categories`)

```
POST /categories
{ "name": { "uz": "Badiiy", "uz-Cyrl": "Бадиий" },
  "iconUrl": "https://...", "sortOrder": 0, "isActive": true }
```

### 4.3. Kolleksiya (`/collections`)

```
POST /collections
{ "name": { "uz": "Tavsiya etamiz" }, "description": { "uz": "..." },
  "coverUrl": "https://...", "sortOrder": 0, "isExclusive": false, "isActive": true }
```

> Kolleksiya = tahririyat to'plami (bosh ekran qatorlari). Kategoriya = janr.
> `isExclusive=true` → "Exclusive" promo to'plam.

### 4.4. Kitob (`/books`) — eng muhim

```
POST /books
{
  "title": { "uz": "Oʻtkan kunlar", "uz-Cyrl": "Ўтган кунлар" },
  "description": { "uz": "Tarixiy roman" },
  "coverUrl": "https://cdn.falaq.uz/books/....jpg",
  "accessType": "PURCHASE",             // FREE | SUBSCRIPTION | PURCHASE (default PURCHASE)
  "price": 25000,                       // UZS, butun som. Faqat PURCHASEda majburiy
  "publishedYear": 1925,
  "isbn": "978-9943-01-234-5",
  "sortOrder": 0,
  "status": "DRAFT",                    // DRAFT | PROCESSING | PUBLISHED (default DRAFT)
  "authorIds":     ["<uuid>"],          // bir yoki ko'p muallif (N—N, ixtiyoriy)
  "categoryIds":   ["<uuid>"],          // N—N
  "collectionIds": ["<uuid>"],          // N—N
  "editions": [                          // kamida bitta format
    { "format": "AUDIO", "narrator": "Akmal Po'latov" },
    { "format": "EBOOK", "pageCount": 320 }
  ]
}
```

Muhim qoidalar:

- **Majburiy maydonlar (yaratishda):** `title`, **`description`**, **`authorIds`**
  (≥1), **`categoryIds`** (≥1), **`collectionIds`** (≥1), `editions` (≥1).
  Bo'sh yuborilsa `400`. Formada bularni required qiling.
- **Muqova (`coverUrl`)** — create JSON'да emas, **alohida** yuklanadi
  (`POST /books/:id/cover`). Shu sabab **kitobni `PUBLISHED` qilishdan oldin
  muqova yuklangan bo'lishi shart** — aks holda `400 cover_required_to_publish`.
  Oqim: kitob yarat (DRAFT) → muqova yukla → `status: "PUBLISHED"`.
- **`status`** — `DRAFT` (default) → `PROCESSING` → `PUBLISHED`. **Faqat
  `PUBLISHED`** kitoblar ommaviy katalogда (mobil app) ko'rinadi. Admin kitobни
  tayyorlab, `PATCH`да `status: "PUBLISHED"` qiladi.
- **`authorIds`** — mualliflar **massivi** (kitobда bir nechta muallif bo'lishi
  mumkin). `categoryIds`/`collectionIds` ham N—N (massiv). Javobда `book.authors[]`.
- **`editions`** — kamida 1 ta. Har format bir marta (ikkita `AUDIO` → `400`).
  Audio uchun `narrator` (`durationSeconds` — **avtomat**, audio fayl shifrlanganда
  aniqlanadi; qo'lda kiritsangiz, avto-qiymat ustidan yozadi). E-kitob uchun
  `pageCount` — EPUB reflowable bo'lgani uchun **taxminiy** (bosma jami beti).
- **`accessType`** — kirish modeli: `FREE` (bepul), `SUBSCRIPTION` (faqat obuna,
  alohida sotilmaydi), `PURCHASE` (faqat xarid). Default `PURCHASE`.
- **Narx**: faqat `PURCHASE`da `price` majburiy; `FREE`/`SUBSCRIPTION` → narx
  e'tiborsiz (`price=null` saqlanadi). Formada narx maydonini faqat `PURCHASE`da ko'rsating.
- **`authorIds`/`categoryIds`/`collectionIds`** — mavjud ID'lar bo'lishi shart
  (yo'q ID → `400 invalid_reference`).

```
PATCH /books/:id     // berilgan maydonlar yangilanadi (masalan status: "PUBLISHED").
                     // editions berilsa — format bo'yicha to'liq almashtiriladi.
                     // categoryIds berilsa — bog'lanish to'liq almashtiriladi ([] = tozalash).
DELETE /books/:id    // soft-delete
```

Javob (`POST`/`PATCH`/`GET`) — to'liq `BookDto` (mobil hujjatdagi shakl:
`authors[]`, `categories[]`, `collections[]`, `editions[]`, `status` bilan).

### Ro'yxat va filtr (admin jadvallar uchun)

```
GET /books/admin?page=1&limit=20&search=...&status=DRAFT&categoryId=&authorId=&collectionId=&format=&accessType=
GET /authors?page&limit&search
GET /categories?page&limit&search
GET /collections?page&limit&search
```

> ⚠️ Admin jadvali uchun **`GET /books/admin`** (Bearer, ADMIN) — **barcha
> holatdagi** kitoblarни qaytaradi (`DRAFT`/`PROCESSING`/`PUBLISHED`),
> ixtiyoriy `status` filtri bilan. Ommaviy **`GET /books`** esa faqat
> `PUBLISHED`. Author/category/collection ro'yxati `isActive=true`.

---

## 5. Rasm yuklash (kontent uchun)

Rasm **to'g'ridan-to'g'ri yozuvga** yuklanadi — alohida URL bilan ovora bo'lmaysiz.
Yuklash → backend faylни R2'ga joylaydi, **rasm maydonини o'rnatadi, eskisini
o'chiradi** va **yangilangan yozuvni** qaytaradi.

| Endpoint                      | Maydon     | Javob           |
| ----------------------------- | ---------- | --------------- |
| `POST /books/:id/cover`       | `coverUrl` | `BookDto`       |
| `POST /authors/:id/photo`     | `photoUrl` | `AuthorDto`     |
| `POST /categories/:id/icon`   | `iconUrl`  | `CategoryDto`   |
| `POST /collections/:id/cover` | `coverUrl` | `CollectionDto` |

- `multipart/form-data`, field nomi: **`file`**. JPEG/PNG/WebP, maks **5 MB**.

### ⭐ Bitta "Saqlash" qanday ishlaydi (id qayerdan keladi?)

Kitob hali yaratilmagan — unda `/:id/cover` uchun id'ni qayerdan olamiz?
**Javob:** rasm darrov yuklanmaydi, **brauzerда (state) turadi**. "Saqlash"
bosilganда **ketma-ket 2 so'rov** ketadi — id **birinchi so'rovning javobidan**
olinadi:

```
1. POST /books            → backend kitobni yaratadi va  id  bilan qaytaradi
2. id ni javobdan olamiz   (res.data.data.id)
3. POST /books/{id}/cover  → endi id bor, brauzerдаgi rasmni yuklaymiz
```

Admin esa **bitta tugma** bosgan.

```tsx
function BookForm() {
  const [form, setForm] = useState({ title: { uz: '' }, editions: [] /* ... */ });
  const [coverFile, setCoverFile] = useState<File | null>(null); // rasm brauzerда turadi

  async function handleSave() {
    // 1) Kitobni yaratamiz — javobda yangi id keladi
    const res = await api.post('/books', form);
    const bookId = res.data.data.id; // ← id SHU YERDAN

    // 2) Rasm tanlangan bo'lsa — endi id bor, yuklaymiz
    if (coverFile) {
      const fd = new FormData();
      fd.append('file', coverFile);
      await api.post(`/books/${bookId}/cover`, fd);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
    >
      {/* title, editions, narx maydonlari ... */}
      <input type="file" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
      <button type="submit">Saqlash</button> {/* bitta tugma */}
    </form>
  );
}
```

> `res.data.data.id` — javob o'ralgan: `{ success, data: {kitob}, ... }`, demak
> `data.data` = kitob, `data.data.id` = uning id'si.

**Tahrirlashда** (kitob mavjud, id bor) — yana oson:

```ts
await api.patch(`/books/${id}`, form);
if (coverFile) await api.post(`/books/${id}/cover`, fd);
```

> Xuddi shu naqsh: `authors/:id/photo`, `categories/:id/icon`, `collections/:id/cover`.
> Rasmni butunlay olib tashlash — `PATCH`да maydonni `null` qiling.
> Nozik holat: 1-so'rov o'tib 2-so'rov (rasm) xato bersa — kitob rasmsiz saqlanadi
> (muqova ixtiyoriy); panel faqat `/books/:id/cover`ни qayta chaqirsa bo'ladi.

### Foydalanuvchi avatari (o'z profili — admin emas)

```
POST /users/me/avatar          (multipart/form-data, field: "file")
DELETE /users/me/avatar
```

Javob — yangilangan `UserDto` (`avatarUrl` bilan). Eski rasm avtomatik almashtiriladi.

---

## 5a. Kontent (audio / e-kitob) fayllarini yuklash

Rasmlardan farqli — kontent **presigned URL bilan to'g'ridan-to'g'ri R2'ga**
yuklanadi (500MB fayl server orqali o'tmaydi). Har edition (format) uchun oqim:

```
1. POST /editions/:editionId/upload-url   { kind:"CONTENT", mime, sizeBytes }
   → { assetId, uploadUrl, expiresIn }
2. PUT <uploadUrl>   (fayl tanasi; Header: Content-Type = yuborilgan mime)   ← brauzer → R2
3. POST /editions/:editionId/process?kind=CONTENT     → { status:"PROCESSING" }
4. GET  /editions/:editionId/assets     (holatni poll qiling)  → status PROCESSING → READY
```

- `editionId` — kitob yaratilganda/olinganda qaytgan `editions[].id`.
- `kind`: `CONTENT` (to'liq) yoki `PREVIEW` (bepul namuna) — preview ham xuddi
  shunday yuklanadi (`kind:"PREVIEW"`).
- **Audio'ni bob bo'lib yuklash:** `upload-url` body'ga `order` (0,1,2...) va
  `title` (LocalizedText — bob nomi) qo'shing; `process`'ga `&order=N` bering.
  Har bobni alohida yuklang (`order: 0`, so'ng `1`, `2`...). E-kitob va bir
  faylли audio uchun `order`ни berMASangiz 0 bo'ladi (bitta fayl). Preview doim
  bitta (order 0). Mobil delivery boblarni `chapters[]` qilib qaytaradi.
  Audio davomiyligi (`durationSeconds`) har bobда **avtomat** aniqlanadi.
- Cheklovlar: audio ≤ **500MB** (har bob), e-kitob ≤ **100MB**, preview ≤ **50MB**;
  MIME — `audio/mpeg, audio/mp4, audio/aac, audio/ogg, audio/wav` yoki
  `application/epub+zip` (**e-kitob standarti**), `application/pdf`.

> **E-kitobni EPUB qilib yuklang.** Mobil reader (shrift/o'lcham/fon temasi,
> sahifa qayta oqishi) faqat **EPUB** (reflowable) bilan to'liq ishlaydi. PDF —
> qotirilgan maket: reader'da faqat zoom bo'ladi, shrift/tema sozlamalari
> ishlamaydi (faqat jurnal/albom kabi nashrlar uchun).
>
> Backend **konvertatsiya qilmaydi** — EPUB yuklashdan oldin tayyorlanadi:
> nashriyot/manbadan tayyor EPUB oling, yoki **Calibre** (bepul) bilan
> PDF/DOCX → EPUB qilib, ko'z bilan tekshirib yuklang. PDF→EPUB sifati past
> bo'lishi mumkin (ayniqsa skanlangan PDF — rasm, matn qatlami yo'q).

- Preview'ni bepul/pullik qilish: `PATCH /editions/:editionId/preview-access { locked }`.
- Barcha kerakli asset **READY** bo'lgach kitobni chop eting:
  `PATCH /books/:id { status:"PUBLISHED" }`.

```ts
// order/title — faqat audio bob bo'lib yuklashda; aks holda berMANG (0 bo'ladi).
async function uploadContent(
  editionId: string,
  file: File,
  kind: 'CONTENT' | 'PREVIEW',
  order = 0,
  title?: { uz: string; 'uz-Cyrl'?: string },
) {
  const { data } = await api.post(`/editions/${editionId}/upload-url`, {
    kind,
    mime: file.type,
    sizeBytes: file.size,
    order,
    title,
  });
  const { uploadUrl } = data.data;
  await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  await api.post(`/editions/${editionId}/process?kind=${kind}&order=${order}`);
  // so'ng GET /editions/:editionId/assets ni poll qiling (status READY bo'lguncha)
}
// Ko'p bobli audio: har bobni ketma-ket yuklang —
//   await uploadContent(ed, ch0, 'CONTENT', 0, { uz: '1-bob' });
//   await uploadContent(ed, ch1, 'CONTENT', 1, { uz: '2-bob' });
```

> ⚠️ R2 sozlanmagan / `CONTENT_MASTER_KEK` yo'q bo'lsa — `503`.

---

## 5b. Obuna tariflari, moderatsiya, bildirishnoma

### Obuna tariflari (CRUD)

```
GET    /subscription-plans            → barcha tariflar
POST   /subscription-plans            { name(LocalizedText), description?, price, periodDays, isActive?, sortOrder? }
PATCH  /subscription-plans/:id
DELETE /subscription-plans/:id        (soft-delete)
```

### Foydalanuvchiga obuna biriktirish (to'lovsiz — admin grant)

```
POST /admin/users/:userId/subscription   { planId }
→ obuna darhol ACTIVE bo'lib biriktiriladi (to'lov yo'q)
```

- Faqat oddiy **USER**'ga; tanlangan tarif **faol** bo'lishi shart.
- Foydalanuvchida **allaqachon faol obuna bo'lsa** → `400 already_active`.
- Muddat tarif `periodDays`idan hisoblanadi; `autoRenew=false` (qaytadan pul
  yechilmaydi). Foydalanuvchini `GET /admin/users?search=` orqali topib `userId`
  olasiz, tarifni `GET /subscription-plans` dan tanlaysiz.

### Sharh moderatsiyasi

```
GET    /reviews?bookId=&page&limit    → barcha sharhlar (sahifalangan)
DELETE /reviews/:id                   → sharhni o'chirish
```

### Push / bildirishnoma yuborish (hammaga)

```
POST /notifications/broadcast
{ type, title: LocalizedText, body: LocalizedText, refId? }   → navbatga (background)
```

> **Ko'p tilli:** `title` va `body` endi **LocalizedText** (obyekt) —
> `{ "uz": "...", "uz-Cyrl": "...", "ru": "...", "en": "..." }`. `uz` majburiy.
> Har foydalanuvchiga **o'z tilida** (afzal tili) yetkaziladi (fallback `uz`).
> Forma: har til uchun title/body inputlari (kategoriya nomlari kabi).

`type`: `NEW_BOOK` · `PROMO` · `REMINDER` · `LICENSE_EXPIRY`. `refId` — bog'liq
kitob id (ixtiyoriy, ilovada chuqur havola uchun).

---

## 6. Rollar va himoya

| Rol           | Imkoniyat                                        |
| ------------- | ------------------------------------------------ |
| `USER`        | Faqat o'qish + o'z profili                       |
| `ADMIN`       | Katalog CRUD, kontent boshqaruvi                 |
| `SUPER_ADMIN` | To'liq (kelajakda: adminlarни boshqarish, tizim) |

- Admin endpointga ruxsatsiz kirish → **`403`** (`message`: "Ruxsat yo'q").
- Token yo'q/yaroqsiz → **`401`**.

---

## 7. Xato kodlari

| Status | Ma'no                                                             |
| ------ | ----------------------------------------------------------------- |
| `400`  | Validatsiya / noto'g'ri ma'lumot / mavjud bo'lmagan bog'lanish ID |
| `401`  | Token yaroqsiz/muddati tugagan → refresh                          |
| `403`  | Rol yetarli emas                                                  |
| `404`  | Topilmadi                                                         |
| `409`  | Konflikt (band qiymat)                                            |
| `413`  | Fayl juda katta (>5 MB)                                           |
| `429`  | Juda ko'p so'rov (throttle)                                       |
| `503`  | Fayl xizmati sozlanmagan                                          |

---

## 8. Tezkor checklist

- [ ] `verify` dan keyin `role`ни tekshiring (`ADMIN`/`SUPER_ADMIN`)
- [ ] axios interceptor: `Authorization` + `x-lang` + `401` avto-refresh
- [ ] LocalizedText: `uz` majburiy, `uz-Cyrl`ни avto-transliteratsiya qiling
- [ ] Kitob: `editions` ≥ 1, format takrorlanmasin, `accessType=PURCHASE` → `price`
- [ ] `authorIds`/`categoryIds`/`collectionIds` (massiv) — mavjud ID
- [ ] Kitobni ko'rsatish uchun `status: "PUBLISHED"` qiling (default `DRAFT`)
- [ ] Rasm: multipart `file`, ≤ 5 MB, JPEG/PNG/WebP
- [ ] `errors` massivini forma maydonlariga bog'lang

Eng aniq manba — Swagger: `/api/docs`.
