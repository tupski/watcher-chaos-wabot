# 🤖 Bot Lords Mobile WhatsApp

Bot WhatsApp yang powerful dan gratis untuk komunitas Lords Mobile dengan banyak fitur, dashboard web AdminLTE, dan sistem anti-spam.

## ✨ Fitur Utama

### 🎯 Core Features
- **WhatsApp Integration** - Terhubung langsung dengan WhatsApp Web
- **MySQL Database** - Sistem database yang robust dan scalable
- **AdminLTE Dashboard** - Interface web modern untuk manajemen bot
- **Real-time Configuration** - Update pengaturan secara real-time
- **Multi-Group Support** - Mendukung unlimited grup WhatsApp

### 🎮 Lords Mobile Features
- **Hell Event Notifications** - Notifikasi event otomatis dari Discord
- **Monster Rotation** - Jadwal rotasi monster 12 hari dengan notifikasi harian
- **AI Assistant** - Integrasi dengan Gemini AI untuk menjawab pertanyaan
- **Auto-Join Groups** - Bot otomatis join ketika diundang ke grup

### �️ Security & Anti-Spam
- **Smart Anti-Spam Link** - Sistem anti-spam link per-grup dengan AI detection
- **Auto-Block Porn** - Deteksi dan blokir link porno secara otomatis
- **Domain Whitelist** - Manajemen domain yang diizinkan per grup
- **Flexible Actions** - Delete message atau warning saja

### 👥 Group Management
- **Per-Group Settings** - Pengaturan terpisah untuk setiap grup
- **Permission System** - Sistem permission admin/member/all
- **Bot Owner Override** - Bot owner bisa akses semua fitur tanpa admin
- **Command Permissions** - Atur akses command per grup

## 🚀 Quick Start

### Instalasi Otomatis

#### Windows
```powershell
# Download repository
git clone https://github.com/tupski/watcher-chaos-wabot.git
cd watcher-chaos-wabot

# Jalankan sebagai Administrator
.\install-windows.ps1
```

#### Ubuntu/Debian
```bash
# Download repository
git clone https://github.com/tupski/watcher-chaos-wabot.git
cd watcher-chaos-wabot

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
```

### Akses Dashboard
Buka browser dan kunjungi:
- **Dashboard AdminLTE**: http://localhost:3000
- **Login Dashboard**: http://localhost:3000/dashboard/login
- **Group Management**: http://localhost:3000/dashboard/groups
- **Bot Settings**: http://localhost:3000/dashboard/settings

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
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=mysql
DB_NAME=wabot

# Web Server Configuration
PORT=3000

# Bot Configuration
BOT_OWNER_NUMBER=628123456789
TIMEZONE_OFFSET=7

# Discord Integration (Required for Hell Events)
DISCORD_TOKEN=your-discord-token
DISCORD_CHANNEL_ID=your-channel-id

# AI Assistant (Optional)
GEMINI_API_KEY=your-gemini-key

# Dashboard Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Anti-Spam Link Configuration (DEPRECATED - now per-group setting)
BLOCKED_LINKS=barongsay.id,spam-site.com,malicious-site.com
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

### 📋 Daftar Command Lengkap

#### 🔧 Command Umum
| Command | Contoh | Output |
|---------|--------|--------|
| `!help` | `!help` | Menampilkan daftar semua command yang tersedia |
| `!ping` | `!ping` | Menampilkan status bot dan waktu response |
| `!ai <pertanyaan>` | `!ai Apa itu Lords Mobile?` | AI menjawab pertanyaan menggunakan Gemini |

#### 🎮 Command Lords Mobile
| Command | Contoh | Output |
|---------|--------|--------|
| `!hell` | `!hell` | Info Hell Event saat ini (Watcher/Chaos Dragon) |
| `!hell all` | `!hell all` | Info semua Hell Event yang aktif |
| `!hell watcherchaos` | `!hell watcherchaos` | Info khusus Watcher dan Chaos Dragon |
| `!monster` | `!monster` | Jadwal monster hari ini dan besok |
| `!monster <nama>` | `!monster gargantua` | Cari kapan monster tertentu spawn |
| `!monster status` | `!monster status` | Status notifikasi monster untuk grup |
| `!monster on` | `!monster on` | Aktifkan notifikasi monster harian (admin) |
| `!monster off` | `!monster off` | Nonaktifkan notifikasi monster harian (admin) |

