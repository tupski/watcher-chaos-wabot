require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

// Test with latest transaction data
async function testLatestWebhook() {
    console.log('🧪 Testing Latest Webhook Data\n');
    
    const BASE_URL = process.env.BASE_URL || 'https://correctly-uncommon-alien.ngrok-free.app';
    const WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN;
    
    console.log('Base URL:', BASE_URL);
    console.log('Webhook Token:', WEBHOOK_TOKEN ? 'SET' : 'NOT SET');
    console.log('');
    
    // Latest transaction data (7 days, IDR 12,000)
    const latestWebhookData = {
        "id": "6845dc4c1c5db68820dfd6b6",
        "external_id": "RENT_120363364063161357_1749408844061",
        "status": "PAID",
        "amount": 12000,
        "paid_at": "2025-06-08T18:54:00.000Z",
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
    
    console.log('📋 Latest Transaction Data:');
    console.log('- External ID:', latestWebhookData.external_id);
    console.log('- Amount: IDR', latestWebhookData.amount.toLocaleString('id-ID'));
    console.log('- Status:', latestWebhookData.status);
    console.log('- Group ID:', latestWebhookData.metadata.group_id);
    console.log('- Duration:', latestWebhookData.metadata.duration, 'days');
    console.log('- Owner:', latestWebhookData.metadata.owner_name);
    console.log('');
    
    // Test signature generation
    const rawBody = JSON.stringify(latestWebhookData);
    const signature = crypto
        .createHmac('sha256', WEBHOOK_TOKEN)
        .update(rawBody)
        .digest('hex');
    
    console.log('🔑 Signature Generation:');
    console.log('Raw Body Length:', rawBody.length);
    console.log('Generated Signature:', signature);
    console.log('');
    
    try {
        console.log('📡 Sending webhook to:', `${BASE_URL}/payment/webhook/invoice`);
        
        const response = await axios.post(`${BASE_URL}/payment/webhook/invoice`, latestWebhookData, {
            headers: {
                'Content-Type': 'application/json',
                'X-CALLBACK-TOKEN': signature,
                'User-Agent': 'Xendit-Webhook/1.0'
            },
            timeout: 15000
        });
        
        console.log('✅ SUCCESS!');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        console.log('');
        console.log('🎉 If this works, webhook signature is now fixed!');
        
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Response:', error.response.data);
            
            if (error.response.status === 401) {
                console.log('');
                console.log('💡 Signature still failing. Try these solutions:');
                console.log('1. Update Xendit Dashboard webhook token to:', WEBHOOK_TOKEN);
                console.log('2. Or generate new token and update both .env and Xendit Dashboard');
            }
        }
    }
}

// Test with Buffer format (as received from express.raw)
async function testWithBufferFormat() {
    console.log('🧪 Testing with Buffer Format (Express.raw)\n');
    
    const BASE_URL = process.env.BASE_URL || 'https://correctly-uncommon-alien.ngrok-free.app';
    const WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN;
    
    const webhookData = {
        "id": "6845dc4c1c5db68820dfd6b6",
        "external_id": "RENT_120363364063161357_1749408844061",
        "status": "PAID",
        "amount": 12000,
        "paid_at": "2025-06-08T18:54:00.000Z",
        "metadata": {
            "group_id": "120363364063161357@g.us",
            "duration": "7",
            "owner_id": "6282211219993@c.us"
        }
    };
    
    // Simulate how express.raw() sends data
    const rawBodyString = JSON.stringify(webhookData);
    const rawBodyBuffer = Buffer.from(rawBodyString);
    
    // Create signature with string (as Xendit does)
    const signature = crypto
        .createHmac('sha256', WEBHOOK_TOKEN)
        .update(rawBodyString)
        .digest('hex');
    
    console.log('📋 Buffer Format Test:');
    console.log('Raw Body String:', rawBodyString.substring(0, 100) + '...');
    console.log('Buffer Length:', rawBodyBuffer.length);
    console.log('Signature:', signature);
    console.log('');
    
    try {
        // Send as raw buffer (simulating express.raw)
        const response = await axios.post(`${BASE_URL}/payment/webhook/invoice`, rawBodyBuffer, {
            headers: {
                'Content-Type': 'application/json',
                'X-CALLBACK-TOKEN': signature,
                'User-Agent': 'Xendit-Webhook/1.0'
            },
            timeout: 15000
        });
        
        console.log('✅ SUCCESS with Buffer format!');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ ERROR with Buffer format:', error.message);
        
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Response:', error.response.data);
        }
    }
}

// Test signature verification function directly
function testSignatureFunction() {
    console.log('🔍 Testing Signature Verification Function\n');
    
    const { verifyWebhookSignature } = require('./utils/xenditPayment');
    const WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN;
    
    const testData = {
        "id": "test123",
        "external_id": "RENT_120363364063161357_1749408844061",
        "status": "PAID",
        "amount": 12000
    };
    
    const rawBodyString = JSON.stringify(testData);
    const correctSignature = crypto
        .createHmac('sha256', WEBHOOK_TOKEN)
        .update(rawBodyString)
        .digest('hex');
    
    console.log('Test Data:', rawBodyString);
    console.log('Correct Signature:', correctSignature);
    console.log('');
    
    // Test with string
    const result1 = verifyWebhookSignature(rawBodyString, correctSignature);
    console.log('String verification:', result1 ? '✅ PASS' : '❌ FAIL');
    
    // Test with Buffer
    const rawBodyBuffer = Buffer.from(rawBodyString);
    const result2 = verifyWebhookSignature(rawBodyBuffer, correctSignature);
    console.log('Buffer verification:', result2 ? '✅ PASS' : '❌ FAIL');
    
    // Test with Buffer object (express.raw format)
    const rawBodyBufferObj = {
        type: 'Buffer',
        data: Array.from(rawBodyBuffer)
    };
    const result3 = verifyWebhookSignature(rawBodyBufferObj, correctSignature);
    console.log('Buffer Object verification:', result3 ? '✅ PASS' : '❌ FAIL');
}

// Main function
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'latest':
            await testLatestWebhook();
            break;
        case 'buffer':
            await testWithBufferFormat();
            break;
        case 'function':
            testSignatureFunction();
            break;
        default:
            console.log('🧪 Latest Webhook Testing Tool\n');
            console.log('Usage:');
            console.log('  node test-latest-webhook.js latest    - Test with latest transaction data');
            console.log('  node test-latest-webhook.js buffer    - Test with Buffer format');
            console.log('  node test-latest-webhook.js function  - Test signature verification function');
            console.log('');
            console.log('This tests webhook with the most recent transaction data.');
    }
}

// Run the script
main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
});
