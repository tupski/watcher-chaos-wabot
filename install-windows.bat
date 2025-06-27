@echo off
setlocal enabledelayedexpansion

REM ========================================
REM Script Instalasi Otomatis WhatsApp Bot
REM Untuk Windows 10/11
REM ========================================

title WhatsApp Bot - Instalasi Otomatis

REM Warna untuk output
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

echo %GREEN%
echo ==========================================
echo     WhatsApp Bot - Instalasi Otomatis
echo ==========================================
echo %NC%

REM Fungsi untuk cek admin privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo %GREEN%[INFO]%NC% Script dijalankan dengan hak administrator
) else (
    echo %RED%[ERROR]%NC% Script ini memerlukan hak administrator!
    echo Klik kanan pada file dan pilih "Run as administrator"
    pause
    exit /b 1
)

echo %BLUE%[INFO]%NC% Memulai instalasi WhatsApp Bot...

REM Cek apakah Chocolatey sudah terinstall
where choco >nul 2>&1
if %errorLevel% == 0 (
    echo %GREEN%[INFO]%NC% Chocolatey sudah terinstall
) else (
    echo %BLUE%[INFO]%NC% Menginstall Chocolatey...
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
    if !errorLevel! == 0 (
        echo %GREEN%[SUKSES]%NC% Chocolatey berhasil diinstall
    ) else (
        echo %RED%[ERROR]%NC% Gagal menginstall Chocolatey
        pause
        exit /b 1
    )
)

REM Refresh environment variables
call refreshenv

REM Install Node.js
echo %BLUE%[INFO]%NC% Mengecek Node.js...
where node >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo %GREEN%[INFO]%NC% Node.js sudah terinstall: !NODE_VERSION!
) else (
    echo %BLUE%[INFO]%NC% Menginstall Node.js...
    choco install nodejs -y
    if !errorLevel! == 0 (
        echo %GREEN%[SUKSES]%NC% Node.js berhasil diinstall
    ) else (
        echo %RED%[ERROR]%NC% Gagal menginstall Node.js
        pause
        exit /b 1
    )
)

REM Install Git
echo %BLUE%[INFO]%NC% Mengecek Git...
where git >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
    echo %GREEN%[INFO]%NC% Git sudah terinstall: !GIT_VERSION!
) else (
    echo %BLUE%[INFO]%NC% Menginstall Git...
    choco install git -y
    if !errorLevel! == 0 (
        echo %GREEN%[SUKSES]%NC% Git berhasil diinstall
    ) else (
        echo %RED%[ERROR]%NC% Gagal menginstall Git
        pause
        exit /b 1
    )
)

REM Install MySQL
echo %BLUE%[INFO]%NC% Mengecek MySQL...
where mysql >nul 2>&1
if %errorLevel% == 0 (
    echo %GREEN%[INFO]%NC% MySQL sudah terinstall
) else (
    echo %BLUE%[INFO]%NC% Menginstall MySQL...
    choco install mysql -y
    if !errorLevel! == 0 (
        echo %GREEN%[SUKSES]%NC% MySQL berhasil diinstall
        echo %YELLOW%[PERINGATAN]%NC% Silakan atur password root MySQL
    ) else (
        echo %RED%[ERROR]%NC% Gagal menginstall MySQL
        pause
        exit /b 1
    )
)

REM Refresh environment variables lagi
call refreshenv

REM Setup database
echo %BLUE%[INFO]%NC% Menyiapkan database MySQL...
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS wabot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p -e "CREATE USER IF NOT EXISTS 'wabot'@'localhost' IDENTIFIED BY 'wabot123';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON wabot.* TO 'wabot'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"

if !errorLevel! == 0 (
    echo %GREEN%[SUKSES]%NC% Database berhasil disiapkan
    echo %BLUE%[INFO]%NC% Database: wabot
    echo %BLUE%[INFO]%NC% Username: wabot
    echo %BLUE%[INFO]%NC% Password: wabot123
) else (
    echo %YELLOW%[PERINGATAN]%NC% Gagal setup database otomatis
    echo Silakan setup database manual setelah instalasi
)

REM Install Node.js dependencies
echo %BLUE%[INFO]%NC% Menginstall dependencies Node.js...
if exist package.json (
    npm install
    if !errorLevel! == 0 (
        echo %GREEN%[SUKSES]%NC% Dependencies Node.js berhasil diinstall
    ) else (
        echo %RED%[ERROR]%NC% Gagal menginstall dependencies Node.js
        pause
        exit /b 1
    )
) else (
    echo %RED%[ERROR]%NC% File package.json tidak ditemukan!
    pause
    exit /b 1
)

