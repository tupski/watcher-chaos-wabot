# 🤖 WhatsApp Bot dengan Sistem Database

Bot WhatsApp yang powerful dengan sistem database MySQL, dashboard web, dan fitur-fitur canggih untuk manajemen grup dan otomasi.

## ✨ Fitur Utama

### 🎯 Core Features
- **WhatsApp Integration** - Terhubung langsung dengan WhatsApp Web
- **MySQL Database** - Sistem database yang robust dan scalable
- **Web Dashboard** - Interface web untuk manajemen bot
- **Real-time Configuration** - Update pengaturan secara real-time
- **Backup & Restore** - Sistem backup otomatis dan restore data

### 🎮 Game Features
- **Hell Event Notifications** - Notifikasi event dari Discord
- **Monster Rotation** - Jadwal rotasi monster dengan notifikasi otomatis
- **AI Assistant** - Integrasi dengan Gemini AI untuk menjawab pertanyaan

### 💰 Payment Features
- **Bot Rental System** - Sistem sewa bot dengan Xendit payment gateway
- **Trial Period** - Masa trial gratis untuk grup baru
- **Auto Renewal** - Notifikasi dan perpanjangan otomatis

### 👥 Group Management
- **Multi-Group Support** - Mendukung multiple grup WhatsApp
- **Permission System** - Sistem permission admin/member
- **Auto Join** - Bot otomatis join ketika diundang ke grup
- **Group Settings** - Pengaturan per grup yang fleksibel

## 🚀 Quick Start

### Instalasi Otomatis

#### Windows
```powershell
# Download repository
git clone https://github.com/your-username/whatsapp-bot.git
cd whatsapp-bot

# Jalankan sebagai Administrator
.\install-windows.ps1
```

#### Ubuntu/Debian
```bash
# Download repository
git clone https://github.com/your-username/whatsapp-bot.git
cd whatsapp-bot

# Jalankan script instalasi
chmod +x install-ubuntu.sh
./install-ubuntu.sh
```

### Menjalankan Bot
```bash
# Metode 1: Menggunakan npm
npm start

# Metode 2: Menggunakan Node.js langsung
node index.js

# Metode 3: Dengan konfigurasi database
node index-database.js
```

### Akses Dashboard
Buka browser dan kunjungi:
- **Dashboard Utama**: http://localhost:3000
- **Database Settings**: http://localhost:3000/database-settings.html
- **Real-time Settings**: http://localhost:3000/realtime-settings.html
- **Backup Manager**: http://localhost:3000/backup-manager.html

## 📋 Persyaratan Sistem

### Minimum Requirements
- **OS**: Windows 10/11, Ubuntu 18.04+, atau Debian 10+
- **RAM**: 2GB (4GB direkomendasikan)
- **Storage**: 5GB ruang kosong
- **Internet**: Koneksi stabil

### Software Requirements
- **Node.js**: v16.0.0+
- **MySQL**: v8.0+
- **Git**: Versi terbaru
- **Browser**: Chrome/Firefox/Edge (untuk dashboard)

## 🛠️ Instalasi Manual

### 1. Install Dependencies

#### Windows
```powershell
# Install Chocolatey
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install dependencies
choco install nodejs mysql git -y
```

#### Ubuntu/Debian
```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL dan dependencies lainnya
sudo apt install -y mysql-server git build-essential
```

### 2. Setup Project
```bash
# Clone repository
git clone https://github.com/your-username/whatsapp-bot.git
cd whatsapp-bot

# Install dependencies
npm install

# Setup database
node scripts/setupDatabase.js

# Migrasi konfigurasi
node scripts/migrateEnvToDatabase.js
```

### 3. Konfigurasi
```bash
# Edit file .env
cp .env.example .env
nano .env
```

Atur konfigurasi minimal:
```env
BOT_OWNER_NUMBER=628123456789  # Nomor WhatsApp Anda
DB_PASSWORD=your-mysql-password
SESSION_SECRET=your-secret-key
```

## ⚙️ Konfigurasi

### Environment Variables (.env)
```env
# Database
DB_HOST=localhost
DB_USER=wabot
DB_PASSWORD=wabot123
DB_NAME=wabot

# Server
PORT=3000
BASE_URL=http://localhost:3000
SESSION_SECRET=your-secret-key

# WhatsApp
WHATSAPP_CLIENT_ID=wabot-client
BOT_OWNER_NUMBER=628123456789

# Discord (Optional)
DISCORD_TOKEN=your-discord-token
DISCORD_CHANNEL_ID=your-channel-id

# Payment (Optional)
XENDIT_SECRET_KEY=your-xendit-key
XENDIT_PUBLIC_KEY=your-xendit-public-key

# AI (Optional)
GEMINI_API_KEY=your-gemini-key
```

### Database Configuration
Bot menggunakan MySQL dengan konfigurasi berikut:
- **Database**: wabot
- **Username**: wabot
- **Password**: wabot123 (ubah untuk production)

