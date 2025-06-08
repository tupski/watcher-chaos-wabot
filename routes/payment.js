const express = require('express');
const router = express.Router();
const { verifyWebhookSignature, processPaymentNotification } = require('../utils/xenditPayment');
const { setRentMode, getAllGroupsSettings } = require('../utils/groupSettings');

// Store WhatsApp client reference
let whatsappClient = null;

function setWhatsAppClient(client) {
    whatsappClient = client;
}

// Xendit Invoice webhook - untuk invoice.paid, invoice.expired, dll
router.post('/webhook/invoice', async (req, res) => {
    try {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] Xendit Invoice webhook received:`, {
            event: req.body.event,
            id: req.body.id,
            external_id: req.body.external_id,
            status: req.body.status,
            amount: req.body.amount,
            headers: {
                'x-callback-token': req.headers['x-callback-token'] ? 'SET' : 'NOT SET',
                'user-agent': req.headers['user-agent'],
                'content-type': req.headers['content-type']
            }
        });

        // Verify webhook signature
        const signature = req.headers['x-callback-token'];

        // Get raw body for signature verification
        let rawBody;
        if (req.rawBody) {
            rawBody = req.rawBody;
        } else {
            rawBody = JSON.stringify(req.body);
        }

        console.log(`[${timestamp}] Webhook signature check:`, {
            hasSignature: !!signature,
            signatureLength: signature ? signature.length : 0,
            bodyType: typeof rawBody,
            bodyLength: rawBody.length
        });

        if (!verifyWebhookSignature(rawBody, signature)) {
            console.error(`[${timestamp}] Invalid webhook signature:`, {
                received: signature ? signature.substring(0, 20) + '...' : 'NO SIGNATURE',
                bodyPreview: typeof rawBody === 'string' ? rawBody.substring(0, 100) + '...' : JSON.stringify(rawBody).substring(0, 100) + '...'
            });
            return res.status(401).json({ error: 'Invalid signature' });
        }

        console.log(`[${timestamp}] Webhook signature verified successfully`);

        const notification = await processPaymentNotification(req.body);

        if (!notification.success) {
            console.error(`[${timestamp}] Payment notification processing failed:`, notification.error);
            return res.status(400).json({ error: 'Processing failed' });
        }

        const {
            orderId,
            status,
            amount,
            metadata
        } = notification;

        const groupId = metadata.group_id;
        const duration = metadata.duration;
        const ownerContactId = metadata.owner_id;

        console.log(`[${timestamp}] Processing webhook - Order: ${orderId}, Status: ${status}, Group: ${groupId}, Duration: ${duration} days, Amount: IDR ${amount}`);

        // Handle successful payment
        if (status === 'PAID') {
            console.log(`[${timestamp}] Processing successful payment for group ${groupId}`);
            await handleSuccessfulPayment(orderId, groupId, duration, ownerContactId, amount);
            console.log(`[${timestamp}] Successfully activated bot for group ${groupId}`);
        }
        // Handle failed/expired payment
        else if (status === 'EXPIRED') {
            console.log(`[${timestamp}] Processing expired payment for group ${groupId}`);
            await handleFailedPayment(orderId, groupId, ownerContactId);
        }
        // Handle pending payment
        else if (status === 'PENDING') {
            console.log(`[${timestamp}] Processing pending payment for group ${groupId}`);
            await handlePendingPayment(orderId, groupId, ownerContactId);
        } else {
            console.log(`[${timestamp}] Unknown payment status: ${status} for group ${groupId}`);
        }

        res.status(200).json({ status: 'OK' });

    } catch (error) {
        console.error('Error handling Xendit Invoice webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Xendit Payment webhook - untuk payment method specific events
router.post('/webhook/payment', async (req, res) => {
    try {
        console.log('Xendit Payment webhook received:', {
            event: req.body.event,
            id: req.body.id,
            external_id: req.body.external_id,
            status: req.body.status
        });

        // Verify webhook signature
        const signature = req.headers['x-callback-token'];
        const rawBody = JSON.stringify(req.body);

        if (!verifyWebhookSignature(rawBody, signature)) {
            console.error('Invalid webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Process payment-specific events
        const event = req.body.event;

        if (event === 'payment.paid' || event === 'payment.succeeded') {
            // Handle successful payment
            const orderId = req.body.external_id;
            const amount = req.body.amount;
            const metadata = req.body.metadata || {};

            await handleSuccessfulPayment(
                orderId,
                metadata.group_id,
                metadata.duration,
                metadata.owner_id,
                amount
            );
        }

        res.status(200).json({ status: 'OK' });

    } catch (error) {
        console.error('Error handling Xendit Payment webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Xendit Virtual Account webhook
router.post('/webhook/va', async (req, res) => {
    try {
        console.log('Xendit VA webhook received:', {
            event: req.body.event,
            id: req.body.id,
            external_id: req.body.external_id
        });

        // Verify webhook signature
        const signature = req.headers['x-callback-token'];
        const rawBody = JSON.stringify(req.body);

        if (!verifyWebhookSignature(rawBody, signature)) {
            console.error('Invalid webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Process VA payment
        if (req.body.event === 'virtual_account.paid') {
            const orderId = req.body.external_id;
            const amount = req.body.amount;

            // Extract metadata from external_id or description
            // Format: RENT_groupId_timestamp atau PROMO_groupId_timestamp
            const parts = orderId.split('_');
            if (parts.length >= 3) {
                const groupId = parts[1] + '@g.us';
                // You might need to get duration from database or other source
                await handleSuccessfulPayment(orderId, groupId, '1', null, amount);
            }
        }

        res.status(200).json({ status: 'OK' });

    } catch (error) {
        console.error('Error handling Xendit VA webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Xendit E-Wallet webhook
router.post('/webhook/ewallet', async (req, res) => {
    try {
        console.log('Xendit E-Wallet webhook received:', {
            event: req.body.event,
            id: req.body.id,
            external_id: req.body.external_id
        });

        // Verify webhook signature
        const signature = req.headers['x-callback-token'];
        const rawBody = JSON.stringify(req.body);

        if (!verifyWebhookSignature(rawBody, signature)) {
            console.error('Invalid webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Process E-Wallet payment
        if (req.body.event === 'ewallet.payment.paid') {
            const orderId = req.body.external_id;
            const amount = req.body.amount;

            // Extract metadata from external_id
            const parts = orderId.split('_');
            if (parts.length >= 3) {
                const groupId = parts[1] + '@g.us';
                await handleSuccessfulPayment(orderId, groupId, '1', null, amount);
            }
        }

        res.status(200).json({ status: 'OK' });

    } catch (error) {
        console.error('Error handling Xendit E-Wallet webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Webhook test endpoint untuk development
router.post('/webhook/test', async (req, res) => {
    try {
        console.log('Webhook test endpoint called:', {
            headers: req.headers,
            body: req.body,
            timestamp: new Date().toISOString()
        });

        res.status(200).json({
            status: 'OK',
            message: 'Webhook test received successfully',
            timestamp: new Date().toISOString(),
            received_data: req.body
        });

    } catch (error) {
        console.error('Error in webhook test:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Webhook status endpoint untuk monitoring
router.get('/webhook/status', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Webhook endpoints are active',
        endpoints: {
            invoice: '/payment/webhook/invoice',
            payment: '/payment/webhook/payment',
            virtual_account: '/payment/webhook/va',
            ewallet: '/payment/webhook/ewallet',
            test: '/payment/webhook/test'
        },
        timestamp: new Date().toISOString(),
        server_info: {
            base_url: process.env.BASE_URL,
            environment: process.env.XENDIT_IS_PRODUCTION === 'true' ? 'production' : 'development'
        }
    });
});

// Payment Request V2 webhook endpoints
router.post('/finish', async (req, res) => {
    try {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] Payment Request V2 webhook received (payment.succeeded):`, {
            event: req.body.event,
            payment_id: req.body.data?.id,
            reference_id: req.body.data?.reference_id,
            amount: req.body.data?.amount,
            status: req.body.data?.status
        });

        // Handle payment.succeeded event
        if (req.body.event === 'payment.succeeded' && req.body.data) {
            const paymentData = req.body.data;

            // Extract group info from reference_id if available
            if (paymentData.reference_id) {
                const parts = paymentData.reference_id.split('_');
                if (parts.length >= 3) {
                    const groupId = parts[1] + '@g.us';
                    const amount = paymentData.amount;

                    console.log(`[${timestamp}] Processing Payment Request success for group ${groupId}, amount: IDR ${amount}`);

                    // You can add activation logic here if needed
                    // For now, just log the success
                }
            }
        }

        res.status(200).json({ status: 'OK', message: 'Payment request webhook processed' });

    } catch (error) {
        console.error('Error handling Payment Request webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/unfinish', async (req, res) => {
    try {
        console.log('Payment Request V2 webhook received (unfinish):', req.body);
        res.status(200).json({ status: 'OK', message: 'Unfinish webhook received' });
    } catch (error) {
        console.error('Error handling unfinish webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/pending', async (req, res) => {
    try {
        console.log('Payment Request V2 webhook received (pending):', req.body);
        res.status(200).json({ status: 'OK', message: 'Pending webhook received' });
    } catch (error) {
        console.error('Error handling pending webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/failed', async (req, res) => {
    try {
        console.log('Payment Request V2 webhook received (failed):', req.body);
        res.status(200).json({ status: 'OK', message: 'Failed webhook received' });
    } catch (error) {
        console.error('Error handling failed webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Legacy webhook endpoint untuk backward compatibility
router.post('/notification', async (req, res) => {
    console.log('Legacy webhook endpoint called, redirecting to /webhook/invoice');
    req.url = '/webhook/invoice';
    return router.handle(req, res);
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
                '❌ *Pembayaran Gagal/Expired*\n\n' +
                `**Order ID:** ${orderId}\n\n` +
                '**Status:** Pembayaran dibatalkan atau kadaluarsa\n\n' +
                '🔄 *Untuk mencoba lagi:*\n' +
                '• Gunakan command `!rent pay <durasi>` di grup\n' +
                '• Atau hubungi: 0822-1121-9993 (Angga)\n\n' +
                '💡 *Tips:*\n' +
                '• Pastikan saldo mencukupi\n' +
                '• Coba metode pembayaran lain\n' +
                '• Selesaikan pembayaran dalam 24 jam\n' +
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

// Payment unfinish page
router.get('/unfinish', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>Pembayaran Belum Selesai</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #fffbf0; }
                .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .warning { color: #ffc107; font-size: 24px; margin-bottom: 20px; }
                .info { color: #666; line-height: 1.6; }
                .button { background: #ffc107; color: #212529; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="warning">⚠️ Pembayaran Belum Selesai</div>
                <div class="info">
                    <p>Pembayaran Anda belum diselesaikan.</p>
                    <p>Jika Anda ingin melanjutkan, silakan gunakan command <code>!rent pay</code> lagi di grup.</p>
                    <p>Atau hubungi support untuk bantuan.</p>
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
