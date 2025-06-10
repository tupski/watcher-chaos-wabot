@echo off
echo Starting Bot Lords Mobile with PM2...

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

REM Install PM2 globally if not installed
npm list -g pm2 >nul 2>&1
if errorlevel 1 (
    echo Installing PM2...
    npm install -g pm2
)

REM Stop existing process if running
pm2 stop bot-lords-mobile 2>nul

REM Start the bot with PM2
pm2 start ecosystem.config.js

REM Show status
pm2 status

echo.
echo Bot started with PM2!
echo Use 'pm2 logs bot-lords-mobile' to view logs
echo Use 'pm2 restart bot-lords-mobile' to restart
echo Use 'pm2 stop bot-lords-mobile' to stop
echo.
pause