#### 👥 Command Group Management
| Command | Contoh | Output |
|---------|--------|--------|
| `!tagall <pesan>` | `!tagall Meeting sekarang!` | Tag semua member grup dengan pesan |
| `!enablebot` | `!enablebot` | Aktifkan bot di grup (admin) |
| `!disablebot` | `!disablebot` | Nonaktifkan bot di grup (admin) |
| `!permission` | `!permission` | Lihat pengaturan permission grup |

#### 🛡️ Command Anti-Spam
| Command | Contoh | Output |
|---------|--------|--------|
| `!antispam` | `!antispam` | Lihat pengaturan anti-spam link grup |
| `!antispam on` | `!antispam on` | Aktifkan anti-spam link (admin) |
| `!antispam off` | `!antispam off` | Nonaktifkan anti-spam link (admin) |
| `!antispam porn on` | `!antispam porn on` | Aktifkan auto-block link porno (admin) |
| `!antispam porn off` | `!antispam porn off` | Nonaktifkan auto-block link porno (admin) |
| `!antispam action delete` | `!antispam action delete` | Set aksi hapus pesan otomatis (admin) |
| `!antispam action warn` | `!antispam action warn` | Set aksi warning saja (admin) |
| `!antispam add <domain>` | `!antispam add example.com` | Tambah domain ke whitelist (admin) |
| `!antispam remove <domain>` | `!antispam remove example.com` | Hapus domain dari whitelist (admin) |
| `!antispam reset` | `!antispam reset` | Reset pengaturan ke default (admin) |

#### ⚙️ Command Admin/Owner
| Command | Contoh | Output |
|---------|--------|--------|
| `!cmd <command> <level>` | `!cmd hell admin` | Ubah permission command (admin) |
| `!debug` | `!debug` | Info debug dan diagnostik bot (admin) |
| `!restart` | `!restart` | Restart bot dengan delay (owner) |
| `!restart 60` | `!restart 60` | Restart bot dengan delay 60 detik (owner) |

### 🎯 Fitur Otomatis

#### Hell Event Notifications
- Bot otomatis mengirim notifikasi Hell Event dari Discord
- Pengaturan per grup: semua event, hanya Watcher/Chaos Dragon, atau off
- Update real-time ketika ada event baru

#### Monster Rotation
- Notifikasi harian jam 11:55 WIB untuk monster hari ini
- Jadwal 12 hari rotasi dimulai dari Gargantua & Hardrox (8 Juni 2025)
- Bisa dinonaktifkan per grup dengan `!monster off`

#### Anti-Spam Link
- Deteksi otomatis link yang tidak diizinkan
- Auto-block link porno dengan AI detection
- Pengaturan per grup: whitelist domain, aksi (delete/warn)
- Whitelist 30+ domain aman (Google, Facebook, YouTube, dll)

### 🌐 Web Dashboard (AdminLTE)

#### 🏠 Dashboard Utama
- Overview statistik bot dan grup
- Grafik aktivitas real-time
- Status koneksi WhatsApp dan database
- Quick actions untuk manajemen

#### 👥 Group Management
- Daftar semua grup yang diikuti bot
- Filter dan search grup
- Pengaturan per grup (enable/disable, notifications)
- Statistik member dan aktivitas grup

#### ⚙️ Bot Settings
- Konfigurasi Hell Event notifications
- Pengaturan Monster Rotation
- Command permissions global
- Bot profile dan informasi

#### 📊 Message Logs
- Log semua pesan yang diproses bot
- Filter berdasarkan grup, tanggal, command
- Export log untuk analisis
- Pagination dan search

#### 🔐 Authentication
- Login dengan username/password
- Session management
- Secure dashboard access
- Auto-logout untuk keamanan

## 🏗️ Arsitektur

### Database Schema
```
wabot/
├── bot_settings      # Pengaturan global bot
├── group_settings    # Pengaturan per grup (antiSpamLink, notifications, dll)
├── command_settings  # Konfigurasi command dan permissions
├── message_logs      # Log semua pesan yang diproses
└── system_logs       # Log sistem dan error
```

