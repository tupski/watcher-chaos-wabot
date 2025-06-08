const { Xendit } = require('xendit-node');

// Initialize Xendit
const xendit = new Xendit({
    secretKey: process.env.XENDIT_SECRET_KEY
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
 * Create payment invoice using Xendit
 */
async function createPaymentTransaction(groupId, groupName, ownerInfo, duration) {
    try {
        const pricing = PRICING[duration.toString()];
        if (!pricing) {
            throw new Error('Invalid duration');
        }
        
        const orderId = `RENT_${groupId.replace('@g.us', '')}_${Date.now()}`;
        
        // Calculate expiry time (24 hours from now)
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 24);
        
        const invoiceData = {
            externalId: orderId,
            amount: pricing.price,
            description: `Sewa Bot Lords Mobile - ${pricing.name}`,
            invoiceDuration: 86400, // 24 hours in seconds
            customer: {
                givenNames: ownerInfo.name,
                mobileNumber: ownerInfo.number,
                email: `${ownerInfo.number}@lordsmobile.bot`
            },
            customerNotificationPreference: {
                invoiceCreated: ['whatsapp', 'email'],
                invoiceReminder: ['whatsapp', 'email'],
                invoicePaid: ['whatsapp', 'email']
            },
            successRedirectUrl: `${process.env.BASE_URL}/payment/finish`,
            failureRedirectUrl: `${process.env.BASE_URL}/payment/error`,
            currency: 'IDR',
            items: [
                {
                    name: `Sewa Bot Lords Mobile - ${pricing.name}`,
                    quantity: 1,
                    price: pricing.price,
                    category: 'Bot Rental Service'
                }
            ],
            fees: [
                {
                    type: 'Admin Fee',
                    value: 0
                }
            ]
        };

        console.log('Creating Xendit invoice with data:', {
            orderId,
            amount: pricing.price,
            duration: duration + ' days'
        });

        // Add metadata separately as it might not be supported in main data
        const requestData = {
            ...invoiceData,
            metadata: {
                group_id: groupId,
                group_name: groupName,
                duration: duration.toString(),
                owner_id: ownerInfo.id,
                owner_name: ownerInfo.name,
                owner_number: ownerInfo.number
            }
        };

        const invoice = await xendit.Invoice.createInvoice({
            data: requestData
        });
        
        console.log('Xendit invoice created successfully:', {
            id: invoice.id,
            external_id: invoice.externalId,
            invoice_url: invoice.invoiceUrl,
            status: invoice.status
        });

        return {
            success: true,
            orderId: orderId,
            invoiceId: invoice.id,
            paymentUrl: invoice.invoiceUrl,
            expiryDate: invoice.expiryDate,
            pricing: pricing
        };
        
    } catch (error) {
        console.error('Error creating Xendit invoice:', error);
        
        return {
            success: false,
            error: error.message || 'Failed to create payment invoice'
        };
    }
}

/**
 * Create promo payment invoice
 */
async function createPromoPaymentTransaction(groupId, groupName, ownerInfo, duration, customPrice, originalPrice) {
    try {
        const orderId = `PROMO_${groupId.replace('@g.us', '')}_${Date.now()}`;
        const savings = originalPrice - customPrice;
        
        const invoiceData = {
            externalId: orderId,
            amount: customPrice,
            description: `PROMO - Sewa Bot ${duration} Hari (Hemat Rp ${savings.toLocaleString('id-ID')})`,
            invoiceDuration: 86400, // 24 hours
            customer: {
                givenNames: ownerInfo.name,
                mobileNumber: ownerInfo.number,
                email: `${ownerInfo.number}@lordsmobile.bot`
            },
            customerNotificationPreference: {
                invoiceCreated: ['whatsapp', 'email'],
                invoiceReminder: ['whatsapp', 'email'],
                invoicePaid: ['whatsapp', 'email']
            },
            successRedirectUrl: `${process.env.BASE_URL}/payment/finish`,
            failureRedirectUrl: `${process.env.BASE_URL}/payment/error`,
            currency: 'IDR',
            items: [
                {
                    name: `PROMO - Sewa Bot ${duration} Hari`,
                    quantity: 1,
                    price: customPrice,
                    category: 'Bot Rental Service - Promo'
                }
            ],
            fees: [
                {
                    type: 'Discount',
                    value: -savings
                }
            ]
        };

        console.log('Creating Xendit promo invoice:', {
            orderId,
            originalPrice,
            promoPrice: customPrice,
            savings
        });

        // Add metadata separately
        const requestData = {
            ...invoiceData,
            metadata: {
                group_id: groupId,
                group_name: groupName,
                duration: duration.toString(),
                owner_id: ownerInfo.id,
                owner_name: ownerInfo.name,
                owner_number: ownerInfo.number,
                is_promo: 'true',
                original_price: originalPrice.toString(),
                promo_price: customPrice.toString(),
                savings: savings.toString()
            }
        };

        const invoice = await xendit.Invoice.createInvoice({
            data: requestData
        });
        
        return {
            success: true,
            orderId: orderId,
            invoiceId: invoice.id,
            paymentUrl: invoice.invoiceUrl,
            expiryDate: invoice.expiryDate,
            pricing: {
                price: customPrice,
                originalPrice: originalPrice,
                savings: savings,
                days: duration,
                name: `${duration} Hari (PROMO)`
            }
        };
        
    } catch (error) {
        console.error('Error creating Xendit promo invoice:', error);
        
        return {
            success: false,
            error: error.message || 'Failed to create promo payment invoice'
        };
    }
}

/**
 * Verify webhook from Xendit
 */
function verifyWebhookSignature(rawBody, signature) {
    try {
        const crypto = require('crypto');
        const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN;

        if (!webhookToken) {
            console.warn('XENDIT_WEBHOOK_TOKEN not set, skipping signature verification');
            return true; // Allow for development
        }

        // Temporary bypass for testing - remove this in production
        if (process.env.XENDIT_SKIP_SIGNATURE === 'true') {
            console.warn('⚠️  SIGNATURE VERIFICATION BYPASSED FOR TESTING');
            return true;
        }

        // Remove any whitespace/newlines from signature
        const cleanSignature = signature ? signature.trim() : '';

        // Convert rawBody to string if it's a Buffer or object
        let bodyString;
        if (Buffer.isBuffer(rawBody)) {
            bodyString = rawBody.toString();
        } else if (typeof rawBody === 'object' && rawBody.type === 'Buffer') {
            // Handle Buffer object from express.raw()
            bodyString = Buffer.from(rawBody.data).toString();
        } else if (typeof rawBody === 'object') {
            bodyString = JSON.stringify(rawBody);
        } else {
            bodyString = rawBody;
        }

        // Xendit uses HMAC SHA256 with the raw body
        const computedSignature = crypto
            .createHmac('sha256', webhookToken)
            .update(bodyString)
            .digest('hex');

        console.log('Signature verification:', {
            received: cleanSignature,
            computed: computedSignature,
            webhookToken: webhookToken ? 'SET' : 'NOT SET',
            bodyType: typeof rawBody,
            bodyLength: bodyString.length,
            isBuffer: Buffer.isBuffer(rawBody)
        });

        return cleanSignature === computedSignature;
    } catch (error) {
        console.error('Error verifying webhook signature:', error);
        return false;
    }
}

/**
 * Process payment notification from Xendit
 */
async function processPaymentNotification(notification) {
    try {
        console.log('Processing Xendit payment notification:', {
            id: notification.id,
            external_id: notification.external_id,
            status: notification.status,
            amount: notification.amount
        });
        
        return {
            success: true,
            orderId: notification.external_id,
            invoiceId: notification.id,
            status: notification.status,
            amount: notification.amount,
            paidAt: notification.paid_at,
            metadata: notification.metadata || {}
        };
        
    } catch (error) {
        console.error('Error processing payment notification:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get invoice status
 */
async function getInvoiceStatus(invoiceId) {
    try {
        const invoice = await xendit.Invoice.getInvoice({ invoiceId });

        return {
            success: true,
            id: invoice.id,
            external_id: invoice.externalId,
            status: invoice.status,
            amount: invoice.amount,
            paid_at: invoice.paidAt,
            metadata: invoice.metadata
        };

    } catch (error) {
        console.error('Error getting invoice status:', error);
        return {
            success: false,
            error: error.message
        };
    }
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
    const basePrice = 2000;
    
    if (days >= 365) {
        return Math.floor(days * basePrice * 0.7); // 30% discount
    } else if (days >= 180) {
        return Math.floor(days * basePrice * 0.75); // 25% discount
    } else if (days >= 30) {
        return Math.floor(days * basePrice * 0.8); // 20% discount
    } else if (days >= 7) {
        return Math.floor(days * basePrice * 0.9); // 10% discount
    } else {
        return days * basePrice;
    }
}

module.exports = {
    createPaymentTransaction,
    createPromoPaymentTransaction,
    verifyWebhookSignature,
    processPaymentNotification,
    getInvoiceStatus,
    getPricingInfo,
    calculateCustomPrice,
    PRICING
};
