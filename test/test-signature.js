require('dotenv').config();
const crypto = require('crypto');
const axios = require('axios');

// Test signature verification with real Xendit data
function testSignatureVerification() {
    console.log('🔐 Testing Xendit Signature Verification\n');
    
    const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN;
    console.log('Webhook Token:', webhookToken ? 'SET' : 'NOT SET');
    
    if (!webhookToken) {
        console.log('❌ XENDIT_WEBHOOK_TOKEN not set in environment variables');
        return;
    }
    
    // Real webhook data from Xendit (example from their docs)
    const webhookData = {
        "id": "579c8d61f23fa4ca35e52da4",
        "external_id": "invoice_123124123",
        "user_id": "5781d19b2e2385880609791c",
        "is_high": true,
        "payment_method": "BANK_TRANSFER",
        "status": "PAID",
        "merchant_name": "Xendit",
        "amount": 50000,
        "paid_amount": 50000,
        "bank_code": "PERMATA",
        "paid_at": "2016-10-12T08:15:03.404Z",
        "payer_email": "wildan@xendit.co",
        "description": "This is a description",
        "adjusted_received_amount": 47500,
        "fees_paid_amount": 0,
        "updated": "2016-10-10T08:15:03.404Z",
        "created": "2016-10-10T08:15:03.404Z",
        "currency": "IDR",
        "payment_channel": "PERMATA",
        "payment_destination": "888888888888"
    };
    
    // Convert to JSON string (as Xendit sends it)
    const rawBody = JSON.stringify(webhookData);
    
    console.log('📋 Webhook Data:');
    console.log('Raw Body Length:', rawBody.length);
    console.log('Raw Body Preview:', rawBody.substring(0, 100) + '...');
    console.log('');
    
    // Generate signature
    const computedSignature = crypto
        .createHmac('sha256', webhookToken)
        .update(rawBody)
        .digest('hex');
    
    console.log('🔑 Signature Generation:');
    console.log('Webhook Token:', webhookToken);
    console.log('Computed Signature:', computedSignature);
    console.log('');
    
    // Test verification function
    const { verifyWebhookSignature } = require('./utils/xenditPayment');
    const isValid = verifyWebhookSignature(rawBody, computedSignature);
    
    console.log('✅ Verification Result:', isValid ? 'VALID' : 'INVALID');
    console.log('');
    
    return { rawBody, computedSignature, webhookData };
}

// Test with our actual transaction data
function testWithRealTransaction() {
    console.log('🎯 Testing with Real Transaction Data\n');
    
    const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN;
    
    // Our actual transaction data
    const realWebhookData = {
        "id": "6845d5ebfb9505de50189ccf",
        "external_id": "RENT_120363364063161357_1749407210853",
        "status": "PAID",
        "amount": 12000,
        "paid_at": "2025-06-09T01:27:00.000Z",
        "description": "Sewa Bot Lords Mobile - 1 Minggu (7 Hari)",
        "currency": "IDR",
        "metadata": {
            "group_id": "120363364063161357@g.us",
            "duration": "7",
            "owner_id": "test@test.com"
        }
    };
    
    const rawBody = JSON.stringify(realWebhookData);
    
    const computedSignature = crypto
        .createHmac('sha256', webhookToken)
        .update(rawBody)
        .digest('hex');
    
    console.log('📋 Real Transaction:');
    console.log('External ID:', realWebhookData.external_id);
    console.log('Amount: IDR', realWebhookData.amount);
    console.log('Status:', realWebhookData.status);
    console.log('');
    
    console.log('🔑 Signature:');
    console.log('Computed:', computedSignature);
    console.log('');
    
    return { rawBody, computedSignature, webhookData: realWebhookData };
}

// Test webhook endpoint with correct signature
async function testWebhookEndpoint() {
    console.log('🧪 Testing Webhook Endpoint with Correct Signature\n');
    
    const BASE_URL = process.env.BASE_URL || 'https://correctly-uncommon-alien.ngrok-free.app';
    
    // Generate test data with correct signature
    const { rawBody, computedSignature, webhookData } = testWithRealTransaction();
    
    try {
        console.log('📡 Sending webhook to:', `${BASE_URL}/payment/webhook/invoice`);
        console.log('Signature:', computedSignature);
        console.log('');
        
        const response = await axios.post(`${BASE_URL}/payment/webhook/invoice`, webhookData, {
            headers: {
                'Content-Type': 'application/json',
                'X-CALLBACK-TOKEN': computedSignature,
                'User-Agent': 'Xendit-Webhook/1.0'
            },
            timeout: 10000
        });
        
        console.log('✅ SUCCESS!');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Response:', error.response.data);
            
            if (error.response.status === 401) {
                console.log('');
                console.log('💡 Signature verification still failing. Possible causes:');
                console.log('1. XENDIT_WEBHOOK_TOKEN mismatch');
                console.log('2. Raw body parsing issue');
                console.log('3. Signature format difference');
            }
        }
    }
}

// Test different signature formats
function testSignatureFormats() {
    console.log('🔍 Testing Different Signature Formats\n');
    
    const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN;
    const testData = { test: 'data' };
    const rawBody = JSON.stringify(testData);
    
    console.log('Test Data:', rawBody);
    console.log('Webhook Token:', webhookToken);
    console.log('');
    
    // Test different formats
    const formats = [
        {
            name: 'HMAC SHA256 (hex)',
            signature: crypto.createHmac('sha256', webhookToken).update(rawBody).digest('hex')
        },
        {
            name: 'HMAC SHA256 (base64)',
            signature: crypto.createHmac('sha256', webhookToken).update(rawBody).digest('base64')
        },
        {
            name: 'HMAC SHA1 (hex)',
            signature: crypto.createHmac('sha1', webhookToken).update(rawBody).digest('hex')
        }
    ];
    
    formats.forEach(format => {
        console.log(`${format.name}:`, format.signature);
    });
    
    console.log('');
}

// Main function
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'verify':
            testSignatureVerification();
            break;
        case 'real':
            testWithRealTransaction();
            break;
        case 'endpoint':
            await testWebhookEndpoint();
            break;
        case 'formats':
            testSignatureFormats();
            break;
        default:
            console.log('🔐 Xendit Signature Testing Tool\n');
            console.log('Usage:');
            console.log('  node test-signature.js verify    - Test signature verification');
            console.log('  node test-signature.js real      - Test with real transaction data');
            console.log('  node test-signature.js endpoint  - Test webhook endpoint');
            console.log('  node test-signature.js formats   - Test different signature formats');
            console.log('');
            console.log('Environment variables required:');
            console.log('  XENDIT_WEBHOOK_TOKEN - Your webhook verification token');
            console.log('  BASE_URL - Your webhook base URL');
    }
}

// Run the script
main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
});
