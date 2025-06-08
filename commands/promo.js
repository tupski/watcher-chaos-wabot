const { getChatInfo } = require('../utils/chatUtils');
const { isBotOwner } = require('../utils/groupSettings');
const { setPromo, disablePromo, getPromoSettings, getPromoInfo } = require('../utils/promoSettings');
const { PRICING } = require('../utils/midtransPayment');

/**
 * Command untuk mengatur promo (BOT_OWNER only, private message only)
 * Usage: 
 * - !promo <durasi> <harga> - Set promo
 * - !promo off - Disable promo
 * - !promo status - Cek status promo
 */
module.exports = async (client, message) => {
    try {
        const chatInfo = await getChatInfo(client, message);
        const args = message.body.split(' ');
        
        // Check if this is a private message (not group)
        if (chatInfo.isGroup) {
            await message.reply(
                '❌ *Command Tidak Tersedia di Grup*\n\n' +
                'Command `!promo` hanya bisa digunakan di pesan pribadi.\n\n' +
                '📱 *Cara menggunakan:*\n' +
                '1. Kirim pesan pribadi ke bot\n' +
                '2. Ketik `!promo <durasi> <harga>`\n' +
                '3. Bot akan mengatur promo'
            );
            return;
        }
        
        // Check if user is bot owner
        if (!isBotOwner(chatInfo.contact)) {
            await message.reply(
                '❌ *Akses Ditolak*\n\n' +
                'Hanya BOT_OWNER yang dapat mengatur promo.\n\n' +
                '**Info:**\n' +
                '• Command ini memerlukan akses BOT_OWNER\n' +
                '• Promo hanya bisa diatur oleh owner bot\n' +
                '• Hubungi administrator bot untuk akses'
            );
            return;
        }
        
        const action = args[1];
        
        if (!action) {
            await message.reply(
                '❌ *Parameter Tidak Lengkap*\n\n' +
                '**Cara penggunaan:**\n' +
                '• `!promo <durasi> <harga>` - Set promo\n' +
                '• `!promo off` - Disable promo\n' +
                '• `!promo status` - Cek status promo\n\n' +
                '**Contoh:**\n' +
                '• `!promo 30 30000` - Promo 30 hari Rp 30,000\n' +
                '• `!promo 7 8000` - Promo 7 hari Rp 8,000\n' +
                '• `!promo off` - Matikan promo\n\n' +
                '**Paket yang tersedia:**\n' +
                Object.entries(PRICING).map(([days, info]) => 
                    `• ${info.name}: Rp ${info.price.toLocaleString('id-ID')}`
                ).join('\n')
            );
            return;
        }
        
        // Handle status command
        if (action.toLowerCase() === 'status') {
            const promoInfo = getPromoInfo();
            
            if (!promoInfo) {
                await message.reply(
                    '📊 *Status Promo*\n\n' +
                    '❌ **Tidak ada promo aktif**\n\n' +
                    '**Untuk mengaktifkan promo:**\n' +
                    '`!promo <durasi> <harga>`\n\n' +
                    '**Contoh:**\n' +
                    '`!promo 30 30000`'
                );
            } else {
                await message.reply(
                    '📊 *Status Promo*\n\n' +
                    '✅ **Promo Aktif**\n\n' +
                    `**Detail:**\n` +
                    `• Durasi: ${promoInfo.duration} hari\n` +
                    `• Harga Normal: Rp ${promoInfo.originalPrice.toLocaleString('id-ID')}\n` +
                    `• Harga Promo: Rp ${promoInfo.promoPrice.toLocaleString('id-ID')}\n` +
                    `• Hemat: Rp ${promoInfo.savings.toLocaleString('id-ID')} (${promoInfo.discountPercent}%)\n` +
                    `• Dibuat: ${new Date(promoInfo.createdAt).toLocaleDateString('id-ID')} ${new Date(promoInfo.createdAt).toLocaleTimeString('id-ID')}\n` +
                    `• Oleh: ${promoInfo.createdBy}\n\n` +
                    '**Command untuk customer:**\n' +
                    '`!rent pay promo`\n\n' +
                    '**Untuk menonaktifkan:**\n' +
                    '`!promo off`'
                );
            }
            return;
        }
        
        // Handle disable command
        if (action.toLowerCase() === 'off' || action.toLowerCase() === 'disable') {
            const result = disablePromo(chatInfo.contact.pushname || chatInfo.contact.number);
            
            if (result.success) {
                await message.reply(
                    '✅ *Promo Berhasil Dinonaktifkan*\n\n' +
                    '**Status:**\n' +
                    '• Promo tidak lagi aktif\n' +
                    '• Harga kembali normal\n' +
                    '• Command `!rent pay promo` tidak tersedia\n\n' +
                    '**Untuk mengaktifkan promo baru:**\n' +
                    '`!promo <durasi> <harga>`'
                );
            } else {
                await message.reply(
                    '❌ *Gagal Menonaktifkan Promo*\n\n' +
                    `**Error:** ${result.error}\n\n` +
                    'Silakan coba lagi atau periksa log sistem.'
                );
            }
            return;
        }
        
        // Handle set promo command
        const duration = parseInt(action);
        const price = parseInt(args[2]);
        
        if (isNaN(duration) || duration <= 0) {
            await message.reply(
                '❌ *Durasi Tidak Valid*\n\n' +
                'Durasi harus berupa angka positif.\n\n' +
                '**Paket yang tersedia:**\n' +
                Object.entries(PRICING).map(([days, info]) => 
                    `• ${days} hari (${info.name}): Rp ${info.price.toLocaleString('id-ID')}`
                ).join('\n')
            );
            return;
        }
        
        if (isNaN(price) || price <= 0) {
            await message.reply(
                '❌ *Harga Tidak Valid*\n\n' +
                'Harga harus berupa angka positif.\n\n' +
                '**Contoh:**\n' +
                '`!promo 30 30000` - Promo 30 hari Rp 30,000'
            );
            return;
        }
        
        // Check if duration exists in pricing
        if (!PRICING[duration.toString()]) {
            await message.reply(
                '❌ *Durasi Tidak Tersedia*\n\n' +
                'Durasi yang dipilih tidak tersedia dalam paket.\n\n' +
                '**Paket yang tersedia:**\n' +
                Object.entries(PRICING).map(([days, info]) => 
                    `• ${days} hari (${info.name}): Rp ${info.price.toLocaleString('id-ID')}`
                ).join('\n')
            );
            return;
        }
        
        // Set promo
        const result = setPromo(duration, price, chatInfo.contact.pushname || chatInfo.contact.number);
        
        if (result.success) {
            const promo = result.promo;
            const savings = promo.originalPrice - promo.promoPrice;
            const discountPercent = Math.round((savings / promo.originalPrice) * 100);
            
            await message.reply(
                '✅ *Promo Berhasil Diaktifkan*\n\n' +
                `**Detail Promo:**\n` +
                `• Paket: ${PRICING[duration.toString()].name}\n` +
                `• Durasi: ${duration} hari\n` +
                `• Harga Normal: Rp ${promo.originalPrice.toLocaleString('id-ID')}\n` +
                `• Harga Promo: Rp ${promo.promoPrice.toLocaleString('id-ID')}\n` +
                `• Hemat: Rp ${savings.toLocaleString('id-ID')} (${discountPercent}%)\n\n` +
                '**Status:**\n' +
                '• Promo sekarang aktif\n' +
                '• Customer bisa gunakan `!rent pay promo`\n' +
                '• Promo akan muncul di pesan bot nonaktif\n\n' +
                '**Management:**\n' +
                '• `!promo status` - Cek status\n' +
                '• `!promo off` - Nonaktifkan promo\n\n' +
                '🎉 *Promo siap digunakan customer!*'
            );
            
            console.log(`Promo activated: ${duration} days - Rp ${price} (was Rp ${promo.originalPrice}) by ${chatInfo.contact.pushname || chatInfo.contact.number}`);
            
        } else {
            await message.reply(
                '❌ *Gagal Mengaktifkan Promo*\n\n' +
                `**Error:** ${result.error}\n\n` +
                '**Kemungkinan penyebab:**\n' +
                '• Harga promo >= harga normal\n' +
                '• Durasi tidak valid\n' +
                '• Error sistem file\n\n' +
                'Silakan periksa parameter dan coba lagi.'
            );
        }
        
    } catch (error) {
        console.error('Error in promo command:', error);
        await message.reply('Terjadi error saat memproses command promo.');
    }
};
