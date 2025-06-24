/**
 * Handler untuk auto-join grup dan kirim pesan welcome
 */

async function handleGroupJoin(client, notification) {
    try {
        console.log('Group join notification received:', notification);
        
        // Check if this is a group add notification for the bot
        if (notification.type === 'group_participant_add' && 
            notification.recipientIds && 
            notification.recipientIds.includes(client.info.wid._serialized)) {
            
            console.log('Bot was added to a group:', notification.chatId);
            
            // Get group info
            const chat = await client.getChatById(notification.chatId);
            console.log(`Joined group: ${chat.name}`);
            
            // Send welcome message and set trial period
            await sendWelcomeMessage(chat, client);
            
        }
    } catch (error) {
        console.error('Error handling group join:', error);
    }
}

async function sendWelcomeMessage(chat, client) {
    try {
        const welcomeMessage = 
            '🎉 *Terima Kasih Telah Menambahkan Bot!*\n\n' +
            '🤖 **Bot Lords Mobile** siap membantu grup Anda!\n\n' +
            '✨ *Fitur Unggulan:*\n' +
            '• 📢 Notifikasi Hell Event otomatis dari Discord\n' +
            '• 📅 Info Monster Rotation harian\n' +
            '• 🤖 AI Assistant untuk pertanyaan\n' +
            '• 👥 Tag All Members\n' +
            '• 🛡️ Anti-spam Protection\n' +
            '• ⚙️ Pengaturan permission per grup\n\n' +
            '💰 *Sistem Sewa Fleksibel:*\n' +
            '• Per hari: Rp 2,000\n' +
            '• Per minggu (7 hari): Rp 12,000\n' +
            '• Per bulan (30 hari): Rp 50,000\n' +
            '• Per 6 bulan (180 hari): Rp 500,000\n' +
            '• Per tahun (365 hari): Rp 950,000\n\n' +
            '🔥 *PROMO TRIAL GRATIS 1 HARI!*\n' +
            'Bot akan aktif otomatis selama 1 hari untuk trial.\n\n' +
            '💳 *Pembayaran Mudah:*\n' +
            '• QRIS (Scan & Pay)\n' +
            '• E-Wallet (GoPay, OVO, DANA, ShopeePay)\n' +
            '• Transfer Bank\n' +
            '• Virtual Account\n\n' +
            '📱 *Kontak & Support:*\n' +
            '• WhatsApp: 0822-1121-9993 (Angga)\n' +
            '• Pembayaran otomatis via bot\n' +
            '• Support 24/7\n\n' +
            '🚀 *Mulai Menggunakan:*\n' +
            '• Ketik `!help` untuk melihat semua command\n' +
            '• Ketik `!permission` untuk melihat pengaturan\n' +
            '• Admin grup bisa atur permission dengan `!cmd`\n\n' +
            '⏰ *Trial 1 hari dimulai sekarang!*\n' +
            'Nikmati semua fitur premium secara GRATIS!\n\n' +
            'Selamat menggunakan Bot Lords Mobile! 🎮✨';
        
        await chat.sendMessage(welcomeMessage);
        console.log(`Welcome message sent to group: ${chat.name}`);
        
        // Set trial period (1 day)
        await setTrialPeriod(chat.id._serialized, chat.name, client);
        
    } catch (error) {
        console.error('Error sending welcome message:', error);
    }
}

async function setTrialPeriod(groupId, groupName, client) {
    try {
        const { setRentMode, getGroupSettings, updateGroupSettings } = require('../utils/groupSettings');

        // Check if group has already used trial
        const existingSettings = getGroupSettings(groupId);
        if (existingSettings.hasUsedTrial) {
            console.log(`Group ${groupName} (${groupId}) has already used trial, skipping trial setup`);

            // Send message about trial already used
            try {
                const chat = await client.getChatById(groupId);
                const { generatePromoMessage } = require('../utils/promoSettings');
                const promoMessage = generatePromoMessage();

                let noTrialMessage = '⚠️ *Trial Sudah Pernah Digunakan*\n\n';
                noTrialMessage += 'Grup ini sudah pernah menggunakan trial gratis sebelumnya.\n\n';

                // Add promo if active
                if (promoMessage) {
                    noTrialMessage += promoMessage;
                }

                noTrialMessage += '💰 *Untuk menggunakan bot, silakan sewa:*\n';
                noTrialMessage += '• 1 hari: Rp 2,000\n';
                noTrialMessage += '• 1 minggu: Rp 12,000\n';
                noTrialMessage += '• 1 bulan: Rp 50,000\n';
                noTrialMessage += '• 6 bulan: Rp 500,000\n';
                noTrialMessage += '• 1 tahun: Rp 950,000\n\n';
                noTrialMessage += '📱 *Cara Pembayaran:*\n';
                noTrialMessage += '• Ketik `!rent` untuk melihat paket\n';
                noTrialMessage += '• Ketik `!rent pay [durasi]` untuk pembayaran otomatis\n';

                if (promoMessage) {
                    noTrialMessage += '• Ketik `!rent pay promo` untuk gunakan promo\n';
                }

                noTrialMessage += '• Hubungi: 0822-1121-9993 untuk pembayaran manual\n\n';
                noTrialMessage += '🔒 Bot akan tetap nonaktif sampai pembayaran berhasil.\n';
                noTrialMessage += '💳 Powered by Xendit Payment Gateway';

                await chat.sendMessage(noTrialMessage);
                } catch (msgError) {
                    console.error('Error sending no trial message:', msgError);
                }
            return;
        }

        // Set 1 day trial (changed from 3 days)
        const trialExpiry = new Date();
        trialExpiry.setDate(trialExpiry.getDate() + 1);
        trialExpiry.setHours(23, 59, 59, 999); // End of day

        const ownerInfo = {
            name: 'Trial User',
            number: 'trial',
            id: 'trial@trial.com'
        };

        const success = setRentMode(
            groupId,
            true,
            trialExpiry,
            ownerInfo,
            1, // 1 day (changed from 3)
            0, // Free trial
            'TRIAL_' + Date.now()
        );

        if (success) {
            // Mark that this group has used trial
            updateGroupSettings(groupId, {
                hasUsedTrial: true,
                trialUsedAt: new Date().toISOString()
            });

            console.log(`Trial period set for group: ${groupName} (${groupId}) until ${trialExpiry.toISOString()}`);
        } else {
            console.error(`Failed to set trial period for group: ${groupName} (${groupId})`);
        }

    } catch (error) {
        console.error('Error setting trial period:', error);
    }
}

module.exports = {
    handleGroupJoin,
    sendWelcomeMessage,
    setTrialPeriod
};
