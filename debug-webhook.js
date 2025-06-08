require('dotenv').config();
const express = require('express');
const app = express();

// Middleware to parse JSON and capture raw body
app.use('/webhook-debug', express.raw({ type: 'application/json' }));
app.use(express.json());

const PORT = process.env.PORT || 3001;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

console.log('🔍 Webhook Debug Server Starting...\n');
console.log('Server will run on:', `http://localhost:${PORT}`);
console.log('Debug endpoint:', `${BASE_URL}/webhook-debug`);
console.log('');
console.log('📋 Setup Instructions:');
console.log('1. Add this URL to Xendit Dashboard:');
console.log(`   ${BASE_URL}/webhook-debug`);
console.log('2. Enable events: invoice.paid, invoice.expired, invoice.pending');
console.log('3. Make a test payment');
console.log('4. Watch this console for webhook data');
console.log('');

// Debug webhook endpoint
app.post('/webhook-debug', (req, res) => {
    const timestamp = new Date().toISOString();
    const headers = req.headers;
    const rawBody = req.body;
    
    console.log('🎯 WEBHOOK RECEIVED!');
    console.log('Timestamp:', timestamp);
    console.log('');
    
    console.log('📨 Headers:');
    Object.entries(headers).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
    });
    console.log('');
    
    console.log('📦 Raw Body:');
    console.log(rawBody.toString());
    console.log('');
    
    try {
        const data = JSON.parse(rawBody.toString());
        console.log('📋 Parsed Data:');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
        
        // Extract key information
        console.log('🔑 Key Information:');
        console.log('- Event:', data.event || 'N/A');
        console.log('- ID:', data.id || 'N/A');
        console.log('- External ID:', data.external_id || data.externalId || 'N/A');
        console.log('- Status:', data.status || 'N/A');
        console.log('- Amount:', data.amount || 'N/A');
        console.log('- Paid At:', data.paid_at || data.paidAt || 'N/A');
        console.log('');
        
        // Check metadata
        if (data.metadata) {
            console.log('📊 Metadata:');
            Object.entries(data.metadata).forEach(([key, value]) => {
                console.log(`  ${key}: ${value}`);
            });
            console.log('');
        }
        
        // Signature verification
        const signature = headers['x-callback-token'];
        if (signature) {
            console.log('🔐 Signature Verification:');
            console.log('- Received Signature:', signature);
            
            const crypto = require('crypto');
            const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN;
            
            if (webhookToken) {
                const computedSignature = crypto
                    .createHmac('sha256', webhookToken)
                    .update(rawBody)
                    .digest('hex');
                
                console.log('- Computed Signature:', computedSignature);
                console.log('- Verification:', signature === computedSignature ? '✅ VALID' : '❌ INVALID');
            } else {
                console.log('- Webhook Token: ❌ NOT SET');
            }
            console.log('');
        }
        
        // Generate activation command
        if (data.external_id || data.externalId) {
            const externalId = data.external_id || data.externalId;
            const parts = externalId.split('_');
            
            if (parts.length >= 3) {
                const groupId = parts[1] + '@g.us';
                const amount = data.amount || 0;
                
                console.log('🤖 Manual Activation Commands:');
                console.log('');
                console.log('Option 1 - Script:');
                console.log(`node manual-activate-payment.js ${externalId} ${amount}`);
                console.log('');
                console.log('Option 2 - WhatsApp Command (BOT_OWNER):');
                console.log(`!activate ${groupId} 30 ${amount} "Customer" "081234567890"`);
                console.log('');
            }
        }
        
    } catch (error) {
        console.log('❌ Error parsing JSON:', error.message);
    }
    
    console.log('=' .repeat(80));
    console.log('');
    
    // Respond to Xendit
    res.status(200).json({
        status: 'OK',
        message: 'Webhook received and logged',
        timestamp: timestamp
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Webhook debug server is running',
        timestamp: new Date().toISOString(),
        endpoints: {
            debug: '/webhook-debug',
            health: '/health'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Webhook Debug Server running on port ${PORT}`);
    console.log('');
    console.log('🔗 Test URLs:');
    console.log(`- Health Check: http://localhost:${PORT}/health`);
    console.log(`- Webhook Debug: http://localhost:${PORT}/webhook-debug`);
    console.log('');
    console.log('⏳ Waiting for webhooks...');
    console.log('');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down webhook debug server...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down webhook debug server...');
    process.exit(0);
});
