#!/bin/bash

# ========================================
# Script Instalasi Otomatis WhatsApp Bot
# Untuk Ubuntu/Debian Linux
# ========================================

set -e  # Exit on any error

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fungsi untuk menampilkan pesan berwarna
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUKSES]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[PERINGATAN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${GREEN}"
    echo "=========================================="
    echo "    WhatsApp Bot - Instalasi Otomatis"
    echo "=========================================="
    echo -e "${NC}"
}

# Fungsi untuk mengecek apakah command tersedia
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Fungsi untuk mengecek versi Ubuntu
check_ubuntu_version() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        if [[ "$ID" == "ubuntu" ]] || [[ "$ID_LIKE" == *"ubuntu"* ]] || [[ "$ID" == "debian" ]] || [[ "$ID_LIKE" == *"debian"* ]]; then
            print_success "Sistem operasi didukung: $PRETTY_NAME"
        else
            print_warning "Sistem operasi mungkin tidak sepenuhnya didukung: $PRETTY_NAME"
            read -p "Lanjutkan instalasi? (y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    else
        print_warning "Tidak dapat mendeteksi versi sistem operasi"
    fi
}

# Fungsi untuk update sistem
update_system() {
    print_status "Memperbarui sistem..."
    sudo apt update
    sudo apt upgrade -y
    print_success "Sistem berhasil diperbarui"
}

# Fungsi untuk install Node.js
install_nodejs() {
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_status "Node.js sudah terinstall: $NODE_VERSION"
        
        # Cek versi Node.js (minimal v16)
        NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR_VERSION" -lt 16 ]; then
            print_warning "Node.js versi lama terdeteksi. Mengupdate ke versi terbaru..."
            install_nodejs_fresh
        fi
    else
        print_status "Menginstall Node.js..."
        install_nodejs_fresh
    fi
}

install_nodejs_fresh() {
    # Install Node.js menggunakan NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Verifikasi instalasi
    if command_exists node && command_exists npm; then
        print_success "Node.js $(node --version) dan npm $(npm --version) berhasil diinstall"
    else
        print_error "Gagal menginstall Node.js"
        exit 1
    fi
}

# Fungsi untuk install MySQL
install_mysql() {
    if command_exists mysql; then
        print_status "MySQL sudah terinstall"
    else
        print_status "Menginstall MySQL Server..."
        sudo apt install -y mysql-server
        
        # Start dan enable MySQL service
        sudo systemctl start mysql
        sudo systemctl enable mysql
        
        print_success "MySQL Server berhasil diinstall"
        print_warning "Jalankan 'sudo mysql_secure_installation' untuk mengamankan MySQL"
    fi
}

# Fungsi untuk install Git
install_git() {
    if command_exists git; then
        print_status "Git sudah terinstall: $(git --version)"
    else
        print_status "Menginstall Git..."
        sudo apt install -y git
        print_success "Git berhasil diinstall"
    fi
}

# Fungsi untuk install dependencies sistem
install_system_dependencies() {
    print_status "Menginstall dependencies sistem..."
    sudo apt install -y \
        curl \
        wget \
        unzip \
        build-essential \
        python3 \
        python3-pip \
        libnss3-dev \
        libatk-bridge2.0-dev \
        libdrm2 \
        libxkbcommon0 \
        libgtk-3-dev \
        libxss1 \
        libasound2
    
    print_success "Dependencies sistem berhasil diinstall"
}

# Fungsi untuk setup database
setup_database() {
    print_status "Menyiapkan database MySQL..."
    
    # Cek apakah MySQL berjalan
    if ! sudo systemctl is-active --quiet mysql; then
        print_status "Memulai MySQL service..."
        sudo systemctl start mysql
    fi
    
    # Buat database dan user
    print_status "Membuat database 'wabot'..."
    sudo mysql -e "CREATE DATABASE IF NOT EXISTS wabot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    sudo mysql -e "CREATE USER IF NOT EXISTS 'wabot'@'localhost' IDENTIFIED BY 'wabot123';"
    sudo mysql -e "GRANT ALL PRIVILEGES ON wabot.* TO 'wabot'@'localhost';"
    sudo mysql -e "FLUSH PRIVILEGES;"
    
    print_success "Database berhasil disiapkan"
    print_status "Database: wabot"
    print_status "Username: wabot"
    print_status "Password: wabot123"
}

# Fungsi untuk install dependencies Node.js
install_node_dependencies() {
    print_status "Menginstall dependencies Node.js..."
    
    if [[ ! -f package.json ]]; then
        print_error "File package.json tidak ditemukan!"
        exit 1
    fi
    
    npm install
    print_success "Dependencies Node.js berhasil diinstall"
}

