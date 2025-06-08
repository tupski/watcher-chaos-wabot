const express = require('express');
const router = express.Router();
const { verifyPaymentNotification } = require('../utils/midtransPayment');
const { setRentMode, getAllGroupsSettings } = require('../utils/groupSettings');

// Store WhatsApp client reference
let whatsappClient = null;

function setWhatsAppClient(client) {
    whatsappClient = client;
}

// Midtrans webhook notification
router.post('/notification', async (req, res) => {
    try {
        console.log('Payment notification received:', req.body);
        
        const verification = await verifyPaymentNotification(req.body);
        
        if (!verification.success) {
            console.error('Payment verification failed:', verification.error);
            return res.status(400).json({ error: 'Verification failed' });
        }
        
        const { 
            orderId, 
            transactionStatus, 
            fraudStatus, 
            grossAmount,
            customField1: groupId,
            customField2: duration,
            customField3: ownerContactId
        } = verification;
        
        console.log(`Payment notification - Order: ${orderId}, Status: ${transactionStatus}, Group: ${groupId}`);
        
        // Handle successful payment
        if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
            if (fraudStatus === 'accept' || !fraudStatus) {
                await handleSuccessfulPayment(orderId, groupId, duration, ownerContactId, grossAmount);
            } else {
                console.log(`Payment fraud detected for order: ${orderId}`);
            }
        }
        // Handle failed payment
        else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
            await handleFailedPayment(orderId, groupId, ownerContactId);
        }
        // Handle pending payment
        else if (transactionStatus === 'pending') {
            await handlePendingPayment(orderId, groupId, ownerContactId);
        }
        
        res.status(200).json({ status: 'OK' });
        
    } catch (error) {
        console.error('Error handling payment notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Handle successful payment
async function handleSuccessfulPayment(orderId, groupId, duration, ownerContactId, amount) {
    try {
        console.log(`Processing successful payment: ${orderId} for group: ${groupId}`);
        
        // Calculate expiry date
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + parseInt(duration));
        expiryDate.setHours(23, 59, 59, 999);
        
        // Get owner info
        let ownerInfo = null;
        if (whatsappClient) {
            try {
                const contact = await whatsappClient.getContactById(ownerContactId);
                ownerInfo = {
                    name: contact.pushname || contact.number,
                    number: contact.number,
                    id: contact.id._serialized
                };
            } catch (error) {
                console.error('Error getting contact info:', error);
                ownerInfo = {
                    name: 'Unknown',
                    number: 'unknown',
                    id: ownerContactId
                };
            }
        }
        
        // Activate rent
        const success = setRentMode(
            groupId,
            true,
            expiryDate,
            ownerInfo,
            parseInt(duration),
            parseInt(amount),
            orderId
        );
        
        if (success) {
            console.log(`Rent activated for group: ${groupId} until ${expiryDate.toISOString()}`);
            
            // Send confirmation to group
            await sendPaymentConfirmation(groupId, orderId, duration, amount, expiryDate);
            
            // Send confirmation to owner
            if (ownerContactId) {
                await sendOwnerConfirmation(ownerContactId, orderId, duration, amount, expiryDate);
            }
        } else {
            console.error(`Failed to activate rent for group: ${groupId}`);
        }
        
    } catch (error) {
        console.error('Error handling successful payment:', error);
    }
}

// Handle failed payment
async function handleFailedPayment(orderId, groupId, ownerContactId) {
    try {
        console.log(`Processing failed payment: ${orderId} for group: ${groupId}`);
        
        if (whatsappClient && ownerContactId) {
            const failMessage = 
                '❌ *Pembayaran Gagal*\n\n' +
                `**Order ID:** ${orderId}\n\n` +
                '**Status:** Pembayaran dibatalkan atau gagal\n\n' +
                '🔄 *Untuk mencoba lagi:*\n' +
                '• Gunakan command `!rent pay <durasi>` di grup\n' +
                '• Atau hubungi: 0822-1121-9993 (Angga)\n\n' +
                '💡 *Tips:*\n' +
                '• Pastikan saldo mencukupi\n' +
                '• Coba metode pembayaran lain\n' +
                '• Periksa koneksi internet';
            
            await whatsappClient.sendMessage(ownerContactId, failMessage);
        }
        
    } catch (error) {
        console.error('Error handling failed payment:', error);
    }
}

// Handle pending payment
async function handlePendingPayment(orderId, groupId, ownerContactId) {
    try {
        console.log(`Processing pending payment: ${orderId} for group: ${groupId}`);
        
        if (whatsappClient && ownerContactId) {
            const pendingMessage = 
                '⏳ *Pembayaran Sedang Diproses*\n\n' +
                `**Order ID:** ${orderId}\n\n` +
                '**Status:** Menunggu konfirmasi pembayaran\n\n' +
                '⏰ *Estimasi:*\n' +
                '• Transfer Bank: 1-3 menit\n' +
                '• Virtual Account: Instant\n' +
                '• E-Wallet: Instant\n\n' +
                '✅ *Bot akan aktif otomatis setelah pembayaran dikonfirmasi*\n\n' +
                '❓ *Bantuan:* 0822-1121-9993 (Angga)';
            
            await whatsappClient.sendMessage(ownerContactId, pendingMessage);
        }
        
    } catch (error) {
        console.error('Error handling pending payment:', error);
    }
}

// Send payment confirmation to group
async function sendPaymentConfirmation(groupId, orderId, duration, amount, expiryDate) {
    try {
        if (!whatsappClient) return;
        
        const chats = await whatsappClient.getChats();
        const chat = chats.find(c => c.id._serialized === groupId);
        
        if (chat) {
            const confirmMessage = 
                '🎉 *Pembayaran Berhasil - Bot Aktif!*\n\n' +
                `**Order ID:** ${orderId}\n` +
                `**Durasi:** ${duration} hari\n` +
                `**Harga:** Rp ${parseInt(amount).toLocaleString('id-ID')}\n` +
                `**Aktif hingga:** ${expiryDate.toLocaleDateString('id-ID')} ${expiryDate.toLocaleTimeString('id-ID')}\n\n` +
                '✅ *Fitur yang Aktif:*\n' +
                '• 📢 Notifikasi Hell Event otomatis\n' +
                '• 📅 Info Monster Rotation harian\n' +
                '• 🤖 AI Assistant\n' +
                '• 👥 Tag All Members\n' +
                '• 🛡️ Anti-spam Protection\n\n' +
                '🚀 *Bot siap digunakan!*\n' +
                'Ketik `!help` untuk melihat semua command.\n\n' +
                '📱 *Support:* 0822-1121-9993 (Angga)\n' +
                'Terima kasih telah menggunakan Bot Lords Mobile! 🎮';
            
            await chat.sendMessage(confirmMessage);
            console.log(`Payment confirmation sent to group: ${groupId}`);
        }
        
    } catch (error) {
        console.error('Error sending payment confirmation to group:', error);
    }
}

// Send confirmation to owner
async function sendOwnerConfirmation(ownerContactId, orderId, duration, amount, expiryDate) {
    try {
        if (!whatsappClient) return;
        
        const ownerMessage = 
            '✅ *Pembayaran Berhasil Dikonfirmasi*\n\n' +
            `**Order ID:** ${orderId}\n` +
            `**Durasi:** ${duration} hari\n` +
            `**Harga:** Rp ${parseInt(amount).toLocaleString('id-ID')}\n` +
            `**Aktif hingga:** ${expiryDate.toLocaleDateString('id-ID')} ${expiryDate.toLocaleTimeString('id-ID')}\n\n` +
            '🎉 *Bot telah aktif di grup Anda!*\n\n' +
            '📧 *Bukti Pembayaran:*\n' +
            'Simpan Order ID ini sebagai bukti pembayaran.\n\n' +
            '🔔 *Notifikasi Perpanjangan:*\n' +
            'Kami akan mengingatkan Anda 3 hari sebelum masa aktif berakhir.\n\n' +
            '📱 *Support & Bantuan:*\n' +
            '0822-1121-9993 (Angga)\n\n' +
            'Terima kasih telah mempercayai layanan kami! 🙏';
        
        await whatsappClient.sendMessage(ownerContactId, ownerMessage);
        console.log(`Owner confirmation sent to: ${ownerContactId}`);
        
    } catch (error) {
        console.error('Error sending owner confirmation:', error);
    }
}

// Payment finish page
router.get('/finish', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>Pembayaran Berhasil</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f0f8ff; }
                .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
                .info { color: #666; line-height: 1.6; }
                .button { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="success">✅ Pembayaran Berhasil!</div>
                <div class="info">
                    <p>Terima kasih! Pembayaran Anda telah berhasil diproses.</p>
                    <p>Bot Lords Mobile akan aktif dalam beberapa saat.</p>
                    <p>Konfirmasi akan dikirim ke WhatsApp Anda.</p>
                </div>
                <a href="https://wa.me/6282211219993" class="button">Hubungi Support</a>
            </div>
        </body>
        </html>
    `);
});

// Payment error page
router.get('/error', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>Pembayaran Gagal</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #fff5f5; }
                .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .error { color: #dc3545; font-size: 24px; margin-bottom: 20px; }
                .info { color: #666; line-height: 1.6; }
                .button { background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="error">❌ Pembayaran Gagal</div>
                <div class="info">
                    <p>Maaf, pembayaran Anda tidak dapat diproses.</p>
                    <p>Silakan coba lagi atau hubungi support untuk bantuan.</p>
                </div>
                <a href="https://wa.me/6282211219993" class="button">Hubungi Support</a>
            </div>
        </body>
        </html>
    `);
});

module.exports = { router, setWhatsAppClient };