## 🎯 Cara Menggunakan

### Menghubungkan WhatsApp
1. Jalankan bot dengan `npm start`
2. Scan QR Code yang muncul dengan WhatsApp di ponsel
3. Tunggu pesan "WhatsApp client is ready!"

### Perintah Bot

#### Perintah Umum
- `!help` - Daftar perintah
- `!ping` - Cek status bot
- `!ai <pertanyaan>` - Tanya AI assistant

#### Perintah Admin
- `!tagall <pesan>` - Tag semua member
- `!enablebot` - Aktifkan bot
- `!disablebot` - Nonaktifkan bot

#### Perintah Game
- `!hell` - Info Hell Event
- `!monster` - Info Monster Rotation

#### Perintah Payment
- `!rent` - Sistem rental bot
- `!rent pay 7d` - Bayar rental 7 hari

### Web Dashboard

#### Database Settings
- Kelola pengaturan database
- Monitor koneksi dan statistik
- Backup dan restore data

#### Real-time Settings
- Edit konfigurasi secara live
- Sinkronisasi multi-client
- Activity logging

#### Backup Manager
- Buat backup otomatis
- Restore dari backup
- Export/import pengaturan

## 🏗️ Arsitektur

### Database Schema
```
wabot/
├── bot_settings      # Pengaturan bot
├── group_settings    # Pengaturan grup
├── payment_logs      # Log pembayaran
├── command_settings  # Konfigurasi perintah
├── messages          # Log pesan
└── system_logs       # Log sistem
```

### File Structure
```
whatsapp-bot/
├── docs/             # Dokumentasi
├── scripts/          # Script utilitas
├── utils/            # Utility functions
├── routes/           # API routes
├── public/           # Web dashboard
├── handlers/         # Event handlers
├── commands/         # Bot commands
└── models/           # Data models
```

## 🔧 Development

### Setup Development Environment
```bash
# Clone repository
git clone https://github.com/your-username/whatsapp-bot.git
cd whatsapp-bot

# Install dependencies
npm install

# Setup database
node scripts/setupDatabase.js

# Start development server
npm run dev
```

### Available Scripts
```bash
npm start              # Start production server
npm run dev            # Start development server
npm test               # Run tests
npm run backup         # Create database backup
npm run restore        # Restore from backup
```

### API Endpoints
- `GET /api/settings/all` - Get all settings
- `POST /api/settings/update` - Update settings
- `GET /api/settings/database/stats` - Database statistics
- `POST /api/settings/database/backup` - Create backup

## 📚 Dokumentasi

### Dokumentasi Lengkap
- [📦 Panduan Instalasi](docs/INSTALASI.md)
- [🚀 Cara Menjalankan](docs/CARA_MENJALANKAN.md)
- [🗄️ Sistem Database](docs/DATABASE_SYSTEM_GUIDE.md)

### API Documentation
- [API Reference](docs/API_DOCUMENTATION.md)
- [WebSocket Events](docs/WEBSOCKET_EVENTS.md)

## 🛡️ Keamanan

### Best Practices
- Ubah password default MySQL
- Gunakan SESSION_SECRET yang kuat
- Aktifkan firewall untuk port yang tidak diperlukan
- Backup database secara rutin
- Update dependencies secara berkala

### Environment Security
```env
# Jangan commit file .env ke repository
# Gunakan .env.example sebagai template
# Simpan credentials di environment variables production
```

## 🔄 Backup & Restore

### Backup Otomatis
```bash
# Buat backup manual
node scripts/databaseBackup.js backup

# Backup dengan nama custom
node scripts/databaseBackup.js backup --name=pre-update

# Lihat daftar backup
node scripts/databaseBackup.js list
```

### Restore Data
```bash
# Restore dari backup
node scripts/databaseBackup.js restore backups/backup-file.json --force

# Export pengaturan saja
node scripts/databaseBackup.js export-settings settings.json
```

## 🚀 Deployment

### Production Deployment

#### Menggunakan PM2
```bash
# Install PM2
npm install -g pm2

# Start dengan PM2
pm2 start index.js --name wabot

# Setup auto-start
pm2 startup
pm2 save
```

#### Menggunakan Docker
```bash
# Build image
docker build -t whatsapp-bot .

# Run container
docker run -d -p 3000:3000 --name wabot whatsapp-bot
```

#### Menggunakan Systemd (Ubuntu)
```bash
# Copy service file
sudo cp wabot.service /etc/systemd/system/

# Enable dan start service
sudo systemctl enable wabot
sudo systemctl start wabot
```

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-username/whatsapp-bot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/whatsapp-bot/discussions)

## 🙏 Acknowledgments

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) - WhatsApp Web API
- [Discord.js](https://discord.js.org/) - Discord API wrapper
- [MySQL2](https://github.com/sidorares/node-mysql2) - MySQL client
- [Express.js](https://expressjs.com/) - Web framework
- [Socket.IO](https://socket.io/) - Real-time communication

---

**Made with ❤️ for the community**
