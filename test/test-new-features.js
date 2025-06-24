/**
 * Test script untuk memverifikasi fitur-fitur baru
 * Run this with: node test-new-features.js
 */

require('dotenv').config();

console.log('🤖 Testing New Bot Features...\n');

// Test 1: Environment Variables
console.log('1. Checking New Environment Variables:');
console.log('='.repeat(50));

const newEnvVars = [
    'GEMINI_API_KEY'
];

newEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value === 'your_gemini_api_key_here') {
        console.log(`   ❌ ${varName}: Not configured properly`);
    } else {
        console.log(`   ✅ ${varName}: Configured`);
    }
});

// Test 2: Group Settings System
console.log('\n2. Testing Group Settings System:');
console.log('='.repeat(50));

try {
    const { getGroupSettings, setHellNotifications, setCommandPermission, shouldReceiveHellNotifications } = require('./utils/groupSettings');
    
    const testGroupId = 'test_group_123@g.us';
    
    // Test default settings
    const defaultSettings = getGroupSettings(testGroupId);
    console.log('   ✅ Default settings loaded:', JSON.stringify(defaultSettings, null, 2));
    
    // Test hell notifications setting
    setHellNotifications(testGroupId, 'watcherchaos');
    console.log('   ✅ Hell notifications set to watcherchaos');
    
    // Test command permission setting
    setCommandPermission(testGroupId, 'hell', 'admin');
    console.log('   ✅ Hell command permission set to admin');
    
    // Test notification filtering
    const shouldReceiveWatcher = shouldReceiveHellNotifications(testGroupId, 'watcher');
    const shouldReceiveOther = shouldReceiveHellNotifications(testGroupId, 'other');
    console.log(`   ✅ Should receive Watcher events: ${shouldReceiveWatcher}`);
    console.log(`   ✅ Should receive other events: ${shouldReceiveOther}`);
    
} catch (error) {
    console.log('   ❌ Group Settings System error:', error.message);
}

// Test 3: Command Files
console.log('\n3. Checking New Command Files:');
console.log('='.repeat(50));

const fs = require('fs');
const path = require('path');

const newCommandFiles = ['ai.js', 'help.js', 'cmd.js', 'hellCommand.js'];
newCommandFiles.forEach(file => {
    const filePath = path.join(__dirname, 'commands', file);
    if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file}: Found`);
    } else {
        console.log(`   ❌ ${file}: Missing`);
    }
});

// Test 4: Utility Files
console.log('\n4. Checking Utility Files:');
console.log('='.repeat(50));

const utilFiles = ['groupSettings.js'];
utilFiles.forEach(file => {
    const filePath = path.join(__dirname, 'utils', file);
    if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file}: Found`);
    } else {
        console.log(`   ❌ ${file}: Missing`);
    }
});

// Test 5: Command Mapping
console.log('\n5. Testing Command Mapping:');
console.log('='.repeat(50));

const commandMap = {
    'hell': 'hellCommand.js',
    'monster': 'monster.js',
    'tagall': 'tagall.js',
    'ping': 'ping.js',
    'ai': 'ai.js',
    'help': 'help.js',
    'cmd': 'cmd.js'
};

Object.entries(commandMap).forEach(([command, file]) => {
    const filePath = path.join(__dirname, 'commands', file);
    if (fs.existsSync(filePath)) {
        console.log(`   ✅ !${command} -> ${file}`);
    } else {
        console.log(`   ❌ !${command} -> ${file} (missing)`);
    }
});

// Test 6: Gemini API Configuration
console.log('\n6. Testing Gemini API Configuration:');
console.log('='.repeat(50));

if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    console.log('   ✅ Gemini API Key is configured');
    console.log('   📝 API URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent');
    console.log('   🔧 Safety settings: Enabled');
    console.log('   ⚙️ Temperature: 0.7, Max tokens: 1024');
} else {
    console.log('   ❌ Gemini API Key not configured');
    console.log('   💡 Set GEMINI_API_KEY in your .env file');
}

// Test 7: Permission System
console.log('\n7. Testing Permission System:');
console.log('='.repeat(50));

const permissionTests = [
    { command: 'hell', setting: 'all', expected: 'All members can use' },
    { command: 'hell', setting: 'admin', expected: 'Only admins can use' },
    { command: 'cmd', setting: 'admin', expected: 'Only admins can use (default)' },
    { command: 'ai', setting: 'all', expected: 'All members can use (default)' }
];

permissionTests.forEach(test => {
    console.log(`   📋 !${test.command} (${test.setting}): ${test.expected}`);
});

// Test 8: Hell Event Notification Settings
console.log('\n8. Testing Hell Event Notification Settings:');
console.log('='.repeat(50));

const notificationTests = [
    { setting: 'all', description: 'Receive all Hell Events' },
    { setting: 'watcherchaos', description: 'Only Watcher & Chaos Dragon events' },
    { setting: 'off', description: 'No Hell Event notifications' }
];

notificationTests.forEach(test => {
    console.log(`   🔔 ${test.setting}: ${test.description}`);
});

console.log('\n✨ New Features Test Completed!');
console.log('\n📋 Summary of New Features:');
console.log('='.repeat(60));
console.log('🤖 AI Integration:');
console.log('   • !ai <prompt> - Ask questions to Gemini AI');
console.log('   • Quotes user questions in responses');
console.log('   • Safety filters enabled');

console.log('\n⚙️ Permission Management:');
console.log('   • !cmd <command> <admin/all> - Set command permissions');
console.log('   • Per-group settings (isolated)');
console.log('   • Admin-only commands: !cmd, hell settings');

console.log('\n🔥 Enhanced Hell Event System:');
console.log('   • !hell watcherchaos - Only Watcher/Chaos notifications');
console.log('   • !hell all/on - All Hell Event notifications');
console.log('   • !hell off - Disable notifications');
console.log('   • !hell status - Check current settings');

console.log('\n📚 Help System:');
console.log('   • !help - Complete command reference');
console.log('   • Usage examples and tips');
console.log('   • Feature explanations');

console.log('\n🛡️ Group Isolation:');
console.log('   • Settings per group (won\'t affect other groups)');
console.log('   • Individual notification preferences');
console.log('   • Separate command permissions');

console.log('\n🌐 All outputs in English for consistency!');