### File Structure
```
watcher-chaos-wabot/
├── docs/                    # Dokumentasi lengkap
├── commands/                # Bot commands
│   ├── hell.js             # Hell Event command
│   ├── monster.js          # Monster Rotation command
│   ├── antispam.js         # Anti-spam link management
│   ├── tagall.js           # Tag all members
│   └── ...
├── handlers/                # Event handlers
│   ├── messageHandler.js   # Message processing
│   ├── hellEventHandler.js # Hell Event notifications
│   ├── monsterResetHandler.js # Monster rotation
│   └── groupJoinHandler.js # Auto-join groups
├── middleware/              # Middleware functions
│   └── antiSpamLink.js     # Anti-spam link filter
├── utils/                   # Utility functions
│   ├── groupSettings.js    # Group settings management
│   ├── pornBlockList.js    # Porn detection engine
│   └── whatsappUtils.js    # WhatsApp utilities
├── routes/                  # Web dashboard routes
│   ├── dashboard.js        # AdminLTE dashboard
│   ├── api-groups.js       # Group management API
│   └── ...
├── public/                  # Web dashboard assets
│   ├── adminlte/           # AdminLTE theme
│   └── dashboard/          # Dashboard pages
└── test/                    # Test files
    ├── test-all-fixes.js   # Comprehensive tests
    ├── test-antispam-link.js # Anti-spam tests
    └── ...
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

### 📖 Dokumentasi Lengkap
- [📦 Panduan Instalasi](docs/INSTALASI.md) - Setup lengkap Windows & Ubuntu
- [🚀 Cara Menjalankan](docs/CARA_MENJALANKAN.md) - Panduan menjalankan bot
- [🗄️ Sistem Database](docs/DATABASE_SYSTEM_GUIDE.md) - Konfigurasi MySQL
- [🎮 Lords Mobile Features](docs/LORDS_MOBILE_FEATURES.md) - Hell Event & Monster Rotation
- [🛡️ Anti-Spam System](docs/ANTI_SPAM_GUIDE.md) - Konfigurasi anti-spam link
- [🌐 Dashboard Guide](docs/DASHBOARD_GUIDE.md) - Panduan AdminLTE dashboard
- [⚙️ Command Reference](docs/COMMAND_REFERENCE.md) - Daftar lengkap semua command

### 🔧 Technical Documentation
- [API Reference](docs/API_DOCUMENTATION.md) - REST API endpoints
- [Database Schema](docs/DATABASE_SCHEMA.md) - Struktur database
- [Development Guide](docs/DEVELOPMENT_GUIDE.md) - Panduan development
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Panduan deployment production

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

## 🎯 Fitur Unggulan

### 🤖 Gratis & Open Source
- **100% Gratis** - Tidak ada biaya berlangganan atau rental
- **Open Source** - Kode terbuka untuk komunitas
- **Self-Hosted** - Kontrol penuh atas data dan bot
- **No Limits** - Unlimited grup dan pengguna

### 🚀 Performance & Reliability
- **High Performance** - Optimized untuk handling multiple groups
- **Auto-Restart** - Sistem restart otomatis jika terjadi error
- **Database Backup** - Backup otomatis pengaturan dan data
- **Error Handling** - Robust error handling dan logging

### 🔒 Security & Privacy
- **Data Privacy** - Semua data tersimpan di server Anda sendiri
- **Secure Dashboard** - Authentication untuk akses dashboard
- **Bot Owner Control** - Kontrol penuh untuk bot owner
- **Group Isolation** - Pengaturan terpisah per grup

## 📞 Support & Community

- **Documentation**: [docs/](docs/) - Dokumentasi lengkap
- **Issues**: [GitHub Issues](https://github.com/tupski/watcher-chaos-wabot/issues) - Laporkan bug
- **Discussions**: [GitHub Discussions](https://github.com/tupski/watcher-chaos-wabot/discussions) - Diskusi

## 🙏 Acknowledgments

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) - WhatsApp Web API
- [Discord.js](https://discord.js.org/) - Discord API wrapper
- [MySQL2](https://github.com/sidorares/node-mysql2) - MySQL client
- [Express.js](https://expressjs.com/) - Web framework
- [AdminLTE](https://adminlte.io/) - Dashboard theme
- [Google Gemini](https://ai.google.dev/) - AI Assistant

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=tupski/watcher-chaos-wabot&type=Date)](https://star-history.com/#tupski/watcher-chaos-wabot&Date)

---

**Made with ❤️ for Lords Mobile Community**

*Bot ini dibuat khusus untuk komunitas Lords Mobile Indonesia. Gratis, open source, dan selalu gratis!*
