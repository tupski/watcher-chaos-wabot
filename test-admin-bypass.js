// Test script to verify admin bypass functionality
require('dotenv').config();

const { isGroupChat, isUserAdmin } = require('./utils/chatUtils');

// Mock objects for testing
const mockClient = {
    getChatById: async (id) => {
        console.log(`Mock: getChatById called with ${id}`);
        return {
            id: { _serialized: id },
            participants: [] // Empty participants to simulate the issue
        };
    },
    getChats: async () => {
        console.log('Mock: getChats called');
        return [];
    }
};

const mockChat = {
    id: { _serialized: '120363364063161357@g.us' },
    name: 'Test Group',
    isGroup: true,
    participants: [] // Empty to simulate the issue
};

const mockContact = {
    id: { _serialized: 'test@c.us' },
    pushname: 'Test User',
    number: '1234567890'
};

async function testAdminBypass() {
    console.log('=== Testing Admin Bypass Functionality ===\n');
    
    console.log('1. Testing group detection...');
    const isGroup = isGroupChat(mockChat);
    console.log(`Is group: ${isGroup}\n`);
    
    console.log('2. Testing admin check with BYPASS_ADMIN_CHECK...');
    console.log(`BYPASS_ADMIN_CHECK = ${process.env.BYPASS_ADMIN_CHECK}`);
    
    const isAdmin = await isUserAdmin(mockClient, mockChat, mockContact);
    console.log(`Is admin: ${isAdmin}\n`);
    
    console.log('3. Environment variables:');
    console.log(`BYPASS_ADMIN_CHECK: ${process.env.BYPASS_ADMIN_CHECK}`);
    console.log(`BOT_OWNER_NUMBER: ${process.env.BOT_OWNER_NUMBER || 'Not set'}`);
    
    console.log('\n=== Test Complete ===');
    
    if (isGroup && isAdmin) {
        console.log('✅ SUCCESS: Group detection and admin bypass working correctly!');
    } else {
        console.log('❌ ISSUE: Something is not working correctly.');
        console.log(`Group detection: ${isGroup ? '✅' : '❌'}`);
        console.log(`Admin bypass: ${isAdmin ? '✅' : '❌'}`);
    }
}

// Run the test
testAdminBypass().catch(console.error);
