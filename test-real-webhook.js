require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

// Configuration
const BASE_URL = process.env.BASE_URL || 'https://correctly-uncommon-alien.ngrok-free.app';
const WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN;

// Helper function to create webhook signature
function createWebhookSignature(body) {
    return crypto
        .createHmac('sha256', WEBHOOK_TOKEN)
        .update(JSON.stringify(body))
        .digest('hex');
}

// Test with real transaction data
async function testRealWebhook() {
    console.log('🧪 Testing Real Webhook Data\n');
    console.log('Base URL:', BASE_URL);
    console.log('Webhook Token:', WEBHOOK_TOKEN ? 'SET' : 'NOT SET');
    console.log('');

    // Real webhook data based on your transaction
    const realWebhookData = {
        id: '6845d1381c5db68820dfcf2e', // Example invoice ID
        external_id: 'RENT_120363364063161357_1749407210853',
        status: 'PAID',
        amount: 12000,
        paid_at: '2025-06-09T01:27:00.000Z',
        description: 'Sewa Bot Lords Mobile - 1 Minggu (7 Hari)',
        invoice_url: 'https://checkout-staging.xendit.co/web/6845d1381c5db68820dfcf2e',
        expiry_date: '2025-06-10T01:26:00.000Z',
        currency: 'IDR',
        metadata: {
            group_id: '120363364063161357@g.us',
            group_name: 'Test Group',
            duration: '7',
            owner_id: 'test@test.com',
            owner_name: 'Customer',
            owner_number: '081234567890'
        }
    };

    console.log('📋 Real Transaction Data:');
    console.log('- Reference:', realWebhookData.external_id);
    console.log('- Amount: IDR', realWebhookData.amount.toLocaleString('id-ID'));
    console.log('- Status:', realWebhookData.status);
    console.log('- Group ID:', realWebhookData.metadata.group_id);
    console.log('- Duration:', realWebhookData.metadata.duration, 'days');
    console.log('');

    // Test endpoints
    const endpoints = [
        {
            name: 'Invoice Webhook (Primary)',
            url: `${BASE_URL}/payment/webhook/invoice`,
            data: realWebhookData
        },
        {
            name: 'Legacy Notification',
            url: `${BASE_URL}/payment/notification`,
            data: realWebhookData
        },
        {
            name: 'Payment Webhook',
            url: `${BASE_URL}/payment/webhook/payment`,
            data: {
                event: 'payment.paid',
                ...realWebhookData
            }
        }
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`🔍 Testing: ${endpoint.name}`);
            console.log(`   URL: ${endpoint.url}`);

            const signature = createWebhookSignature(endpoint.data);
            console.log(`   Signature: ${signature.substring(0, 20)}...`);

            const response = await axios.post(endpoint.url, endpoint.data, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-callback-token': signature,
                    'User-Agent': 'Xendit-Webhook/1.0'
                },
                timeout: 10000
            });

            console.log(`   ✅ SUCCESS (${response.status})`);
            if (response.data) {
                console.log(`   Response:`, JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
            }

        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                if (error.response.status === 400 && error.response.data) {
                    // Check if it's ngrok error
                    if (typeof error.response.data === 'string' && error.response.data.includes('ngrok')) {
                        console.log('   Issue: Bot server not running or ngrok connection failed');
                        console.log('   Solution: Make sure bot is running with "npm start"');
                    } else {
                        console.log(`   Data:`, error.response.data);
                    }
                }
            }
        }

        console.log('');
    }

    // Test bot status
    console.log('🔍 Testing Bot Status:');
    try {
        const statusResponse = await axios.get(`${BASE_URL}/payment/webhook/status`, {
            timeout: 5000
        });
        console.log('   ✅ Bot is running and accessible');
        console.log('   Response:', JSON.stringify(statusResponse.data, null, 2));
    } catch (error) {
        console.log('   ❌ Bot is not accessible');
        console.log('   Error:', error.message);
        
        if (error.code === 'ECONNREFUSED' || (error.response && error.response.status === 400)) {
            console.log('');
            console.log('💡 Solutions:');
            console.log('1. Start bot server: npm start');
            console.log('2. Make sure ngrok is running: ngrok http 3000');
            console.log('3. Update BASE_URL in .env with correct ngrok URL');
            console.log('4. Restart bot after updating BASE_URL');
        }
    }
}

// Test specific webhook endpoint
async function testSpecificEndpoint(endpointPath) {
    console.log(`🧪 Testing Specific Endpoint: ${endpointPath}\n`);

    const realWebhookData = {
        id: '6845d1381c5db68820dfcf2e',
        external_id: 'RENT_120363364063161357_1749407210853',
        status: 'PAID',
        amount: 12000,
        paid_at: '2025-06-09T01:27:00.000Z',
        metadata: {
            group_id: '120363364063161357@g.us',
            duration: '7',
            owner_id: 'test@test.com'
        }
    };

    try {
        const url = `${BASE_URL}${endpointPath}`;
        const signature = createWebhookSignature(realWebhookData);

        console.log('URL:', url);
        console.log('Data:', JSON.stringify(realWebhookData, null, 2));
        console.log('Signature:', signature);
        console.log('');

        const response = await axios.post(url, realWebhookData, {
            headers: {
                'Content-Type': 'application/json',
                'x-callback-token': signature
            }
        });

        console.log(`✅ SUCCESS (${response.status})`);
        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
            console.log(`Data:`, error.response.data);
        }
    }
}

// Main function
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        // Run all tests
        await testRealWebhook();
    } else {
        // Test specific endpoint
        const endpoint = args[0];
        await testSpecificEndpoint(endpoint);
    }
}

// Run tests
main().then(() => {
    console.log('\n✨ Testing completed.');
    process.exit(0);
}).catch(error => {
    console.error('❌ Testing failed:', error.message);
    process.exit(1);
});
