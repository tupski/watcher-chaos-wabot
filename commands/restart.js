const { getChatInfo } = require('../utils/chatUtils');
const { isBotOwner } = require('../utils/groupSettings');
const cron = require('node-cron');

// Store restart schedule
let restartSchedule = {
    enabled: false,
    type: null, // 'once', 'daily'
    time: null,
    cronJob: null
};

/**
 * Command untuk restart bot
 * Usage: 
 * - !restart (restart dalam 30 detik)
 * - !restart now (restart sekarang)
 * - !restart everyday (restart tiap hari jam 12 malam)
 * - !restart status (cek status restart)
 */
module.exports = async (client, message) => {
    try {
        const chatInfo = await getChatInfo(client, message);
        
        // Only BOT_OWNER can use this command
        if (!isBotOwner(chatInfo.contact)) {
            await message.reply('❌ Command ini hanya untuk BOT_OWNER.');
            return;
        }
        
        // Parse command arguments
        const args = message.body.split(' ').slice(1); // Remove !restart
        const action = args[0] ? args[0].toLowerCase() : null;
        
        if (!action) {
            // Default: restart in 30 seconds
            await scheduleRestart(client, message, 30);
            return;
        }
        
        switch (action) {
            case 'now':
                await restartNow(client, message);
                break;
                
            case 'everyday':
                await scheduleDaily(client, message);
                break;
                
            case 'status':
                await showStatus(client, message);
                break;
                
            case 'cancel':
                await cancelRestart(client, message);
                break;
                
            default:
                // Check if it's a number (custom seconds)
                const seconds = parseInt(action);
                if (!isNaN(seconds) && seconds > 0) {
                    await scheduleRestart(client, message, seconds);
                } else {
                    await showHelp(client, message);
                }
                break;
        }
        
    } catch (error) {
        console.error('Error in restart command:', error);
        await message.reply('❌ Terjadi error saat memproses command restart.');
    }
};

// Schedule restart in X seconds
async function scheduleRestart(client, message, seconds) {
    try {
        const restartTime = new Date(Date.now() + (seconds * 1000));
        
        restartSchedule = {
            enabled: true,
            type: 'once',
            time: restartTime,
            cronJob: null
        };
        
        const responseMessage = 
            `🔄 *Bot Restart Dijadwalkan*\n\n` +
            `**Waktu:** ${seconds} detik\n` +
            `**Restart pada:** ${restartTime.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n\n` +
            `⚠️ *Bot akan restart otomatis dan kembali online dalam beberapa detik.*\n\n` +
            `Gunakan \`!restart cancel\` untuk membatalkan.`;
        
        await message.reply(responseMessage);
        
        // Set timeout for restart
        setTimeout(async () => {
            await performRestart(client, 'Scheduled restart');
        }, seconds * 1000);
        
        console.log(`Restart scheduled in ${seconds} seconds by BOT_OWNER`);
        
    } catch (error) {
        console.error('Error scheduling restart:', error);
        await message.reply('❌ Gagal menjadwalkan restart.');
    }
}

// Restart immediately
async function restartNow(client, message) {
    try {
        await message.reply(
            `🔄 *Bot Restart Sekarang*\n\n` +
            `⚠️ *Bot akan restart dalam 3 detik...*\n` +
            `Bot akan kembali online dalam beberapa detik.`
        );
        
        console.log('Immediate restart requested by BOT_OWNER');
        
        // Wait 3 seconds then restart
        setTimeout(async () => {
            await performRestart(client, 'Immediate restart');
        }, 3000);
        
    } catch (error) {
        console.error('Error in immediate restart:', error);
        await message.reply('❌ Gagal melakukan restart sekarang.');
    }
}

// Schedule daily restart at midnight
async function scheduleDaily(client, message) {
    try {
        // Cancel existing daily schedule
        if (restartSchedule.cronJob) {
            restartSchedule.cronJob.stop();
            restartSchedule.cronJob.destroy();
        }
        
        // Schedule daily restart at 00:00 (midnight)
        const cronJob = cron.schedule('0 0 * * *', async () => {
            console.log('Daily restart triggered');
            await performRestart(client, 'Daily scheduled restart');
        }, {
            scheduled: true,
            timezone: 'Asia/Jakarta'
        });
        
        restartSchedule = {
            enabled: true,
            type: 'daily',
            time: '00:00 WIB',
            cronJob: cronJob
        };
        
        const responseMessage = 
            `🔄 *Daily Restart Diaktifkan*\n\n` +
            `**Jadwal:** Setiap hari jam 00:00 WIB\n` +
            `**Status:** Aktif\n\n` +
            `⚠️ *Bot akan restart otomatis setiap hari dan kembali online dalam beberapa detik.*\n\n` +
            `Gunakan \`!restart cancel\` untuk membatalkan jadwal harian.`;
        
        await message.reply(responseMessage);
        
        console.log('Daily restart schedule activated by BOT_OWNER');
        
    } catch (error) {
        console.error('Error scheduling daily restart:', error);
        await message.reply('❌ Gagal mengaktifkan restart harian.');
    }
}

