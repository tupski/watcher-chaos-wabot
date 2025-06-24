require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN || 'test-token';

// Helper function to create webhook signature
function createWebhookSignature(body) {
    return crypto
        .createHmac('sha256', WEBHOOK_TOKEN)
        .update(JSON.stringify(body))
        .digest('hex');
}

// Test webhook endpoints
async function testWebhookEndpoints() {
    console.log('🧪 Testing Xendit Webhook Endpoints\n');
    console.log('Base URL:', BASE_URL);
    console.log('Webhook Token:', WEBHOOK_TOKEN ? 'SET' : 'NOT SET');
    console.log('');

    const tests = [
        {
            name: 'Webhook Status Check',
            method: 'GET',
            url: `${BASE_URL}/payment/webhook/status`,
            expectStatus: 200
        },
        {
            name: 'Test Webhook Endpoint',
            method: 'POST',
            url: `${BASE_URL}/payment/webhook/test`,
            body: { test: 'data', timestamp: new Date().toISOString() },
            expectStatus: 200
        },
        {
            name: 'Invoice Paid Webhook',
            method: 'POST',
            url: `${BASE_URL}/payment/webhook/invoice`,
            body: {
                id: 'test-invoice-' + Date.now(),
                external_id: 'RENT_1234567890_' + Date.now(),
                status: 'PAID',
                amount: 2000,
                paid_at: new Date().toISOString(),
                metadata: {
                    group_id: '1234567890@g.us',
                    group_name: 'Test Group',
                    duration: '1',
                    owner_id: 'test@test.com',
                    owner_name: 'Test User',
                    owner_number: '081234567890'
                }
            },
            expectStatus: 200
        },
        {
            name: 'Invoice Expired Webhook',
            method: 'POST',
            url: `${BASE_URL}/payment/webhook/invoice`,
            body: {
                id: 'test-invoice-expired-' + Date.now(),
                external_id: 'RENT_1234567890_' + Date.now(),
                status: 'EXPIRED',
                amount: 2000,
                expired_at: new Date().toISOString(),
                metadata: {
                    group_id: '1234567890@g.us',
                    group_name: 'Test Group',
                    duration: '1',
                    owner_id: 'test@test.com',
                    owner_name: 'Test User',
                    owner_number: '081234567890'
                }
            },
            expectStatus: 200
        },
        {
            name: 'Virtual Account Paid Webhook',
            method: 'POST',
            url: `${BASE_URL}/payment/webhook/va`,
            body: {
                event: 'virtual_account.paid',
                id: 'va_test_' + Date.now(),
                external_id: 'RENT_1234567890_' + Date.now(),
                bank_code: 'BCA',
                account_number: '1234567890',
                amount: 2000,
                transaction_timestamp: new Date().toISOString()
            },
            expectStatus: 200
        },
        {
            name: 'E-Wallet Paid Webhook',
            method: 'POST',
            url: `${BASE_URL}/payment/webhook/ewallet`,
            body: {
                event: 'ewallet.payment.paid',
                id: 'ew_test_' + Date.now(),
                external_id: 'RENT_1234567890_' + Date.now(),
                ewallet_type: 'GOPAY',
                amount: 2000,
                transaction_timestamp: new Date().toISOString()
            },
            expectStatus: 200
        }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            console.log(`🔍 Testing: ${test.name}`);
            console.log(`   ${test.method} ${test.url}`);

            const config = {
                method: test.method,
                url: test.url,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (test.body) {
                config.data = test.body;
                // Add webhook signature for POST requests
                const signature = createWebhookSignature(test.body);
                config.headers['x-callback-token'] = signature;
                console.log(`   Signature: ${signature.substring(0, 20)}...`);
            }

            const response = await axios(config);

            if (response.status === test.expectStatus) {
                console.log(`   ✅ PASSED (${response.status})`);
                if (response.data) {
                    console.log(`   Response:`, JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
                }
                passed++;
            } else {
                console.log(`   ❌ FAILED (Expected ${test.expectStatus}, got ${response.status})`);
                failed++;
            }

        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Data:`, error.response.data);
            }
            failed++;
        }

        console.log('');
    }

    // Summary
    console.log('📊 Test Summary:');
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 All webhook endpoints are working correctly!');
    } else {
        console.log('\n⚠️  Some tests failed. Check the errors above.');
    }
}

// Test individual webhook
async function testSingleWebhook(endpoint, eventType = 'paid') {
    console.log(`🧪 Testing Single Webhook: ${endpoint}\n`);

    const webhookBodies = {
        invoice: {
            paid: {
                id: 'test-invoice-' + Date.now(),
                external_id: 'RENT_1234567890_' + Date.now(),
                status: 'PAID',
                amount: 2000,
                paid_at: new Date().toISOString(),
                metadata: {
                    group_id: '1234567890@g.us',
                    duration: '1',
                    owner_id: 'test@test.com'
                }
            },
            expired: {
                id: 'test-invoice-' + Date.now(),
                external_id: 'RENT_1234567890_' + Date.now(),
                status: 'EXPIRED',
                amount: 2000,
                expired_at: new Date().toISOString(),
                metadata: {
                    group_id: '1234567890@g.us',
                    duration: '1',
                    owner_id: 'test@test.com'
                }
            }
        },
        va: {
            paid: {
                event: 'virtual_account.paid',
                id: 'va_test_' + Date.now(),
                external_id: 'RENT_1234567890_' + Date.now(),
                bank_code: 'BCA',
                amount: 2000,
                transaction_timestamp: new Date().toISOString()
            }
        },
        ewallet: {
            paid: {
                event: 'ewallet.payment.paid',
                id: 'ew_test_' + Date.now(),
                external_id: 'RENT_1234567890_' + Date.now(),
                ewallet_type: 'GOPAY',
                amount: 2000,
                transaction_timestamp: new Date().toISOString()
            }
        }
    };

    const body = webhookBodies[endpoint]?.[eventType];
    if (!body) {
        console.log(`❌ Unknown endpoint or event type: ${endpoint}/${eventType}`);
        return;
    }

    try {
        const signature = createWebhookSignature(body);
        const url = `${BASE_URL}/payment/webhook/${endpoint}`;

        console.log(`URL: ${url}`);
        console.log(`Body:`, JSON.stringify(body, null, 2));
        console.log(`Signature: ${signature}`);
        console.log('');

        const response = await axios.post(url, body, {
            headers: {
                'Content-Type': 'application/json',
                'x-callback-token': signature
            }
        });

        console.log(`✅ SUCCESS (${response.status})`);
        console.log(`Response:`, JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
            console.log(`Data:`, JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Main function
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        // Run all tests
        await testWebhookEndpoints();
    } else if (args.length >= 1) {
        // Test specific endpoint
        const endpoint = args[0];
        const eventType = args[1] || 'paid';
        await testSingleWebhook(endpoint, eventType);
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