# Fungsi untuk setup environment
setup_environment() {
    print_status "Menyiapkan file konfigurasi..."
    
    if [[ ! -f .env ]]; then
        print_status "Membuat file .env dari template..."
        cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_USER=wabot
DB_PASSWORD=wabot123
DB_NAME=wabot

# Server Configuration
PORT=3000
BASE_URL=http://localhost:3000
SESSION_SECRET=your-secret-key-change-this
NODE_ENV=development

# WhatsApp Configuration
WHATSAPP_CLIENT_ID=wabot-client
BOT_OWNER_NUMBER=your-whatsapp-number

# Discord Configuration (Optional)
DISCORD_TOKEN=your-discord-token
DISCORD_CHANNEL_ID=your-discord-channel-id

# Payment Configuration (Optional)
XENDIT_SECRET_KEY=your-xendit-secret-key
XENDIT_PUBLIC_KEY=your-xendit-public-key
XENDIT_WEBHOOK_TOKEN=your-xendit-webhook-token
XENDIT_IS_PRODUCTION=false

# AI Configuration (Optional)
GEMINI_API_KEY=your-gemini-api-key

# General Settings
TIMEZONE_OFFSET=7
ONLY_WATCHER_CHAOS=true
MONSTER_RESET_TIME=11:55
MONSTER_NOTIFICATIONS=true
TRIAL_ENABLED=true
TRIAL_DURATION_DAYS=1
EOF
        print_success "File .env berhasil dibuat"
        print_warning "Silakan edit file .env untuk mengatur konfigurasi bot"
    else
        print_status "File .env sudah ada"
    fi
}

# Fungsi untuk setup database schema
setup_database_schema() {
    print_status "Menyiapkan skema database..."
    
    if [[ -f scripts/setupDatabase.js ]]; then
        node scripts/setupDatabase.js
        print_success "Skema database berhasil disiapkan"
    else
        print_warning "Script setup database tidak ditemukan"
    fi
}

# Fungsi untuk membuat service systemd
create_systemd_service() {
    print_status "Membuat service systemd..."
    
    CURRENT_DIR=$(pwd)
    USER_NAME=$(whoami)
    
    sudo tee /etc/systemd/system/wabot.service > /dev/null << EOF
[Unit]
Description=WhatsApp Bot Service
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
User=$USER_NAME
WorkingDirectory=$CURRENT_DIR
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable wabot.service
    
    print_success "Service systemd berhasil dibuat"
    print_status "Gunakan 'sudo systemctl start wabot' untuk memulai bot"
    print_status "Gunakan 'sudo systemctl status wabot' untuk cek status"
}

# Fungsi untuk menampilkan informasi setelah instalasi
show_post_install_info() {
    print_header
    print_success "Instalasi WhatsApp Bot berhasil diselesaikan!"
    echo
    print_status "Langkah selanjutnya:"
    echo "1. Edit file .env untuk mengatur konfigurasi bot"
    echo "2. Jalankan bot dengan: npm start"
    echo "3. Atau gunakan service: sudo systemctl start wabot"
    echo "4. Akses dashboard di: http://localhost:3000"
    echo
    print_status "File penting:"
    echo "- Konfigurasi: .env"
    echo "- Dokumentasi: docs/"
    echo "- Logs: /var/log/wabot/ (jika menggunakan service)"
    echo
    print_status "Perintah berguna:"
    echo "- Mulai bot: npm start"
    echo "- Mulai service: sudo systemctl start wabot"
    echo "- Cek status: sudo systemctl status wabot"
    echo "- Cek logs: sudo journalctl -u wabot -f"
    echo "- Stop service: sudo systemctl stop wabot"
    echo
    print_warning "Jangan lupa untuk:"
    echo "- Mengatur BOT_OWNER_NUMBER di file .env"
    echo "- Mengatur token Discord jika diperlukan"
    echo "- Mengatur konfigurasi payment jika diperlukan"
    echo
}

# Main installation function
main() {
    print_header
    
    # Cek apakah script dijalankan sebagai root
    if [[ $EUID -eq 0 ]]; then
        print_error "Jangan jalankan script ini sebagai root!"
        exit 1
    fi
    
    # Cek versi Ubuntu
    check_ubuntu_version
    
    print_status "Memulai instalasi WhatsApp Bot..."
    
    # Update sistem
    update_system
    
    # Install dependencies
    install_system_dependencies
    install_git
    install_nodejs
    install_mysql
    
    # Setup database
    setup_database
    
    # Install Node.js dependencies
    install_node_dependencies
    
    # Setup environment
    setup_environment
    
    # Setup database schema
    setup_database_schema
    
    # Create systemd service
    read -p "Buat service systemd untuk auto-start? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        create_systemd_service
    fi
    
    # Show post-install information
    show_post_install_info
}

# Jalankan instalasi
main "$@"
