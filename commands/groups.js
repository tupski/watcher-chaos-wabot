const { getChatInfo } = require('../utils/chatUtils');
const { isBotOwner, getAllGroupsSettings, setBotEnabled } = require('../utils/groupSettings');

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

                listMessage += `**${groupNum}.** ${groupName}\n`;
                listMessage += `   Bot: ${botStatus} | Mode: 🆓 Gratis\n`;
                
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
            statusMessage += `**Mode:** 🆓 Gratis\n`;

            statusMessage += `\n**Hell Notifications:** ${settings.hellNotifications || 'all'}\n\n`;

            statusMessage += '**Actions:**\n';
            statusMessage += `• \`!groups ${groupNumber} enable\` - Aktifkan bot\n`;
            statusMessage += `• \`!groups ${groupNumber} disable\` - Nonaktifkan bot`;
            
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
        // Unknown action
        await message.reply(
            `❌ *Action tidak dikenal: ${action}*\n\n` +
            'Actions yang tersedia: enable, disable'
        );
        
    } catch (error) {
        console.error('Error in groups command:', error);
        await message.reply('❌ Terjadi error saat memproses command groups.');
    }
};
