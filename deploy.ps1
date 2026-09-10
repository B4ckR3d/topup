# =================================================================
# Umbreon Store Docker Deployment PowerShell Helper Script (Windows)
# =================================================================

param (
    [string]$Action = "up",
    [string]$Service = ""
)

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "   🚀 Umbreon Store Deployment Assistant (Windows) " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# 1. Cek ketersediaan file .env
if (-not (Test-Path ".env")) {
    Write-Host "[!] File .env tidak ditemukan." -ForegroundColor Yellow
    if (Test-Path ".env.docker.example") {
        Write-Host "[+] Menyalin .env.docker.example menjadi .env..." -ForegroundColor Green
        Copy-Item ".env.docker.example" ".env"
        Write-Host "[*] Harap periksa dan sesuaikan nilai di file .env sebelum melanjutkan." -ForegroundColor Yellow
    } else {
        Write-Host "[X] File .env.docker.example tidak ditemukan!" -ForegroundColor Red
        exit 1
    }
}

# 2. Cek apakah Docker terinstall
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[X] Docker tidak terdeteksi. Pastikan Docker Desktop sudah berjalan." -ForegroundColor Red
    exit 1
}

switch ($Action.ToLower()) {
    "up" {
        Write-Host "[+] Memulai build dan deploy semua container..." -ForegroundColor Green
        docker compose up -d --build
        Write-Host "[*] Memastikan MinIO bucket 'umbreon' siap..." -ForegroundColor Cyan
        docker compose run --rm createbuckets
        Write-Host "[✔] Semua layanan berhasil dijalankan!" -ForegroundColor Green
        docker compose ps
    }
    "down" {
        Write-Host "[-] Menghentikan seluruh container..." -ForegroundColor Yellow
        docker compose down
        Write-Host "[✔] Container telah dihentikan." -ForegroundColor Green
    }
    "restart" {
        if ($Service) {
            Write-Host "[*] Merestart service: $Service..." -ForegroundColor Yellow
            docker compose restart $Service
        } else {
            Write-Host "[*] Merestart semua service..." -ForegroundColor Yellow
            docker compose restart
        }
        Write-Host "[✔] Selesai restart." -ForegroundColor Green
    }
    "logs" {
        if ($Service) {
            docker compose logs -f $Service
        } else {
            docker compose logs -f
        }
    }
    "migrate" {
        Write-Host "[*] Menjalankan migrasi database dan seed data..." -ForegroundColor Cyan
        docker compose run --rm --build migration
        Write-Host "[✔] Migrasi database selesai!" -ForegroundColor Green
    }
    "seed" {
        Write-Host "[*] Menjalankan seeding data admin & kategori produk..." -ForegroundColor Cyan
        docker compose run --rm --build migration pnpm --filter @umbreon/db db:seed
        Write-Host "[✔] Seeding data selesai!" -ForegroundColor Green
    }
    "bucket" {
        Write-Host "[*] Menginisialisasi bucket MinIO storage..." -ForegroundColor Cyan
        docker compose run --rm createbuckets
        Write-Host "[✔] MinIO bucket siap!" -ForegroundColor Green
    }
    "status" {
        docker compose ps
    }
    "ps" {
        docker compose ps
    }
    "clean" {
        Write-Host "[*] Membersihkan container, network, dan image yang tidak terpakai..." -ForegroundColor Yellow
        docker compose down --remove-orphans
        docker image prune -f
        docker builder prune -f
        Write-Host "[✔] Bersih!" -ForegroundColor Green
    }
    "rebuild" {
        Write-Host "[+] Membangun ulang seluruh container dari nol (tanpa cache)..." -ForegroundColor Green
        docker compose build --no-cache
        docker compose up -d --force-recreate
        Write-Host "[✔] Selesai rebuild dan deploy!" -ForegroundColor Green
        docker compose ps
    }
    default {
        Write-Host "Penggunaan: .\deploy.ps1 [perintah]"
        Write-Host "Perintah yang tersedia:"
        Write-Host "  up        : Build dan jalankan seluruh container di background (default)"
        Write-Host "  rebuild   : Build ulang semua container dari nol tanpa cache (bersih)"
        Write-Host "  down      : Hentikan seluruh container"
        Write-Host "  restart   : Restart semua container (atau .\deploy.ps1 restart <service>)"
        Write-Host "  logs      : Lihat live streaming log (atau .\deploy.ps1 logs <service>)"
        Write-Host "  migrate   : Jalankan sinkronisasi schema database"
        Write-Host "  status    : Cek status kesehatan container"
        Write-Host "  clean     : Bersihkan image & build cache yang tidak terpakai"
    }
}
