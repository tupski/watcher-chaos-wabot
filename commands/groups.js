const { getChatInfo } = require('../utils/chatUtils');
const { isBotOwner, getAllGroupsSettings, setBotEnabled, setRentMode, getRentStatus } = require('../utils/groupSettings');

/**
 * Command untuk BOT_OWNER melihat dan mengelola semua grup
 * Usage: 
 * - !groups (lihat semua grup)
 * - !groups <number> (lihat grup spesifik berdasarkan nomor)
 * - !groups <number> enable (aktifkan bot di grup)
 * - !groups <number> disable (nonaktifkan bot di grup)
 * - !groups <number> sewa <durasi> (aktifkan mode sewa)
 * - !groups <number> rentoff (nonaktifkan mode sewa)
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
        const args = message.body.split(' ').slice(1); // Remove !groups
        const groupNumber = args[0] ? parseInt(args[0]) : null;
        const action = args[1] ? args[1].toLowerCase() : null;
        const duration = args[2];
        
        const allGroups = getAllGroupsSettings();
        const groupEntries = Object.entries(allGroups);
        
        if (groupEntries.length === 0) {
            await message.reply('📋 *Daftar Grup: Kosong*\n\nBelum ada grup yang terdaftar.');
            return;
        }
        
        // If no group number specified, show list
        if (!groupNumber) {
            let listMessage = '📋 *Daftar Semua Grup*\n\n';
            
            for (let i = 0; i < groupEntries.length && i < 15; i++) {
                const [groupId, settings] = groupEntries[i];
                const groupNum = i + 1;
                
                // Get group name
                let groupName = 'Unknown Group';
                try {
                    const chats = await client.getChats();
                    const chat = chats.find(c => c.id._serialized === groupId);
                    if (chat) {
                        groupName = chat.name;
                    }
                } catch (error) {
                    console.error('Error getting group name:', error);
                }
                
                const botStatus = settings.botEnabled !== false ? '✅' : '❌';
                let rentStatus = '🆓';
                
                if (settings.rentMode) {
                    const rentInfo = getRentStatus(groupId);
                    rentStatus = rentInfo.isActive ? '🔄' : '⏰';
                }
                
                listMessage += `**${groupNum}.** ${groupName}\n`;
                listMessage += `   Bot: ${botStatus} | Mode: ${rentStatus}\n`;
                
                if (settings.rentMode && settings.rentExpiry) {
                    const expiryDate = new Date(settings.rentExpiry);
                    const now = new Date();
                    const timeLeft = expiryDate - now;
                    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
                    
                    if (daysLeft > 0) {
                        listMessage += `   Sisa: ${daysLeft} hari\n`;
                    } else {
                        listMessage += `   Status: Expired\n`;
                    }
                }
                
                listMessage += '\n';
            }
            
            if (groupEntries.length > 15) {
                listMessage += `... dan ${groupEntries.length - 15} grup lainnya\n\n`;
            }
            
            listMessage += `**Total:** ${groupEntries.length} grup\n\n`;
            listMessage += '**Cara Menggunakan:**\n';
            listMessage += '• `!groups <nomor>` - Lihat detail grup\n';
            listMessage += '• `!groups <nomor> enable` - Aktifkan bot\n';
            listMessage += '• `!groups <nomor> disable` - Nonaktifkan bot\n';
            listMessage += '• `!groups <nomor> sewa 30d` - Aktifkan sewa\n';
            listMessage += '• `!groups <nomor> rentoff` - Nonaktifkan sewa\n\n';
            listMessage += '**Legend:**\n';
            listMessage += '✅ = Bot Aktif | ❌ = Bot Nonaktif\n';
            listMessage += '🆓 = Mode Normal | 🔄 = Sewa Aktif | ⏰ = Sewa Expired';
            
            await message.reply(listMessage);
            return;
        }
        
        // Validate group number
        if (groupNumber < 1 || groupNumber > groupEntries.length) {
            await message.reply(`❌ Nomor grup tidak valid. Gunakan nomor 1-${groupEntries.length}.`);
            return;
        }
        
        const [groupId, settings] = groupEntries[groupNumber - 1];
        
        // Get group name
        let groupName = 'Unknown Group';
        try {
            const chats = await client.getChats();
            const chat = chats.find(c => c.id._serialized === groupId);
            if (chat) {
                groupName = chat.name;
            }
        } catch (error) {
            console.error('Error getting group name:', error);
        }
        
        // If no action specified, show group details
        if (!action) {
            const rentStatus = getRentStatus(groupId);
            
            let statusMessage = `📊 *Detail Grup ${groupNumber}*\n\n`;
            statusMessage += `**Nama:** ${groupName}\n`;
            statusMessage += `**Bot Status:** ${settings.botEnabled !== false ? '✅ Aktif' : '❌ Nonaktif'}\n`;
            
            if (settings.rentMode) {
                statusMessage += `**Mode:** 🔄 Sewa\n`;
                statusMessage += `**Sewa Status:** ${rentStatus.isActive ? '✅ Aktif' : '❌ Expired'}\n`;
                
                if (settings.rentExpiry) {
                    const expiryDate = new Date(settings.rentExpiry);
                    statusMessage += `**Expired:** ${expiryDate.toLocaleDateString('id-ID')} ${expiryDate.toLocaleTimeString('id-ID')}\n`;
                    
                    if (rentStatus.isActive) {
                        const now = new Date();
                        const timeLeft = expiryDate - now;
                        const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
                        statusMessage += `**Sisa:** ${daysLeft} hari\n`;
                    }
                }
                
                if (settings.rentOwner) {
                    statusMessage += `**Owner:** ${settings.rentOwner.name} (${settings.rentOwner.number})\n`;
                }
            } else {
                statusMessage += `**Mode:** 🆓 Normal\n`;
            }
            
            statusMessage += `\n**Hell Notifications:** ${settings.hellNotifications || 'all'}\n\n`;
            
            statusMessage += '**Actions:**\n';
            statusMessage += `• \`!groups ${groupNumber} enable\` - Aktifkan bot\n`;
            statusMessage += `• \`!groups ${groupNumber} disable\` - Nonaktifkan bot\n`;
            statusMessage += `• \`!groups ${groupNumber} sewa 30d\` - Aktifkan sewa\n`;
            statusMessage += `• \`!groups ${groupNumber} rentoff\` - Nonaktifkan sewa`;
            
            await message.reply(statusMessage);
            return;
        }
        
        // Handle actions
        if (action === 'enable') {
            const success = setBotEnabled(groupId, true);
            
            if (success) {
                await message.reply(
                    `✅ *Bot Diaktifkan*\n\n` +
                    `**Grup ${groupNumber}:** ${groupName}\n\n` +
                    '🚀 Bot akan merespons command di grup ini.'
                );
                console.log(`BOT_OWNER enabled bot in group: ${groupName} (${groupId})`);
            } else {
                await message.reply(`❌ Gagal mengaktifkan bot di grup ${groupNumber}.`);
            }
            return;
        }
        
        if (action === 'disable') {
            const success = setBotEnabled(groupId, false);
            
            if (success) {
                await message.reply(
                    `❌ *Bot Dinonaktifkan*\n\n` +
                    `**Grup ${groupNumber}:** ${groupName}\n\n` +
                    '🔒 Bot tidak akan merespons command di grup ini.'
                );
                console.log(`BOT_OWNER disabled bot in group: ${groupName} (${groupId})`);
            } else {
                await message.reply(`❌ Gagal menonaktifkan bot di grup ${groupNumber}.`);
            }
            return;
        }
        
        if (action === 'rentoff') {
            const success = setRentMode(groupId, false);
            
            if (success) {
                await message.reply(
                    `✅ *Mode Sewa Dinonaktifkan*\n\n` +
                    `**Grup ${groupNumber}:** ${groupName}\n\n` +
                    '🔄 Bot kembali ke mode normal.'
                );
                console.log(`BOT_OWNER disabled rent mode in group: ${groupName} (${groupId})`);
            } else {
                await message.reply(`❌ Gagal menonaktifkan mode sewa di grup ${groupNumber}.`);
            }
            return;
        }
        
        if (action === 'sewa') {
            if (!duration) {
                await message.reply(
                    '❌ *Durasi sewa diperlukan*\n\n' +
                    '**Format:**\n' +
                    '`!groups <nomor> sewa <durasi>`\n\n' +
                    '**Contoh:**\n' +
                    '• `!groups 1 sewa 30d` - 30 hari\n' +
                    '• `!groups 1 sewa 08072025` - sampai 8 Juli 2025'
                );
                return;
            }
            
            // Parse duration
            let expiryDate;
            
            if (duration.endsWith('d')) {
                const days = parseInt(duration.replace('d', ''));
                if (isNaN(days) || days <= 0) {
                    await message.reply('❌ Format durasi tidak valid. Contoh: `30d` untuk 30 hari.');
                    return;
                }
                
                expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + days);
            } else if (duration.length === 8 && /^\d{8}$/.test(duration)) {
                const day = parseInt(duration.substring(0, 2));
                const month = parseInt(duration.substring(2, 4)) - 1;
                const year = parseInt(duration.substring(4, 8));
                
                expiryDate = new Date(year, month, day, 23, 59, 59);
                
                if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
                    await message.reply('❌ Tanggal tidak valid atau sudah lewat. Format: DDMMYYYY');
                    return;
                }
            } else {
                await message.reply(
                    '❌ *Format durasi tidak valid*\n\n' +
                    '**Format yang benar:**\n' +
                    '• `30d` - 30 hari dari sekarang\n' +
                    '• `08072025` - Tanggal 8 Juli 2025'
                );
                return;
            }
            
            const success = setRentMode(groupId, true, expiryDate);
            
            if (success) {
                const now = new Date();
                const timeLeft = expiryDate - now;
                const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
                
                await message.reply(
                    `✅ *Mode Sewa Diaktifkan*\n\n` +
                    `**Grup ${groupNumber}:** ${groupName}\n` +
                    `**Durasi:** ${daysLeft} hari\n` +
                    `**Expired:** ${expiryDate.toLocaleDateString('id-ID')}\n\n` +
                    '🔄 Bot sekarang dalam mode sewa.'
                );
                console.log(`BOT_OWNER enabled rent mode in group: ${groupName} (${groupId}) until ${expiryDate}`);
            } else {
                await message.reply(`❌ Gagal mengaktifkan mode sewa di grup ${groupNumber}.`);
            }
            return;
        }
        
        // Unknown action
        await message.reply(
            `❌ *Action tidak dikenal: ${action}*\n\n` +
            'Actions yang tersedia: enable, disable, sewa, rentoff'
        );
        
    } catch (error) {
        console.error('Error in groups command:', error);
        await message.reply('❌ Terjadi error saat memproses command groups.');
    }
};
