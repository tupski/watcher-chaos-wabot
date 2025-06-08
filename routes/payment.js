const express = require('express');
const router = express.Router();
const { verifyWebhookSignature, processPaymentNotification } = require('../utils/xenditPayment');
const { setRentMode, extendRentMode, getAllGroupsSettings, isRentActive } = require('../utils/groupSettings');

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

        // Parse metadata or extract from external_id if metadata is missing
        let groupId, duration, ownerContactId;

        if (metadata && metadata.group_id) {
            groupId = metadata.group_id;
            duration = metadata.duration;
            ownerContactId = metadata.owner_id;
        } else {
            // Fallback: parse from external_id (RENT_groupId_timestamp or PROMO_groupId_timestamp)
            console.log(`[${timestamp}] Metadata missing, parsing from external_id: ${orderId}`);
            const parts = orderId.split('_');
            if (parts.length >= 2) {
                groupId = parts[1] + '@g.us';
                // Default duration based on order type
                if (parts[0] === 'PROMO') {
                    duration = '30'; // Default promo duration
                } else {
                    duration = '7'; // Default duration
                }
                ownerContactId = 'unknown@c.us';
                console.log(`[${timestamp}] Parsed from external_id - Group: ${groupId}, Duration: ${duration}`);
            } else {
                console.error(`[${timestamp}] Cannot parse group info from external_id: ${orderId}`);
                return res.status(400).json({ error: 'Cannot extract group information' });
            }
        }

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

