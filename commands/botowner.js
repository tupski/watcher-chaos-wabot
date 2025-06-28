const { getChatInfo } = require('../utils/chatUtils');
const { isBotOwner, setBotEnabled, getAllGroupsSettings } = require('../utils/groupSettings');

/**
 * Command khusus untuk BOT_OWNER
 * Usage: 
 * - !botowner disable <groupId> (nonaktifkan bot di grup tertentu)
 * - !botowner enable <groupId> (aktifkan bot di grup tertentu)
 * - !botowner list (lihat semua grup)
 * - !botowner status <groupId> (cek status grup)
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
        const args = message.body.split(' ').slice(1); // Remove !botowner
        const action = args[0] ? args[0].toLowerCase() : null;
        const groupId = args[1];
        
        if (!action) {
            const helpMessage = 
                '🤖 *BOT_OWNER Commands*\n\n' +
                '**Available Commands:**\n' +
                '• `!botowner list` - Lihat semua grup\n' +
                '• `!botowner status <groupId>` - Cek status grup\n' +
                '• `!botowner disable <groupId>` - Nonaktifkan bot\n' +
                '• `!botowner enable <groupId>` - Aktifkan bot\n' +
                '• `!botowner rentoff <groupId>` - Nonaktifkan mode sewa\n\n' +
                '**Format Group ID:**\n' +
                'Gunakan ID lengkap: `120363364063161357@g.us`\n' +
                'Atau gunakan nomor saja: `120363364063161357`\n\n' +
                '**Contoh:**\n' +
                '`!botowner disable 120363364063161357`\n' +
                '`!botowner status 120363364063161357@g.us`';
            
            await message.reply(helpMessage);
            return;
        }
        
        // Handle list command
        if (action === 'list') {
            const allGroups = getAllGroupsSettings();
            
            if (Object.keys(allGroups).length === 0) {
                await message.reply('📋 *Daftar Grup: Kosong*\n\nBelum ada grup yang terdaftar.');
                return;
            }
            
            let listMessage = '📋 *Daftar Semua Grup*\n\n';
            let groupCount = 0;
            
            for (const [groupId, settings] of Object.entries(allGroups)) {
                groupCount++;
                
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
                
                const botStatus = settings.botEnabled !== false ? '✅ Aktif' : '❌ Nonaktif';

                listMessage += `**${groupCount}. ${groupName}**\n`;
                listMessage += `   • ID: \`${groupId.replace('@g.us', '')}\`\n`;
                listMessage += `   • Bot: ${botStatus}\n`;
                listMessage += `   • Mode: 🆓 Gratis\n`;
                
                listMessage += '\n';
                
                // Limit to prevent message too long
                if (groupCount >= 10) {
                    listMessage += `... dan ${Object.keys(allGroups).length - 10} grup lainnya\n`;
                    break;
                }
            }
            
            listMessage += `**Total:** ${Object.keys(allGroups).length} grup`;
            
            await message.reply(listMessage);
            return;
        }
        
        // Commands that require groupId
        if (!groupId) {
            await message.reply(
                '❌ *Group ID diperlukan*\n\n' +
                '**Format:**\n' +
                '`!botowner ' + action + ' <groupId>`\n\n' +
                '**Contoh:**\n' +
                '`!botowner ' + action + ' 120363364063161357`\n\n' +
                'Gunakan `!botowner list` untuk melihat semua grup.'
            );
            return;
        }
        
        // Normalize group ID
        const normalizedGroupId = groupId.includes('@g.us') ? groupId : groupId + '@g.us';
        
        // Handle status command
        if (action === 'status') {
            const settings = getAllGroupsSettings()[normalizedGroupId];

            if (!settings) {
                await message.reply(`❌ Grup dengan ID \`${groupId}\` tidak ditemukan.`);
                return;
            }

            // Get group name
            let groupName = 'Unknown Group';
            try {
                const chats = await client.getChats();
                const chat = chats.find(c => c.id._serialized === normalizedGroupId);
                if (chat) {
                    groupName = chat.name;
                }
            } catch (error) {
                console.error('Error getting group name:', error);
            }

            let statusMessage = `📊 *Status Grup: ${groupName}*\n\n`;
            statusMessage += `**Group ID:** \`${groupId}\`\n`;
            statusMessage += `**Bot Status:** ${settings.botEnabled !== false ? '✅ Aktif' : '❌ Nonaktif'}\n`;
            statusMessage += `**Mode:** 🆓 Gratis\n`;
            statusMessage += `\n**Hell Notifications:** ${settings.hellNotifications || 'all'}\n`;

            await message.reply(statusMessage);
            return;
        }
        
        // Handle disable command
        if (action === 'disable') {
            const success = setBotEnabled(normalizedGroupId, false);
            
            if (success) {
                // Get group name
                let groupName = 'Unknown Group';
                try {
                    const chats = await client.getChats();
                    const chat = chats.find(c => c.id._serialized === normalizedGroupId);
                    if (chat) {
                        groupName = chat.name;
                    }
                } catch (error) {
                    console.error('Error getting group name:', error);
                }
                
                await message.reply(
                    `✅ *Bot Berhasil Dinonaktifkan*\n\n` +
                    `**Grup:** ${groupName}\n` +
                    `**Group ID:** \`${groupId}\`\n\n` +
                    '❌ Bot tidak akan merespons command di grup ini.\n' +
                    'Gunakan `!botowner enable ${groupId}` untuk mengaktifkan kembali.'
                );
                
                console.log(`BOT_OWNER disabled bot in group: ${groupName} (${normalizedGroupId})`);
            } else {
                await message.reply(`❌ Gagal menonaktifkan bot di grup \`${groupId}\`.`);
            }
            return;
        }
        
        // Handle enable command
        if (action === 'enable') {
            const success = setBotEnabled(normalizedGroupId, true);
            
            if (success) {
                // Get group name
                let groupName = 'Unknown Group';
                try {
                    const chats = await client.getChats();
                    const chat = chats.find(c => c.id._serialized === normalizedGroupId);
                    if (chat) {
                        groupName = chat.name;
                    }
                } catch (error) {
                    console.error('Error getting group name:', error);
                }
                
                await message.reply(
                    `✅ *Bot Berhasil Diaktifkan*\n\n` +
                    `**Grup:** ${groupName}\n` +
                    `**Group ID:** \`${groupId}\`\n\n` +
                    '🚀 Bot akan merespons command di grup ini.\n' +
                    'Semua fitur telah aktif kembali.'
                );
                
                console.log(`BOT_OWNER enabled bot in group: ${groupName} (${normalizedGroupId})`);
            } else {
                await message.reply(`❌ Gagal mengaktifkan bot di grup \`${groupId}\`.`);
            }
            return;
        }
        

        
        // Unknown action
        await message.reply(
            `❌ *Action tidak dikenal: ${action}*\n\n` +
            'Gunakan `!botowner` untuk melihat daftar command yang tersedia.'
        );
        
    } catch (error) {
        console.error('Error in botowner command:', error);
        await message.reply('❌ Terjadi error saat memproses command BOT_OWNER.');
    }
};
