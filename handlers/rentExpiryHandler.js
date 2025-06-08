const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { getGroupSettings, setRentMode, getGroupsNeedingRenewal } = require('../utils/groupSettings');

// File to store group settings
const settingsFile = path.join(__dirname, '..', 'data', 'groupSettings.json');

/**
 * Load all group settings
 */
function loadAllSettings() {
    try {
        if (fs.existsSync(settingsFile)) {
            const data = fs.readFileSync(settingsFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading group settings for rent expiry check:', error);
    }
    return {};
}

/**
 * Check and disable expired rent bots
 */
function checkExpiredRents(whatsappClient) {
    try {
        const allSettings = loadAllSettings();
        const now = new Date();

        console.log('Checking for expired rent bots...');

        for (const [groupId, settings] of Object.entries(allSettings)) {
            if (settings.rentMode && settings.rentExpiry) {
                const expiryDate = new Date(settings.rentExpiry);

                if (now >= expiryDate) {
                    console.log(`Rent expired for group ${groupId}, disabling bot...`);

                    // Send expiry notification to owner first
                    if (settings.rentOwner && settings.rentOwner.id !== 'trial@trial.com') {
                        sendOwnerExpiryNotification(whatsappClient, settings.rentOwner, groupId, expiryDate);
                    }

                    // Disable rent mode
                    const success = setRentMode(groupId, false);

                    if (success) {
                        console.log(`Successfully disabled rent for group ${groupId}`);

                        // Send notification to the group
                        sendExpiryNotification(whatsappClient, groupId, expiryDate);
                    } else {
                        console.error(`Failed to disable rent for group ${groupId}`);
                    }
                }
            }
        }

    } catch (error) {
        console.error('Error checking expired rents:', error);
    }
}

/**
 * Check and send renewal notifications (3 days before expiry)
 */
function checkRenewalNotifications(whatsappClient) {
    try {
        const groupsNeedingRenewal = getGroupsNeedingRenewal();

        console.log(`Found ${groupsNeedingRenewal.length} groups needing renewal notification`);

        for (const groupInfo of groupsNeedingRenewal) {
            const { groupId, settings, expiryDate, daysLeft } = groupInfo;

            // Only send notification if owner is not trial user
            if (settings.rentOwner && settings.rentOwner.id !== 'trial@trial.com') {
                sendRenewalNotification(whatsappClient, settings.rentOwner, groupId, expiryDate, daysLeft);
            }
        }

    } catch (error) {
        console.error('Error checking renewal notifications:', error);
    }
}

/**
 * Send renewal notification to owner
 */
async function sendRenewalNotification(whatsappClient, ownerInfo, groupId, expiryDate, daysLeft) {
    try {
        // Check if ownerInfo is valid
        if (!ownerInfo || !ownerInfo.id) {
            console.log(`Skipping renewal notification for ${groupId}: owner info not available`);
            return;
        }

        const renewalMessage =
            '⚠️ *Pengingat Perpanjangan Sewa Bot*\n\n' +
            `**Grup:** ${groupId}\n` +
            `**Sisa Waktu:** ${daysLeft} hari lagi\n` +
            `**Kadaluarsa:** ${expiryDate.toLocaleDateString('id-ID')} ${expiryDate.toLocaleTimeString('id-ID')}\n\n` +
            '🔔 *Segera Perpanjang Sebelum Kadaluarsa!*\n\n' +
            '💰 *Paket Perpanjangan:*\n' +
            '• 1 hari: Rp 2,000\n' +
            '• 1 minggu: Rp 10,000\n' +
            '• 1 bulan: Rp 50,000\n' +
            '• 6 bulan: Rp 500,000\n' +
            '• 1 tahun: Rp 950,000\n\n' +
            '🚀 *Cara Perpanjang:*\n' +
            '1. Ketik `!rent pay <durasi>` di grup\n' +
            '2. Pilih metode pembayaran\n' +
            '3. Selesaikan pembayaran\n' +
            '4. Bot aktif otomatis\n\n' +
            '📱 *Bantuan:* 0822-1121-9993 (Angga)\n\n' +
            '⏰ *Jangan sampai terlewat!*\n' +
            'Bot akan nonaktif otomatis jika tidak diperpanjang.';

        await whatsappClient.sendMessage(ownerInfo.id, renewalMessage);
        console.log(`Renewal notification sent to owner: ${ownerInfo.name} (${ownerInfo.id})`);

    } catch (error) {
        console.error(`Error sending renewal notification to owner ${ownerInfo.id}:`, error);
    }
}

/**
 * Send expiry notification to owner
 */
async function sendOwnerExpiryNotification(whatsappClient, ownerInfo, groupId, expiryDate) {
    try {
        const ownerExpiryMessage =
            '❌ *Sewa Bot Telah Berakhir*\n\n' +
            `**Grup:** ${groupId}\n` +
            `**Kadaluarsa:** ${expiryDate.toLocaleDateString('id-ID')} ${expiryDate.toLocaleTimeString('id-ID')}\n\n` +
            '🔴 *Bot telah dinonaktifkan otomatis*\n\n' +
            '🔄 *Untuk Mengaktifkan Kembali:*\n' +
            '• Ketik `!rent pay <durasi>` di grup\n' +
            '• Atau hubungi: 0822-1121-9993 (Angga)\n\n' +
            '💰 *Paket Sewa Tersedia:*\n' +
            '• 1 hari: Rp 2,000\n' +
            '• 1 minggu: Rp 10,000\n' +
            '• 1 bulan: Rp 50,000\n' +
            '• 6 bulan: Rp 500,000\n' +
            '• 1 tahun: Rp 950,000\n\n' +
            '💳 *Pembayaran Mudah:*\n' +
            'QRIS, E-Wallet, Bank Transfer, Virtual Account\n\n' +
            'Terima kasih telah menggunakan Bot Lords Mobile! 🙏';

        await whatsappClient.sendMessage(ownerInfo.id, ownerExpiryMessage);
        console.log(`Owner expiry notification sent to: ${ownerInfo.name} (${ownerInfo.id})`);

    } catch (error) {
        console.error(`Error sending owner expiry notification to ${ownerInfo.id}:`, error);
    }
}

/**
 * Send expiry notification to group
 */
async function sendExpiryNotification(whatsappClient, groupId, expiryDate) {
    try {
        const chats = await whatsappClient.getChats();
        const chat = chats.find(c => c.id._serialized === groupId);

        if (chat) {
            const { generatePromoMessage } = require('../utils/promoSettings');
            const promoMessage = generatePromoMessage();

            let expiryMessage = '⏰ *Masa Sewa Bot Telah Berakhir*\n\n';
            expiryMessage += `📅 *Kadaluarsa:* ${expiryDate.toLocaleDateString('id-ID')} ${expiryDate.toLocaleTimeString('id-ID')}\n\n`;
            expiryMessage += '❌ *Bot telah dinonaktifkan*\n';
            expiryMessage += 'Semua fitur bot tidak lagi tersedia.\n\n';

            // Add promo if active
            if (promoMessage) {
                expiryMessage += promoMessage;
            }

            expiryMessage += '🔄 *Untuk Mengaktifkan Kembali:*\n';
            expiryMessage += '• `!rent pay <durasi>` - Pembayaran otomatis (instan)\n';
            if (promoMessage) {
                expiryMessage += '• `!rent pay promo` - Gunakan promo spesial\n';
            }
            expiryMessage += '• `!rent manual` - Info pembayaran manual\n';
            expiryMessage += '• Hubungi: 0822-1121-9993 (Support langsung)\n\n';
            expiryMessage += '💰 *Paket Sewa:*\n';
            expiryMessage += '• 1 hari: Rp 2,000\n';
            expiryMessage += '• 1 minggu: Rp 12,000\n';
            expiryMessage += '• 1 bulan: Rp 50,000\n';
            expiryMessage += '• 6 bulan: Rp 500,000\n';
            expiryMessage += '• 1 tahun: Rp 950,000\n\n';
            expiryMessage += '💳 *Pembayaran Otomatis (Rekomendasi):*\n';
            expiryMessage += 'QRIS, E-Wallet, Bank Transfer, Virtual Account, Retail Outlets\n';
            expiryMessage += '⚡ Aktivasi instan setelah pembayaran via Xendit!\n\n';
            expiryMessage += '🏦 *Pembayaran Manual:*\n';
            expiryMessage += 'Transfer manual + konfirmasi ke WhatsApp\n';
            expiryMessage += '⏱️ Aktivasi dalam 1-24 jam\n\n';
            expiryMessage += 'Terima kasih telah menggunakan layanan kami! 🙏';

            await chat.sendMessage(expiryMessage);
            console.log(`Expiry notification sent to group ${groupId}`);
        } else {
            console.log(`Group ${groupId} not found for expiry notification`);
        }

    } catch (error) {
        console.error(`Error sending expiry notification to group ${groupId}:`, error);
    }
}

/**
 * Send payment reminders to expired groups
 */
async function sendExpiredGroupPaymentReminders(whatsappClient) {
    try {
        const { getExpiredGroups } = require('../utils/groupSettings');
        const expiredGroups = getExpiredGroups();

        console.log(`Checking ${expiredGroups.length} expired groups for payment reminders...`);

        if (expiredGroups.length === 0) {
            console.log('No expired groups found for payment reminders');
            return;
        }

        const { generatePromoMessage } = require('../utils/promoSettings');
        const promoMessage = generatePromoMessage();

        let reminderMessage = '💰 *Reminder: Perpanjang Sewa Bot*\n\n';
        reminderMessage += '⏰ *Bot masih dalam status NONAKTIF*\n';
        reminderMessage += 'Masa sewa telah berakhir beberapa hari yang lalu.\n\n';

        // Add promo if active
        if (promoMessage) {
            reminderMessage += promoMessage;
        }

        reminderMessage += '🔄 *Untuk mengaktifkan kembali:*\n\n';
        reminderMessage += '💳 *Pembayaran Otomatis (Tercepat):*\n';
        reminderMessage += '• `!rent pay 1` - 1 hari (Rp 2,000)\n';
        reminderMessage += '• `!rent pay 7` - 1 minggu (Rp 12,000)\n';
        reminderMessage += '• `!rent pay 30` - 1 bulan (Rp 50,000)\n';
        reminderMessage += '• `!rent pay 180` - 6 bulan (Rp 500,000)\n';
        reminderMessage += '• `!rent pay 365` - 1 tahun (Rp 950,000)\n';

        if (promoMessage) {
            reminderMessage += '• `!rent pay promo` - Gunakan promo spesial\n';
        }

        reminderMessage += '\n⚡ *Aktivasi instan setelah pembayaran via Xendit!*\n\n';
        reminderMessage += '🏦 *Pembayaran Manual:*\n';
        reminderMessage += '• `!rent manual` - Info rekening & cara transfer\n';
        reminderMessage += '• Aktivasi dalam 1-24 jam setelah konfirmasi\n\n';
        reminderMessage += '📱 *Butuh Bantuan?*\n';
        reminderMessage += '• WhatsApp: 0822-1121-9993 (Angga)\n';
        reminderMessage += '• Response time: < 1 jam\n';
        reminderMessage += '• Layanan 24/7\n\n';
        reminderMessage += '🎮 *Fitur yang akan aktif:*\n';
        reminderMessage += '• Notifikasi Hell Event otomatis\n';
        reminderMessage += '• Info Monster Rotation harian\n';
        reminderMessage += '• AI Assistant & semua command\n\n';
        reminderMessage += '💡 *Jangan lewatkan update game penting!*\n';
        reminderMessage += 'Aktifkan bot sekarang untuk tetap update.';

        let sentCount = 0;
        let failedCount = 0;

        for (const group of expiredGroups) {
            try {
                // Only send reminder if expired for more than 1 day but less than 30 days
                if (group.daysExpired >= 1 && group.daysExpired <= 30) {
                    const chat = await whatsappClient.getChatById(group.groupId);
                    await chat.sendMessage(reminderMessage);
                    sentCount++;
                    console.log(`Payment reminder sent to expired group: ${group.groupId} (expired ${group.daysExpired} days ago)`);

                    // Add delay to avoid spam
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            } catch (error) {
                console.error(`Failed to send payment reminder to group ${group.groupId}:`, error);
                failedCount++;
            }
        }

        console.log(`Payment reminders sent: ${sentCount} successful, ${failedCount} failed`);

    } catch (error) {
        console.error('Error sending expired group payment reminders:', error);
    }
}

/**
 * Start rent expiry checker scheduler
 */
function startRentExpiryScheduler(whatsappClient) {
    console.log('Starting Rent Expiry Scheduler...');

    // Check every hour for expired rents
    // Cron format: minute hour day month dayOfWeek
    // 0 * * * * means every hour at minute 0
    cron.schedule('0 * * * *', () => {
        checkExpiredRents(whatsappClient);
    }, {
        timezone: 'Asia/Jakarta' // GMT+7
    });

    // Check for renewal notifications every day at 9 AM
    cron.schedule('0 9 * * *', () => {
        checkRenewalNotifications(whatsappClient);
    }, {
        timezone: 'Asia/Jakarta' // GMT+7
    });

    // Send payment reminders to expired groups every 3 days at 10 AM
    cron.schedule('0 10 */3 * *', () => {
        sendExpiredGroupPaymentReminders(whatsappClient);
    }, {
        timezone: 'Asia/Jakarta' // GMT+7
    });

    // Also check immediately on startup (after 30 seconds delay)
    setTimeout(() => {
        console.log('Running initial rent expiry check...');
        checkExpiredRents(whatsappClient);
        checkRenewalNotifications(whatsappClient);
    }, 30000);

    console.log('Rent Expiry Scheduler started!');
    console.log('- Checking expired rents every hour');
    console.log('- Checking renewal notifications daily at 9 AM');
    console.log('- Sending payment reminders to expired groups every 3 days at 10 AM');
}

module.exports = {
    startRentExpiryScheduler,
    checkExpiredRents,
    sendExpiredGroupPaymentReminders
};
