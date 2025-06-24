require('dotenv').config();
const { Xendit } = require('xendit-node');

// Initialize Xendit
const xendit = new Xendit({
    secretKey: process.env.XENDIT_SECRET_KEY
});

async function checkWebhookDelivery() {
    console.log('🔍 Checking Webhook Delivery Status\n');
    
    try {
        // Get recent invoices
        console.log('📋 Fetching recent invoices...');
        const invoices = await xendit.Invoice.getInvoices({
            limit: 10
        });
        
        console.log(`Found ${invoices.length} recent invoices:\n`);
        
        for (const invoice of invoices) {
            console.log(`📄 Invoice: ${invoice.id}`);
            console.log(`   External ID: ${invoice.externalId}`);
            console.log(`   Status: ${invoice.status}`);
            console.log(`   Amount: IDR ${invoice.amount}`);
            console.log(`   Created: ${new Date(invoice.created).toLocaleString()}`);
            
            if (invoice.paidAt) {
                console.log(`   Paid At: ${new Date(invoice.paidAt).toLocaleString()}`);
            }
            
            // Check if this is our transaction
            if (invoice.externalId === 'RENT_120363364063161357_1749407210853') {
                console.log('   🎯 THIS IS YOUR TRANSACTION!');
                
                // Try to get webhook delivery info (if available)
                try {
                    console.log('   📡 Checking webhook delivery...');
                    // Note: Xendit doesn't provide direct webhook delivery API
                    // But we can check the invoice details
                    
                    const invoiceDetails = await xendit.Invoice.getInvoice({
                        invoiceId: invoice.id
                    });
                    
                    console.log('   📊 Invoice Details:');
                    console.log(`      Status: ${invoiceDetails.status}`);
                    console.log(`      Paid At: ${invoiceDetails.paidAt || 'Not paid'}`);
                    console.log(`      Metadata:`, invoiceDetails.metadata || 'No metadata');
                    
                } catch (error) {
                    console.log('   ❌ Could not fetch invoice details:', error.message);
                }
            }
            
            console.log('');
        }
        
        // Check webhook configuration
        console.log('🔧 Checking webhook configuration...');
        const webhooks = await xendit.Webhook.getWebhooks();
        
        console.log(`Found ${webhooks.length} configured webhooks:\n`);
        
        for (const webhook of webhooks) {
            console.log(`🔗 Webhook: ${webhook.id}`);
            console.log(`   URL: ${webhook.url}`);
            console.log(`   Status: ${webhook.status}`);
            console.log(`   Events: ${webhook.events ? webhook.events.join(', ') : 'N/A'}`);
            console.log(`   Created: ${webhook.created ? new Date(webhook.created).toLocaleString() : 'N/A'}`);
            
            // Check if this is our webhook
            if (webhook.url && webhook.url.includes('correctly-uncommon-alien.ngrok-free.app')) {
                console.log('   🎯 THIS IS YOUR WEBHOOK!');
                
                // Check if invoice.paid event is enabled
                if (webhook.events && webhook.events.includes('invoice.paid')) {
                    console.log('   ✅ invoice.paid event is enabled');
                } else {
                    console.log('   ❌ invoice.paid event is NOT enabled');
                }
            }
            
            console.log('');
        }
        
    } catch (error) {
        console.error('❌ Error checking webhook delivery:', error.message);
        
        if (error.response && error.response.data) {
            console.error('Error details:', error.response.data);
        }
    }
}

async function checkSpecificInvoice(externalId) {
    console.log(`🔍 Checking specific invoice: ${externalId}\n`);
    
    try {
        // Get all invoices and find the specific one
        const invoices = await xendit.Invoice.getInvoices({
            limit: 100 // Get more invoices to find the specific one
        });
        
        const targetInvoice = invoices.find(inv => inv.externalId === externalId);
        
        if (!targetInvoice) {
            console.log('❌ Invoice not found');
            return;
        }
        
        console.log('✅ Invoice found!');
        console.log(`   ID: ${targetInvoice.id}`);
        console.log(`   External ID: ${targetInvoice.externalId}`);
        console.log(`   Status: ${targetInvoice.status}`);
        console.log(`   Amount: IDR ${targetInvoice.amount}`);
        console.log(`   Created: ${new Date(targetInvoice.created).toLocaleString()}`);
        console.log(`   Paid At: ${targetInvoice.paidAt ? new Date(targetInvoice.paidAt).toLocaleString() : 'Not paid'}`);
        console.log(`   Invoice URL: ${targetInvoice.invoiceUrl}`);
        console.log('');
        
        // Get detailed invoice info
        const invoiceDetails = await xendit.Invoice.getInvoice({
            invoiceId: targetInvoice.id
        });
        
        console.log('📊 Detailed Invoice Information:');
        console.log(JSON.stringify(invoiceDetails, null, 2));
        
    } catch (error) {
        console.error('❌ Error checking specific invoice:', error.message);
    }
}

async function testWebhookConnectivity() {
    console.log('🧪 Testing Webhook Connectivity\n');
    
    const BASE_URL = process.env.BASE_URL;
    if (!BASE_URL) {
        console.log('❌ BASE_URL not set in environment variables');
        return;
    }
    
    const webhookUrl = `${BASE_URL}/payment/webhook/status`;
    
    try {
        const axios = require('axios');
        const response = await axios.get(webhookUrl, {
            timeout: 10000
        });
        
        console.log('✅ Webhook endpoint is accessible');
        console.log(`   URL: ${webhookUrl}`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Response:`, JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ Webhook endpoint is not accessible');
        console.log(`   URL: ${webhookUrl}`);
        console.log(`   Error: ${error.message}`);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('');
            console.log('💡 Solutions:');
            console.log('1. Make sure bot is running: npm start');
            console.log('2. Make sure ngrok is running: ngrok http 3000');
            console.log('3. Update BASE_URL in .env with correct ngrok URL');
        }
    }
}

// Main function
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'delivery':
            await checkWebhookDelivery();
            break;
        case 'invoice':
            const externalId = args[1] || 'RENT_120363364063161357_1749407210853';
            await checkSpecificInvoice(externalId);
            break;
        case 'connectivity':
            await testWebhookConnectivity();
            break;
        default:
            console.log('🔍 Webhook Delivery Checker\n');
            console.log('Usage:');
            console.log('  node check-webhook-delivery.js delivery     - Check webhook delivery status');
            console.log('  node check-webhook-delivery.js invoice [id] - Check specific invoice');
            console.log('  node check-webhook-delivery.js connectivity - Test webhook connectivity');
            console.log('');
            console.log('Examples:');
            console.log('  node check-webhook-delivery.js delivery');
            console.log('  node check-webhook-delivery.js invoice RENT_120363364063161357_1749407210853');
            console.log('  node check-webhook-delivery.js connectivity');
            console.log('');
            console.log('Environment variables required:');
            console.log('  XENDIT_SECRET_KEY - Your Xendit secret key');
            console.log('  BASE_URL - Your webhook base URL');
    }
}

// Run the script
main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
});
