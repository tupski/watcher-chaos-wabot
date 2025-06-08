const { getChatInfo } = require('../utils/chatUtils');
const { setRentMode, isBotOwner, getGroupSettings } = require('../utils/groupSettings');

/**
 * Command untuk aktivasi manual bot di grup (BOT_OWNER only)
 * Usage: !activate [groupId] [days] [price] [ownerName] [ownerNumber]
 */
module.exports = async (client, message) => {
    try {
        const chatInfo = await getChatInfo(client, message);
        const args = message.body.split(' ');
        
        // Check if user is bot owner
        if (!isBotOwner(chatInfo.contact)) {
            await message.reply(
                '❌ *Akses Ditolak*\n\n' +
                'Hanya BOT_OWNER yang dapat menggunakan command ini.\n\n' +
                '**Info:**\n' +
                '• Command ini memerlukan akses BOT_OWNER\n' +
                '• Gunakan `!rent pay` untuk pembayaran otomatis\n' +
                '• Hubungi owner bot untuk aktivasi manual'
            );
            return;
        }
        
        if (args.length < 6) {
            await message.reply(
                '❌ *Parameter Tidak Lengkap*\n\n' +
                '**Format:**\n' +
                '`!activate [groupId] [days] [price] [ownerName] [ownerNumber]`\n\n' +
                '**Contoh:**\n' +
                '`!activate 1234567890@g.us 30 50000 "John Doe" 081234567890`\n\n' +
                '**Parameter:**\n' +
                '• groupId: ID grup WhatsApp\n' +
                '• days: Durasi dalam hari\n' +
                '• price: Harga yang dibayar (Rupiah)\n' +
                '• ownerName: Nama penyewa (gunakan tanda kutip jika ada spasi)\n' +
                '• ownerNumber: Nomor WhatsApp penyewa\n\n' +
                'Gunakan `!grouprent` untuk melihat daftar grup.'
            );
            return;
        }
        
        const groupId = args[1];
        const days = parseInt(args[2]);
        const price = parseInt(args[3]);
        const ownerName = args[4].replace(/"/g, ''); // Remove quotes
        const ownerNumber = args[5];
        
        // Validate parameters
        if (isNaN(days) || days <= 0) {
            await message.reply('❌ Durasi hari tidak valid. Harus berupa angka positif.');
            return;
        }
        
        if (isNaN(price) || price < 0) {
            await message.reply('❌ Harga tidak valid. Harus berupa angka (0 atau lebih).');
            return;
        }
        
        if (!groupId.includes('@g.us')) {
            await message.reply('❌ Format Group ID tidak valid. Harus berakhiran @g.us');
            return;
        }
        
        // Check if group exists
        try {
            const targetChat = await client.getChatById(groupId);
            if (!targetChat) {
                await message.reply('❌ Grup tidak ditemukan. Pastikan bot sudah bergabung dengan grup tersebut.');
                return;
            }
        } catch (error) {
            await message.reply('❌ Grup tidak ditemukan atau bot belum bergabung dengan grup tersebut.');
            return;
        }
        
        // Calculate expiry date
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);
        expiryDate.setHours(23, 59, 59, 999); // End of day
        
        // Create owner info
        const ownerInfo = {
            name: ownerName,
            number: ownerNumber,
            id: `manual_${ownerNumber}@manual.activation`
        };
        
        // Generate payment ID
        const paymentId = `MANUAL_${groupId.replace('@g.us', '')}_${Date.now()}`;
        
        // Activate rent mode
        const success = setRentMode(
            groupId,
            true,
            expiryDate,
            ownerInfo,
            days,
            price,
            paymentId
        );
        
        if (success) {
            // Send confirmation to the group
            try {
                const targetChat = await client.getChatById(groupId);
                const confirmationMessage = 
                    '✅ *Bot Berhasil Diaktifkan!*\n\n' +
                    `**Detail Aktivasi:**\n` +
                    `• Grup: ${targetChat.name}\n` +
                    `• Durasi: ${days} hari\n` +
                    `• Kadaluarsa: ${expiryDate.toLocaleDateString('id-ID')} ${expiryDate.toLocaleTimeString('id-ID')}\n` +
                    `• Penyewa: ${ownerName}\n` +
                    `• Kontak: ${ownerNumber}\n` +
                    `• Harga: Rp ${price.toLocaleString('id-ID')}\n` +
                    `• Payment ID: ${paymentId}\n\n` +
                    '🎮 *Fitur yang Aktif:*\n' +
                    '• Notifikasi Hell Event otomatis\n' +
                    '• Info Monster Rotation harian\n' +
                    '• AI Assistant\n' +
                    '• Tag All Members\n' +
                    '• Anti-spam Protection\n' +
                    '• Semua command tersedia\n\n' +
                    '📱 *Support:* 0822-1121-9993 (Angga)\n\n' +
                    'Terima kasih telah menggunakan Bot Lords Mobile! 🎮✨';
                
                await targetChat.sendMessage(confirmationMessage);
                
                // Send success message to BOT_OWNER
                await message.reply(
                    '✅ *Aktivasi Manual Berhasil*\n\n' +
                    `**Detail:**\n` +
                    `• Grup: ${targetChat.name}\n` +
                    `• Group ID: ${groupId}\n` +
                    `• Durasi: ${days} hari\n` +
                    `• Harga: Rp ${price.toLocaleString('id-ID')}\n` +
                    `• Penyewa: ${ownerName} (${ownerNumber})\n` +
                    `• Kadaluarsa: ${expiryDate.toLocaleDateString('id-ID')} ${expiryDate.toLocaleTimeString('id-ID')}\n` +
                    `• Payment ID: ${paymentId}\n\n` +
                    '📋 *Status:*\n' +
                    '• Bot aktif di grup\n' +
                    '• Konfirmasi dikirim ke grup\n' +
                    '• Semua fitur tersedia\n\n' +
                    '⏰ *Reminder:*\n' +
                    'Notifikasi perpanjangan otomatis 3 hari sebelum kadaluarsa.'
                );
                
                console.log(`Manual activation successful for group: ${targetChat.name} (${groupId}) by ${ownerName} - ${days} days - Rp ${price}`);
                
            } catch (chatError) {
                console.error('Error sending confirmation to group:', chatError);
                await message.reply(
                    '⚠️ *Aktivasi Berhasil dengan Peringatan*\n\n' +
                    'Bot berhasil diaktifkan, tetapi gagal mengirim konfirmasi ke grup.\n\n' +
                    '**Detail:**\n' +
                    `• Group ID: ${groupId}\n` +
                    `• Durasi: ${days} hari\n` +
                    `• Harga: Rp ${price.toLocaleString('id-ID')}\n` +
                    `• Penyewa: ${ownerName} (${ownerNumber})\n\n` +
                    '**Status:** Bot aktif, konfirmasi manual diperlukan.'
                );
            }
            
        } else {
            await message.reply(
                '❌ *Aktivasi Gagal*\n\n' +
                'Terjadi kesalahan saat mengaktifkan bot.\n\n' +
                '**Kemungkinan penyebab:**\n' +
                '• Error sistem file\n' +
                '• Masalah permission\n' +
                '• Data grup tidak valid\n\n' +
                'Silakan coba lagi atau periksa log sistem.'
            );
        }
        
    } catch (error) {
        console.error('Error in activate command:', error);
        await message.reply('Terjadi error saat memproses aktivasi manual.');
    }
};
