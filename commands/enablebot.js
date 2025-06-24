const { getChatInfo } = require('../utils/chatUtils');
const { setBotEnabled, isBotOwner } = require('../utils/groupSettings');

/**
 * Command untuk mengaktifkan bot di grup
 * Hanya BOT_OWNER yang bisa menggunakan command ini
 * Usage: !enablebot
 */
module.exports = async (client, message) => {
    try {
        const chatInfo = await getChatInfo(client, message);
        
        if (!chatInfo.isGroup) {
            await message.reply('Command ini hanya bisa digunakan di grup.');
            return;
        }
        
        // Check if user is bot owner
        if (!isBotOwner(chatInfo.contact)) {
            await message.reply(
                '❌ *Akses Ditolak*\n\n' +
                'Hanya BOT_OWNER yang dapat mengaktifkan/menonaktifkan bot.\n\n' +
                '**Info:**\n' +
                '• Command ini memerlukan akses BOT_OWNER\n' +
                '• Admin grup biasa tidak dapat menggunakan command ini\n' +
                '• Hubungi owner bot untuk mengaktifkan bot di grup ini'
            );
            return;
        }
        
        const groupId = chatInfo.chat.id._serialized;
        const success = setBotEnabled(groupId, true);
        
        if (success) {
            await message.reply(
                '✅ *Bot Berhasil Diaktifkan*\n\n' +
                `**Grup:** ${chatInfo.chat.name}\n` +
                `**Diaktifkan oleh:** ${chatInfo.contact.pushname || chatInfo.contact.number}\n\n` +
                '**Bot sekarang akan:**\n' +
                '• Merespon semua command yang diizinkan\n' +
                '• Mengirim notifikasi Hell Event otomatis\n' +
                '• Mengirim notifikasi Monster Rotation harian\n' +
                '• Memproses semua fitur bot\n\n' +
                '**Command yang tersedia:**\n' +
                '• `!permission` - Lihat semua permission\n' +
                '• `!help` - Bantuan command\n' +
                '• `!disablebot` - Nonaktifkan bot (BOT_OWNER only)'
            );
            
            console.log(`Bot enabled in group: ${chatInfo.chat.name} (${groupId}) by ${chatInfo.contact.pushname || chatInfo.contact.number}`);
        } else {
            await message.reply('❌ Gagal mengaktifkan bot. Silakan coba lagi.');
        }
        
    } catch (error) {
        console.error('Error in enablebot command:', error);
        await message.reply('Terjadi error saat mengaktifkan bot.');
    }
};
