require('dotenv').config();
const axios = require('axios');

// Test webhook with real data and bypass signature
async function testWebhookWithConfirmation() {
    console.log('🧪 Testing Webhook with Confirmation Messages\n');
    
    const BASE_URL = process.env.BASE_URL || 'https://correctly-uncommon-alien.ngrok-free.app';
    
    // Latest transaction data
    const webhookData = {
        "id": "6845e0031c5db68820dfd984",
        "external_id": "RENT_120363364063161357_1749409795142",
        "status": "PAID",
        "amount": 12000,
        "paid_at": "2025-06-08T19:10:00.000Z",
        "description": "Sewa Bot Lords Mobile - 1 Minggu (7 Hari)",
        "currency": "IDR",
        "metadata": {
            "group_id": "120363364063161357@g.us",
            "group_name": "Code Tester",
            "duration": "7",
            "owner_id": "6282211219993@c.us",
            "owner_name": "Angga Artupas",
            "owner_number": "6282211219993"
        }
    };
    
    console.log('📋 Transaction Data:');
    console.log('- External ID:', webhookData.external_id);
    console.log('- Amount: IDR', webhookData.amount.toLocaleString('id-ID'));
    console.log('- Status:', webhookData.status);
    console.log('- Group ID:', webhookData.metadata.group_id);
    console.log('- Duration:', webhookData.metadata.duration, 'days');
    console.log('- Owner:', webhookData.metadata.owner_name);
    console.log('- Owner ID:', webhookData.metadata.owner_id);
    console.log('');
    
    try {
        console.log('📡 Sending webhook to:', `${BASE_URL}/payment/webhook/invoice`);
        console.log('🔓 Using default test token (will bypass signature verification)');
        console.log('');
        
        const response = await axios.post(`${BASE_URL}/payment/webhook/invoice`, webhookData, {
            headers: {
                'Content-Type': 'application/json',
                'X-CALLBACK-TOKEN': 'tTh7AJ6a88foi0U4bq1sRCXVN5GylgBNRJNEHDv1pvrGsDgt', // Default test token
                'User-Agent': 'Xendit-Webhook/1.0'
            },
            timeout: 15000
        });
        
        console.log('✅ SUCCESS!');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        console.log('');
        console.log('🎉 Check WhatsApp group for confirmation message!');
        console.log('📱 Check owner WhatsApp for payment confirmation!');
        
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Response:', error.response.data);
        }
    }
}

// Test with different payment amounts
async function testMultiplePayments() {
    console.log('🧪 Testing Multiple Payment Scenarios\n');
    
    const BASE_URL = process.env.BASE_URL || 'https://correctly-uncommon-alien.ngrok-free.app';
    
    const testPayments = [
        {
            name: '1 Day Payment',
            data: {
                "id": "test_1day_" + Date.now(),
                "external_id": "RENT_120363364063161357_" + Date.now(),
                "status": "PAID",
                "amount": 2000,
                "paid_at": new Date().toISOString(),
                "metadata": {
                    "group_id": "120363364063161357@g.us",
                    "duration": "1",
                    "owner_id": "6282211219993@c.us",
                    "owner_name": "Angga Artupas"
                }
            }
        },
        {
            name: '7 Days Payment',
            data: {
                "id": "test_7days_" + Date.now(),
                "external_id": "RENT_120363364063161357_" + (Date.now() + 1000),
                "status": "PAID",
                "amount": 12000,
                "paid_at": new Date().toISOString(),
                "metadata": {
                    "group_id": "120363364063161357@g.us",
                    "duration": "7",
                    "owner_id": "6282211219993@c.us",
                    "owner_name": "Angga Artupas"
                }
            }
        },
        {
            name: '30 Days Payment',
            data: {
                "id": "test_30days_" + Date.now(),
                "external_id": "RENT_120363364063161357_" + (Date.now() + 2000),
                "status": "PAID",
                "amount": 50000,
                "paid_at": new Date().toISOString(),
                "metadata": {
                    "group_id": "120363364063161357@g.us",
                    "duration": "30",
                    "owner_id": "6282211219993@c.us",
                    "owner_name": "Angga Artupas"
                }
            }
        }
    ];
    
    for (const payment of testPayments) {
        try {
            console.log(`🔍 Testing: ${payment.name}`);
            console.log(`   Amount: IDR ${payment.data.amount.toLocaleString('id-ID')}`);
            console.log(`   Duration: ${payment.data.metadata.duration} days`);
            
            const response = await axios.post(`${BASE_URL}/payment/webhook/invoice`, payment.data, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CALLBACK-TOKEN': 'tTh7AJ6a88foi0U4bq1sRCXVN5GylgBNRJNEHDv1pvrGsDgt',
                    'User-Agent': 'Xendit-Webhook/1.0'
                },
                timeout: 10000
            });
            
            console.log(`   ✅ SUCCESS (${response.status})`);
            
            // Add delay between requests
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
        }
        
        console.log('');
    }
}

// Test promo payment
async function testPromoPayment() {
    console.log('🧪 Testing Promo Payment\n');
    
    const BASE_URL = process.env.BASE_URL || 'https://correctly-uncommon-alien.ngrok-free.app';
    
    const promoData = {
        "id": "promo_test_" + Date.now(),
        "external_id": "PROMO_120363364063161357_" + Date.now(),
        "status": "PAID",
        "amount": 100, // Promo price
        "paid_at": new Date().toISOString(),
        "description": "PROMO - Sewa Bot 30 Hari (Hemat Rp 49,900)",
        "metadata": {
            "group_id": "120363364063161357@g.us",
            "duration": "30",
            "owner_id": "6282211219993@c.us",
            "owner_name": "Angga Artupas",
            "is_promo": "true",
            "original_price": "50000",
            "promo_price": "100",
            "savings": "49900"
        }
    };
    
    console.log('📋 Promo Payment Data:');
    console.log('- External ID:', promoData.external_id);
    console.log('- Amount: IDR', promoData.amount.toLocaleString('id-ID'));
    console.log('- Original Price: IDR', promoData.metadata.original_price);
    console.log('- Savings: IDR', promoData.metadata.savings);
    console.log('- Duration:', promoData.metadata.duration, 'days');
    console.log('');
    
    try {
        const response = await axios.post(`${BASE_URL}/payment/webhook/invoice`, promoData, {
            headers: {
                'Content-Type': 'application/json',
                'X-CALLBACK-TOKEN': 'tTh7AJ6a88foi0U4bq1sRCXVN5GylgBNRJNEHDv1pvrGsDgt',
                'User-Agent': 'Xendit-Webhook/1.0'
            },
            timeout: 15000
        });
        
        console.log('✅ PROMO PAYMENT SUCCESS!');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        console.log('');
        console.log('🎉 Check WhatsApp for promo confirmation message!');
        
    } catch (error) {
        console.log('❌ PROMO PAYMENT ERROR:', error.message);
        
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Response:', error.response.data);
        }
    }
}

// Main function
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'single':
            await testWebhookWithConfirmation();
            break;
        case 'multiple':
            await testMultiplePayments();
            break;
        case 'promo':
            await testPromoPayment();
            break;
        default:
            console.log('🧪 Webhook Confirmation Testing Tool\n');
            console.log('Usage:');
            console.log('  node test-webhook-with-confirmation.js single    - Test single payment');
            console.log('  node test-webhook-with-confirmation.js multiple  - Test multiple payments');
            console.log('  node test-webhook-with-confirmation.js promo     - Test promo payment');
            console.log('');
            console.log('This tests webhook processing and confirmation messages.');
    }
}

// Run the script
main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
});
