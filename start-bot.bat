@echo off
title Bot Lords Mobile - Startup
color 0A

echo.
echo ========================================
echo    Bot Lords Mobile - Windows Startup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [INFO] Node.js version:
node --version

REM Create logs directory if it doesn't exist
if not exist "logs" (
    echo [INFO] Creating logs directory...
    mkdir logs
)

REM Check if npm dependencies are installed
if not exist "node_modules" (
    echo [INFO] Installing npm dependencies...
    npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Install PM2 globally if not installed
echo [INFO] Checking PM2 installation...
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing PM2 globally...
    npm install -g pm2
    if errorlevel 1 (
        echo [ERROR] Failed to install PM2
        echo Please run as Administrator or install manually: npm install -g pm2
        pause
        exit /b 1
    )
)

echo [INFO] PM2 version:
pm2 --version

REM Stop existing process if running
echo [INFO] Stopping existing bot process...
pm2 stop bot-lords-mobile 2>nul
pm2 delete bot-lords-mobile 2>nul

REM Start the bot with PM2
echo [INFO] Starting Bot Lords Mobile with PM2...
pm2 start ecosystem.config.js

if errorlevel 1 (
    echo [ERROR] Failed to start bot with PM2
    echo Trying to start with Node.js directly...
    node index.js
    pause
    exit /b 1
)

REM Show status
echo.
echo [SUCCESS] Bot started successfully!
echo.
pm2 status
pm2 logs bot-lords-mobile --lines 10

echo.
echo ========================================
echo           Bot Management Commands
echo ========================================
echo pm2 status                    - Check bot status
echo pm2 logs bot-lords-mobile     - View real-time logs
echo pm2 restart bot-lords-mobile  - Restart bot
echo pm2 stop bot-lords-mobile     - Stop bot
echo pm2 delete bot-lords-mobile   - Remove from PM2
echo.
echo Dashboard: http://localhost:3000/dashboard
echo.
echo Press any key to exit...
pause >nul
