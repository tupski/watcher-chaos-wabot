# 📦 Panduan Instalasi WhatsApp Bot

Panduan lengkap untuk menginstall WhatsApp Bot dengan sistem database MySQL di berbagai platform.

## 🎯 Pilihan Instalasi

### ⚡ Instalasi Otomatis (Direkomendasikan)
- **Windows**: Menggunakan script PowerShell atau Batch
- **Ubuntu/Debian**: Menggunakan script Bash
- **Semua dependencies diinstall otomatis**
- **Database dikonfigurasi otomatis**

### 🛠️ Instalasi Manual
- **Kontrol penuh atas proses instalasi**
- **Cocok untuk server production**
- **Kustomisasi konfigurasi advanced**

## 🖥️ Instalasi di Windows

### Metode 1: PowerShell Script (Direkomendasikan)

1. **Download Repository**
   ```powershell
   git clone <repository-url>
   cd BotLM
   ```

2. **Jalankan Script Instalasi**
   ```powershell
   # Buka PowerShell sebagai Administrator
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\install-windows.ps1
   ```

3. **Ikuti Instruksi di Layar**
   - Script akan menginstall semua dependencies
   - Database akan dikonfigurasi otomatis
   - File .env akan dibuat dengan template

### Metode 2: Batch Script

1. **Download Repository**
2. **Klik Kanan pada `install-windows.bat`**
3. **Pilih "Run as Administrator"**
4. **Ikuti Instruksi di Layar**

### Metode 3: Manual Windows

#### Prerequisites
```powershell
# Install Chocolatey
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install dependencies
choco install nodejs mysql git -y
```

#### Setup Project
```powershell
# Clone repository
git clone <repository-url>
cd BotLM

# Install Node.js dependencies
npm install

# Setup database
node scripts/setupDatabase.js
```

## 🐧 Instalasi di Ubuntu/Debian

### Metode 1: Script Otomatis (Direkomendasikan)

```bash
# Download repository
git clone <repository-url>
cd BotLM

# Jalankan script instalasi
chmod +x install-ubuntu.sh
./install-ubuntu.sh
```

### Metode 2: Manual Ubuntu

#### Update Sistem
```bash
sudo apt update && sudo apt upgrade -y
```

#### Install Dependencies
```bash
# Install basic tools
sudo apt install -y curl wget git build-essential

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt install -y mysql-server

# Install additional dependencies
sudo apt install -y \
    libnss3-dev \
    libatk-bridge2.0-dev \
    libdrm2 \
    libxkbcommon0 \
    libgtk-3-dev \
    libxss1 \
    libasound2
```

#### Setup MySQL
```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -e "CREATE DATABASE wabot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'wabot'@'localhost' IDENTIFIED BY 'wabot123';"
sudo mysql -e "GRANT ALL PRIVILEGES ON wabot.* TO 'wabot'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

#### Setup Project
```bash
# Clone repository
git clone <repository-url>
cd BotLM

# Install Node.js dependencies
npm install

# Setup database schema
node scripts/setupDatabase.js

# Create systemd service (optional)
sudo cp wabot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable wabot
```

## 🐳 Instalasi dengan Docker

### Dockerfile
```dockerfile
FROM node:18-alpine

# Install dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install npm dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Set environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Start application
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  wabot:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=mysql
      - DB_USER=wabot
      - DB_PASSWORD=wabot123
      - DB_NAME=wabot
    depends_on:
      - mysql
    volumes:
      - ./data:/app/data
      - ./.env:/app/.env

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=wabot
      - MYSQL_USER=wabot
      - MYSQL_PASSWORD=wabot123
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

volumes:
  mysql_data:
```

### Menjalankan dengan Docker
```bash
# Build dan jalankan
docker-compose up -d

# Lihat logs
docker-compose logs -f wabot

# Stop services
docker-compose down
```

## 🔧 Konfigurasi Setelah Instalasi

### 1. Edit File .env
```bash
# Buka file .env dengan editor
nano .env
# atau
code .env
```

### 2. Konfigurasi Wajib
```env
# Ganti dengan nomor WhatsApp Anda
BOT_OWNER_NUMBER=628123456789

# Ganti dengan secret key yang aman
SESSION_SECRET=your-very-secure-secret-key-here
```

### 3. Konfigurasi Opsional
```env
# Discord Bot (jika diperlukan)
DISCORD_TOKEN=your-discord-bot-token
DISCORD_CHANNEL_ID=your-discord-channel-id

# Payment Gateway (jika diperlukan)
XENDIT_SECRET_KEY=your-xendit-secret-key
XENDIT_PUBLIC_KEY=your-xendit-public-key

