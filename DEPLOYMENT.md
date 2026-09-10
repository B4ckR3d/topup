# 🚀 Panduan Deployment Docker Compose Umbreon Store

Dokumen ini adalah panduan lengkap untuk men-deploy ekosistem **Umbreon Store Monorepo** menggunakan Docker Compose, baik di komputer lokal untuk pengujian maupun di VPS (Ubuntu / Debian) untuk production.

---

## 📋 Daftar Layanan & Port

| Layanan | Teknologi | Port Container | Port Host Default | Deskripsi |
|---|---|---|---|---|
| **Nginx** | Reverse Proxy | 80, 443 | `8080`, `8443` | Gateway ingress & SSL termination |
| **web-client** | React Router v7 | 9992 | `9992` | Web customer / storefront |
| **web-admin** | AdonisJS 6 + Inertia | 3333 | `3333` | Portal dashboard admin & merchant |
| **web-api** | NestJS + BullMQ | 9991 | `9991` | Backend REST API & Queue Worker |
| **postgres** | PostgreSQL 16 Alpine | 5432 | `5432` | Database utama (opsional) |
| **redis** | Redis 7 Alpine | 6379 | `6380` | Cache & antrian transaksi |
| **minio** | Local S3 Object Storage | 9000, 9001 | `9000`, `9001` | Pengganti AWS S3 (Web Console: port 9001) |
| **migration** | Drizzle ORM Runner | - | - | Auto-sync schema database saat deploy |

---

## ⚡ Quick Start (Hanya 3 Langkah)

### 1. Salin File Konfigurasi Environment
```bash
cp .env.docker.example .env
```
*(Di Windows PowerShell: `Copy-Item .env.docker.example .env`)*

### 2. Sesuaikan Konfigurasi `.env`
Buka file `.env` dan periksa:
- **`DATABASE_URL`**:
  - Jika menggunakan PostgreSQL bawaan Docker: biarkan default (`postgresql://umbreon_admin:Umbr30n_Pg_S3cur3_P@ss_2026!@postgres:5432/umbreon_db`) atau ubah password di `.env`.
  - Jika menggunakan VPS Database eksternal: ubah menjadi connection string VPS Anda (misal: `postgresql://topup:password@84.247.148.122:37912/topup`).
- **`REDIS_URL`** & **`REDIS_PASSWORD`**:
  - Bawaan Docker (terproteksi auth): `redis://:Umbr30n_R3d1s_Auth_9921_xK!@redis:6379`.
  - Eksternal: `redis://:password@84.247.148.122:6379`.
- **`GOOGLE_CLIENT_ID`** & **`VITE_GOOGLE_CLIENT_ID`**:
  - Diisi dengan Client ID OAuth 2.0 dari Google Cloud Console agar fitur *Login dengan Google* aktif.
- **`STORAGE (Penyimpanan Banner/Gambar)`**:
  - **Lokal Docker (MinIO - 100% Gratis)**: Secara bawaan sudah disiapkan container MinIO di port `9000` (API) & `9001` (Dashboard GUI). Anda **TIDAK BUTUH AWS S3**. File tersimpan di disk server Anda.
  - **AWS S3 / Cloudflare R2**: Jika ingin pakai cloud S3 / R2 (10GB gratis), cukup ganti variabel `S3_*` di `.env`.
- **`JWT_SECRET`** & **`APP_KEY`**: Ganti dengan string acak yang aman.
- **`VITE_API_URL`**:
  - Lokal: `http://localhost:9991` atau `http://localhost/api`
  - Production: `https://api.namadomainanda.com`

### 3. Jalankan Deployment
Di Linux / VPS:
```bash
chmod +x deploy.sh
./deploy.sh up
```

Di Windows (PowerShell):
```powershell
.\deploy.ps1 up
```

Atau langsung dengan perintah standar Docker Compose:
```bash
docker compose up -d --build
```

---

## 🌐 Konfigurasi Domain & Routing Nginx

Nginx yang disertakan secara otomatis mendukung 2 pola akses:

### Pola 1: Berbasis Subdomain (Direkomendasikan untuk Production)
Arahkan DNS Record di panel domain (seperti Cloudflare) ke IP Public VPS Anda:
- `A` record: `namadomain.com` -> `IP_VPS`
- `A` record: `api.namadomain.com` -> `IP_VPS`
- `A` record: `admin.namadomain.com` -> `IP_VPS`

