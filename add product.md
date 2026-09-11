# 🎮 Panduan Tambah Produk H2H Otomatis & Konfigurasi Payment Gateway - Umbreon Store

Dokumen ini menjelaskan alur penambahan produk otomatis dari provider H2H (**Digiflazz** & **VIP-Reseller**), penjelasan hierarki produk, serta konfigurasi **Payment Gateway pintar (KlikQRIS, Tripay, Duitku)** yang kini telah dilengkapi fitur *auto-fill* dan *smart presets*.

---

## 📑 Daftar Isi
1. [Hierarki Produk: Memahami Struktur Kategori, Sub-Kategori, & Produk](#1-hierarki-produk-memahami-struktur-kategori-sub-kategori--produk)
2. [Fitur Baru: Auto-Fill & Grab Data Kategori Game](#2-fitur-baru-auto-fill--grab-data-kategori-game)
3. [Alur Tambah Produk H2H Otomatis ("Tinggal Add Auto & Edit Harga")](#3-alur-tambah-produk-h2h-otomatis-tinggal-add-auto--edit-harga)
4. [Konfigurasi Payment Gateway Pintar (KlikQRIS & Tripay Auto-Preset)](#4-konfigurasi-payment-gateway-pintar-klikqris--tripay-auto-preset)
5. [Menampilkan Produk di Halaman Utama (Home) Web Client](#5-menampilkan-produk-di-halaman-utama-home-web-client)

---

## 🏗️ 1. Hierarki Produk: Memahami Struktur Kategori, Sub-Kategori, & Produk

Di sistem Umbreon Store, produk disusun dalam **3 tingkat (hierarki)** agar tampilan di website rapi dan terkelompok dengan baik:

```text
┌────────────────────────────────────────────────────────┐
│ Tingkat 1: Kategori Game / Layanan                     │
│ Contoh: Mobile Legends, Free Fire, Pulsa Telkomsel     │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Tingkat 2: Sub-Kategori                                │
│ Contoh: "Diamonds Reguler", "Weekly Pass", "Paket Data"│
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Tingkat 3: Produk / Nominal Item (SKU Provider H2H)    │
│ Contoh: "86 Diamonds", "172 Diamonds", "257 Diamonds"  │
│ [Di sinilah tombol "Add from Provider" berada!]        │
└────────────────────────────────────────────────────────┘
```

> **Catatan Penting (Terkait Screenshot 1):**
> Halaman `Create Product Category` adalah untuk membuat **Wadah Game (Tingkat 1)**.
> Penarikan produk/item H2H secara otomatis (`Add from Provider`) berada di dalam **Sub-Kategori (Tingkat 3)**.

---

## ⚡ 2. Fitur Baru: Auto-Fill & Grab Data Kategori Game

Untuk mempermudah saat membuat kategori game baru tanpa perlu mengetik manual dari nol, kini di halaman `Create Product Category` (`/admin/product-categories/game/create`) telah ditambahkan widget:

### **"⚡ Quick Grab / Auto-Fill Game dari Provider"**
Cukup pilih game yang diinginkan dari dropdown:
* **Mobile Legends: Bang Bang** (Moonton)
* **Free Fire** (Garena)
* **PUBG Mobile** (Tencent Games)
* **Genshin Impact** (HoYoverse)
* **Honor of Kings** (Level Infinite)
* **Valorant** (Riot Games)
* **Honkai: Star Rail** (HoYoverse)
* **Roblox** (Roblox Corp)
* **Call of Duty Mobile** (Garena)
* **Point Blank** (Zepetto)

**Yang Terjadi Saat Dipilih (1-Klik):**
1. **Nama Produk**: Terisi otomatis (contoh: *Mobile Legends: Bang Bang*).
2. **Sub Name**: Terisi otomatis (*Diamonds & Weekly Pass*).
3. **Publisher**: Terisi otomatis (*Moonton*, *Garena*, dll.).
4. **Deskripsi**: Terisi deskripsi resmi dan menarik.
5. **Label**: Terisi badge rekomendasi (*HOT*, *POPULAR*, *BEST SELLER*).
6. **SEO Title & SEO Description**: Langsung terkonfigurasi untuk optimasi Google Search.
7. Anda cukup memilih gambar/banner dari File Manager lalu klik **Save Category**.

---

## 🚀 3. Alur Tambah Produk H2H Otomatis ("Tinggal Add Auto & Edit Harga")

Setelah Kategori Game dibuat, ikuti langkah berikut untuk menarik seluruh item nominal secara otomatis:

### **Langkah 1: Buat Sub-Kategori**
1. Buka Kategori Game yang baru dibuat (klik nama game di tabel kategori).
2. Pada bagian **Product Sub Categories**, klik tombol **`+ Add Sub Category`**.
3. Masukkan nama sub-kategori, misalnya:
   * `Diamonds` (untuk game Mobile Legends / Free Fire)
   * `Weekly Pass` (untuk paket mingguan)
   * `Unknown Cash` (untuk PUBG)
4. Klik **Save**.

### **Langkah 2: Ambil Produk Otomatis dari Provider (Add from Provider)**
1. Klik Sub-Kategori yang baru dibuat agar aktif.
2. Di tabel produk sebelah kanan atas, klik tombol icon awan **`Add from Provider`**.
3. Modal penarik katalog provider akan muncul:
   * **Pilih Provider**: `DIGIFLAZZ` atau `VIPRESELLER`.
   * **Filter Brand**: Pilih nama game (misal: `MOBILE LEGENDS`).
   * **Atur Margin Keuntungan (Profit)**:
     * **Profit Statis (Rp)**: Misal `Rp 1.500`.
     * **Profit Persentase (%)**: Misal `5%`.
     * *Harga jual ke pembeli dihitung otomatis di atas harga modal H2H.*
   * **Pilih Gambar/Icon Produk**: Pilih icon item dari File Manager.
   * **Centang Produk**: Centang item yang mau dijual (bisa centang satu per satu atau centang semua sekaligus).
   * Klik **Tambah Produk**.
4. Selesai! Semua item langsung tersimpan di database lengkap dengan harga modal, harga jual, dan kode SKU H2H.

### **Langkah 3: Edit Harga & Status Kapan Saja**
* **Edit Manual Per Item**: Klik ikon **Pensil (Edit)** di baris produk untuk mengubah harga jual, margin, atau mengganti nama tampilan item.
* **Nonaktifkan Sementara**: Gunakan tombol switch **Available** untuk on/off item tanpa menghapusnya.
* **Update Harga Massal**: Klik tombol **`Update Provider Price`** untuk memperbarui harga modal secara massal jika harga dari Digiflazz/VIP-Reseller naik atau turun.

---

## 💳 4. Konfigurasi Payment Gateway Pintar (KlikQRIS & Tripay Auto-Preset)

Sebelumnya, pengisian metode pembayaran di Web Admin harus diketik secara manual. Sekarang, modal **Add Payment Method** telah ditingkatkan dengan fitur pintar:

### **A. Khusus KlikQRIS (Terkunci Otomatis)**
* KlikQRIS **hanya mendukung QRIS Dinamis**.
* Saat memilih provider `klikqris`:
  * **Type**: Otomatis terkunci ke `qr_code`.
  * **Provider Code**: Otomatis terisi dan terkunci ke `QRIS`.
  * **Kategori**: Otomatis memilih kategori QRIS / E-Wallet.
  * Tampil notifikasi hijau informatif: *"KlikQRIS khusus melayani channel QRIS dinamis"*.
  * Admin tidak perlu menebak atau salah mengetik kode lagi!

### **B. Quick Presets Siap Pakai (1-Klik Isi Semua Field)**
Di bagian atas modal `Add Payment Method`, terdapat dropdown **Quick Preset**:
1. **⚡ KlikQRIS - QRIS Dinamis (All Payment)**:
   * Nama: `QRIS (Semua E-Wallet & Bank)`
   * Provider: `klikqris`, Code: `QRIS`, Type: `qr_code`
   * Fee: `0.7% MDR`, Min: `Rp 1.000`, Max: `Rp 10.000.000`
2. **⚡ Tripay - QRIS Dinamis**:
   * Nama: `QRIS (Tripay)`, Provider: `tripay`, Code: `QRIS`, Type: `qr_code`
3. **⚡ Tripay - Virtual Account (BCA, BRI, Mandiri, BNI)**:
   * Mengisi kode `BCAVA`, `BRIVA`, `MANDIRIVA`, `BNIVA` beserta estimasi fee VA bank.
4. **⚡ Tripay - E-Wallet (DANA, OVO, ShopeePay)**:
   * Mengisi kode `DANA`, `OVO`, `SHOPEEPAY` dengan fee 1.67%.
5. **⚡ Tripay - Gerai Retail (Alfamart, Indomaret)**:
   * Mengisi kode `ALFAMART` & `INDOMARET`.
6. **⚡ Saldo Akun / Wallet Member**:
   * Mengisi pembayaran via saldo internal akun tanpa biaya admin (Fee 0).

### **C. Shortcut Channel Tripay & Duitku**
Jika memilih provider `Tripay` atau `Duitku`, muncul tombol-tombol shortcut channel (`BCA VA`, `BRI VA`, `Mandiri VA`, `QRIS`, `DANA`, dll.). Klik salah satu tombol, maka kode channel dan tipenya langsung terisi seketika.

---

## 🏠 5. Menampilkan Produk di Halaman Utama (Home) Web Client

Agar game yang baru ditambahkan muncul di halaman depan website (`https://umbreon.store`):

1. Buka menu **Config & Settings** &rarr; **Product Sections** (`/admin/config/home/product-sections`).
2. Cari section beranda yang aktif (misal: *Popular Games* atau *Top Up Kilat*).
3. Klik tombol **Detail (ikon mata 👁️)** pada baris section tersebut.
4. Klik tombol **`+ Tambah Kategori`**.
5. Centang game yang ingin ditampilkan (misal: *Mobile Legends*, *Free Fire*), lalu klik **Simpan**.
6. Game beserta seluruh daftar nominal diamond-nya langsung muncul lengkap di website pelanggan!

---

## 🛡️ Rangkuman

| Komponen | Status Sebelum | Status Sesudah Pembaruan |
|---|---|---|
| **Input Game Baru** | Manual ketik semua field | **Auto-Fill 1-Klik dari Preset Game Provider** |
| **Input Nominal Item** | Kadang bingung cari menu | **Tersentralisasi di Sub-Kategori via tombol "Add from Provider"** |
| **KlikQRIS Setup** | Manual pilih tipe & ketik kode | **Otomatis terkunci ke `qr_code` & kode `QRIS`** |
| **Payment Gateway Lain** | Manual ketik kode channel Tripay/Duitku | **Quick Preset 1-Klik + Shortcut Channel Pills** |
| **Tampilan di Client** | Terkadang section kosong muncul judul saja | **Diproteksi guard: hanya menampilkan section yang ada itemnya** |
