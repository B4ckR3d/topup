---
name: vip-reseller
description: Panduan integrasi lengkap API VIP-Reseller (VIPayment) untuk H2H PPOB, Pulsa, Data, Top Up Game, Cek Nickname Game, Cek Saldo & Profil, dan Webhook Callback. Gunakan saat mengelola provider VIP-Reseller, debugging transaksi, sinkronisasi produk prepaid & game, atau konfigurasi signature MD5.
---

# VIP-Reseller (VIPayment) H2H Integration Guide

Skill ini mendokumentasikan spesifikasi teknis, arsitektur, parameter signature, endpoint, dan implementasi integrasi API VIP-Reseller (https://vip-reseller.co.id/) pada monorepo BagusPay.

---

## 1. Authentication & Signature Formula

Semua request ke API VIP-Reseller menggunakan metode **POST** dengan `Content-Type: application/x-www-form-urlencoded` (atau JSON).

### Parameter Wajib Autentikasi
| Parameter | Tipe | Deskripsi |
| :--- | :--- | :--- |
| `key` | `string` | API Key akun VIP-Reseller (didapat dari menu Profil / Pengaturan API). |
| `sign` | `string` | Hash MD5 dari gabungan API ID dan API KEY: `md5(API_ID + API_KEY)` |

### Contoh Pembuatan Signature (TypeScript)
```typescript
import crypto from 'node:crypto'

export function generateVipSignature(apiId: string, apiKey: string): string {
  return crypto.createHash('md5').update(`${apiId}${apiKey}`).digest('hex')
}
```

---

## 2. Endpoint Reference

Base URL: `https://vip-reseller.co.id/api`

### A. Cek Profil & Saldo (`/profile`)
- **URL**: `POST https://vip-reseller.co.id/api/profile`
- **Body**:
  ```json
  {
    "key": "YOUR_API_KEY",
    "sign": "MD5(API_ID + API_KEY)"
  }
  ```
- **Response**:
  ```json
  {
    "result": true,
    "data": {
      "full_name": "Bandero Aldi Prasetya",
      "username": "Bndraldi",
      "balance": 1500000,
      "point": 0,
      "level": "Basic",
      "registered": "2026-09-08 08:29:01"
    },
    "message": "Successfully got your account details."
  }
  ```

---

### B. Produk Prepaid & Pulsa/Data (`/prepaid`)
- **URL**: `POST https://vip-reseller.co.id/api/prepaid`

#### 1. Tarik Daftar Layanan (`type: "services"`)
- **Body**:
  ```json
  {
    "key": "YOUR_API_KEY",
    "sign": "MD5(API_ID + API_KEY)",
    "type": "services",
    "filter_type": "type", // opsional: "type", "brand", "category"
    "filter_value": "pulsa-reguler" // opsional
  }
  ```
- **Response Item**:
  ```json
  {
    "result": true,
    "data": [
      {
        "code": "TSEL10",
        "name": "Telkomsel 10.000",
        "price": {
          "basic": 10250,
          "premium": 10150,
          "special": 10050
        },
        "status": "available",
        "brand": "TELKOMSEL",
        "type": "pulsa-reguler",
        "category": "Pulsa Reguler",
        "note": "Pengisian otomatis 24 Jam"
      }
    ]
  }
  ```

#### 2. Buat Order Prepaid (`type: "order"`)
- **Body**:
  ```json
  {
    "key": "YOUR_API_KEY",
    "sign": "MD5(API_ID + API_KEY)",
    "type": "order",
    "service": "TSEL10",
    "target": "081234567890",
    "no_meter": "" // Khusus token PLN
  }
  ```
- **Response**:
  ```json
  {
    "result": true,
    "data": {
      "trxid": "VIP12345678",
      "data": "081234567890",
      "service": "TSEL10",
      "status": "waiting",
      "note": "Pesanan sedang diproses",
      "balance": 1489750,
      "price": 10250
    },
    "message": "Order placed successfully."
  }
  ```

#### 3. Cek Status Order (`type: "status"`)
- **Body**:
  ```json
  {
    "key": "YOUR_API_KEY",
    "sign": "MD5(API_ID + API_KEY)",
    "type": "status",
    "trxid": "VIP12345678"
  }
  ```

---

### C. Game Feature & Top Up Game (`/game-feature`)
- **URL**: `POST https://vip-reseller.co.id/api/game-feature`

#### 1. Cek Nickname Game (`type: "get-nickname"`)
- **Body**:
  ```json
  {
    "key": "YOUR_API_KEY",
    "sign": "MD5(API_ID + API_KEY)",
    "type": "get-nickname",
    "code": "mobile-legends",
    "target": "12345678",
    "additional_target": "1234"
  }
  ```
- **Response**:
  ```json
  {
    "result": true,
    "data": "SkyWalker_99",
    "country": "Indonesia",
    "message": "ID Ditemukan"
  }
  ```

#### 2. Order Topup Game (`type: "order"`)
- **Body**:
  ```json
  {
    "key": "YOUR_API_KEY",
    "sign": "MD5(API_ID + API_KEY)",
    "type": "order",
    "service": "ML86",
    "target": "12345678",
    "additional_target": "1234"
  }
  ```

#### 3. Cek Stok Produk Game (`type: "service-stock"`)
- **Body**:
  ```json
  {
    "key": "YOUR_API_KEY",
    "sign": "MD5(API_ID + API_KEY)",
    "type": "service-stock"
  }
  ```

---

## 3. Webhook Callback & IP Whitelist

- **Server IP**: Pastikan IP outbound VPS (`84.247.148.122`) telah dimasukkan ke daftar **IP Whitelist** di akun VIP-Reseller.
- **Callback Security**: Verifikasi signature callback atau IP pengirim sebelum memproses perubahan status transaksi menjadi `success` atau `failed`.
- **Idempotency**: Selalu gunakan update status transaksional (misal: hanya ubah status order jika status saat ini masih `PROCESSING` atau `PENDING`).

---

## 4. Lokasi Kode di Monorepo BagusPay

- **Service Backend (NestJS)**:
  - Client & Requests: `apps/web-api/src/integrations/h2h/vipreseller/vip-reseller.service.ts`
  - Types: `apps/web-api/src/integrations/h2h/vipreseller/vip-reseller.type.ts`
  - Module: `apps/web-api/src/integrations/h2h/vipreseller/vip-reseller.module.ts`
- **Service Admin (AdonisJS)**:
  - Admin Client & Normalizer: `apps/web-admin/app/services/vip_reseller_service.ts`
  - Gateway Tester: `apps/web-admin/app/services/gateway_tester_service.ts`
  - Controller: `apps/web-admin/app/controllers/providers_controller.ts`
- **Environment Variables**:
  - `VIP_RESELLER_API_ID`: ID Akun VIP-Reseller
  - `VIP_RESELLER_API_KEY`: API Key Akun VIP-Reseller
