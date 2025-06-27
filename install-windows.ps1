# ========================================
# Script Instalasi Otomatis WhatsApp Bot
# Untuk Windows 10/11 (PowerShell)
# ========================================

# Require Administrator privileges
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Script ini memerlukan hak administrator!" -ForegroundColor Red
    Write-Host "Klik kanan pada PowerShell dan pilih 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Tekan Enter untuk keluar"
    exit 1
}

# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Fungsi untuk menampilkan pesan berwarna
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUKSES] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[PERINGATAN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Header {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "    WhatsApp Bot - Instalasi Otomatis" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
}

# Fungsi untuk mengecek apakah command tersedia
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Fungsi untuk install Chocolatey
function Install-Chocolatey {
    if (Test-Command "choco") {
        Write-Status "Chocolatey sudah terinstall"
    }
    else {
        Write-Status "Menginstall Chocolatey..."
        try {
            Set-ExecutionPolicy Bypass -Scope Process -Force
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
            Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
            
            # Refresh environment
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            
            Write-Success "Chocolatey berhasil diinstall"
        }
        catch {
            Write-Error "Gagal menginstall Chocolatey: $($_.Exception.Message)"
            exit 1
        }
    }
}

# Fungsi untuk install Node.js
function Install-NodeJS {
    if (Test-Command "node") {
        $nodeVersion = node --version
        Write-Status "Node.js sudah terinstall: $nodeVersion"
        
        # Cek versi Node.js (minimal v16)
        $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        if ($majorVersion -lt 16) {
            Write-Warning "Node.js versi lama terdeteksi. Mengupdate ke versi terbaru..."
            choco upgrade nodejs -y
        }
    }
    else {
        Write-Status "Menginstall Node.js..."
        try {
            choco install nodejs -y
            
            # Refresh environment
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            
            if (Test-Command "node" -and Test-Command "npm") {
                $nodeVersion = node --version
                $npmVersion = npm --version
                Write-Success "Node.js $nodeVersion dan npm $npmVersion berhasil diinstall"
            }
            else {
                Write-Error "Gagal menginstall Node.js"
                exit 1
            }
        }
        catch {
            Write-Error "Gagal menginstall Node.js: $($_.Exception.Message)"
            exit 1
        }
    }
}

# Fungsi untuk install Git
function Install-Git {
    if (Test-Command "git") {
        $gitVersion = git --version
        Write-Status "Git sudah terinstall: $gitVersion"
    }
    else {
        Write-Status "Menginstall Git..."
        try {
            choco install git -y
            
            # Refresh environment
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            
            Write-Success "Git berhasil diinstall"
        }
        catch {
            Write-Error "Gagal menginstall Git: $($_.Exception.Message)"
            exit 1
        }
    }
}

# Fungsi untuk install MySQL
function Install-MySQL {
    if (Test-Command "mysql") {
        Write-Status "MySQL sudah terinstall"
    }
    else {
        Write-Status "Menginstall MySQL..."
        try {
            choco install mysql -y
            
            # Refresh environment
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            
            Write-Success "MySQL berhasil diinstall"
            Write-Warning "Silakan atur password root MySQL menggunakan MySQL Workbench atau command line"
        }
        catch {
            Write-Error "Gagal menginstall MySQL: $($_.Exception.Message)"
            Write-Warning "Silakan install MySQL secara manual dari https://dev.mysql.com/downloads/mysql/"
        }
    }
}

# Fungsi untuk setup database
function Setup-Database {
    Write-Status "Menyiapkan database MySQL..."
    
    try {
        # Coba koneksi ke MySQL
        $mysqlCommands = @(
            "CREATE DATABASE IF NOT EXISTS wabot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
            "CREATE USER IF NOT EXISTS 'wabot'@'localhost' IDENTIFIED BY 'wabot123';",
            "GRANT ALL PRIVILEGES ON wabot.* TO 'wabot'@'localhost';",
            "FLUSH PRIVILEGES;"
        )
        
        foreach ($cmd in $mysqlCommands) {
            mysql -u root -p -e $cmd
        }
        
        Write-Success "Database berhasil disiapkan"
        Write-Status "Database: wabot"
        Write-Status "Username: wabot"
        Write-Status "Password: wabot123"
    }
    catch {
        Write-Warning "Gagal setup database otomatis: $($_.Exception.Message)"
        Write-Warning "Silakan setup database manual setelah instalasi"
    }
}

# Fungsi untuk install dependencies Node.js
function Install-NodeDependencies {
    Write-Status "Menginstall dependencies Node.js..."
    
    if (-not (Test-Path "package.json")) {
        Write-Error "File package.json tidak ditemukan!"
        exit 1
    }
    
    try {
        npm install
        Write-Success "Dependencies Node.js berhasil diinstall"
    }
    catch {
        Write-Error "Gagal menginstall dependencies Node.js: $($_.Exception.Message)"
        exit 1
    }
}

# Fungsi untuk setup environment
function Setup-Environment {
    Write-Status "Menyiapkan file konfigurasi..."
    
    if (-not (Test-Path ".env")) {
        Write-Status "Membuat file .env dari template..."
        
        $envContent = @"
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
"@
        
        $envContent | Out-File -FilePath ".env" -Encoding UTF8
        Write-Success "File .env berhasil dibuat"
        Write-Warning "Silakan edit file .env untuk mengatur konfigurasi bot"
    }
    else {
        Write-Status "File .env sudah ada"
    }
}

# Fungsi untuk setup database schema
function Setup-DatabaseSchema {
    Write-Status "Menyiapkan skema database..."
    
    if (Test-Path "scripts\setupDatabase.js") {
        try {
            node scripts\setupDatabase.js
            Write-Success "Skema database berhasil disiapkan"
        }
        catch {
            Write-Warning "Gagal setup skema database: $($_.Exception.Message)"
        }
    }
    else {
        Write-Warning "Script setup database tidak ditemukan"
    }
}

# Fungsi untuk membuat shortcut
function Create-Shortcuts {
    Write-Status "Membuat shortcut untuk menjalankan bot..."
    
    # Buat batch file untuk start bot
    $startBotContent = @"
@echo off
title WhatsApp Bot
echo Memulai WhatsApp Bot...
node index.js
pause
"@
    $startBotContent | Out-File -FilePath "start-bot.bat" -Encoding ASCII
    
    # Buat batch file untuk buka dashboard
    $dashboardContent = @"
@echo off
echo Membuka dashboard WhatsApp Bot...
start http://localhost:3000
echo Dashboard dibuka di browser
pause
"@
    $dashboardContent | Out-File -FilePath "open-dashboard.bat" -Encoding ASCII
    
    Write-Success "Shortcut berhasil dibuat:"
    Write-Status "- start-bot.bat: Untuk menjalankan bot"
    Write-Status "- open-dashboard.bat: Untuk membuka dashboard"
}

# Fungsi untuk menampilkan informasi setelah instalasi
function Show-PostInstallInfo {
    Write-Header
    Write-Success "Instalasi WhatsApp Bot berhasil diselesaikan!"
    Write-Host ""
    Write-Status "Langkah selanjutnya:"
    Write-Host "1. Edit file .env untuk mengatur konfigurasi bot"
    Write-Host "2. Jalankan bot dengan: start-bot.bat"
    Write-Host "3. Atau gunakan: npm start"
    Write-Host "4. Akses dashboard di: http://localhost:3000"
    Write-Host ""
    Write-Status "File penting:"
    Write-Host "- Konfigurasi: .env"
    Write-Host "- Dokumentasi: docs\"
    Write-Host "- Mulai bot: start-bot.bat"
    Write-Host "- Buka dashboard: open-dashboard.bat"
    Write-Host ""
    Write-Status "Perintah berguna:"
    Write-Host "- Mulai bot: npm start"
    Write-Host "- Mulai dengan database: node index-database.js"
    Write-Host "- Setup database: node scripts\setupDatabase.js"
    Write-Host "- Backup database: node scripts\databaseBackup.js backup"
    Write-Host ""
    Write-Warning "Jangan lupa untuk:"
    Write-Host "- Mengatur BOT_OWNER_NUMBER di file .env"
    Write-Host "- Mengatur token Discord jika diperlukan"
    Write-Host "- Mengatur konfigurasi payment jika diperlukan"
    Write-Host "- Mengatur password MySQL yang aman"
    Write-Host ""
}

# Main installation function
function Start-Installation {
    Write-Header
    
    Write-Status "Memulai instalasi WhatsApp Bot..."
    
    # Install Chocolatey
    Install-Chocolatey
    
    # Install dependencies
    Install-Git
    Install-NodeJS
    Install-MySQL
    
    # Setup database
    Setup-Database
    
    # Install Node.js dependencies
    Install-NodeDependencies
    
    # Setup environment
    Setup-Environment
    
    # Setup database schema
    Setup-DatabaseSchema
    
    # Create shortcuts
    Create-Shortcuts
    
    # Show post-install information
    Show-PostInstallInfo
}

# Jalankan instalasi
try {
    Start-Installation
}
catch {
    Write-Error "Instalasi gagal: $($_.Exception.Message)"
    Read-Host "Tekan Enter untuk keluar"
    exit 1
}

Read-Host "Instalasi selesai! Tekan Enter untuk keluar"
