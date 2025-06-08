const { getChatInfo } = require('../utils/chatUtils');
const { getExpiredGroups, isBotOwner } = require('../utils/groupSettings');

/**
 * Command untuk mengirim pesan pembayaran ke grup yang expired (BOT_OWNER only)
 * Usage: !sendpayment [groupId] atau !sendpayment all
 */
module.exports = async (client, message) => {
    try {
        const chatInfo = await getChatInfo(client, message);
        const args = message.body.split(' ');
        const target = args[1]; // groupId atau 'all'
        
        // Check if user is bot owner
        if (!isBotOwner(chatInfo.contact)) {
            await message.reply(
                '❌ *Akses Ditolak*\n\n' +
                'Hanya BOT_OWNER yang dapat menggunakan command ini.\n\n' +
                '**Info:**\n' +
                '• Command ini memerlukan akses BOT_OWNER\n' +
                '• Gunakan `!grouprent` untuk melihat daftar grup\n' +
                '• Hubungi owner bot untuk informasi lebih lanjut'
            );
            return;
        }
        
        if (!target) {
            await message.reply(
                '❌ *Parameter Tidak Lengkap*\n\n' +
                '**Cara penggunaan:**\n' +
                '• `!sendpayment all` - Kirim ke semua grup expired\n' +
                '• `!sendpayment [groupId]` - Kirim ke grup tertentu\n\n' +
                '**Contoh:**\n' +
                '• `!sendpayment all`\n' +
                '• `!sendpayment 1234567890@g.us`\n\n' +
                'Gunakan `!grouprent` untuk melihat daftar grup.'
            );
            return;
        }
        
        const expiredGroups = getExpiredGroups();
        
        if (expiredGroups.length === 0) {
            await message.reply(
                '✅ *Tidak Ada Grup Expired*\n\n' +
                'Semua grup masih aktif atau dalam mode normal.\n\n' +
                'Gunakan `!grouprent` untuk melihat status semua grup.'
            );
            return;
        }
        
        const paymentMessage = 
            '💰 *Perpanjang Sewa Bot Lords Mobile*\n\n' +
            '⏰ *Masa sewa bot telah berakhir*\n' +
            'Bot saat ini dalam status NONAKTIF.\n\n' +
            '🔄 *Untuk mengaktifkan kembali:*\n\n' +
            '💳 *Pembayaran Otomatis (Rekomendasi):*\n' +
            '• Ketik `!rent pay 1` - 1 hari (Rp 2,000)\n' +
            '• Ketik `!rent pay 7` - 1 minggu (Rp 12,000)\n' +
            '• Ketik `!rent pay 30` - 1 bulan (Rp 50,000)\n' +
            '• Ketik `!rent pay 180` - 6 bulan (Rp 500,000)\n' +
            '• Ketik `!rent pay 365` - 1 tahun (Rp 950,000)\n\n' +
            '⚡ *Aktivasi instan setelah pembayaran!*\n\n' +
            '🏦 *Pembayaran Manual:*\n' +
            '• Ketik `!rent manual` untuk info rekening\n' +
            '• Transfer + konfirmasi ke WhatsApp\n' +
            '• Aktivasi dalam 1-24 jam\n\n' +
            '📱 *Support & Bantuan:*\n' +
            '• WhatsApp: 0822-1121-9993 (Angga)\n' +
            '• Response time: < 1 jam\n' +
            '• Layanan 24/7\n\n' +
            '🎮 *Fitur yang akan aktif kembali:*\n' +
            '• Notifikasi Hell Event otomatis\n' +
            '• Info Monster Rotation harian\n' +
            '• AI Assistant\n' +
            '• Tag All Members\n' +
            '• Anti-spam Protection\n\n' +
            '💡 *Tips:* Gunakan pembayaran otomatis untuk aktivasi instan!';
        
        let sentCount = 0;
        let failedCount = 0;
        let targetGroups = [];
        
        if (target.toLowerCase() === 'all') {
            targetGroups = expiredGroups;
        } else {
            // Find specific group
            const specificGroup = expiredGroups.find(g => g.groupId === target);
            if (specificGroup) {
                targetGroups = [specificGroup];
            } else {
                await message.reply(
                    '❌ *Grup Tidak Ditemukan*\n\n' +
                    `Grup dengan ID "${target}" tidak ditemukan dalam daftar expired.\n\n` +
                    '**Kemungkinan penyebab:**\n' +
                    '• Grup tidak expired\n' +
                    '• ID grup salah\n' +
                    '• Grup sudah diperpanjang\n\n' +
                    'Gunakan `!grouprent` untuk melihat daftar grup expired.'
                );
                return;
            }
        }
        
        await message.reply(
            `🚀 *Mengirim Pesan Pembayaran*\n\n` +
            `Target: ${targetGroups.length} grup expired\n` +
            `Mohon tunggu...`
        );
        
        // Send payment message to target groups
        for (const group of targetGroups) {
            try {
                const chat = await client.getChatById(group.groupId);
                await chat.sendMessage(paymentMessage);
                sentCount++;
                console.log(`Payment message sent to group: ${group.groupId}`);
                
                // Add small delay to avoid spam
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`Failed to send payment message to group ${group.groupId}:`, error);
                failedCount++;
            }
        }
        
        // Send result summary
        let resultMessage = '📊 *Hasil Pengiriman Pesan Pembayaran*\n\n';
        resultMessage += `✅ *Berhasil:* ${sentCount} grup\n`;
        if (failedCount > 0) {
            resultMessage += `❌ *Gagal:* ${failedCount} grup\n`;
        }
        resultMessage += `📋 *Total Target:* ${targetGroups.length} grup\n\n`;
        
        if (sentCount > 0) {
            resultMessage += '🎯 *Pesan berisi:*\n';
            resultMessage += '• Info pembayaran otomatis\n';
            resultMessage += '• Info pembayaran manual\n';
            resultMessage += '• Kontak support\n';
            resultMessage += '• Daftar fitur yang akan aktif\n\n';
        }
        
        resultMessage += '📱 *Monitoring:*\n';
        resultMessage += 'Pantau pembayaran masuk dan aktivasi manual jika diperlukan.';
        
        await message.reply(resultMessage);
        
    } catch (error) {
        console.error('Error in sendpayment command:', error);
        await message.reply('Terjadi error saat mengirim pesan pembayaran.');
    }
};
