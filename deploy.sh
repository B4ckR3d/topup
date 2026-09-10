#!/usr/bin/env bash

# =================================================================
# Umbreon Store Docker Deployment Helper Script
# =================================================================
set -e

# Warna output terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}==============================================${NC}"
echo -e "${CYAN}   🚀 Umbreon Store Deployment Assistant     ${NC}"
echo -e "${CYAN}==============================================${NC}"

# 1. Cek ketersediaan file .env
if [ ! -f .env ]; then
    echo -e "${YELLOW}[!] File .env tidak ditemukan.${NC}"
    if [ -f .env.docker.example ]; then
        echo -e "${GREEN}[+] Membuat file .env dari template .env.docker.example...${NC}"
        cp .env.docker.example .env
        echo -e "${YELLOW}[*] Harap periksa dan sesuaikan nilai di file .env sebelum melanjutkan.${NC}"
    else
        echo -e "${RED}[X] File .env.docker.example tidak ditemukan!${NC}"
        exit 1
    fi
fi

# 2. Cek apakah Docker dan Docker Compose terinstall
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[X] Docker tidak terdeteksi. Silakan install Docker terlebih dahulu.${NC}"
    exit 1
fi

ACTION=${1:-up}

case "$ACTION" in
    up|start)
        echo -e "${GREEN}[+] Memulai build dan deploy semua container...${NC}"
        docker compose up -d --build
        echo -e "${GREEN}[✔] Semua layanan berhasil dijalankan!${NC}"
        docker compose ps
        ;;
    down|stop)
        echo -e "${YELLOW}[-] Menghentikan seluruh container...${NC}"
        docker compose down
        echo -e "${GREEN}[✔] Container telah dihentikan.${NC}"
        ;;
    restart)
        SERVICE=${2:-}
        if [ -n "$SERVICE" ]; then
            echo -e "${YELLOW}[*] Merestart service: $SERVICE...${NC}"
            docker compose restart "$SERVICE"
        else
            echo -e "${YELLOW}[*] Merestart semua service...${NC}"
            docker compose restart
        fi
        echo -e "${GREEN}[✔] Selesai restart.${NC}"
        ;;
    logs)
        SERVICE=${2:-}
        if [ -n "$SERVICE" ]; then
            docker compose logs -f "$SERVICE"
        else
            docker compose logs -f
        fi
        ;;
    migrate)
        echo -e "${CYAN}[*] Menjalankan migrasi database dan seed admin/kategori...${NC}"
        docker compose run --rm --build migration
        echo -e "${GREEN}[✔] Migrasi dan seeding database selesai!${NC}"
        ;;
    seed)
        echo -e "${CYAN}[*] Menjalankan seeding data admin & kategori produk...${NC}"
        docker compose run --rm --build migration pnpm --filter @umbreon/db db:seed
        echo -e "${GREEN}[✔] Seeding data selesai!${NC}"
        ;;
    status|ps)
        docker compose ps
        ;;
    clean)
        echo -e "${YELLOW}[*] Membersihkan container, network, dan image yang tidak terpakai...${NC}"
        docker compose down --remove-orphans
        docker image prune -f
        docker builder prune -f
        echo -e "${GREEN}[✔] Bersih!${NC}"
        ;;
    fresh|rebuild)
        echo -e "${GREEN}[+] Membangun ulang seluruh container dari nol (tanpa cache)...${NC}"
        docker compose build --no-cache
        docker compose up -d --force-recreate
        echo -e "${GREEN}[✔] Selesai rebuild dan deploy!${NC}"
        docker compose ps
        ;;
    *)
        echo -e "Penggunaan: ./deploy.sh [perintah]"
        echo -e "Perintah yang tersedia:"
        echo -e "  up        : Build dan jalankan seluruh container di background (default)"
        echo -e "  rebuild   : Build ulang semua container dari nol tanpa cache (bersih)"
        echo -e "  down      : Hentikan seluruh container"
        echo -e "  restart   : Restart semua container (atau ./deploy.sh restart <service>)"
        echo -e "  logs      : Lihat live streaming log (atau ./deploy.sh logs <service>)"
        echo -e "  migrate   : Jalankan sinkronisasi schema database"
        echo -e "  status    : Cek status kesehatan container"
        echo -e "  clean     : Bersihkan image & build cache yang tidak terpakai"
        ;;
esac
