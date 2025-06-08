const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { getGroupSettings, setRentMode } = require('../utils/groupSettings');

// File to store group settings
const settingsFile = path.join(__dirname, '..', 'data', 'groupSettings.json');

/**
 * Load all group settings
 */
function loadAllSettings() {
    try {
        if (fs.existsSync(settingsFile)) {
            const data = fs.readFileSync(settingsFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading group settings for rent expiry check:', error);
    }
    return {};
}

/**
 * Check and disable expired rent bots
 */
function checkExpiredRents(whatsappClient) {
    try {
        const allSettings = loadAllSettings();
        const now = new Date();
        
        console.log('Checking for expired rent bots...');
        
        for (const [groupId, settings] of Object.entries(allSettings)) {
            if (settings.rentMode && settings.rentExpiry) {
                const expiryDate = new Date(settings.rentExpiry);
                
                if (now >= expiryDate) {
                    console.log(`Rent expired for group ${groupId}, disabling bot...`);
                    
                    // Disable rent mode
                    const success = setRentMode(groupId, false);
                    
                    if (success) {
                        console.log(`Successfully disabled rent for group ${groupId}`);
                        
                        // Send notification to the group
                        sendExpiryNotification(whatsappClient, groupId, expiryDate);
                    } else {
                        console.error(`Failed to disable rent for group ${groupId}`);
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('Error checking expired rents:', error);
    }
}

/**
 * Send expiry notification to group
 */
async function sendExpiryNotification(whatsappClient, groupId, expiryDate) {
    try {
        const chats = await whatsappClient.getChats();
        const chat = chats.find(c => c.id._serialized === groupId);
        
        if (chat) {
            const expiryMessage = 
                '⏰ *Masa Sewa Bot Telah Berakhir*\n\n' +
                `📅 *Kadaluarsa:* ${expiryDate.toLocaleDateString('id-ID')} ${expiryDate.toLocaleTimeString('id-ID')}\n\n` +
                '❌ *Bot telah dinonaktifkan*\n' +
                'Semua fitur bot tidak lagi tersedia.\n\n' +
                '🔄 *Untuk Mengaktifkan Kembali:*\n' +
                'Hubungi owner bot untuk perpanjangan sewa:\n\n' +
                '📱 *Kontak:*\n' +
                '0822-1121-9993 (Angga)\n\n' +
                '💰 *Promo Perpanjangan:*\n' +
                'Sewa Bot Lords Mobile cuma *30ribu/bulan!*\n\n' +
                '✨ *Fitur yang akan aktif kembali:*\n' +
                '• Notifikasi Hell Event otomatis\n' +
                '• Info Monster Rotation harian\n' +
                '• AI Assistant\n' +
                '• Tag All Members\n' +
                '• Anti-spam Protection\n\n' +
                'Terima kasih telah menggunakan layanan kami! 🙏';
            
            await chat.sendMessage(expiryMessage);
            console.log(`Expiry notification sent to group ${groupId}`);
        } else {
            console.log(`Group ${groupId} not found for expiry notification`);
        }
        
    } catch (error) {
        console.error(`Error sending expiry notification to group ${groupId}:`, error);
    }
}

/**
 * Start rent expiry checker scheduler
 */
function startRentExpiryScheduler(whatsappClient) {
    console.log('Starting Rent Expiry Scheduler...');
    
    // Check every hour for expired rents
    // Cron format: minute hour day month dayOfWeek
    // 0 * * * * means every hour at minute 0
    cron.schedule('0 * * * *', () => {
        checkExpiredRents(whatsappClient);
    }, {
        timezone: 'Asia/Jakarta' // GMT+7
    });
    
    // Also check immediately on startup (after 30 seconds delay)
    setTimeout(() => {
        console.log('Running initial rent expiry check...');
        checkExpiredRents(whatsappClient);
    }, 30000);
    
    console.log('Rent Expiry Scheduler started! Will check every hour for expired rents.');
}

module.exports = {
    startRentExpiryScheduler,
    checkExpiredRents
};
