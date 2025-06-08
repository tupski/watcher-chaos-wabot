const { getChatInfo } = require('../utils/chatUtils');
const { getGroupSettings } = require('../utils/groupSettings');

/**
 * Command untuk melihat permission semua command dan pesan otomatis
 * Usage: !permission
 */
module.exports = async (client, message) => {
    try {
        const chatInfo = await getChatInfo(client, message);
        
        if (!chatInfo.isGroup) {
            await message.reply('Command ini hanya bisa digunakan di grup.');
            return;
        }
        
        if (!chatInfo.isUserAdmin) {
            await message.reply('❌ Hanya admin grup yang dapat menggunakan command ini.');
            return;
        }
        
        const groupId = chatInfo.chat.id._serialized;
        const settings = getGroupSettings(groupId);
        
        let permissionInfo = '🔐 *Permission Command & Pesan Otomatis*\n\n';
        
        // Bot Status
        permissionInfo += '**Status Bot:**\n';
        permissionInfo += `• Bot Status: ${settings.botEnabled !== false ? '🟢 Aktif' : '🔴 Nonaktif'}\n\n`;
        
        // Command Permissions
        permissionInfo += '**Permission Command:**\n';
        const commands = [
            { name: 'hell', desc: 'Hell Event settings' },
            { name: 'monster', desc: 'Monster rotation info' },
            { name: 'tagall', desc: 'Tag semua member' },
            { name: 'ping', desc: 'Test bot response' },
            { name: 'ai', desc: 'AI assistant' },
            { name: 'help', desc: 'Bantuan command' },
            { name: 'cmd', desc: 'Ubah permission command' },
            { name: 'debug', desc: 'Diagnostik bot' },
            { name: 'permission', desc: 'Lihat permission (command ini)' }
        ];
        
        commands.forEach(cmd => {
            const permission = settings.commandPermissions[cmd.name] || 'all';
            const icon = permission === 'admin' ? '👑' : '👥';
            const access = permission === 'admin' ? 'Admin Only' : 'Semua Member';
            permissionInfo += `• \`!${cmd.name}\` ${icon} ${access}\n`;
        });
        
        // Hell Event Notifications
        permissionInfo += '\n**Notifikasi Hell Event:**\n';
        const hellStatus = settings.hellNotifications || 'all';
        let hellIcon, hellDesc;
        
        switch (hellStatus) {
            case 'all':
                hellIcon = '🟢';
                hellDesc = 'Semua Hell Event';
                break;
            case 'watcherchaos':
                hellIcon = '🔶';
                hellDesc = 'Hanya Watcher & Chaos Dragon';
                break;
            case 'off':
                hellIcon = '🔴';
                hellDesc = 'Nonaktif';
                break;
            default:
                hellIcon = '🟢';
                hellDesc = 'Semua Hell Event (default)';
        }
        
        permissionInfo += `• Status: ${hellIcon} ${hellDesc}\n\n`;
        
        // Automatic Messages
        permissionInfo += '**Pesan Otomatis yang Dikirim:**\n';
        
        if (settings.botEnabled !== false) {
            // Hell Event Messages
            if (hellStatus !== 'off') {
                permissionInfo += '📢 *Hell Event Notifications:*\n';
                if (hellStatus === 'all') {
                    permissionInfo += '• Semua Hell Event dari Discord\n';
                    permissionInfo += '• Format: "Hell | Reward | Task | Time Left | Power"\n';
                } else if (hellStatus === 'watcherchaos') {
                    permissionInfo += '• Hanya Watcher dan Chaos Dragon events\n';
                    permissionInfo += '• Event lain akan difilter\n';
                }
                permissionInfo += '\n';
            }
            
            // Monster Rotation Messages
            permissionInfo += '📅 *Monster Rotation:*\n';
            permissionInfo += '• Notifikasi harian jam 11:55 WIB\n';
            permissionInfo += '• Rotasi 12 hari dimulai 8 Juni 2025\n';
            permissionInfo += '• Format: "Monster hari ini: [Nama Monster]"\n\n';
            
            // Command Responses
            permissionInfo += '🤖 *Response Command:*\n';
            permissionInfo += '• Semua command yang diizinkan akan direspon\n';
            permissionInfo += '• Error message jika permission tidak cukup\n';
            permissionInfo += '• Help dan status information\n\n';
        } else {
            permissionInfo += '🔴 *Bot Nonaktif:*\n';
            permissionInfo += '• Tidak ada pesan otomatis yang dikirim\n';
            permissionInfo += '• Semua command diabaikan\n';
            permissionInfo += '• Hanya BOT_OWNER yang bisa mengaktifkan kembali\n\n';
        }
        
        // Control Commands
        permissionInfo += '**Command Kontrol Bot:**\n';
        permissionInfo += '• `!enablebot` - Aktifkan bot (BOT_OWNER only)\n';
        permissionInfo += '• `!disablebot` - Nonaktifkan bot (BOT_OWNER only)\n';
        permissionInfo += '• `!cmd <command> <admin/all>` - Ubah permission (Admin)\n';
        permissionInfo += '• `!hell <on/off/watcherchaos>` - Setting notifikasi (Admin)\n\n';
        
        // Footer
        permissionInfo += '**Catatan:**\n';
        permissionInfo += '• Permission berlaku per grup\n';
        permissionInfo += '• BOT_OWNER memiliki akses penuh\n';
        permissionInfo += '• Admin grup dapat mengubah sebagian besar setting\n';
        permissionInfo += '• Setting tersimpan otomatis';
        
        await message.reply(permissionInfo);
        
    } catch (error) {
        console.error('Error in permission command:', error);
        await message.reply('Terjadi error saat mengambil informasi permission.');
    }
};