// Show restart status
async function showStatus(client, message) {
    try {
        let statusMessage = `🔄 *Status Restart Bot*\n\n`;
        
        if (!restartSchedule.enabled) {
            statusMessage += `**Status:** Tidak ada jadwal restart\n\n`;
            statusMessage += `💡 *Gunakan:*\n`;
            statusMessage += `• \`!restart\` - Restart dalam 30 detik\n`;
            statusMessage += `• \`!restart now\` - Restart sekarang\n`;
            statusMessage += `• \`!restart everyday\` - Restart harian\n`;
        } else {
            statusMessage += `**Status:** ✅ Aktif\n`;
            statusMessage += `**Tipe:** ${restartSchedule.type === 'daily' ? 'Harian' : 'Sekali'}\n`;
            
            if (restartSchedule.type === 'daily') {
                statusMessage += `**Jadwal:** Setiap hari jam ${restartSchedule.time}\n`;
            } else {
                statusMessage += `**Waktu:** ${restartSchedule.time.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n`;
            }
            
            statusMessage += `\n⚠️ *Bot akan restart otomatis sesuai jadwal.*\n\n`;
            statusMessage += `Gunakan \`!restart cancel\` untuk membatalkan.`;
        }
        
        await message.reply(statusMessage);
        
    } catch (error) {
        console.error('Error showing restart status:', error);
        await message.reply('❌ Gagal menampilkan status restart.');
    }
}

// Cancel restart schedule
async function cancelRestart(client, message) {
    try {
        if (!restartSchedule.enabled) {
            await message.reply('ℹ️ Tidak ada jadwal restart yang aktif.');
            return;
        }
        
        // Cancel cron job if exists
        if (restartSchedule.cronJob) {
            restartSchedule.cronJob.stop();
            restartSchedule.cronJob.destroy();
        }
        
        const wasDaily = restartSchedule.type === 'daily';
        
        restartSchedule = {
            enabled: false,
            type: null,
            time: null,
            cronJob: null
        };
        
        const responseMessage = 
            `✅ *Restart ${wasDaily ? 'Harian' : ''} Dibatalkan*\n\n` +
            `Jadwal restart telah dibatalkan.\n` +
            `Bot akan tetap berjalan normal.`;
        
        await message.reply(responseMessage);
        
        console.log(`Restart schedule cancelled by BOT_OWNER`);
        
    } catch (error) {
        console.error('Error cancelling restart:', error);
        await message.reply('❌ Gagal membatalkan restart.');
    }
}

// Show help
async function showHelp(client, message) {
    const helpMessage = 
        `🔄 *Bot Restart Commands*\n\n` +
        `**Available Commands:**\n` +
        `• \`!restart\` - Restart dalam 30 detik\n` +
        `• \`!restart now\` - Restart sekarang juga\n` +
        `• \`!restart [detik]\` - Restart dalam X detik\n` +
        `• \`!restart everyday\` - Restart harian jam 00:00\n` +
        `• \`!restart status\` - Cek status restart\n` +
        `• \`!restart cancel\` - Batalkan jadwal restart\n\n` +
        `**Contoh:**\n` +
        `\`!restart 60\` - Restart dalam 60 detik\n` +
        `\`!restart now\` - Restart sekarang\n\n` +
        `⚠️ *Hanya BOT_OWNER yang bisa menggunakan command ini.*`;
    
    await message.reply(helpMessage);
}

// Perform actual restart
async function performRestart(client, reason) {
    try {
        console.log(`Performing restart: ${reason}`);
        
        // Send notification to BOT_OWNER
        await sendRestartNotification(client, 'before', reason);
        
        // Close WhatsApp client gracefully
        if (client) {
            await client.destroy();
        }
        
        // Exit process - PM2 or process manager should restart it
        console.log('Bot restarting...');
        process.exit(0);
        
    } catch (error) {
        console.error('Error during restart:', error);
    }
}

// Send restart notification to BOT_OWNER
async function sendRestartNotification(client, phase, reason) {
    try {
        const botOwnerNumber = process.env.BOT_OWNER_NUMBER;
        if (!client || !botOwnerNumber) return;
        
        const botOwnerContactId = `${botOwnerNumber}@c.us`;
        
        let notificationMessage;
        
        if (phase === 'before') {
            notificationMessage = 
                `🔄 *Bot Restart Notification*\n\n` +
                `**Status:** Restarting...\n` +
                `**Reason:** ${reason}\n` +
                `**Time:** ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n\n` +
                `⚠️ *Bot akan offline sebentar dan kembali online dalam beberapa detik.*`;
        } else {
            notificationMessage = 
                `✅ *Bot Restart Complete*\n\n` +
                `**Status:** Online\n` +
                `**Reason:** ${reason}\n` +
                `**Time:** ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n\n` +
                `🚀 *Bot telah kembali online dan siap digunakan!*`;
        }
        
        await client.sendMessage(botOwnerContactId, notificationMessage);
        console.log(`Restart notification sent to BOT_OWNER (${phase})`);
        
    } catch (error) {
        console.error('Error sending restart notification:', error);
    }
}

// Export restart schedule for external access
module.exports.getRestartSchedule = () => restartSchedule;
module.exports.sendRestartNotification = sendRestartNotification;
