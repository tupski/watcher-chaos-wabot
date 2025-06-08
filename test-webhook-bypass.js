require('dotenv').config();
const axios = require('axios');

// Test webhook with signature bypass
async function testWebhookBypass() {
    console.log('🧪 Testing Webhook with Signature Bypass\n');
    
    const BASE_URL = process.env.BASE_URL || 'https://correctly-uncommon-alien.ngrok-free.app';
    
    // Set bypass flag temporarily
    process.env.XENDIT_SKIP_SIGNATURE = 'true';
    
    // Real transaction data
    const webhookData = {
        "id": "6845da671c5db68820dfd57f",
        "external_id": "RENT_120363364063161357_1749408359487",
        "status": "PAID",
        "amount": 50000,
        "paid_at": "2025-06-08T18:46:00.000Z",
        "description": "Sewa Bot Lords Mobile - 1 Bulan (30 Hari)",
        "currency": "IDR",
        "metadata": {
            "group_id": "120363364063161357@g.us",
            "group_name": "Code Tester",
            "duration": "30",
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
    console.log('');
    
    try {
        console.log('📡 Sending webhook to:', `${BASE_URL}/payment/webhook/invoice`);
        console.log('🔓 Signature verification: BYPASSED');
        console.log('');
        
        const response = await axios.post(`${BASE_URL}/payment/webhook/invoice`, webhookData, {
            headers: {
                'Content-Type': 'application/json',
                'X-CALLBACK-TOKEN': 'bypass-token-for-testing',
                'User-Agent': 'Xendit-Webhook/1.0'
            },
            timeout: 15000
        });
        
        console.log('✅ SUCCESS!');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        console.log('');
        console.log('🎉 Bot should now be activated for 30 days!');
        console.log('Check WhatsApp group for confirmation message.');
        
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Response:', error.response.data);
        }
    }
}

// Test manual activation as backup
async function testManualActivation() {
    console.log('🔧 Testing Manual Activation as Backup\n');
    
    const reference = 'RENT_120363364063161357_1749408359487';
    const amount = 50000;
    
    try {
        const { exec } = require('child_process');
        
        console.log('Running manual activation...');
        console.log(`Command: node manual-activate-payment.js ${reference} ${amount}`);
        console.log('');
        
        exec(`node manual-activate-payment.js ${reference} ${amount}`, (error, stdout, stderr) => {
            if (error) {
                console.log('❌ Manual activation failed:', error.message);
                return;
            }
            
            if (stderr) {
                console.log('⚠️  Warnings:', stderr);
            }
            
            console.log('✅ Manual activation output:');
            console.log(stdout);
        });
        
    } catch (error) {
        console.log('❌ Error running manual activation:', error.message);
    }
}

// Main function
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'webhook':
            await testWebhookBypass();
            break;
        case 'manual':
            await testManualActivation();
            break;
        default:
            console.log('🧪 Webhook Testing with Bypass\n');
            console.log('Usage:');
            console.log('  node test-webhook-bypass.js webhook  - Test webhook with signature bypass');
            console.log('  node test-webhook-bypass.js manual   - Test manual activation');
            console.log('');
            console.log('This script temporarily bypasses signature verification for testing.');
            console.log('Make sure to fix signature verification for production use.');
    }
}

// Run the script
main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
});