REM Setup environment file
echo %BLUE%[INFO]%NC% Menyiapkan file konfigurasi...
if not exist .env (
    echo %BLUE%[INFO]%NC% Membuat file .env dari template...
    (
        echo # Database Configuration
        echo DB_HOST=localhost
        echo DB_USER=wabot
        echo DB_PASSWORD=wabot123
        echo DB_NAME=wabot
        echo.
        echo # Server Configuration
        echo PORT=3000
        echo BASE_URL=http://localhost:3000
        echo SESSION_SECRET=your-secret-key-change-this
        echo NODE_ENV=development
        echo.
        echo # WhatsApp Configuration
        echo WHATSAPP_CLIENT_ID=wabot-client
        echo BOT_OWNER_NUMBER=your-whatsapp-number
        echo.
        echo # Discord Configuration ^(Optional^)
        echo DISCORD_TOKEN=your-discord-token
        echo DISCORD_CHANNEL_ID=your-discord-channel-id
        echo.
        echo # Payment Configuration ^(Optional^)
        echo XENDIT_SECRET_KEY=your-xendit-secret-key
        echo XENDIT_PUBLIC_KEY=your-xendit-public-key
        echo XENDIT_WEBHOOK_TOKEN=your-xendit-webhook-token
        echo XENDIT_IS_PRODUCTION=false
        echo.
        echo # AI Configuration ^(Optional^)
        echo GEMINI_API_KEY=your-gemini-api-key
        echo.
        echo # General Settings
        echo TIMEZONE_OFFSET=7
        echo ONLY_WATCHER_CHAOS=true
        echo MONSTER_RESET_TIME=11:55
        echo MONSTER_NOTIFICATIONS=true
        echo TRIAL_ENABLED=true
        echo TRIAL_DURATION_DAYS=1
    ) > .env
    echo %GREEN%[SUKSES]%NC% File .env berhasil dibuat
    echo %YELLOW%[PERINGATAN]%NC% Silakan edit file .env untuk mengatur konfigurasi bot
) else (
    echo %GREEN%[INFO]%NC% File .env sudah ada
)

REM Setup database schema
echo %BLUE%[INFO]%NC% Menyiapkan skema database...
if exist scripts\setupDatabase.js (
    node scripts\setupDatabase.js
    if !errorLevel! == 0 (
        echo %GREEN%[SUKSES]%NC% Skema database berhasil disiapkan
    ) else (
        echo %YELLOW%[PERINGATAN]%NC% Gagal setup skema database
    )
) else (
    echo %YELLOW%[PERINGATAN]%NC% Script setup database tidak ditemukan
)

REM Buat batch file untuk menjalankan bot
echo %BLUE%[INFO]%NC% Membuat shortcut untuk menjalankan bot...
(
    echo @echo off
    echo title WhatsApp Bot
    echo echo Memulai WhatsApp Bot...
    echo node index.js
    echo pause
) > start-bot.bat

echo %GREEN%[SUKSES]%NC% Shortcut start-bot.bat berhasil dibuat

REM Buat batch file untuk membuka dashboard
(
    echo @echo off
    echo echo Membuka dashboard WhatsApp Bot...
    echo start http://localhost:3000
    echo echo Dashboard dibuka di browser
    echo pause
) > open-dashboard.bat

echo %GREEN%[SUKSES]%NC% Shortcut open-dashboard.bat berhasil dibuat

REM Tampilkan informasi setelah instalasi
echo.
echo %GREEN%
echo ==========================================
echo   Instalasi WhatsApp Bot Selesai!
echo ==========================================
echo %NC%
echo.
echo %BLUE%[INFO]%NC% Langkah selanjutnya:
echo 1. Edit file .env untuk mengatur konfigurasi bot
echo 2. Jalankan bot dengan: start-bot.bat
echo 3. Atau gunakan: npm start
echo 4. Akses dashboard di: http://localhost:3000
echo.
echo %BLUE%[INFO]%NC% File penting:
echo - Konfigurasi: .env
echo - Dokumentasi: docs\
echo - Mulai bot: start-bot.bat
echo - Buka dashboard: open-dashboard.bat
echo.
echo %BLUE%[INFO]%NC% Perintah berguna:
echo - Mulai bot: npm start
echo - Mulai dengan database: node index-database.js
echo - Setup database: node scripts\setupDatabase.js
echo - Backup database: node scripts\databaseBackup.js backup
echo.
echo %YELLOW%[PERINGATAN]%NC% Jangan lupa untuk:
echo - Mengatur BOT_OWNER_NUMBER di file .env
echo - Mengatur token Discord jika diperlukan
echo - Mengatur konfigurasi payment jika diperlukan
echo - Mengatur password MySQL yang aman
echo.
echo %GREEN%[SUKSES]%NC% Instalasi selesai! Tekan tombol apapun untuk keluar.
pause >nul
