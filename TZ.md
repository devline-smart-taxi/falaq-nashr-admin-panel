# Falaq — Texnik Topshiriq (TZ)

**Loyiha:** Falaq nashriyoti — audio va elektron kitoblar platformasi
**Versiya:** 1.2 (v1 MVP, dizayn asosida yangilangan)
**Sana:** 06.06.2026

> Bu — loyihaning rasmiy texnik topshirig'i. Backend rivojlanishi shu hujjatga
> muvofiq olib boriladi. (Asl fayl: `falaq_tz.md.pdf`.)

---

## 1. Loyiha haqida umumiy ma'lumot

Falaq — audio va elektron kitoblarni sotib olib, ularni online tinglash/o'qish
hamda offline (internetsiz) foydalanish imkonini beruvchi mobil ilova (Flutter).

### Asosiy biznes-qoidalar

- Har bir kitob alohida sotib olinadi (bir martalik xarid).
- Bitta xarid bilan kitobning **ham audio, ham elektron** varianti ochiladi.
- Sotib olingan kitob offline (internetsiz) tinglanishi/o'qilishi mumkin.
- Offline kirish litsenziyaga bog'langan: muddat **30 kun**, tugaganda internetga
  ulanib yangilanadi.
- Kontent himoyalangan: shifrlash + qurilmaga bog'langan kalit + anti-screenshot.
- Narxlar so'mda (UZS) ko'rsatiladi.

---

## 2. Texnologiyalar stacki

| Qatlam             | Texnologiya                                 | Sabab                            |
| ------------------ | ------------------------------------------- | -------------------------------- |
| Backend            | NestJS (Node.js + TypeScript)               | Modular, kuchli DI               |
| ORM                | TypeORM                                     | Tanlangan ORM                    |
| Ma'lumotlar bazasi | PostgreSQL                                  | Ishonchli relational DB          |
| Background jobs    | BullMQ + Redis                              | Og'ir ishlarni navbatga olish    |
| Kontent saqlash    | Cloudflare R2                               | Egress bepul, S3-compatible, CDN |
| Mobil ilova        | Flutter / Dart                              | Cross-platform                   |
| Admin panel        | React + Vite + Ant Design                   | Tez UI                           |
| Kalit boshqaruvi   | KMS yoki shifrlangan secret storage         | Master kalitlarni himoyalash     |
| To'lov             | Octobank subscribe API (karta tokenization) | Karta saqlash + xarid            |
| Push bildirishnoma | Firebase Cloud Messaging (FCM)              | Notification                     |

---

## 3. Funksional talablar

### 3.1. Foydalanuvchi tomoni (mobil ilova)

**Autentifikatsiya**

- Ro'yxatdan o'tish / kirish: telefon raqami (OTP/SMS), Google, Apple.
- Token (JWT) asosida sessiya.
- Har bir qurilma ro'yxatga olinadi (device registration, public key).

**Bosh sahifa (Main)**

- Shaxsiy salomlashish ("Hi, {ism}!").
- Qidiruv.
- Promo to'plamlar / kuratsiya qilingan kolleksiyalar (masalan "Romance — Exclusive").
- "New" (yangi kitoblar) bo'limi.
- "Recommended" (tavsiya) bo'limi.
- Davom ettirish vidjeti (continue reading/listening, progress %).

**Market (katalog)**

- Kitoblar ro'yxati (sahifalash).
- Qidiruv (nom, muallif).
- Kategoriya / janr / muallif bo'yicha filtr.

**Kitob sahifasi**