// Payment Method V2 webhooks (/v2/payment_methods)
router.post('/method/created', async (req, res) => {
    try {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] Payment Method V2 webhook received (method.created):`, {
            event: req.body.event,
            method_id: req.body.data?.id,
            type: req.body.data?.type,
            status: req.body.data?.status
        });

        res.status(200).json({ status: 'OK', message: 'Payment method created webhook processed' });

    } catch (error) {
        console.error('Error handling Payment Method created webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/method/activated', async (req, res) => {
    try {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] Payment Method V2 webhook received (method.activated):`, {
            event: req.body.event,
            method_id: req.body.data?.id,
            type: req.body.data?.type,
            status: req.body.data?.status
        });

        res.status(200).json({ status: 'OK', message: 'Payment method activated webhook processed' });

    } catch (error) {
        console.error('Error handling Payment Method activated webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/method/expired', async (req, res) => {
    try {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] Payment Method V2 webhook received (method.expired):`, {
            event: req.body.event,
            method_id: req.body.data?.id,
            type: req.body.data?.type,
            status: req.body.data?.status
        });

        res.status(200).json({ status: 'OK', message: 'Payment method expired webhook processed' });

    } catch (error) {
        console.error('Error handling Payment Method expired webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Payment Requests V3 webhooks (/v3/payment_requests)
router.post('/v3/succeeded', async (req, res) => {
    try {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] Payment Request V3 webhook received (payment.succeeded):`, {
            event: req.body.event,
            payment_id: req.body.data?.id,
            reference_id: req.body.data?.reference_id,
            amount: req.body.data?.amount,
            status: req.body.data?.status
        });

        // Handle V3 payment success
        if (req.body.event === 'payment.succeeded' && req.body.data) {
            const paymentData = req.body.data;

            // Extract group info from reference_id if available
            if (paymentData.reference_id) {
                const parts = paymentData.reference_id.split('_');
                if (parts.length >= 3) {
                    const groupId = parts[1] + '@g.us';
                    const amount = paymentData.amount;

                    console.log(`[${timestamp}] Processing Payment Request V3 success for group ${groupId}, amount: IDR ${amount}`);

                    // Process payment success
                    const { processPaymentNotification } = require('../utils/xenditPayment');
                    const notification = await processPaymentNotification({
                        id: paymentData.id,
                        external_id: paymentData.reference_id,
                        status: 'PAID',
                        amount: paymentData.amount,
                        paid_at: new Date().toISOString(),
                        metadata: {
                            group_id: groupId,
                            duration: parts[0] === 'PROMO' ? '30' : '7', // Default duration
                            owner_id: 'unknown@c.us'
                        }
                    });

                    if (notification.success) {
                        const { handleSuccessfulPayment } = require('../routes/payment');
                        await handleSuccessfulPayment(
                            paymentData.reference_id,
                            groupId,
                            notification.metadata.duration,
                            notification.metadata.owner_id,
                            paymentData.amount
                        );
                        console.log(`[${timestamp}] V3 payment processed successfully for group ${groupId}`);
                    }
                }
            }
        }

        res.status(200).json({ status: 'OK', message: 'Payment request V3 succeeded webhook processed' });

    } catch (error) {
        console.error('Error handling Payment Request V3 succeeded webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/v3/failed', async (req, res) => {
    try {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] Payment Request V3 webhook received (payment.failed):`, {
            event: req.body.event,
            payment_id: req.body.data?.id,
            reference_id: req.body.data?.reference_id,
            amount: req.body.data?.amount,
            status: req.body.data?.status,
            failure_code: req.body.data?.failure_code
        });

        res.status(200).json({ status: 'OK', message: 'Payment request V3 failed webhook processed' });

    } catch (error) {
        console.error('Error handling Payment Request V3 failed webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/v3/pending', async (req, res) => {
    try {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] Payment Request V3 webhook received (payment.pending):`, {
            event: req.body.event,
            payment_id: req.body.data?.id,
            reference_id: req.body.data?.reference_id,
            amount: req.body.data?.amount,
            status: req.body.data?.status
        });

        res.status(200).json({ status: 'OK', message: 'Payment request V3 pending webhook processed' });

    } catch (error) {
        console.error('Error handling Payment Request V3 pending webhook:', error);
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

        // Get owner info with multiple fallback methods
        let ownerInfo = null;

        // Method 1: Try to get from ownerContactId if valid
        if (whatsappClient && ownerContactId && ownerContactId !== 'unknown@c.us') {
            try {
                const contact = await whatsappClient.getContactById(ownerContactId);
                ownerInfo = {
                    name: contact.pushname || contact.number,
                    number: contact.number,
                    id: contact.id._serialized
                };
                console.log('✅ Owner info from contact ID:', ownerInfo);
            } catch (error) {
                console.error('Error getting contact info from ID:', error);
            }
        }

        // Method 2: Try to get from stored payment data
        if (!ownerInfo || ownerInfo.name === 'Unknown') {
            try {
                const paymentData = await getStoredPaymentData(orderId);
                if (paymentData && paymentData.ownerInfo) {
                    ownerInfo = paymentData.ownerInfo;
                    console.log('✅ Owner info from stored payment data:', ownerInfo);
                }
            } catch (error) {
                console.error('Error getting stored payment data:', error);
            }
        }

        // Method 3: Try to get from group participants (find admin who made recent payment)
        if (!ownerInfo || ownerInfo.name === 'Unknown') {
            try {
                ownerInfo = await getOwnerInfoFromGroup(groupId, orderId);
                if (ownerInfo) {
                    console.log('✅ Owner info from group participants:', ownerInfo);
                }
            } catch (error) {
                console.error('Error getting owner info from group:', error);
            }
        }

        // Method 4: Fallback to unknown
        if (!ownerInfo) {
            ownerInfo = {
                name: 'Unknown',
                number: 'unknown',
                id: ownerContactId || 'unknown@c.us'
            };
            console.log('⚠️ Using fallback owner info:', ownerInfo);
        }

        // Check if bot is already active in rent mode
        const isCurrentlyActive = isRentActive(groupId);
        let success = false;
        let finalExpiryDate = null;

        if (isCurrentlyActive) {
            // Extend existing rent
            console.log(`Bot already active, extending rent by ${duration} days`);
            success = extendRentMode(
                groupId,
                parseInt(duration),
                ownerInfo,
                parseInt(amount),
                orderId
            );

            if (success) {
                // Get the new expiry date
                const { getRentStatus } = require('../utils/groupSettings');
                const rentStatus = getRentStatus(groupId);
                finalExpiryDate = rentStatus.rentExpiry;
                console.log(`Rent extended for group: ${groupId} until ${finalExpiryDate.toISOString()}`);
            }
        } else {
            // Activate new rent
            console.log(`Activating new rent for ${duration} days`);
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + parseInt(duration));
            expiryDate.setHours(23, 59, 59, 999);

            success = setRentMode(
                groupId,
                true,
                expiryDate,
                ownerInfo,
                parseInt(duration),
                parseInt(amount),
                orderId
            );

            if (success) {
                finalExpiryDate = expiryDate;
                console.log(`Rent activated for group: ${groupId} until ${finalExpiryDate.toISOString()}`);
            }
        }

        if (success && finalExpiryDate) {
            // Send confirmation to group
            await sendPaymentConfirmation(groupId, orderId, duration, amount, finalExpiryDate, isCurrentlyActive);

            // Send confirmation to owner
            if (ownerContactId && ownerContactId !== 'unknown@c.us') {
                await sendOwnerConfirmation(ownerContactId, orderId, duration, amount, finalExpiryDate, isCurrentlyActive);
            }

            // Send notification to BOT_OWNER
            await sendBotOwnerNotification(groupId, orderId, duration, amount, finalExpiryDate, isCurrentlyActive, ownerInfo);
        } else {
            console.error(`Failed to ${isCurrentlyActive ? 'extend' : 'activate'} rent for group: ${groupId}`);

            // Send notification to BOT_OWNER about failed activation
            await sendBotOwnerFailureNotification(groupId, orderId, duration, amount, ownerInfo);
        }

    } catch (error) {
        console.error('Error handling successful payment:', error);

        // Send error notification to BOT_OWNER
        await sendBotOwnerErrorNotification(orderId, groupId, error.message);
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
async function sendPaymentConfirmation(groupId, orderId, duration, amount, expiryDate, isExtension = false) {
    try {
        if (!whatsappClient) return;

        const chats = await whatsappClient.getChats();
        const chat = chats.find(c => c.id._serialized === groupId);

        if (chat) {
            let confirmMessage;

            if (isExtension) {
                confirmMessage =
                    '🎉 *Pembayaran Berhasil - Sewa Diperpanjang!*\n\n' +
                    `**Order ID:** ${orderId}\n` +
                    `**Durasi Tambahan:** ${duration} hari\n` +
                    `**Harga:** Rp ${parseInt(amount).toLocaleString('id-ID')}\n` +
                    `**Aktif hingga:** ${expiryDate.toLocaleDateString('id-ID')} ${expiryDate.toLocaleTimeString('id-ID')}\n\n` +
                    '✅ *Sewa berhasil diperpanjang!*\n' +
                    'Bot akan tetap aktif dengan semua fitur:\n' +
                    '• 📢 Notifikasi Hell Event otomatis\n' +
                    '• 📅 Info Monster Rotation harian\n' +
                    '• 🤖 AI Assistant\n' +
                    '• 👥 Tag All Members\n' +
                    '• 🛡️ Anti-spam Protection\n\n' +
                    '🚀 *Bot tetap siap digunakan!*\n' +
                    'Ketik `!help` untuk melihat semua command.\n\n' +
                    '📱 *Support:* 0822-1121-9993 (Angga)\n' +
                    'Terima kasih telah memperpanjang sewa Bot Lords Mobile! 🎮';
            } else {
                confirmMessage =
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
            }

            await chat.sendMessage(confirmMessage);
            console.log(`Payment confirmation sent to group: ${groupId} (${isExtension ? 'extension' : 'new activation'})`);
        }

    } catch (error) {
        console.error('Error sending payment confirmation to group:', error);
    }
}

// Send confirmation to owner
async function sendOwnerConfirmation(ownerContactId, orderId, duration, amount, expiryDate, isExtension = false) {
    try {
        if (!whatsappClient) return;

        let ownerMessage;

        if (isExtension) {
            ownerMessage =
                '✅ *Sewa Bot Berhasil Diperpanjang*\n\n' +
                `**Order ID:** ${orderId}\n` +
                `**Durasi Tambahan:** ${duration} hari\n` +
                `**Harga:** Rp ${parseInt(amount).toLocaleString('id-ID')}\n` +
                `**Aktif hingga:** ${expiryDate.toLocaleDateString('id-ID')} ${expiryDate.toLocaleTimeString('id-ID')}\n\n` +
                '🎉 *Sewa bot berhasil diperpanjang!*\n\n' +
                '📧 *Bukti Pembayaran:*\n' +
                'Simpan Order ID ini sebagai bukti pembayaran.\n\n' +
                '🔔 *Notifikasi Perpanjangan:*\n' +
                'Kami akan mengingatkan Anda 3 hari sebelum masa aktif berakhir.\n\n' +
                '📱 *Support & Bantuan:*\n' +
                '0822-1121-9993 (Angga)\n\n' +
                'Terima kasih telah memperpanjang layanan kami! 🙏';
        } else {
            ownerMessage =
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
        }

        await whatsappClient.sendMessage(ownerContactId, ownerMessage);
        console.log(`Owner confirmation sent to: ${ownerContactId} (${isExtension ? 'extension' : 'new activation'})`);

    } catch (error) {
        console.error('Error sending owner confirmation:', error);
    }
}

// Get stored payment data from file
async function getStoredPaymentData(orderId) {
    try {
        const fs = require('fs');
        const path = require('path');
        const paymentDataFile = path.join(__dirname, '..', 'data', 'payment_data.json');

        if (fs.existsSync(paymentDataFile)) {
            const data = JSON.parse(fs.readFileSync(paymentDataFile, 'utf8'));
            return data[orderId] || null;
        }
        return null;
    } catch (error) {
        console.error('Error reading stored payment data:', error);
        return null;
    }
}

// Store payment data when creating payment
async function storePaymentData(orderId, paymentData) {
    try {
        const fs = require('fs');
        const path = require('path');
        const paymentDataFile = path.join(__dirname, '..', 'data', 'payment_data.json');

        let data = {};
        if (fs.existsSync(paymentDataFile)) {
            data = JSON.parse(fs.readFileSync(paymentDataFile, 'utf8'));
        }

        data[orderId] = {
            ...paymentData,
            createdAt: new Date().toISOString()
        };

        // Ensure data directory exists
        const dataDir = path.dirname(paymentDataFile);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(paymentDataFile, JSON.stringify(data, null, 2));
        console.log('✅ Payment data stored for order:', orderId);
        return true;
    } catch (error) {
        console.error('Error storing payment data:', error);
        return false;
    }
}

// Get owner info from group participants
async function getOwnerInfoFromGroup(groupId, orderId) {
    try {
        if (!whatsappClient) return null;

        const chats = await whatsappClient.getChats();
        const chat = chats.find(c => c.id._serialized === groupId);

        if (!chat || !chat.isGroup) return null;

        // Get participants
        const participants = await chat.getParticipants();
        console.log(`Found ${participants.length} participants in group`);

        // Look for admins first (more likely to be the payer)
        const admins = participants.filter(p => p.isAdmin || p.isSuperAdmin);
        console.log(`Found ${admins.length} admins in group`);

        // Try to get contact info for admins
        for (const admin of admins) {
            try {
                const contact = await whatsappClient.getContactById(admin.id._serialized);
                if (contact && contact.pushname && contact.pushname !== 'Unknown') {
                    return {
                        name: contact.pushname || contact.number,
                        number: contact.number,
                        id: contact.id._serialized
                    };
                }
            } catch (error) {
                console.error('Error getting admin contact:', error);
                continue;
            }
        }

        // If no admin found, try first few participants
        for (let i = 0; i < Math.min(3, participants.length); i++) {
            try {
                const participant = participants[i];
                const contact = await whatsappClient.getContactById(participant.id._serialized);
                if (contact && contact.pushname && contact.pushname !== 'Unknown') {
                    return {
                        name: contact.pushname || contact.number,
                        number: contact.number,
                        id: contact.id._serialized
                    };
                }
            } catch (error) {
                console.error('Error getting participant contact:', error);
                continue;
            }
        }

        return null;
    } catch (error) {
        console.error('Error getting owner info from group:', error);
        return null;
    }
}

// Send notification to BOT_OWNER about successful payment
async function sendBotOwnerNotification(groupId, orderId, duration, amount, expiryDate, isExtension, ownerInfo) {
    try {
        const botOwnerNumber = process.env.BOT_OWNER_NUMBER;
        if (!whatsappClient || !botOwnerNumber) return;

        const botOwnerContactId = `${botOwnerNumber}@c.us`;

        // Get group name
        let groupName = 'Unknown Group';
        try {
            const chats = await whatsappClient.getChats();
            const chat = chats.find(c => c.id._serialized === groupId);
            if (chat) {
                groupName = chat.name;
            }
        } catch (error) {
            console.error('Error getting group name for BOT_OWNER notification:', error);
        }

        const notificationMessage =
            '💰 *Pembayaran Berhasil Diterima*\n\n' +
            `**Order ID:** ${orderId}\n` +
            `**Grup:** ${groupName}\n` +
            `**Group ID:** ${groupId}\n` +
            `**Tipe:** ${isExtension ? 'Perpanjangan' : 'Aktivasi Baru'}\n` +
            `**Durasi:** ${duration} hari\n` +
            `**Harga:** Rp ${parseInt(amount).toLocaleString('id-ID')}\n` +
            `**Aktif hingga:** ${expiryDate.toLocaleDateString('id-ID')} ${expiryDate.toLocaleTimeString('id-ID')}\n\n` +
            '👤 *Info Pembeli:*\n' +
            `• Nama: ${ownerInfo.name}\n` +
            `• Nomor: ${ownerInfo.number}\n` +
            `• ID: ${ownerInfo.id}\n\n` +
            `✅ *Status:* Bot ${isExtension ? 'diperpanjang' : 'diaktifkan'} otomatis\n\n` +
            '📊 *Dashboard:* Gunakan `!grouprent` untuk melihat semua grup';

        await whatsappClient.sendMessage(botOwnerContactId, notificationMessage);
        console.log(`BOT_OWNER notification sent for order: ${orderId}`);

    } catch (error) {
        console.error('Error sending BOT_OWNER notification:', error);
    }
}

// Send notification to BOT_OWNER about failed activation
async function sendBotOwnerFailureNotification(groupId, orderId, duration, amount, ownerInfo) {
    try {
        const botOwnerNumber = process.env.BOT_OWNER_NUMBER;
        if (!whatsappClient || !botOwnerNumber) return;

        const botOwnerContactId = `${botOwnerNumber}@c.us`;

        // Get group name
        let groupName = 'Unknown Group';
        try {
            const chats = await whatsappClient.getChats();
            const chat = chats.find(c => c.id._serialized === groupId);
            if (chat) {
                groupName = chat.name;
            }
        } catch (error) {
            console.error('Error getting group name for failure notification:', error);
        }

        const failureMessage =
            '⚠️ *Pembayaran Berhasil Tapi Bot Tidak Aktif*\n\n' +
            `**Order ID:** ${orderId}\n` +
            `**Grup:** ${groupName}\n` +
            `**Group ID:** ${groupId}\n` +
            `**Durasi:** ${duration} hari\n` +
            `**Harga:** Rp ${parseInt(amount).toLocaleString('id-ID')}\n\n` +
            '👤 *Info Pembeli:*\n' +
            `• Nama: ${ownerInfo.name}\n` +
            `• Nomor: ${ownerInfo.number}\n` +
            `• ID: ${ownerInfo.id}\n\n` +
            '❌ *Masalah:* Bot gagal diaktifkan otomatis\n' +
            '🔧 *Tindakan:* Perlu aktivasi manual\n\n' +
            '💡 *Solusi:*\n' +
            '• Gunakan `!activate` di grup tersebut\n' +
            '• Atau hubungi customer untuk konfirmasi';

        await whatsappClient.sendMessage(botOwnerContactId, failureMessage);
        console.log(`BOT_OWNER failure notification sent for order: ${orderId}`);

    } catch (error) {
        console.error('Error sending BOT_OWNER failure notification:', error);
    }
}

// Send error notification to BOT_OWNER
async function sendBotOwnerErrorNotification(orderId, groupId, errorMessage) {
    try {
        const botOwnerNumber = process.env.BOT_OWNER_NUMBER;
        if (!whatsappClient || !botOwnerNumber) return;

        const botOwnerContactId = `${botOwnerNumber}@c.us`;

        const errorNotification =
            '🚨 *Error Saat Memproses Pembayaran*\n\n' +
            `**Order ID:** ${orderId}\n` +
            `**Group ID:** ${groupId}\n` +
            `**Error:** ${errorMessage}\n\n` +
            '⚠️ *Perlu penanganan manual*\n' +
            'Periksa log server untuk detail lebih lanjut.';

        await whatsappClient.sendMessage(botOwnerContactId, errorNotification);
        console.log(`BOT_OWNER error notification sent for order: ${orderId}`);

    } catch (error) {
        console.error('Error sending BOT_OWNER error notification:', error);
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