Nginx akan otomatis mengalirkan:
- `api.namadomain.com` -> `web-api` (Port 9991)
- `admin.namadomain.com` -> `web-admin` (Port 3333)
- `namadomain.com` -> `web-client` (Port 9992)

### Pola 2: Berbasis Path Tunggal (Untuk Akses via IP / 1 Domain Saja)
Jika belum memiliki subdomain atau sedang menguji dengan IP VPS:
- `http://IP_VPS/` -> Terbuka ke `web-client`
- `http://IP_VPS/api/` -> Terbuka ke `web-api`
- `http://IP_VPS:3333/` -> Terbuka ke `web-admin`

---

## 🔒 Setup SSL / HTTPS Gratis (Cloudflare / Let's Encrypt)

### Cara 1: Menggunakan Cloudflare Flexible / Full SSL (Paling Mudah)
1. Sambungkan domain ke Cloudflare.
2. Aktifkan fitur **Proxy (Awan Oranye)** pada DNS records (`namadomain.com`, `api`, `admin`).
3. Pada tab SSL/TLS Cloudflare, pilih mode **Flexible** atau **Full**.
4. Website langsung otomatis ber-HTTPS tanpa perlu sertifikat di VPS.

### Cara 2: Let's Encrypt Certbot di Host Nginx
Jika Anda memasang Nginx atau Certbot langsung di VPS host:
```bash
sudo apt update && sudo apt install -y certbot
sudo certbot certonly --standalone -d namadomain.com -d api.namadomain.com -d admin.namadomain.com
```
Lalu mount sertifikat di `docker-compose.yml` pada service `nginx`:
```yaml
volumes:
  - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
  - /etc/letsencrypt:/etc/letsencrypt:ro
```

---

## 🛠️ Perintah Operasional Sehari-hari

Script `./deploy.sh` (atau `.\deploy.ps1`) menyediakan shortcut perintah:

| Kebutuhan | Perintah Helper | Perintah Asli Docker |
|---|---|---|
| **Deploy / Update Kode Baru** | `./deploy.sh up` | `docker compose up -d --build` |
| **Hentikan Semua Layanan** | `./deploy.sh down` | `docker compose down` |
| **Lihat Log Realtime Semua App** | `./deploy.sh logs` | `docker compose logs -f` |
| **Lihat Log Khusus API** | `./deploy.sh logs web-api` | `docker compose logs -f web-api` |
| **Lihat Log Khusus Admin** | `./deploy.sh logs web-admin` | `docker compose logs -f web-admin` |
| **Restart Salah Satu Service** | `./deploy.sh restart web-api` | `docker compose restart web-api` |
| **Jalankan Migrasi Database** | `./deploy.sh migrate` | `docker compose run --rm migration` |
| **Cek Status Kesehatan Container** | `./deploy.sh status` | `docker compose ps` |
| **Bersihkan Image Bekas** | `./deploy.sh clean` | `docker image prune -f` |

---

## 🔄 Alur Update Aplikasi dari Git (CI/CD / Manual VPS)

Saat Anda melakukan update kode (git push) dan ingin menerapkan perubahan di VPS:

```bash
git pull origin main
./deploy.sh up
```
Docker hanya akan me-rebuild layer yang berubah (karena menggunakan caching Turborepo), dan proses deploy hanya memakan waktu 30-60 detik dengan zero data loss.

---

## ❓ FAQ & Troubleshooting

### 1. Port 80 atau 5432 sudah terpakai di VPS?
Anda bisa mengganti mapping port host di file `.env` tanpa perlu mengubah kode aplikasi:
```env
NGINX_HTTP_PORT=8080
POSTGRES_PORT=5433
```

### 2. Ingin menonaktifkan PostgreSQL & Redis bawaan Docker?
Jika Anda 100% menggunakan PostgreSQL dan Redis di luar Docker (misal cloud DB atau VPS terpisah):
1. Buka `.env`, arahkan `DATABASE_URL` dan `REDIS_URL` ke host eksternal Anda.
2. Pada `docker-compose.yml`, Anda bisa memberi komentar `#` pada service `postgres` dan `redis`. Service `web-api`, `web-admin`, dan `migration` memiliki pengaturan `required: false` sehingga tetap berjalan lancar tanpa kontainer postgres lokal.
