const { getChatInfo } = require('../utils/chatUtils');
const { setRentMode, getRentStatus, isBotOwner } = require('../utils/groupSettings');

/**
 * Command untuk mengelola sewa bot
 * Usage: 
 * - !rent DDMMYYYY (set tanggal kadaluarsa)
 * - !rent 30d (set 30 hari dari sekarang)
 * - !rent disable (nonaktifkan sewa)
 * - !rent status (cek status sewa - reply private)
 */
module.exports = async (client, message) => {
    try {
        const chatInfo = await getChatInfo(client, message);
        
        if (!chatInfo.isGroup) {
            await message.reply('Command ini hanya bisa digunakan di grup.');
            return;
        }
        
        // Parse command arguments
        const args = message.body.split(' ').slice(1); // Remove !rent
        const option = args[0] ? args[0].toLowerCase() : null;
        
        const groupId = chatInfo.chat.id._serialized;
        
        // Handle status command (admin can access, reply privately)
        if (option === 'status') {
            if (!chatInfo.isUserAdmin) {
                await message.reply('❌ Hanya admin grup yang dapat melihat status sewa.');
                return;
            }
            
            const rentStatus = getRentStatus(groupId);
            let statusMessage = '📊 *Status Sewa Bot*\n\n';
            
            if (rentStatus.rentMode) {
                if (rentStatus.isActive) {
                    const now = new Date();
                    const timeLeft = rentStatus.rentExpiry - now;
                    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
                    
                    statusMessage += '🟢 *Status:* Aktif (Mode Sewa)\n';
                    statusMessage += `📅 *Masa Aktif:* ${daysLeft} hari lagi\n`;
                    statusMessage += `⏰ *Kadaluarsa:* ${rentStatus.rentExpiry.toLocaleDateString('id-ID')} ${rentStatus.rentExpiry.toLocaleTimeString('id-ID')}\n`;
                    
                    if (rentStatus.rentActivatedAt) {
                        statusMessage += `🚀 *Diaktifkan:* ${rentStatus.rentActivatedAt.toLocaleDateString('id-ID')} ${rentStatus.rentActivatedAt.toLocaleTimeString('id-ID')}\n`;
                    }
                    
                    statusMessage += '\n✅ *Fitur Aktif:*\n';
                    statusMessage += '• Semua command tersedia\n';
                    statusMessage += '• Notifikasi Hell Event otomatis\n';
                    statusMessage += '• Notifikasi Monster Rotation harian\n';
                    statusMessage += '• AI assistant\n';
                    statusMessage += '• Anti-spam protection\n\n';
                    
                    statusMessage += '💡 *Info Perpanjangan:*\n';
                    statusMessage += 'Hubungi owner bot untuk perpanjangan:\n';
                    statusMessage += '📱 0822-1121-9993 (Angga)\n';
                    statusMessage += '💰 Harga: 50rb/bulan';
                    
                } else {
                    statusMessage += '🔴 *Status:* Kadaluarsa\n';
                    statusMessage += `⏰ *Kadaluarsa pada:* ${rentStatus.rentExpiry.toLocaleDateString('id-ID')} ${rentStatus.rentExpiry.toLocaleTimeString('id-ID')}\n\n`;
                    
                    statusMessage += '❌ *Bot Nonaktif*\n';
                    statusMessage += 'Semua fitur bot telah dinonaktifkan.\n\n';
                    
                    statusMessage += '🔄 *Untuk Mengaktifkan Kembali:*\n';
                    statusMessage += 'Hubungi owner bot untuk perpanjangan:\n';
                    statusMessage += '📱 0822-1121-9993 (Angga)\n';
                    statusMessage += '💰 Promo: 50rb/bulan!';
                }
            } else {
                statusMessage += '🟢 *Status:* Aktif (Mode Normal)\n';
                statusMessage += '📝 *Tipe:* Bot permanen (bukan sewa)\n\n';
                
                statusMessage += '✅ *Semua fitur tersedia tanpa batas waktu*\n\n';
                
                statusMessage += '💡 *Info:*\n';
                statusMessage += 'Bot ini tidak dalam mode sewa.\n';
                statusMessage += 'Semua fitur aktif secara permanen.';
            }
            
            // Send private reply to the user
            try {
                await client.sendMessage(chatInfo.contact.id._serialized, statusMessage);
                await message.reply('✅ Status sewa telah dikirim ke pesan pribadi Anda.');
            } catch (error) {
                console.error('Error sending private message:', error);
                await message.reply('❌ Gagal mengirim pesan pribadi. Status sewa:\n\n' + statusMessage);
            }
            
            return;
        }
        
        // Other rent commands require BOT_OWNER access
        if (!isBotOwner(chatInfo.contact)) {
            await message.reply(
                '❌ *Akses Ditolak*\n\n' +
                'Hanya BOT_OWNER yang dapat mengelola sewa bot.\n\n' +
                '**Info:**\n' +
                '• Command ini memerlukan akses BOT_OWNER\n' +
                '• Admin grup hanya bisa menggunakan `!rent status`\n' +
                '• Hubungi owner bot untuk mengatur sewa'
            );
            return;
        }
        
        if (!option) {
            await message.reply(
                '❌ *Format Salah*\n\n' +
                '**Usage:**\n' +
                '• `!rent DDMMYYYY` - Set tanggal kadaluarsa\n' +
                '  Contoh: `!rent 08072025`\n' +
                '• `!rent 30d` - Set 30 hari dari sekarang\n' +
                '• `!rent disable` - Nonaktifkan sewa\n' +
                '• `!rent status` - Cek status (admin only)'
            );
            return;
        }
        
        // Handle disable command
        if (option === 'disable') {
            const success = setRentMode(groupId, false);
            
            if (success) {
                await message.reply(
                    '🔴 *Sewa Bot Dinonaktifkan*\n\n' +
                    `**Grup:** ${chatInfo.chat.name}\n` +
                    `**Dinonaktifkan oleh:** ${chatInfo.contact.pushname || chatInfo.contact.number}\n\n` +
                    '**Status:**\n' +
                    '• Mode sewa dinonaktifkan\n' +
                    '• Bot kembali ke mode normal\n' +
                    '• Semua fitur tetap aktif\n\n' +
                    '**Catatan:** Bot akan tetap aktif dalam mode normal.'
                );
                
                console.log(`Rent disabled in group: ${chatInfo.chat.name} (${groupId}) by ${chatInfo.contact.pushname || chatInfo.contact.number}`);
            } else {
                await message.reply('❌ Gagal menonaktifkan sewa. Silakan coba lagi.');
            }
            return;
        }
        
        // Parse date/duration
        let expiryDate = null;
        
        // Check if it's duration format (e.g., 30d)
        if (option.endsWith('d')) {
            const days = parseInt(option.slice(0, -1));
            if (isNaN(days) || days <= 0) {
                await message.reply('❌ Format hari tidak valid. Contoh: `!rent 30d`');
                return;
            }
            
            expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + days);
            
        } else if (option.length === 8 && /^\d{8}$/.test(option)) {
            // Parse DDMMYYYY format
            const day = parseInt(option.substring(0, 2));
            const month = parseInt(option.substring(2, 4)) - 1; // Month is 0-indexed
            const year = parseInt(option.substring(4, 8));
            
            expiryDate = new Date(year, month, day, 23, 59, 59); // Set to end of day
            
            // Validate date
            if (isNaN(expiryDate.getTime()) || 
                expiryDate.getDate() !== day || 
                expiryDate.getMonth() !== month || 
                expiryDate.getFullYear() !== year) {
                await message.reply('❌ Tanggal tidak valid. Format: DDMMYYYY (contoh: 08072025)');
                return;
            }
            
            // Check if date is in the future
            if (expiryDate <= new Date()) {
                await message.reply('❌ Tanggal harus di masa depan.');
                return;
            }
            
        } else {
            await message.reply(
                '❌ *Format Tidak Valid*\n\n' +
                '**Format yang benar:**\n' +
                '• `!rent DDMMYYYY` - Contoh: `!rent 08072025`\n' +
                '• `!rent 30d` - 30 hari dari sekarang\n' +
                '• `!rent disable` - Nonaktifkan sewa\n' +
                '• `!rent status` - Cek status'
            );
            return;
        }
        
        // Set rent mode
        const success = setRentMode(groupId, true, expiryDate);
        
        if (success) {
            const now = new Date();
            const timeLeft = expiryDate - now;
            const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
            
            await message.reply(
                '✅ *Sewa Bot Berhasil Diaktifkan*\n\n' +
                `**Grup:** ${chatInfo.chat.name}\n` +
                `**Diaktifkan oleh:** ${chatInfo.contact.pushname || chatInfo.contact.number}\n\n` +
                `**Detail Sewa:**\n` +
                `• Masa aktif: ${daysLeft} hari\n` +
                `• Kadaluarsa: ${expiryDate.toLocaleDateString('id-ID')} ${expiryDate.toLocaleTimeString('id-ID')}\n` +
                `• Diaktifkan: ${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')}\n\n` +
                '**Fitur yang Aktif:**\n' +
                '• Semua command tersedia\n' +
                '• Notifikasi Hell Event otomatis\n' +
                '• Notifikasi Monster Rotation harian\n' +
                '• AI assistant\n' +
                '• Anti-spam protection\n\n' +
                '**Catatan:** Bot akan otomatis nonaktif saat masa sewa habis.'
            );
            
            console.log(`Rent activated in group: ${chatInfo.chat.name} (${groupId}) until ${expiryDate.toISOString()} by ${chatInfo.contact.pushname || chatInfo.contact.number}`);
        } else {
            await message.reply('❌ Gagal mengaktifkan sewa. Silakan coba lagi.');
        }
        
    } catch (error) {
        console.error('Error in rent command:', error);
        await message.reply('Terjadi error saat memproses command sewa.');
    }
};
