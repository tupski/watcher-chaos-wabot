const midtransClient = require('midtrans-client');

// Initialize Midtrans Snap
const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Pricing configuration
const PRICING = {
    '1': { days: 1, price: 2000, name: '1 Hari' },
    '7': { days: 7, price: 12000, name: '1 Minggu (7 Hari)' },
    '30': { days: 30, price: 50000, name: '1 Bulan (30 Hari)' },
    '180': { days: 180, price: 500000, name: '6 Bulan (180 Hari)' },
    '365': { days: 365, price: 950000, name: '1 Tahun (365 Hari)' }
};

/**
 * Create payment transaction
 */
async function createPaymentTransaction(groupId, groupName, ownerInfo, duration) {
    try {
        const pricing = PRICING[duration.toString()];
        if (!pricing) {
            throw new Error('Invalid duration');
        }
        
        const orderId = `RENT_${groupId.replace('@g.us', '')}_${Date.now()}`;
        
        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: pricing.price
            },
            credit_card: {
                secure: true
            },
            customer_details: {
                first_name: ownerInfo.name,
                phone: ownerInfo.number,
                email: `${ownerInfo.number}@lordsmobile.bot`
            },
            item_details: [
                {
                    id: `RENT_${duration}D`,
                    price: pricing.price,
                    quantity: 1,
                    name: `Sewa Bot Lords Mobile - ${pricing.name}`,
                    category: 'Bot Rental Service'
                }
            ],
            custom_field1: groupId,
            custom_field2: duration.toString(),
            custom_field3: ownerInfo.id,
            callbacks: {
                finish: `${process.env.BASE_URL}/payment/finish`,
                error: `${process.env.BASE_URL}/payment/error`,
                pending: `${process.env.BASE_URL}/payment/pending`
            }
        };
        
        const transaction = await snap.createTransaction(parameter);
        
        return {
            success: true,
            orderId: orderId,
            paymentUrl: transaction.redirect_url,
            token: transaction.token,
            pricing: pricing
        };
        
    } catch (error) {
        console.error('Error creating payment transaction:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Verify payment notification from Midtrans
 */
async function verifyPaymentNotification(notification) {
    try {
        const statusResponse = await snap.transaction.notification(notification);
        
        return {
            success: true,
            orderId: statusResponse.order_id,
            transactionStatus: statusResponse.transaction_status,
            fraudStatus: statusResponse.fraud_status,
            grossAmount: statusResponse.gross_amount,
            customField1: statusResponse.custom_field1, // groupId
            customField2: statusResponse.custom_field2, // duration
            customField3: statusResponse.custom_field3  // ownerInfo.id
        };
        
    } catch (error) {
        console.error('Error verifying payment notification:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Check payment status
 */
async function checkPaymentStatus(orderId) {
    try {
        const statusResponse = await snap.transaction.status(orderId);
        
        return {
            success: true,
            orderId: statusResponse.order_id,
            transactionStatus: statusResponse.transaction_status,
            fraudStatus: statusResponse.fraud_status,
            grossAmount: statusResponse.gross_amount
        };
        
    } catch (error) {
        console.error('Error checking payment status:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Generate payment message for WhatsApp
 */
function generatePaymentMessage(groupName, ownerInfo, duration, paymentUrl, orderId, pricing) {
    const message = 
        '💳 *Pembayaran Sewa Bot Lords Mobile*\n\n' +
        `**Detail Pesanan:**\n` +
        `• Grup: ${groupName}\n` +
        `• Paket: ${pricing.name}\n` +
        `• Durasi: ${pricing.days} hari\n` +
        `• Harga: Rp ${pricing.price.toLocaleString('id-ID')}\n` +
        `• Order ID: ${orderId}\n\n` +
        `**Pemesan:**\n` +
        `• Nama: ${ownerInfo.name}\n` +
        `• Nomor: ${ownerInfo.number}\n\n` +
        '💰 *Metode Pembayaran Tersedia:*\n' +
        '• 📱 QRIS (Scan & Pay)\n' +
        '• 💳 E-Wallet (GoPay, OVO, DANA, ShopeePay)\n' +
        '• 🏦 Transfer Bank (BCA, BNI, BRI, Mandiri)\n' +
        '• 🔢 Virtual Account\n' +
        '• 💳 Kartu Kredit/Debit\n\n' +
        '🔗 *Link Pembayaran:*\n' +
        `${paymentUrl}\n\n` +
        '⏰ *Batas Waktu Pembayaran:*\n' +
        '24 jam setelah link dibuat\n\n' +
        '✅ *Setelah Pembayaran Berhasil:*\n' +
        '• Bot akan aktif otomatis\n' +
        '• Notifikasi konfirmasi dikirim\n' +
        '• Semua fitur langsung tersedia\n\n' +
        '❓ *Butuh Bantuan?*\n' +
        'Hubungi: 0822-1121-9993 (Angga)\n\n' +
        '🔒 *Pembayaran Aman & Terpercaya*\n' +
        'Powered by Midtrans Payment Gateway';
    
    return message;
}

/**
 * Get pricing information
 */
function getPricingInfo() {
    return PRICING;
}

/**
 * Calculate price for custom duration
 */
function calculateCustomPrice(days) {
    // Base price per day
    const basePrice = 2000;
    
    // Apply discounts for longer periods
    if (days >= 365) {
        return Math.floor(days * basePrice * 0.7); // 30% discount for 1+ year
    } else if (days >= 180) {
        return Math.floor(days * basePrice * 0.75); // 25% discount for 6+ months
    } else if (days >= 30) {
        return Math.floor(days * basePrice * 0.8); // 20% discount for 1+ month
    } else if (days >= 7) {
        return Math.floor(days * basePrice * 0.9); // 10% discount for 1+ week
    } else {
        return days * basePrice; // No discount for less than a week
    }
}

module.exports = {
    createPaymentTransaction,
    verifyPaymentNotification,
    checkPaymentStatus,
    generatePaymentMessage,
    getPricingInfo,
    calculateCustomPrice,
    PRICING
};