- Muqova, nom, muallif, tavsif.
- Statistika: sahifalar soni, audio davomiyligi, o'rtacha reyting, sharhlar soni.
- Preview — ham o'qish, ham tinglash uchun namuna (bepul qism).
- Narx (so'm) + "Buy" tugmasi.
- Sharhlar: foydalanuvchi ismi, sana, reyting, matn + "See all" (sahifalash).

**Sotib olish**

- Octobank orqali to'lov (karta saqlash bilan).
- Xaridan so'ng kitob "Purchased"ga tushadi va litsenziya yaratiladi.

**Kutubxona (Library) — tablar bilan**

- All — barchasi.
- Saved — saqlangan / wishlist.
- Purchased — sotib olingan.
- Downloaded — offline uchun yuklab olingan.
- Now reading — jarayonda (progress asosida).
- Har bir kitobni yuklab olish va yuklash holatini ko'rsatish ("200 Mb").

**Audio pleer**

- Play / pause, -10s orqaga, +30s oldinga.
- Tinglash tezligi: 0.5x – 2x.
- Uyqu taymeri: 5 / 10 / 15 / 30 daqiqa, 1 soat.
- Bookmark, to'xtagan joyni saqlash (resume position).
- Read ↔ Listen almashish.
- Keyingi / oldingi bob.
- Kitobni ulashish (tavsiya — matn emas).
- Offline tinglash (yuklab olingan kitoblar).

**Ebook reader**

- Bob-bob o'qish, pozitsiya ("X from Y" + %).
- Shrift o'lchami (aA), tun rejimi.
- Bookmark, oxirgi o'qilgan joyni saqlash.
- Listen ↔ Read almashish.
- Kitobni ulashish (tavsiya — matn emas).
- Matnni Copy/eksport qilish o'chirilgan (himoya uchun).
- Offline o'qish (yuklab olingan kitoblar).

**Bildirishnomalar (Notification)**

- Push (FCM) orqali.
- Turlari: yangi kitob/kolleksiya, promo/aksiya, o'qishni davom ettirish eslatmasi,
  litsenziya muddati tugashi haqida ogohlantirish.
- In-app bildirishnomalar ro'yxati.
- Foydalanuvchi bildirishnoma turlarini yoqish/o'chirish sozlamasi.

**Qo'shimcha**

- Saved / wishlist.
- Sharh va reyting qoldirish.

### 3.2. Admin tomoni (admin panel)

**Kitob boshqaruvi**

- Kitob qo'shish: metadata (nom, muallif, kategoriya, tavsif, narx, muqova, sahifalar soni).
- Audio fayl va ebook fayl yuklash.
- Preview (namuna) qismini belgilash.
- Yuklash statusini kuzatish (draft → processing → published).
- Tahrirlash, unpublish, o'chirish.

**Kolleksiya / muallif / kategoriya boshqaruvi**

- Promo kolleksiyalar yaratish (kitoblarni guruhlash, banner).
- Muallif qo'shish/tahrirlash.
- Kategoriya/janr qo'shish/tahrirlash.

**Bildirishnoma boshqaruvi**

- Push bildirishnoma yuborish (hammaga yoki segmentga).

**Buyurtmalar va analitika**

- Sotuvlar ro'yxati, qaysi kitob qancha sotilgani.
- Foydalanuvchilar ro'yxati.

**Moderatsiya**

- Sharhlarni ko'rish/o'chirish.

---

## 4. Domen modeli (asosiy entity'lar)

> To'liq TypeORM entity'lari keyingi bosqichda yoziladi.

- **User** — id, telefon, ism, authProvider (PHONE|GOOGLE|APPLE), rol.
- **Device** — id, userId, publicKey, platform, fcmToken, lastSeen.
- **Author** — id, nom, bio.
- **Category** — id, nom.
- **Collection** — id, nom, tavsif, banner, isExclusive.
- **Book** — id, nom, tavsif, narx, muqova, authorId, status, pageCount,
  audioDuration, avgRating, reviewCount.
- **BookAsset** — id, bookId, type (AUDIO|EBOOK), r2Key, previewKey, masterKeyId, status.
- **Purchase** — id, userId, bookId, narx, holat (PENDING|PAID|FAILED), octobankTxnId, sana.
- **PaymentCard** — id, userId, octobankToken, maskedPan (saqlangan karta).
- **License** — id, userId, bookId, deviceId, wrappedKey, expiresAt.
- **ReadingProgress** — id, userId, bookId, type (AUDIO|EBOOK), position, percent.
- **Review** — id, userId, bookId, rating, matn, sana.
- **Saved** — id, userId, bookId (wishlist).
- **Notification** — id, userId, type, title, body, isRead, sana.

### Asosiy bog'lanishlar

- User 1—N Device, Purchase, PaymentCard, ReadingProgress, Review, Saved, Notification
- Book **N—1 Author**, Book N—N Category, Book N—N Collection
- Book 1—N BookAsset (audio + ebook)
- Purchase N—1 Book
- User + Book + Device → 1 License (har qurilma uchun)

---

## 5. Backend arxitektura (NestJS modullari)

| Modul              | Vazifasi                                                               |
| ------------------ | ---------------------------------------------------------------------- |
| `auth`             | Telefon OTP, Google/Apple OAuth, JWT, device registration              |
| `users`            | Foydalanuvchi profili                                                  |
| `catalog`          | Kitob, muallif, kategoriya, kolleksiya, qidiruv (o'qish API)           |
| `purchase`         | Sotib olish oqimi, buyurtmalar                                         |
| `payment`          | Octobank integratsiyasi (karta tokenization, to'lov, callback)         |
| `licensing`        | Litsenziya, wrapped key, 30 kunlik yangilash                           |
| `content-delivery` | Signed URL, kirish nazorati                                            |
| `library`          | Kutubxona (Saved/Purchased/Downloaded/Now reading), progress, bookmark |
| `reviews`          | Sharh va reyting                                                       |
| `notifications`    | FCM push, in-app bildirishnomalar                                      |
| `admin`            | Kitob/kolleksiya/muallif/kategoriya/bildirishnoma boshqaruvi           |
| `media-processing` | Background job: validatsiya, normalize, shifrlash, R2 upload           |
| `storage`          | R2 (S3-compatible client)                                              |

**Arxitektura turi:** modular monolith (v1).

---

## 6. Kontent saqlash va himoya

### 6.1. Saqlash

- Barcha kontent (audio + ebook) Cloudflare R2'da saqlanadi.
- R2'da hech qachon ochiq (plaintext) fayl turmaydi — faqat shifrlangan (ciphertext) fayllar.
- Fayl bir marta master_key (AES-256) bilan shifrlangan, bitta nusxa.
- DB'da faqat metadata va asset key (`r2Key`); faylning o'zi DB'da emas.
- Original (shifrlanmagan) fayl alohida private bucketda zaxira.

### 6.2. Server yuki

- Kontent baytlari (200–500 MB) NestJS serveridan o'tmaydi. Fayl R2'dan
  to'g'ridan-to'g'ri ilovaga oqadi (signed URL orqali).
- Server faqat darvozabon: auth, sotib olinganini tekshirish, signed URL va
  wrapped key berish.
- Server faylni faqat admin yuklash paytida ushlaydi (shifrlash), u ham background job'da.

### 6.3. Shifrlash sxemasi (envelope encryption)

1. Fayl R2'da master_key bilan shifrlangan.
2. Foydalanuvchi yuklaganda: backend master_key ni o'sha qurilmaning public key'i
   bilan shifrlaydi (wraps) → `wrappedKey`.
3. Qurilmada: device private key (Keychain/Keystore) wrappedKey ni ochadi →
   master_key → fayl ochiladi.
4. Wrapped key faqat o'sha qurilmada ishlaydi — boshqa qurilmaga ko'chirilsa ochilmaydi.

### 6.4. Offline va litsenziya

- Litsenziyada `expiresAt` (30 kun).
- Offline: app litsenziya muddati va lokal kalitni tekshiradi, internetsiz ishlaydi.
- Muddat tugagach: internetga ulanib litsenziyani yangilash.
- To'liq deshifrlangan fayl diskka yozilmaydi — faqat xotirada, oqim-oqim deshifrlanadi.
  - Audio: just_audio uchun custom decrypting stream source (HTTP Range → surish ishlaydi).
  - Ebook: bob ochilganda xotirada deshifrlanadi.

### 6.5. Anti-screenshot choralari

- Android: FLAG_SECURE — screenshot va ekran yozuvini butunlay bloklaydi (qora ekran).
- iOS: screenshot oldini olib bo'lmaydi. Shuning uchun:
  - Detection — userDidTakeScreenshotNotification va isCaptured sezilganda
    kontentni bulutlashtirish/ogohlantirish.
  - Ixtiyoriy: o'qish/tinglash ekranida yengil, yarim shaffof Falaq logosi overlay.
- Matnni Copy/eksport ebook reader'da o'chirilgan.

---

## 7. To'lov oqimi (Octobank)

- To'lov Octobank subscribe API (karta tokenization) orqali, ilova ichida.
- Foydalanuvchi kartani bir marta bog'laydi → token saqlanadi (`PaymentCard`) →
  keyingi xaridlar tez amalga oshiriladi.
- Oqim: "Buy" → Octobank to'lovi → callback/tasdiq → Purchase PAID → License yaratiladi.
- Kitoblar bir martalik xarid (abadiy egalik).

**Muhim xavf (App Store / Play Store)**

- Apple va Google raqamli kontent uchun ilova ichida tashqi to'lovni taqiqlaydi — IAP majburiy.
- Octobank'ni ilovada to'g'ridan-to'g'ri ishlatish ilova rad etilishiga olib kelishi mumkin.
- Yengish yo'llari (keyin ko'rib chiqiladi): xaridni ilova tashqarisida (web/link)
  qildirish, yoki "reader app" modeli.

---

## 8. Non-functional talablar

- **Xavfsizlik:** kontent shifrlangan, R2'da plaintext yo'q, signed URL qisqa
  muddatli, kalitlar himoyalangan, HTTPS majburiy, anti-screenshot.
- **Masshtablanish:** server yuki fayl hajmidan mustaqil; R2 + CDN trafikni ko'taradi.
- **Ishonchlilik:** background job'lar retry bilan; yuklash xatosida draft holatda qoladi.
- **Tezlik:** katalog so'rovlari sahifalangan, N+1 muammosiz.
- **Audit:** yuklash, to'lov va kalit berish loglanadi.

---

## 9. Bosqichlar (Roadmap)

**1-bosqich — Poydevor**

- DB schema (TypeORM), auth (telefon OTP + Google + Apple), device registration.
- Katalog API (kitob, muallif, kategoriya, kolleksiya, qidiruv).
- Admin panel: kitob qo'shish, metadata, kolleksiya.

**2-bosqich — Kontent pipeline**

- R2 integratsiyasi (storage modul).
- Admin yuklash + background job (validatsiya, shifrlash, R2 upload).
- Signed URL va content-delivery.

**3-bosqich — Sotib olish va litsenziya**

- Octobank integratsiyasi (karta saqlash, to'lov, callback).
- Licensing: wrapped key, 30 kunlik litsenziya.
- Kutubxona (Saved/Purchased/Downloaded/Now reading).

**4-bosqich — Mobil ilova (eng murakkab)**

- Main, Market, kitob sahifasi, sotib olish, kutubxona ekranlari.
- Audio pleer + offline decrypting stream + taymer/tezlik.
- Ebook reader + offline bob deshifrlash + shrift/tun rejimi.
- Keychain/Keystore kalit boshqaruvi.
- FLAG_SECURE + iOS detection.

**5-bosqich — Bildirishnoma va qo'shimcha**

- FCM push + in-app bildirishnomalar.
- Sharh, reyting, Saved.
- Progress/bookmark sinxronizatsiyasi.
- Analitika (admin).

---

## 10. Eslatma / Risklar

- Eng murakkab qism — Flutter offline deshifrlash qatlami (custom audio source +
  Keystore). v1 vaqtida hisobga olish kerak.
- App Store / Play Store risk: Octobank kabi tashqi to'lov raqamli kontent uchun
  do'kon qoidalariga zid — ilova rad etilishi mumkin. To'lov strategiyasini qayta
  ko'rib chiqish kerak bo'lishi mumkin.
- DRM 100% himoya bermaydi — maqsad nusxalashni qiyinlashtirish.
- iOS'da screenshot ichiga logo "joylashtirib" bo'lmaydi — faqat doimiy overlay
  orqali (ixtiyoriy).

---

## Addendum — Obuna (Subscription) modeli

Biznes modeli **gibrid**ga kengaytirildi: bir martalik xariddан tashqari
**obuna** ham bor. Foydalanuvchi obuna sotib olib `SUBSCRIPTION` kitoblardan
foydalanadi; `PURCHASE` kitoblar esa obunaga kirmaydi — alohida sotib olinadi
(abadiy). Har kitobning kirish modeli `Book.accessType` bilan: `FREE` /
`SUBSCRIPTION` / `PURCHASE` (default `PURCHASE`, narx faqat `PURCHASE`da).

- **Qurildi:** `Book.accessType` maydoni + katalog/filtr.
- **Keyingi bosqich (3, to'lov bilan):** rejalar (`SubscriptionPlan`, ko'p tarif),
  foydalanuvchi obunasi (`UserSubscription`), kirish hal qilish (`AccessService`),
  Octobank recurring. To'liq dizayn — `docs/SUBSCRIPTION_DESIGN.md`.
