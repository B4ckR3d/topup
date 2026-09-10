# AGENTS.md - apps/web-api

Panduan ini khusus untuk agent yang bekerja di package `apps/web-api`.

## Gambaran Package

- Framework: NestJS (`@nestjs/*`) dengan TypeScript.
- Entry point ada di `src/main.ts`, root module ada di `src/app.module.ts`.
- API docs: Swagger + Scalar (`/reference`).
- Queue: BullMQ (`@nestjs/bullmq`) + Bull Board (`/queues`).
- DB: modul internal `DatabaseModule` dari `src/core/database` dan workspace package `@umbreon/db`.

## Struktur Arsitektur

- Pattern dominan: `controller -> service -> repository`.
- Modul domain utama: `auth`, `order`, `payments`, `deposit`, `products`, `offers`, `settings`, `user`, `queue`.
- Integrasi eksternal dipisah di `src/integrations`:
  - H2H: `digiflazz`, `atlantic`
  - Payment gateway: `tripay`, `duitku`, `balance`
- Exception handling global: `AllExceptionsFilter`.
- Validation global: `ValidationPipe` (whitelist, transform, forbidNonWhitelisted, status 422).

## Konvensi Kode yang Harus Diikuti

- Pertahankan style TypeScript tanpa titik koma (sesuai codebase).
- Ikuti naming dan layering yang sudah ada, jangan bypass service langsung ke controller logic berat.
- Untuk endpoint baru, utamakan DTO + `class-validator` dan biarkan validasi lewat global `ValidationPipe`.
- Format response mengikuti util yang sudah ada (`src/common/utils/response.ts`) atau pola existing di modul terkait.
- Jika endpoint butuh auth, gunakan guard/decorator yang sudah ada (`JwtAuthGuard`, `@User()`).
- Header device context sering dipakai (`X-Device-ID`, `user-agent`, `@Ip()`), cek pola di `src/auth/auth.controller.ts`.

## Environment dan Runtime

- Port default aplikasi: `9991` (lihat `src/main.ts`).
- Redis URL dibaca dari `REDIS_URL` (fallback `redis://localhost:6379`).
- JWT secret lewat `JWT_SECRET`.
- CORS origin dari `CORS_ORIGIN` (fallback `*`).

## Perintah Kerja Lokal (di folder `apps/web-api`)

- Install dependency workspace dari root monorepo (jangan install manual per package kecuali diperlukan).
- Jalankan dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Check/format: `npm run check` / `npm run format`
- Test unit: `npm run test`
- Test e2e: `npm run test:e2e`

## Scope Perubahan yang Aman

- Prioritaskan perubahan kecil dan terlokalisasi per modul.
- Saat mengubah flow bisnis order/payment, cek efek ke:
  - processor (`src/order/processor`)
  - queue consumer (`src/queue`)
  - integrasi gateway/h2h (`src/integrations`)
- Jangan ubah kontrak response/error secara global tanpa kebutuhan jelas karena berdampak ke client.

## Checklist Sebelum Selesai

- Endpoint/logic baru punya DTO dan validasi yang konsisten.
- Tidak ada dependency baru tanpa alasan kuat.
- Lulus minimal `npm run lint` dan test yang relevan untuk area yang diubah.
- Jika menyentuh auth/payment/order, jelaskan dampak backward compatibility di ringkasan PR/commit.
