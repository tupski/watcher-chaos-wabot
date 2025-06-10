#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "========================================"
echo "   Bot Lords Mobile - Linux Startup"
echo "========================================"
echo -e "${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js is not installed${NC}"
    echo "Please install Node.js:"
    echo "Ubuntu/Debian: sudo apt update && sudo apt install nodejs npm"
    echo "CentOS/RHEL: sudo yum install nodejs npm"
    echo "Or download from: https://nodejs.org/"
    exit 1
fi

echo -e "${BLUE}[INFO] Node.js version:${NC}"
node --version

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR] npm is not installed${NC}"
    echo "Please install npm along with Node.js"
    exit 1
fi

echo -e "${BLUE}[INFO] npm version:${NC}"
npm --version

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
    echo -e "${BLUE}[INFO] Creating logs directory...${NC}"
    mkdir -p logs
fi

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}[INFO] Installing npm dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR] Failed to install dependencies${NC}"
        exit 1
    fi
fi

# Install PM2 globally if not installed
echo -e "${BLUE}[INFO] Checking PM2 installation...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${BLUE}[INFO] Installing PM2 globally...${NC}"
    sudo npm install -g pm2
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}[WARNING] Failed to install PM2 globally, trying without sudo...${NC}"
        npm install -g pm2
        if [ $? -ne 0 ]; then
            echo -e "${RED}[ERROR] Failed to install PM2${NC}"
            echo "Please install manually: sudo npm install -g pm2"
            exit 1
        fi
    fi
fi

echo -e "${BLUE}[INFO] PM2 version:${NC}"
pm2 --version

# Stop existing process if running
echo -e "${BLUE}[INFO] Stopping existing bot process...${NC}"
pm2 stop bot-lords-mobile 2>/dev/null
pm2 delete bot-lords-mobile 2>/dev/null

# Start the bot with PM2
echo -e "${BLUE}[INFO] Starting Bot Lords Mobile with PM2...${NC}"
pm2 start ecosystem.config.js

if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Failed to start bot with PM2${NC}"
    echo -e "${YELLOW}[INFO] Trying to start with Node.js directly...${NC}"
    node index.js
    exit 1
fi

# Show status
echo -e "${GREEN}"
echo "[SUCCESS] Bot started successfully!"
echo -e "${NC}"
pm2 status
echo ""
echo -e "${BLUE}[INFO] Recent logs:${NC}"
pm2 logs bot-lords-mobile --lines 10

echo -e "${GREEN}"
echo "========================================"
echo "         Bot Management Commands"
echo "========================================"
echo -e "${NC}"
echo "pm2 status                    - Check bot status"
echo "pm2 logs bot-lords-mobile     - View real-time logs"
echo "pm2 restart bot-lords-mobile  - Restart bot"
echo "pm2 stop bot-lords-mobile     - Stop bot"
echo "pm2 delete bot-lords-mobile   - Remove from PM2"
echo ""
echo "Dashboard: http://localhost:3000/dashboard"
echo ""
echo -e "${GREEN}Bot is now running in the background!${NC}"

# Save PM2 process list
pm2 save

# Setup PM2 startup script (optional)
echo -e "${BLUE}[INFO] Setting up PM2 startup script...${NC}"
pm2 startup 2>/dev/null | grep "sudo" | bash 2>/dev/null

echo -e "${GREEN}Setup complete!${NC}"
