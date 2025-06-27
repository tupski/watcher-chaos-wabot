const express = require('express');
const router = express.Router();
const { checkSession } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Bot settings endpoint
router.post('/bot', checkSession, async (req, res) => {
    try {
        const { botOwner, timezone, aiApiKey, autoRestart } = req.body;
        
        // Read current .env file
        const envPath = path.join(__dirname, '..', '.env');
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }
        
        // Update environment variables
        const envLines = envContent.split('\n');
        const updatedLines = [];
        const varsToUpdate = {
            'BOT_OWNER_NUMBER': botOwner,
            'TIMEZONE_OFFSET': timezone,
            'AI_API_KEY': aiApiKey
        };
        
        // Track which variables we've updated
        const updatedVars = new Set();
        
        // Update existing lines
        for (const line of envLines) {
            let updatedLine = line;
            for (const [key, value] of Object.entries(varsToUpdate)) {
                if (line.startsWith(key + '=')) {
                    updatedLine = `${key}=${value}`;
                    updatedVars.add(key);
                    break;
                }
            }
            updatedLines.push(updatedLine);
        }
        
        // Add new variables if they don't exist
        for (const [key, value] of Object.entries(varsToUpdate)) {
            if (!updatedVars.has(key)) {
                updatedLines.push(`${key}=${value}`);
            }
        }
        
        // Write back to .env file
        fs.writeFileSync(envPath, updatedLines.join('\n'));
        
        // Update process.env for current session
        process.env.BOT_OWNER_NUMBER = botOwner;
        process.env.TIMEZONE_OFFSET = timezone;
        process.env.AI_API_KEY = aiApiKey;
        
        res.json({
            success: true,
            message: 'Bot settings updated successfully'
        });
        
    } catch (error) {
        console.error('Error updating bot settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update bot settings: ' + error.message
        });
    }
});

// Hell events settings endpoint
router.post('/hell', checkSession, async (req, res) => {
    try {
        const { discordChannel, defaultFilter, hellNotifications } = req.body;
        
        // Read current .env file
        const envPath = path.join(__dirname, '..', '.env');
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }
        
        // Update environment variables
        const envLines = envContent.split('\n');
        const updatedLines = [];
        const varsToUpdate = {
            'DISCORD_CHANNEL_ID': discordChannel,
            'ONLY_WATCHER_CHAOS': defaultFilter
        };
        
        // Track which variables we've updated
        const updatedVars = new Set();
        
        // Update existing lines
        for (const line of envLines) {
            let updatedLine = line;
            for (const [key, value] of Object.entries(varsToUpdate)) {
                if (line.startsWith(key + '=')) {
                    updatedLine = `${key}=${value}`;
                    updatedVars.add(key);
                    break;
                }
            }
            updatedLines.push(updatedLine);
        }
        
        // Add new variables if they don't exist
        for (const [key, value] of Object.entries(varsToUpdate)) {
            if (!updatedVars.has(key)) {
                updatedLines.push(`${key}=${value}`);
            }
        }
        
        // Write back to .env file
        fs.writeFileSync(envPath, updatedLines.join('\n'));
        
        // Update process.env for current session
        process.env.DISCORD_CHANNEL_ID = discordChannel;
        process.env.ONLY_WATCHER_CHAOS = defaultFilter;
        
        res.json({
            success: true,
            message: 'Hell Events settings updated successfully'
        });
        
    } catch (error) {
        console.error('Error updating hell settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update hell settings: ' + error.message
        });
    }
});

// System restart endpoint
router.post('/restart', checkSession, async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Bot restart initiated'
        });
        
        // Restart the process after sending response
        setTimeout(() => {
            console.log('Restarting bot via API request...');
            process.exit(0); // This will trigger PM2 or nodemon to restart
        }, 1000);
        
    } catch (error) {
        console.error('Error restarting bot:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to restart bot: ' + error.message
        });
    }
});

// Clear logs endpoint
router.post('/clear-logs', checkSession, async (req, res) => {
    try {
        // Clear message logs
        const Message = require('../models/message');
        Message.clearAll();
        
        res.json({
            success: true,
            message: 'Logs cleared successfully'
        });
        
    } catch (error) {
        console.error('Error clearing logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear logs: ' + error.message
        });
    }
});

// Export data endpoint
router.get('/export', checkSession, async (req, res) => {
    try {
        const Message = require('../models/message');
        const { getConfiguredJoinedGroups } = require('../utils/whatsappUtils');
        
        // Get all data
        const messages = Message.getAll(1, 10000);
        
        const exportData = {
            timestamp: new Date().toISOString(),
            messages: messages.messages || [],
            settings: {
                botOwner: process.env.BOT_OWNER_NUMBER,
                timezone: process.env.TIMEZONE_OFFSET,
                discordChannel: process.env.DISCORD_CHANNEL_ID,
                onlyWatcherChaos: process.env.ONLY_WATCHER_CHAOS
            }
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=bot-data-export.json');
        res.json(exportData);
        
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export data: ' + error.message
        });
    }
});

// Get current settings
router.get('/current', checkSession, (req, res) => {
    try {
        const settings = {
            botOwner: process.env.BOT_OWNER_NUMBER || '',
            timezone: process.env.TIMEZONE_OFFSET || '7',
            discordChannel: process.env.DISCORD_CHANNEL_ID || '',
            onlyWatcherChaos: process.env.ONLY_WATCHER_CHAOS === 'true',
            nodeEnv: process.env.NODE_ENV || 'development'
        };
        
        res.json({
            success: true,
            data: settings
        });
        
    } catch (error) {
        console.error('Error getting current settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get current settings: ' + error.message
        });
    }
});

module.exports = router;
