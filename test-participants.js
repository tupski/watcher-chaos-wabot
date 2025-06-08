// Script untuk test mengambil participants grup WhatsApp
require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: process.env.WHATSAPP_CLIENT_ID,
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
});

const TARGET_GROUP_ID = '120363364063161357@g.us'; // ID grup Code Tester

client.on('ready', async () => {
    console.log('✅ WhatsApp client ready!');
    console.log('🔍 Testing participant retrieval methods...\n');
    
    try {
        // Method 1: Get chat by ID
        console.log('=== Method 1: getChatById ===');
        const chat = await client.getChatById(TARGET_GROUP_ID);
        console.log(`Chat name: ${chat.name}`);
        console.log(`Chat isGroup: ${chat.isGroup}`);
        console.log(`Chat participants: ${chat.participants ? chat.participants.length : 'undefined'}`);
        
        if (chat.participants && chat.participants.length > 0) {
            console.log('✅ SUCCESS: Found participants via getChatById');
            console.log('First participant:', chat.participants[0]);
            process.exit(0);
        }
        
        // Method 2: Get all chats and find group
        console.log('\n=== Method 2: getChats + filter ===');
        const allChats = await client.getChats();
        console.log(`Total chats: ${allChats.length}`);
        
        const groupChats = allChats.filter(c => c.id._serialized.endsWith('@g.us'));
        console.log(`Group chats: ${groupChats.length}`);
        
        const targetGroup = groupChats.find(c => c.id._serialized === TARGET_GROUP_ID);
        if (targetGroup) {
            console.log(`Target group found: ${targetGroup.name}`);
            console.log(`Target group isGroup: ${targetGroup.isGroup}`);
            console.log(`Target group participants: ${targetGroup.participants ? targetGroup.participants.length : 'undefined'}`);
            
            if (targetGroup.participants && targetGroup.participants.length > 0) {
                console.log('✅ SUCCESS: Found participants via getChats');
                console.log('First participant:', targetGroup.participants[0]);
                process.exit(0);
            }
        }
        
        // Method 3: Try getGroupMetadata
        console.log('\n=== Method 3: getGroupMetadata ===');
        if (client.getGroupMetadata) {
            try {
                const metadata = await client.getGroupMetadata(TARGET_GROUP_ID);
                console.log('Group metadata:', metadata);
                
                if (metadata && metadata.participants) {
                    console.log('✅ SUCCESS: Found participants via getGroupMetadata');
                    console.log(`Participants count: ${metadata.participants.length}`);
                    console.log('First participant:', metadata.participants[0]);
                    process.exit(0);
                }
            } catch (error) {
                console.log('getGroupMetadata error:', error.message);
            }
        } else {
            console.log('getGroupMetadata method not available');
        }
        
        // Method 4: Deep object inspection
        console.log('\n=== Method 4: Deep inspection ===');
        console.log('Chat object keys:', Object.keys(chat));
        
        // Check all properties
        for (const [key, value] of Object.entries(chat)) {
            if (Array.isArray(value) && value.length > 0) {
                console.log(`Array property ${key}: ${value.length} items`);
                
                // Check if it looks like participants
                if (value[0] && (value[0].id || value[0].user)) {
                    console.log('✅ POTENTIAL SUCCESS: Found participant-like array');
                    console.log(`Property: ${key}`);
                    console.log('First item:', value[0]);
                }
            }
            
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                console.log(`Object property ${key}:`, Object.keys(value));
                
                if (value.participants && Array.isArray(value.participants)) {
                    console.log('✅ SUCCESS: Found nested participants');
                    console.log(`Property: ${key}.participants`);
                    console.log(`Count: ${value.participants.length}`);
                    console.log('First participant:', value.participants[0]);
                    process.exit(0);
                }
            }
        }
        
        console.log('\n❌ All methods failed to retrieve participants');
        console.log('This might be due to:');
        console.log('1. WhatsApp Web.js version compatibility');
        console.log('2. WhatsApp Web restrictions');
        console.log('3. Group privacy settings');
        console.log('4. Session/authentication issues');
        
    } catch (error) {
        console.error('Test error:', error);
    }
    
    process.exit(1);
});

client.on('qr', (qr) => {
    console.log('QR Code received, please scan with WhatsApp');
});

client.on('auth_failure', (msg) => {
    console.error('Authentication failed:', msg);
});

console.log('🚀 Starting WhatsApp client...');
client.initialize();
