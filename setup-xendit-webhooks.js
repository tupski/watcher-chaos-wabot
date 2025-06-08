require('dotenv').config();
const { Xendit } = require('xendit-node');

// Initialize Xendit
const xendit = new Xendit({
    secretKey: process.env.XENDIT_SECRET_KEY
});

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN || 'default-webhook-token';

async function setupWebhooks() {
    console.log('🔧 Setting up Xendit Webhooks\n');
    console.log('Base URL:', BASE_URL);
    console.log('Secret Key:', process.env.XENDIT_SECRET_KEY ? 'SET' : 'NOT SET');
    console.log('Webhook Token:', WEBHOOK_TOKEN);
    console.log('');

    if (!process.env.XENDIT_SECRET_KEY) {
        console.log('❌ XENDIT_SECRET_KEY not found in environment variables');
        console.log('Please add XENDIT_SECRET_KEY to your .env file');
        return;
    }

    if (!BASE_URL || BASE_URL === 'http://localhost:3000') {
        console.log('⚠️  Using localhost URL. This will not work for actual webhooks.');
        console.log('Please set BASE_URL to your ngrok or production domain');
        console.log('Example: BASE_URL=https://abc123.ngrok.io');
        console.log('');
    }

    try {
        // Define webhooks to create
        const webhooksToCreate = [
            {
                name: 'Bot Lords Mobile - Invoice Events',
                url: `${BASE_URL}/payment/webhook/invoice`,
                events: ['invoice.paid', 'invoice.expired', 'invoice.pending']
            },
            {
                name: 'Bot Lords Mobile - Virtual Account Events',
                url: `${BASE_URL}/payment/webhook/va`,
                events: ['virtual_account.paid', 'virtual_account.expired']
            },
            {
                name: 'Bot Lords Mobile - E-Wallet Events',
                url: `${BASE_URL}/payment/webhook/ewallet`,
                events: ['ewallet.payment.paid', 'ewallet.payment.failed']
            }
        ];

        console.log('📋 Webhooks to create:');
        webhooksToCreate.forEach((webhook, index) => {
            console.log(`${index + 1}. ${webhook.name}`);
            console.log(`   URL: ${webhook.url}`);
            console.log(`   Events: ${webhook.events.join(', ')}`);
            console.log('');
        });

        // Get existing webhooks
        console.log('🔍 Checking existing webhooks...');
        let existingWebhooks = [];
        
        try {
            existingWebhooks = await xendit.Webhook.getWebhooks();
            console.log(`Found ${existingWebhooks.length} existing webhooks`);
            
            if (existingWebhooks.length > 0) {
                console.log('Existing webhooks:');
                existingWebhooks.forEach((webhook, index) => {
                    console.log(`${index + 1}. ${webhook.url} (${webhook.status})`);
                });
                console.log('');
            }
        } catch (error) {
            console.log('Could not fetch existing webhooks:', error.message);
        }

        // Create new webhooks
        console.log('🚀 Creating webhooks...');
        
        for (const webhookConfig of webhooksToCreate) {
            try {
                // Check if webhook already exists
                const existingWebhook = existingWebhooks.find(w => w.url === webhookConfig.url);
                
                if (existingWebhook) {
                    console.log(`⏭️  Webhook already exists: ${webhookConfig.url}`);
                    console.log(`   Status: ${existingWebhook.status}`);
                    console.log(`   ID: ${existingWebhook.id}`);
                    continue;
                }

                const webhookData = {
                    url: webhookConfig.url,
                    events: webhookConfig.events
                };

                const webhook = await xendit.Webhook.createWebhook(webhookData);
                
                console.log(`✅ Created webhook: ${webhookConfig.name}`);
                console.log(`   URL: ${webhook.url}`);
                console.log(`   ID: ${webhook.id}`);
                console.log(`   Status: ${webhook.status}`);
                console.log(`   Events: ${webhook.events.join(', ')}`);
                console.log('');

            } catch (error) {
                console.log(`❌ Failed to create webhook: ${webhookConfig.name}`);
                console.log(`   Error: ${error.message}`);
                
                if (error.response && error.response.data) {
                    console.log(`   Details:`, error.response.data);
                }
                console.log('');
            }
        }

        console.log('✨ Webhook setup completed!');
        console.log('');
        console.log('📝 Next steps:');
        console.log('1. Test webhooks with: node test-webhook.js');
        console.log('2. Test payment flow with: !rent pay 1');
        console.log('3. Monitor webhook delivery in Xendit Dashboard');

    } catch (error) {
        console.error('❌ Error setting up webhooks:', error.message);
        
        if (error.response && error.response.data) {
            console.error('Error details:', error.response.data);
        }
    }
}

