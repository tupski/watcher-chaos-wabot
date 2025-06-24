const { getChatInfo } = require('../utils/chatUtils');
const { setRentMode, getRentStatus, isBotOwner } = require('../utils/groupSettings');
const { createPaymentTransaction, createPromoPaymentTransaction, getPricingInfo, calculateCustomPrice } = require('../utils/xenditPayment');
const { getPromoPrice, generatePromoMessage, getPromoInfo } = require('../utils/promoSettings');

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
            const pricing = getPricingInfo();
            let priceList = '💰 *Paket Sewa Bot Lords Mobile*\n\n';

            // Add promo if active
            const promoMessage = generatePromoMessage();
            if (promoMessage) {
                priceList += promoMessage;
            }

            Object.entries(pricing).forEach(([days, info]) => {
                priceList += `📦 **${info.name}**\n`;
                priceList += `   • Durasi: ${info.days} hari\n`;
                priceList += `   • Harga: Rp ${info.price.toLocaleString('id-ID')}\n`;
                priceList += `   • Command: \`!rent pay ${days}\`\n\n`;
            });

            priceList += '**Usage:**\n';
            priceList += '• `!rent pay <durasi>` - Pembayaran otomatis\n';
            priceList += '  Contoh: `!rent pay 30`\n';
            if (promoMessage) {
                priceList += '• `!rent pay promo` - Gunakan promo aktif\n';
            }
            priceList += '• `!rent manual` - Info pembayaran manual\n';
            priceList += '• `!rent DDMMYYYY` - Set manual (BOT_OWNER)\n';
            priceList += '• `!rent disable` - Nonaktifkan sewa (BOT_OWNER)\n';
            priceList += '• `!rent status` - Cek status (admin only)\n\n';
            priceList += '💳 *Pembayaran Otomatis via Xendit*\n';
            priceList += 'QRIS, E-Wallet, Bank Transfer, Virtual Account, Retail Outlets';

            await message.reply(priceList);
            return;
        }

        // Handle manual payment info command
        if (option === 'manual') {
            const pricing = getPricingInfo();
            let manualPaymentInfo = '💰 *Pembayaran Manual Bot Lords Mobile*\n\n';

            manualPaymentInfo += '📋 *Paket Tersedia:*\n';
            Object.entries(pricing).forEach(([days, info]) => {
                manualPaymentInfo += `• ${info.name}: Rp ${info.price.toLocaleString('id-ID')}\n`;
            });

            manualPaymentInfo += '\n🏦 *Rekening Pembayaran:*\n';
            manualPaymentInfo += '• **BCA:** 6050381330 a.n. Angga Artupas\n';
            // manualPaymentInfo += '• **BNI:** 0987654321 a.n. Angga Artupas\n';
            manualPaymentInfo += '• **DANA:** 0819-1191-9993\n';
            manualPaymentInfo += '• **GoPay:** 0819-1191-9993\n';
            manualPaymentInfo += '• **OVO:** 0822-1121-9993\n\n';

            manualPaymentInfo += '📝 *Cara Pembayaran Manual:*\n';
            manualPaymentInfo += '1. Transfer sesuai paket yang dipilih\n';
            manualPaymentInfo += '2. Screenshot bukti transfer\n';
            manualPaymentInfo += '3. Kirim ke WhatsApp: 0822-1121-9993\n';
            manualPaymentInfo += '4. Sertakan info grup dan durasi sewa\n';
            manualPaymentInfo += '5. Bot akan diaktifkan dalam 1-24 jam\n\n';

            manualPaymentInfo += '⚡ *Pembayaran Otomatis (Lebih Cepat):*\n';
            manualPaymentInfo += 'Gunakan `!rent pay [durasi]` untuk aktivasi instan via Xendit\n\n';

            manualPaymentInfo += '📞 *Kontak Support:*\n';
            manualPaymentInfo += '• WhatsApp: 0822-1121-9993 (Angga)\n';
            manualPaymentInfo += '• Jam Operasional: 24/7\n';
            manualPaymentInfo += '• Response Time: < 1 jam';

            await message.reply(manualPaymentInfo);
            return;
        }

        // Handle payment command (available for all users)
        if (option === 'pay') {
            const duration = args[1];
            if (!duration) {
                const promoMessage = generatePromoMessage();
                let helpMessage = '❌ *Durasi Tidak Disebutkan*\n\n';

                if (promoMessage) {
                    helpMessage += promoMessage;
                }

                helpMessage += '**Contoh penggunaan:**\n';
                helpMessage += '• `!rent pay 1` - 1 hari (Rp 2,000)\n';
                helpMessage += '• `!rent pay 7` - 1 minggu (Rp 12,000)\n';
                helpMessage += '• `!rent pay 30` - 1 bulan (Rp 50,000)\n';
                helpMessage += '• `!rent pay 180` - 6 bulan (Rp 500,000)\n';
                helpMessage += '• `!rent pay 365` - 1 tahun (Rp 950,000)\n';

                if (promoMessage) {
                    helpMessage += '• `!rent pay promo` - Gunakan promo aktif\n';
                }

                helpMessage += '\nKetik `!rent` untuk melihat semua paket.';

                await message.reply(helpMessage);
                return;
            }

            let selectedPackage = null;
            let isPromo = false;
            let promoInfo = null;

            // Handle promo payment
            if (duration.toLowerCase() === 'promo') {
                promoInfo = getPromoPrice(null); // Get any active promo
                const activePromo = getPromoInfo();

                if (!activePromo) {
                    await message.reply(
                        '❌ *Tidak Ada Promo Aktif*\n\n' +
                        'Saat ini tidak ada promo yang tersedia.\n\n' +
                        '**Paket normal tersedia:**\n' +
                        '• `!rent pay 1` - 1 hari (Rp 2,000)\n' +
                        '• `!rent pay 7` - 1 minggu (Rp 12,000)\n' +
                        '• `!rent pay 30` - 1 bulan (Rp 50,000)\n' +
                        '• `!rent pay 180` - 6 bulan (Rp 500,000)\n' +
                        '• `!rent pay 365` - 1 tahun (Rp 950,000)\n\n' +
                        'Ketik `!rent` untuk melihat semua paket.'
                    );
                    return;
                }

                const pricing = getPricingInfo();
                const originalPackage = pricing[activePromo.duration.toString()];

                selectedPackage = {
                    ...originalPackage,
                    price: activePromo.promoPrice,
                    originalPrice: activePromo.originalPrice,
                    savings: activePromo.savings,
                    discountPercent: activePromo.discountPercent
                };
                isPromo = true;

            } else {
                // Handle normal payment
                const pricing = getPricingInfo();
                selectedPackage = pricing[duration];

                if (!selectedPackage) {
                    const promoMessage = generatePromoMessage();
                    let errorMessage = '❌ *Paket Tidak Tersedia*\n\n';

                    if (promoMessage) {
                        errorMessage += promoMessage;
                    }

                    errorMessage += 'Paket yang tersedia:\n';
                    errorMessage += '• 1 hari (Rp 2,000)\n';
                    errorMessage += '• 7 hari (Rp 12,000)\n';
                    errorMessage += '• 30 hari (Rp 50,000)\n';
                    errorMessage += '• 180 hari (Rp 500,000)\n';
                    errorMessage += '• 365 hari (Rp 950,000)\n';

                    if (promoMessage) {
                        errorMessage += '• `!rent pay promo` - Gunakan promo aktif\n';
                    }

                    errorMessage += '\nKetik `!rent` untuk melihat detail lengkap.';

                    await message.reply(errorMessage);
                    return;
                }
            }

            // Create payment transaction
            const ownerInfo = {
                name: chatInfo.contact.pushname || chatInfo.contact.number,
                number: chatInfo.contact.number,
                id: chatInfo.contact.id._serialized
            };

            // Create payment transaction
            let paymentResult;

            if (isPromo) {
                // Use promo payment function
                paymentResult = await createPromoPaymentTransaction(
                    groupId,
                    chatInfo.chat.name,
                    ownerInfo,
                    selectedPackage.days,
                    selectedPackage.price,
                    selectedPackage.originalPrice
                );
            } else {
                // Use normal payment function
                paymentResult = await createPaymentTransaction(
                    groupId,
                    chatInfo.chat.name,
                    ownerInfo,
                    selectedPackage.days
                );
            }

            if (paymentResult.success) {
                let paymentMessage = '💳 *Link Pembayaran Berhasil Dibuat*\n\n';

                if (isPromo) {
                    paymentMessage += '🔥 *PROMO SPESIAL DIGUNAKAN!*\n\n';
                }

                paymentMessage += `**Detail Pesanan:**\n`;
                paymentMessage += `• Grup: ${chatInfo.chat.name}\n`;
                paymentMessage += `• Paket: ${selectedPackage.name}\n`;
                paymentMessage += `• Durasi: ${selectedPackage.days} hari\n`;

                if (isPromo) {
                    paymentMessage += `• Harga Normal: ~~Rp ${selectedPackage.originalPrice.toLocaleString('id-ID')}~~\n`;
                    paymentMessage += `• Harga Promo: **Rp ${selectedPackage.price.toLocaleString('id-ID')}**\n`;
                    paymentMessage += `• Hemat: Rp ${selectedPackage.savings.toLocaleString('id-ID')} (${selectedPackage.discountPercent}%)\n`;
                } else {
                    paymentMessage += `• Harga: Rp ${selectedPackage.price.toLocaleString('id-ID')}\n`;
                }

                paymentMessage += `• Order ID: ${paymentResult.orderId}\n\n`;
                paymentMessage += '🔗 *Link Pembayaran:*\n';
                paymentMessage += `${paymentResult.paymentUrl}\n\n`;
                paymentMessage += '💰 *Metode Pembayaran:*\n';
                paymentMessage += '• 📱 QRIS (Scan & Pay)\n';
                paymentMessage += '• 💳 E-Wallet (GoPay, OVO, DANA, ShopeePay, LinkAja)\n';
                paymentMessage += '• 🏦 Transfer Bank (BCA, BNI, BRI, Mandiri, Permata)\n';
                paymentMessage += '• 🔢 Virtual Account\n';
                paymentMessage += '• 🏪 Retail Outlets (Alfamart, Indomaret)\n\n';
                paymentMessage += '⏰ *Batas Waktu:* 24 jam\n\n';
                paymentMessage += '✅ *Setelah Pembayaran:*\n';
                paymentMessage += '• Bot aktif otomatis\n';
                paymentMessage += '• Konfirmasi dikirim ke grup\n';
                paymentMessage += '• Semua fitur tersedia\n\n';

                if (isPromo) {
                    paymentMessage += '🎉 *Terima kasih telah menggunakan promo!*\n\n';
                }

                paymentMessage += '❓ *Bantuan:* 0822-1121-9993 (Angga)';

                await message.reply(paymentMessage);

                console.log(`Payment link created for group: ${chatInfo.chat.name} (${groupId}) by ${ownerInfo.name} - Order: ${paymentResult.orderId}`);
            } else {
                await message.reply(
                    '❌ *Gagal Membuat Pembayaran*\n\n' +
                    'Terjadi kesalahan saat membuat link pembayaran.\n\n' +
                    '**Silakan coba lagi atau hubungi:**\n' +
                    '📱 0822-1121-9993 (Angga)\n\n' +
                    `**Error:** ${paymentResult.error}`
                );
            }
            return;
        }

        // Handle disable command (BOT_OWNER only)
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
