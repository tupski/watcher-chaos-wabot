require('dotenv').config();
const crypto = require('crypto');

function generateWebhookToken() {
    console.log('🔑 Xendit Webhook Token Generator\n');
    
    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    console.log('Generated Webhook Token:');
    console.log(token);
    console.log('');
    
    console.log('📋 Setup Instructions:');
    console.log('');
    console.log('1. Copy the token above');
    console.log('2. Update your .env file:');
    console.log(`   XENDIT_WEBHOOK_TOKEN=${token}`);
    console.log('');
    console.log('3. Update Xendit Dashboard:');
    console.log('   - Go to Settings → Webhooks');
    console.log('   - Find your webhook URL');
    console.log('   - Update Verification Token with the token above');
    console.log('');
    console.log('4. Restart your bot:');
    console.log('   - Stop current bot (Ctrl+C)');
    console.log('   - Start again: npm start');
    console.log('');
    
    return token;
}

function checkCurrentToken() {
    console.log('🔍 Current Webhook Token Configuration\n');
    
    const currentToken = process.env.XENDIT_WEBHOOK_TOKEN;
    
    if (currentToken) {
        console.log('Current Token:', currentToken);
        console.log('Token Length:', currentToken.length);
        console.log('Token Type:', typeof currentToken);
        console.log('');
        
        // Test signature generation with current token
        const testData = { test: 'data' };
        const rawBody = JSON.stringify(testData);
        
        const signature = crypto
            .createHmac('sha256', currentToken)
            .update(rawBody)
            .digest('hex');
        
        console.log('Test Signature Generation:');
        console.log('Test Data:', rawBody);
        console.log('Generated Signature:', signature);
        console.log('');
        
    } else {
        console.log('❌ XENDIT_WEBHOOK_TOKEN not set in environment variables');
        console.log('');
        console.log('💡 Solution:');
        console.log('1. Generate a new token: node generate-webhook-token.js generate');
        console.log('2. Add it to your .env file');
        console.log('3. Update Xendit Dashboard with the same token');
    }
}

function validateTokenFormat(token) {
    console.log(`🔍 Validating Token Format: ${token}\n`);
    
    // Check token format
    const isHex = /^[a-f0-9]+$/i.test(token);
    const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(token);
    const isAlphanumeric = /^[A-Za-z0-9]+$/.test(token);
    
    console.log('Token Analysis:');
    console.log('- Length:', token.length);
    console.log('- Is Hex:', isHex);
    console.log('- Is Base64:', isBase64);
    console.log('- Is Alphanumeric:', isAlphanumeric);
    console.log('');
    
    // Recommendations
    if (token.length < 32) {
        console.log('⚠️  Token is too short. Recommended: 32+ characters');
    } else {
        console.log('✅ Token length is good');
    }
    
    if (isHex && token.length === 64) {
        console.log('✅ Token appears to be a 32-byte hex string (recommended)');
    } else if (isBase64) {
        console.log('✅ Token appears to be base64 encoded');
    } else if (isAlphanumeric) {
        console.log('✅ Token is alphanumeric');
    } else {
        console.log('⚠️  Token contains special characters');
    }
}

function testWithXenditExample() {
    console.log('🧪 Testing with Xendit Example Data\n');
    
    const currentToken = process.env.XENDIT_WEBHOOK_TOKEN;
    
    if (!currentToken) {
        console.log('❌ XENDIT_WEBHOOK_TOKEN not set');
        return;
    }
    
    // Example webhook data from Xendit documentation
    const exampleData = {
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
    
    const rawBody = JSON.stringify(exampleData);
    
    console.log('Example Data:');
    console.log('External ID:', exampleData.external_id);
    console.log('Status:', exampleData.status);
    console.log('Amount:', exampleData.amount);
    console.log('');
    
    console.log('Raw Body:');
    console.log('Length:', rawBody.length);
    console.log('Preview:', rawBody.substring(0, 100) + '...');
    console.log('');
    
    const signature = crypto
        .createHmac('sha256', currentToken)
        .update(rawBody)
        .digest('hex');
    
    console.log('Generated Signature:');
    console.log(signature);
    console.log('');
    
    console.log('💡 Use this signature to test webhook manually:');
    console.log(`curl -X POST ${process.env.BASE_URL}/payment/webhook/invoice \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -H "X-CALLBACK-TOKEN: ${signature}" \\`);
    console.log(`  -d '${rawBody.substring(0, 100)}...'`);
}

// Main function
function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'generate':
            generateWebhookToken();
            break;
        case 'check':
            checkCurrentToken();
            break;
        case 'validate':
            const token = args[1] || process.env.XENDIT_WEBHOOK_TOKEN;
            if (token) {
                validateTokenFormat(token);
            } else {
                console.log('❌ No token provided. Usage: node generate-webhook-token.js validate <token>');
            }
            break;
        case 'test':
            testWithXenditExample();
            break;
        default:
            console.log('🔑 Xendit Webhook Token Management\n');
            console.log('Usage:');
            console.log('  node generate-webhook-token.js generate  - Generate new webhook token');
            console.log('  node generate-webhook-token.js check     - Check current token configuration');
            console.log('  node generate-webhook-token.js validate [token] - Validate token format');
            console.log('  node generate-webhook-token.js test      - Test signature with example data');
            console.log('');
            console.log('Examples:');
            console.log('  node generate-webhook-token.js generate');
            console.log('  node generate-webhook-token.js check');
            console.log('  node generate-webhook-token.js validate abc123def456');
            console.log('  node generate-webhook-token.js test');
    }
}

// Run the script
main();
