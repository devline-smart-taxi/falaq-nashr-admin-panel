# 5-bosqich — Sharh/reyting, kutubxona, bildirishnoma, admin analitika

TZ 5-bosqichi (va §3.1/§3.2 qoldiqlari) bo'yicha qurilgan funksiyalar.

## Sharh va reyting (`reviews`)

Har foydalanuvchi har kitobga **bitta** sharh (reyting 1–5 + ixtiyoriy matn);
qayta yuborilsa yangilanadi. Kitobning `avgRating`/`reviewCount` denormallari
har o'zgarishda darhol qayta hisoblanadi — katalog kartochkasida tez o'qiladi.

> **Qoida:** sharh/reyting faqat kitobni **o'qib/eshitib tugatgandan keyin**
> qoldiriladi — biror formatда progress `COMPLETION_PERCENT` (95%)'ga yetgan
> bo'lishi shart, aks holda `403`. (`LibraryService.hasCompletedReading`.)

| Metod    | Yo'l                        | Kirish                        |
| -------- | --------------------------- | ----------------------------- |
| `GET`    | `/books/:bookId/reviews`    | ommaviy (sahifalangan)        |
| `PUT`    | `/books/:bookId/reviews/my` | auth — yuborish/yangilash     |
| `DELETE` | `/books/:bookId/reviews/my` | auth — o'z sharhini o'chirish |
| `GET`    | `/reviews?bookId=`          | admin — moderatsiya ro'yxati  |
| `DELETE` | `/reviews/:id`              | admin — moderatsiya o'chirish |

## Kutubxona (`library`)

TZ tablari: **All / Saved / Purchased / Downloaded / Now reading**.

- _Purchased_ — PAID xaridlar; _Downloaded_ — delivery qilingan (litsenziyali)
  kitoblar; _Now reading_ — progress 1–99%.
- **Progress (resume position):** har (kitob, format) bo'yicha pozitsiya
  (audio — sekund, e-kitob — joylashuv) + foiz. Ilova davriy `PUT` qiladi.
- **Davom ettirish vidjeti:** eng so'nggi progress + kitob.
- **Xatcho'plar:** pozitsiya + izoh (audio/e-kitob).

| Metod             | Yo'l                                                          |
| ----------------- | ------------------------------------------------------------- |
| `GET`             | `/library?tab=ALL\|SAVED\|PURCHASED\|DOWNLOADED\|NOW_READING` |
| `GET`             | `/library/continue`                                           |
| `POST` / `DELETE` | `/books/:bookId/save` (wishlist, idempotent)                  |
| `PUT` / `GET`     | `/books/:bookId/progress`                                     |
| `POST` / `GET`    | `/books/:bookId/bookmarks`                                    |
| `DELETE`          | `/bookmarks/:id`                                              |

## Bildirishnomalar (`notifications`)

- **In-app:** har foydalanuvchiga yozuv; o'qildi belgisi, badge (unread count).
- **Push (FCM HTTP v1):** `FCM_SERVICE_ACCOUNT` (base64 service-account JSON)
  berilsa qurilmalarning `fcmToken`'lariga yuboriladi; berilmasa push o'chiq,
  in-app ishlayveradi. Yangi paket yo'q — mavjud `google-auth-library` bilan.
- **Sozlamalar:** foydalanuvchi turlarni o'chira oladi
  (`NEW_BOOK | PROMO | REMINDER | LICENSE_EXPIRY`).
- **Broadcast (admin):** BullMQ navbatga tushadi, foydalanuvchilar 500 talик
  batch'larda qayta ishlanadi (xotira barqaror).
- **Litsenziya ogohlantirishi:** kunlik scheduler (09:00) — muddati ≤3 kun
  qolgan litsenziyalar uchun ogohlantirish (7 kunlik dedup bilan).

| Metod       | Yo'l                                                      | Kirish |
| ----------- | --------------------------------------------------------- | ------ |
| `GET`       | `/notifications/me`, `/notifications/me/unread-count`     | auth   |
| `PATCH`     | `/notifications/:id/read`; `POST /notifications/read-all` | auth   |
| `GET`/`PUT` | `/notifications/preferences`                              | auth   |
| `POST`      | `/notifications/broadcast`                                | admin  |

## Admin analitika (`admin`)

| Metod | Yo'l                            | Mazmun                                                          |
| ----- | ------------------------------- | --------------------------------------------------------------- |
| `GET` | `/admin/stats`                  | foydalanuvchilar / sotuvlar (soni+tushum) / obunalar / kitoblar |
| `GET` | `/admin/stats/top-books?limit=` | eng ko'p sotilganlar                                            |
| `GET` | `/admin/users?search=`          | foydalanuvchilar (telefon/ism/email qidiruv)                    |
| `GET` | `/admin/sales`                  | PAID sotuvlar ro'yxati                                          |

## Sozlash (env)

```
FCM_SERVICE_ACCOUNT=   # base64(service-account.json); bo'sh — push o'chiq
```

## Bosh sahifa (Home feed) — `catalog`

| Metod | Yo'l                        | Mazmun                                     |
| ----- | --------------------------- | ------------------------------------------ |
| `GET` | `/books/new?limit=`         | yangi kitoblar (chop etilgan, eng so'nggi) |
| `GET` | `/books/recommended?limit=` | yuqori reyting + mashhurlik bo'yicha       |

(Promo kolleksiyalar — mavjud `collections`; davom ettirish — `GET /library/continue`.)

## Avtomatik eslatmalar (cron, BullMQ)

- **Litsenziya muddati** — har kuni 09:00, muddati ≤3 kun qolganlarga.
- **O'qishni davom ettirish (REMINDER)** — har kuni 10:00, boshlangan (1–99%) lekin
  3 kun harakatsiz kitoblar uchun. Ikkalasi ham 7 kunlik dedup bilan.

## Original fayl zaxirasi (TZ §6.1)

`CONTENT_KEEP_ORIGINAL=true` bo'lsa, shifrlangach xom original `backup/` prefiksiga
ko'chiriladi (disaster-recovery). Default `false` — xom fayl o'chiriladi.

## Qamrovdan tashqari

- "Recommended" — hozircha reyting+mashhurlik (shaxsiylashtirilgan tavsiya keyin).
- Octobank to'lov integratsiyasi (shartnomadan keyin).
