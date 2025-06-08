const { getChatInfo } = require('../utils/chatUtils');
const { setBotEnabled, isBotOwner } = require('../utils/groupSettings');

/**
 * Command untuk menonaktifkan bot di grup
 * Hanya BOT_OWNER yang bisa menggunakan command ini
 * Usage: !disablebot
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
                '• Hubungi owner bot jika ingin menonaktifkan bot'
            );
            return;
        }
        
        const groupId = chatInfo.chat.id._serialized;
        const success = setBotEnabled(groupId, false);
        
        if (success) {
            await message.reply(
                '🔴 *Bot Berhasil Dinonaktifkan*\n\n' +
                `**Grup:** ${chatInfo.chat.name}\n` +
                `**Dinonaktifkan oleh:** ${chatInfo.contact.pushname || chatInfo.contact.number}\n\n` +
                '**Bot sekarang akan:**\n' +
                '• Mengabaikan semua command (kecuali !enablebot)\n' +
                '• Tidak mengirim notifikasi Hell Event\n' +
                '• Tidak mengirim notifikasi Monster Rotation\n' +
                '• Tidak memproses fitur bot lainnya\n\n' +
                '**Untuk mengaktifkan kembali:**\n' +
                '• Gunakan `!enablebot` (BOT_OWNER only)\n' +
                '• Atau hubungi owner bot\n\n' +
                '**Catatan:** Setting grup tetap tersimpan dan akan aktif kembali saat bot diaktifkan.'
            );
            
            console.log(`Bot disabled in group: ${chatInfo.chat.name} (${groupId}) by ${chatInfo.contact.pushname || chatInfo.contact.number}`);
        } else {
            await message.reply('❌ Gagal menonaktifkan bot. Silakan coba lagi.');
        }
        
    } catch (error) {
        console.error('Error in disablebot command:', error);
        await message.reply('Terjadi error saat menonaktifkan bot.');
    }
};