async function listWebhooks() {
    console.log('📋 Listing Xendit Webhooks\n');

    try {
        const webhooks = await xendit.Webhook.getWebhooks();

        if (webhooks.length === 0) {
            console.log('No webhooks found.');
            return;
        }

        console.log(`Found ${webhooks.length} webhooks:\n`);

        webhooks.forEach((webhook, index) => {
            console.log(`${index + 1}. Webhook ID: ${webhook.id}`);
            console.log(`   URL: ${webhook.url}`);
            console.log(`   Status: ${webhook.status}`);
            console.log(`   Events: ${webhook.events ? webhook.events.join(', ') : 'N/A'}`);
            console.log(`   Created: ${webhook.created ? new Date(webhook.created).toLocaleString() : 'N/A'}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error listing webhooks:', error.message);
    }
}

async function deleteWebhook(webhookId) {
    console.log(`🗑️  Deleting webhook: ${webhookId}\n`);

    try {
        await xendit.Webhook.deleteWebhook({ webhookId });
        
        console.log('✅ Webhook deleted successfully');

    } catch (error) {
        console.error('❌ Error deleting webhook:', error.message);
    }
}

async function testWebhookConnection() {
    console.log('🧪 Testing Webhook Connection\n');

    const testUrl = `${BASE_URL}/payment/webhook/status`;
    
    try {
        const axios = require('axios');
        const response = await axios.get(testUrl);
        
        console.log('✅ Webhook endpoint is accessible');
        console.log(`Status: ${response.status}`);
        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log('❌ Webhook endpoint is not accessible');
        console.log(`URL: ${testUrl}`);
        console.log(`Error: ${error.message}`);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('');
            console.log('💡 Possible solutions:');
            console.log('1. Make sure your bot server is running (node index.js)');
            console.log('2. Check if BASE_URL is correct');
            console.log('3. If using ngrok, make sure ngrok is running');
        }
    }
}

// Main function
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'setup':
            await setupWebhooks();
            break;
        case 'list':
            await listWebhooks();
            break;
        case 'delete':
            const webhookId = args[1];
            if (!webhookId) {
                console.log('❌ Please provide webhook ID to delete');
                console.log('Usage: node setup-xendit-webhooks.js delete <webhook_id>');
                return;
            }
            await deleteWebhook(webhookId);
            break;
        case 'test':
            await testWebhookConnection();
            break;
        default:
            console.log('🔧 Xendit Webhook Setup Tool\n');
            console.log('Usage:');
            console.log('  node setup-xendit-webhooks.js setup   - Create webhooks');
            console.log('  node setup-xendit-webhooks.js list    - List existing webhooks');
            console.log('  node setup-xendit-webhooks.js delete <id> - Delete webhook');
            console.log('  node setup-xendit-webhooks.js test    - Test webhook connection');
            console.log('');
            console.log('Environment variables required:');
            console.log('  XENDIT_SECRET_KEY - Your Xendit secret key');
            console.log('  BASE_URL - Your webhook base URL (ngrok or domain)');
            console.log('  XENDIT_WEBHOOK_TOKEN - Webhook verification token');
    }
}

// Run the script
main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
});
