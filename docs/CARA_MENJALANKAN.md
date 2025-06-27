# 🚀 Cara Menjalankan WhatsApp Bot

Panduan lengkap untuk menjalankan WhatsApp Bot dengan sistem database MySQL.

## 📋 Daftar Isi

- [Persyaratan Sistem](#persyaratan-sistem)
- [Instalasi Otomatis](#instalasi-otomatis)
- [Instalasi Manual](#instalasi-manual)
- [Konfigurasi](#konfigurasi)
- [Menjalankan Bot](#menjalankan-bot)
- [Mengakses Dashboard](#mengakses-dashboard)
- [Troubleshooting](#troubleshooting)

## 🔧 Persyaratan Sistem

### Minimum Requirements
- **OS**: Windows 10/11, Ubuntu 18.04+, atau Debian 10+
- **RAM**: 2GB (4GB direkomendasikan)
- **Storage**: 5GB ruang kosong
- **Internet**: Koneksi stabil untuk WhatsApp Web

### Software Requirements
- **Node.js**: v16.0.0 atau lebih baru
- **MySQL**: v8.0 atau lebih baru
- **Git**: Versi terbaru
- **Browser**: Chrome, Firefox, atau Edge (untuk dashboard)

## ⚡ Instalasi Otomatis

### Windows

#### Opsi 1: Menggunakan Batch File
```batch
# Download dan jalankan sebagai Administrator
install-windows.bat
```

#### Opsi 2: Menggunakan PowerShell
```powershell
# Buka PowerShell sebagai Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\install-windows.ps1
```

### Ubuntu/Debian Linux
```bash
# Download dan jalankan
chmod +x install-ubuntu.sh
./install-ubuntu.sh
```

## 🛠️ Instalasi Manual

### 1. Install Dependencies

#### Windows (menggunakan Chocolatey)
```powershell
# Install Chocolatey terlebih dahulu
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install dependencies
choco install nodejs mysql git -y
```

#### Ubuntu/Debian
```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y curl wget git build-essential

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt install -y mysql-server
```

### 2. Clone Repository
```bash
git clone <repository-url>
cd BotLM
```

### 3. Install Node.js Dependencies
```bash
npm install
```

### 4. Setup Database
```bash
# Jalankan script setup database
node scripts/setupDatabase.js
```

## ⚙️ Konfigurasi

### 1. File Environment (.env)

Buat atau edit file `.env` dengan konfigurasi berikut:

```env
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
BOT_OWNER_NUMBER=628123456789  # Ganti dengan nomor WhatsApp Anda

# Discord Configuration (Opsional)
DISCORD_TOKEN=your-discord-bot-token
DISCORD_CHANNEL_ID=your-discord-channel-id

# Payment Configuration (Opsional)
XENDIT_SECRET_KEY=your-xendit-secret-key
XENDIT_PUBLIC_KEY=your-xendit-public-key
XENDIT_WEBHOOK_TOKEN=your-xendit-webhook-token
XENDIT_IS_PRODUCTION=false

# AI Configuration (Opsional)
GEMINI_API_KEY=your-gemini-api-key

# General Settings
TIMEZONE_OFFSET=7
ONLY_WATCHER_CHAOS=true
MONSTER_RESET_TIME=11:55
MONSTER_NOTIFICATIONS=true
TRIAL_ENABLED=true
TRIAL_DURATION_DAYS=1
```

### 2. Database Configuration

#### Setup MySQL Database
```sql
-- Login ke MySQL sebagai root
mysql -u root -p

-- Buat database dan user
CREATE DATABASE wabot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'wabot'@'localhost' IDENTIFIED BY 'wabot123';
GRANT ALL PRIVILEGES ON wabot.* TO 'wabot'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Migrasi Data dari .env ke Database
```bash
# Jalankan script migrasi
node scripts/migrateEnvToDatabase.js
```

## 🎯 Menjalankan Bot

### Metode 1: Menggunakan npm
```bash
# Menjalankan bot dengan konfigurasi .env
npm start

# Atau menjalankan dengan konfigurasi database
node index-database.js
```

### Metode 2: Menggunakan Shortcut (Windows)
```batch
# Double-click file berikut:
start-bot.bat
```

### Metode 3: Menggunakan Service (Ubuntu)
```bash
# Start service
sudo systemctl start wabot

# Enable auto-start
sudo systemctl enable wabot

# Cek status
sudo systemctl status wabot

# Lihat logs
sudo journalctl -u wabot -f
```

## 🌐 Mengakses Dashboard

Setelah bot berjalan, Anda dapat mengakses berbagai dashboard:

### Dashboard Utama
```
http://localhost:3000
```

### Dashboard Pengaturan Database
```
http://localhost:3000/database-settings.html
```

### Dashboard Pengaturan Lengkap
```
http://localhost:3000/settings-dashboard.html
```

### Dashboard Real-time Settings
```
http://localhost:3000/realtime-settings.html
```

### Backup Manager
```
http://localhost:3000/backup-manager.html
```

### Login Dashboard
- **Username**: admin (default)
- **Password**: admin (default)

> ⚠️ **Penting**: Ubah username dan password default untuk keamanan!

## 📱 Menghubungkan WhatsApp

1. Jalankan bot
2. Scan QR Code yang muncul di terminal dengan WhatsApp di ponsel Anda
3. Tunggu hingga muncul pesan "WhatsApp client is ready!"
4. Bot siap digunakan

## 🔧 Perintah Bot

### Perintah Umum
- `!help` - Menampilkan daftar perintah
- `!ping` - Cek status bot
- `!ai <pertanyaan>` - Bertanya ke AI assistant

### Perintah Admin
- `!tagall <pesan>` - Tag semua member grup
- `!enablebot` - Aktifkan bot di grup
- `!disablebot` - Nonaktifkan bot di grup

### Perintah Game
- `!hell` - Info Hell Event
- `!monster` - Info Monster Rotation

### Perintah Payment (Admin)
- `!rent` - Sistem rental bot
- `!rent status` - Cek status rental

## 🔍 Troubleshooting

### Bot Tidak Bisa Start

#### Cek Port
```bash
# Windows
netstat -ano | findstr :3000

# Linux
netstat -tulpn | grep :3000
```

#### Cek Database Connection
```bash
# Test koneksi database
node -e "require('./utils/mysqlConfig').initialize().then(() => console.log('DB OK')).catch(console.error)"
```

### WhatsApp Tidak Terhubung

1. **Pastikan QR Code fresh** - Restart bot jika QR Code expired
2. **Cek koneksi internet** - WhatsApp Web memerlukan koneksi stabil
3. **Clear browser cache** - Hapus data WhatsApp Web di browser
4. **Restart WhatsApp di ponsel** - Force close dan buka kembali aplikasi

### Database Error

#### Reset Database
```bash
# Backup data terlebih dahulu
node scripts/databaseBackup.js backup

# Reset database
node scripts/setupDatabase.js
```

#### Restore dari Backup
```bash
# Lihat daftar backup
node scripts/databaseBackup.js list

# Restore dari backup
node scripts/databaseBackup.js restore backups/backup-file.json --force
```

### Permission Error (Linux)

```bash
# Fix permission untuk folder project
sudo chown -R $USER:$USER .
chmod +x install-ubuntu.sh
```

### Memory Issues

```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 index.js
```

## 📊 Monitoring

### Cek Status Bot
```bash
# Cek proses yang berjalan
ps aux | grep node

# Cek penggunaan resource
top -p $(pgrep -f "node.*index.js")
```

### Cek Logs
```bash
# Logs aplikasi (jika menggunakan PM2)
pm2 logs wabot

# Logs sistem (Ubuntu)
sudo journalctl -u wabot -f

# Logs manual
tail -f logs/app.log
```

### Database Monitoring
```sql
-- Cek ukuran database
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'wabot';

-- Cek jumlah record per tabel
SELECT 
    table_name AS 'Table',
    table_rows AS 'Rows'
FROM information_schema.tables 
WHERE table_schema = 'wabot';
```

## 🔄 Update Bot

### Update dari Git
```bash
# Backup database terlebih dahulu
node scripts/databaseBackup.js backup

# Pull update terbaru
git pull origin main

# Install dependencies baru (jika ada)
npm install

# Restart bot
npm start
```

### Update Dependencies
```bash
# Cek dependencies yang outdated
npm outdated

# Update semua dependencies
npm update

# Update dependencies tertentu
npm install package-name@latest
```

## 🛡️ Keamanan

### Backup Rutin
```bash
# Setup cron job untuk backup otomatis (Linux)
crontab -e

# Tambahkan line berikut untuk backup harian jam 2 pagi
0 2 * * * cd /path/to/bot && node scripts/databaseBackup.js backup
```

### Monitoring Keamanan
- Monitor logs secara rutin
- Update dependencies secara berkala
- Gunakan password yang kuat untuk database
- Aktifkan firewall untuk port yang tidak diperlukan

## 📞 Bantuan

Jika mengalami masalah:

1. **Cek dokumentasi** di folder `docs/`
2. **Lihat logs error** untuk detail masalah
3. **Restart bot** untuk masalah sementara
4. **Reset database** jika ada masalah data
5. **Reinstall dependencies** jika ada masalah package

---

**Selamat menggunakan WhatsApp Bot! 🎉**
