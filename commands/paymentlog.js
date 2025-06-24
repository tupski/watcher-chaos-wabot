const { getChatInfo } = require('../utils/chatUtils');
const { getAllGroupsSettings, isBotOwner } = require('../utils/groupSettings');

/**
 * Command untuk melihat log aktivitas pembayaran (BOT_OWNER only)
 * Usage: !paymentlog [limit]
 */
module.exports = async (client, message) => {
    try {
        const chatInfo = await getChatInfo(client, message);
        const args = message.body.split(' ');
        const limit = parseInt(args[1]) || 20; // Default 20 entries
        
        // Check if user is bot owner
        if (!isBotOwner(chatInfo.contact)) {
            await message.reply(
                '❌ *Akses Ditolak*\n\n' +
                'Hanya BOT_OWNER yang dapat melihat log pembayaran.\n\n' +
                '**Info:**\n' +
                '• Command ini memerlukan akses BOT_OWNER\n' +
                '• Data pembayaran bersifat rahasia\n' +
                '• Hubungi owner bot untuk informasi lebih lanjut'
            );
            return;
        }
        
        if (limit > 50) {
            await message.reply(
                '❌ *Limit Terlalu Besar*\n\n' +
                'Maksimal 50 entri per request.\n\n' +
                '**Cara penggunaan:**\n' +
                '• `!paymentlog` - 20 entri terakhir\n' +
                '• `!paymentlog 10` - 10 entri terakhir\n' +
                '• `!paymentlog 50` - 50 entri terakhir (maksimal)'
            );
            return;
        }
        
        const allSettings = getAllGroupsSettings();
        const paymentEntries = [];
        
        // Collect all payment entries
        for (const [groupId, settings] of Object.entries(allSettings)) {
            if (settings.rentMode && settings.rentActivatedAt) {
                const entry = {
                    groupId,
                    activatedAt: new Date(settings.rentActivatedAt),
                    expiryDate: settings.rentExpiry ? new Date(settings.rentExpiry) : null,
                    owner: settings.rentOwner,
                    duration: settings.rentDuration || 0,
                    price: settings.rentPrice || 0,
                    paymentId: settings.paymentId || 'N/A',
                    isTrial: settings.rentOwner && settings.rentOwner.id === 'trial@trial.com',
                    isActive: settings.rentExpiry ? new Date() < new Date(settings.rentExpiry) : false
                };
                paymentEntries.push(entry);
            }
        }
        
        // Sort by activation date (newest first)
        paymentEntries.sort((a, b) => b.activatedAt - a.activatedAt);
        
        // Limit results
        const limitedEntries = paymentEntries.slice(0, limit);
        
        if (limitedEntries.length === 0) {
            await message.reply(
                '📋 *Log Pembayaran Kosong*\n\n' +
                'Belum ada aktivitas pembayaran yang tercatat.\n\n' +
                '**Kemungkinan penyebab:**\n' +
                '• Belum ada grup yang menggunakan mode sewa\n' +
                '• Data log belum tersedia\n' +
                '• Sistem baru dijalankan\n\n' +
                'Gunakan `!grouprent` untuk melihat status grup.'
            );
            return;
        }
        
        // Build log report
        let logReport = `📋 *Log Aktivitas Pembayaran*\n\n`;
        logReport += `**Menampilkan ${limitedEntries.length} dari ${paymentEntries.length} entri**\n\n`;
        
        limitedEntries.forEach((entry, index) => {
            const statusIcon = entry.isActive ? '🟢' : '🔴';
            const typeIcon = entry.isTrial ? '🆓' : '💰';
            
            logReport += `${index + 1}. ${statusIcon} ${typeIcon} **${entry.groupId.substring(0, 15)}...**\n`;
            
            // Activation info
            logReport += `   📅 Aktivasi: ${entry.activatedAt.toLocaleDateString('id-ID')} ${entry.activatedAt.toLocaleTimeString('id-ID')}\n`;
            
            // Expiry info
            if (entry.expiryDate) {
                logReport += `   ⏰ Kadaluarsa: ${entry.expiryDate.toLocaleDateString('id-ID')} ${entry.expiryDate.toLocaleTimeString('id-ID')}\n`;
            }
            
            // Owner info
            if (entry.owner) {
                if (entry.isTrial) {
                    logReport += `   👤 Status: Trial Gratis\n`;
                } else {
                    logReport += `   👤 Owner: ${entry.owner.name}\n`;
                    logReport += `   📱 Kontak: ${entry.owner.number}\n`;
                }
            }
            
            // Duration and price
            logReport += `   ⏱️ Durasi: ${entry.duration} hari\n`;
            if (!entry.isTrial && entry.price > 0) {
                logReport += `   💵 Harga: Rp ${entry.price.toLocaleString('id-ID')}\n`;
            }
            
            // Payment ID
            if (entry.paymentId && entry.paymentId !== 'N/A') {
                const shortPaymentId = entry.paymentId.length > 20 ? 
                    entry.paymentId.substring(0, 20) + '...' : 
                    entry.paymentId;
                logReport += `   🆔 Payment ID: ${shortPaymentId}\n`;
            }
            
            // Status
            const status = entry.isActive ? 'AKTIF' : 'EXPIRED';
            logReport += `   📊 Status: ${status}\n\n`;
        });
        
        // Summary statistics
        const totalPaid = limitedEntries.filter(e => !e.isTrial).length;
        const totalTrial = limitedEntries.filter(e => e.isTrial).length;
        const totalActive = limitedEntries.filter(e => e.isActive).length;
        const totalRevenue = limitedEntries
            .filter(e => !e.isTrial)
            .reduce((sum, e) => sum + e.price, 0);
        
        logReport += '📊 *Ringkasan (dari entri yang ditampilkan):*\n';
        logReport += `• Total Berbayar: ${totalPaid}\n`;
        logReport += `• Total Trial: ${totalTrial}\n`;
        logReport += `• Masih Aktif: ${totalActive}\n`;
        logReport += `• Total Pendapatan: Rp ${totalRevenue.toLocaleString('id-ID')}\n\n`;
        
        // Recent activity summary
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        
        const todayCount = limitedEntries.filter(e => 
            e.activatedAt.toDateString() === today.toDateString()
        ).length;
        
        const yesterdayCount = limitedEntries.filter(e => 
            e.activatedAt.toDateString() === yesterday.toDateString()
        ).length;
        
        const weekCount = limitedEntries.filter(e => 
            e.activatedAt >= lastWeek
        ).length;
        
        logReport += '📈 *Aktivitas Terkini:*\n';
        logReport += `• Hari ini: ${todayCount} aktivasi\n`;
        logReport += `• Kemarin: ${yesterdayCount} aktivasi\n`;
        logReport += `• 7 hari terakhir: ${weekCount} aktivasi\n\n`;
        
        logReport += '💡 *Tips:*\n';
        logReport += '• Gunakan `!revenue` untuk analisis pendapatan\n';
        logReport += '• Gunakan `!grouprent` untuk status real-time\n';
        logReport += `• Gunakan \`!paymentlog ${Math.min(limit + 10, 50)}\` untuk lebih banyak entri\n\n`;
        
        logReport += `*Generated: ${today.toLocaleDateString('id-ID')} ${today.toLocaleTimeString('id-ID')}*`;
        
        await message.reply(logReport);
        
    } catch (error) {
        console.error('Error in paymentlog command:', error);
        await message.reply('Terjadi error saat mengambil log pembayaran.');
    }
};