# AI Assistant (jika diperlukan)
GEMINI_API_KEY=your-gemini-api-key
```

## 🚀 Menjalankan Bot

### Development Mode
```bash
# Jalankan dengan npm
npm start

# Atau jalankan dengan Node.js langsung
node index.js

# Atau jalankan dengan konfigurasi database
node index-database.js
```

### Production Mode

#### Menggunakan PM2
```bash
# Install PM2
npm install -g pm2

# Start bot dengan PM2
pm2 start index.js --name wabot

# Save PM2 configuration
pm2 save

# Setup auto-start
pm2 startup
```

#### Menggunakan Systemd (Ubuntu)
```bash
# Start service
sudo systemctl start wabot

# Enable auto-start
sudo systemctl enable wabot

# Check status
sudo systemctl status wabot
```

## 🔍 Verifikasi Instalasi

### 1. Cek Dependencies
```bash
# Cek versi Node.js
node --version

# Cek versi npm
npm --version

# Cek MySQL
mysql --version

# Cek Git
git --version
```

### 2. Cek Database Connection
```bash
# Test koneksi database
node -e "require('./utils/mysqlConfig').initialize().then(() => console.log('✅ Database OK')).catch(err => console.error('❌ Database Error:', err))"
```

### 3. Cek Bot Status
```bash
# Akses dashboard
curl http://localhost:3000

# Cek API endpoint
curl http://localhost:3000/api/settings/database/test
```

## 🛠️ Troubleshooting Instalasi

### Windows Issues

#### PowerShell Execution Policy
```powershell
# Jika ada error execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

#### Chocolatey Installation Failed
```powershell
# Manual install Chocolatey
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### MySQL Service Not Starting
```powershell
# Start MySQL service manually
net start mysql80
```

### Ubuntu Issues

#### Permission Denied
```bash
# Fix script permissions
chmod +x install-ubuntu.sh

# Fix project permissions
sudo chown -R $USER:$USER .
```

#### MySQL Installation Issues
```bash
# Reinstall MySQL
sudo apt remove --purge mysql-server mysql-client mysql-common
sudo apt autoremove
sudo apt autoclean
sudo apt install mysql-server
```

#### Node.js Version Issues
```bash
# Remove old Node.js
sudo apt remove nodejs npm

# Install latest Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### General Issues

#### Port Already in Use
```bash
# Find process using port 3000
# Windows
netstat -ano | findstr :3000

# Linux
netstat -tulpn | grep :3000

# Kill process
# Windows
taskkill /PID <PID> /F

# Linux
kill -9 <PID>
```

#### Dependencies Installation Failed
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Database Connection Failed
```bash
# Check MySQL service
# Windows
net start mysql80

# Linux
sudo systemctl start mysql
sudo systemctl status mysql

# Test connection manually
mysql -u wabot -p wabot
```

## 📋 Checklist Instalasi

### ✅ Pre-Installation
- [ ] Sistem operasi didukung (Windows 10+, Ubuntu 18.04+)
- [ ] Koneksi internet stabil
- [ ] Hak administrator/sudo tersedia
- [ ] Minimal 5GB ruang disk kosong

### ✅ Installation
- [ ] Node.js v16+ terinstall
- [ ] MySQL 8.0+ terinstall dan berjalan
- [ ] Git terinstall
- [ ] Repository di-clone
- [ ] Dependencies npm terinstall
- [ ] Database wabot dibuat
- [ ] Schema database di-setup

### ✅ Configuration
- [ ] File .env dibuat dan dikonfigurasi
- [ ] BOT_OWNER_NUMBER diatur
- [ ] SESSION_SECRET diubah dari default
- [ ] Database credentials benar
- [ ] Port 3000 tersedia

### ✅ Testing
- [ ] Bot dapat dijalankan tanpa error
- [ ] Database connection berhasil
- [ ] Dashboard dapat diakses
- [ ] WhatsApp QR code muncul
- [ ] Bot dapat terhubung ke WhatsApp

## 🎉 Selesai!

Setelah semua langkah selesai, bot Anda siap digunakan!

### Langkah Selanjutnya:
1. **Scan QR Code** untuk menghubungkan WhatsApp
2. **Akses Dashboard** di `http://localhost:3000`
3. **Konfigurasi Bot** sesuai kebutuhan
4. **Test Commands** di grup WhatsApp
5. **Setup Backup** rutin untuk database

### Dokumentasi Lanjutan:
- [Cara Menjalankan](CARA_MENJALANKAN.md)
- [Sistem Database](DATABASE_SYSTEM_GUIDE.md)
- [API Documentation](API_DOCUMENTATION.md)

---

**Happy Botting! 🤖💬**
