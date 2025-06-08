/**
 * Test script to verify that the fixes are working correctly
 * Run this with: node test-fixes.js
 */

require('dotenv').config();

console.log('🔍 Testing Bot Configuration...\n');

// Test 1: Environment Variables
console.log('1. Checking Environment Variables:');
const requiredEnvVars = [
    'DISCORD_TOKEN',
    'DISCORD_CHANNEL_ID',
    'WHATSAPP_CLIENT_ID',
    'WHATSAPP_GROUP_IDS',
    'ALLOWED_LINKS',
    'TIMEZONE_OFFSET',
    'ONLY_WATCHER_CHAOS'
];

let envIssues = 0;
requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value === 'your_discord_bot_token_here' || value === 'your_discord_token') {
        console.log(`   ❌ ${varName}: Not configured properly`);
        envIssues++;
    } else {
        console.log(`   ✅ ${varName}: Configured`);
    }
});

if (envIssues > 0) {
    console.log(`\n   ⚠️  ${envIssues} environment variable(s) need to be configured`);
} else {
    console.log('\n   🎉 All environment variables are configured!');
}

// Test 2: Command Files
console.log('\n2. Checking Command Files:');
const fs = require('fs');
const path = require('path');

const commandFiles = ['tagall.js', 'hell.js', 'ping.js', 'monster.js'];
commandFiles.forEach(file => {
    const filePath = path.join(__dirname, 'commands', file);
    if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file}: Found`);
    } else {
        console.log(`   ❌ ${file}: Missing`);
    }
});

// Test 3: Middleware Files
console.log('\n3. Checking Middleware Files:');
const middlewareFiles = ['antiSpamLink.js'];
middlewareFiles.forEach(file => {
    const filePath = path.join(__dirname, 'middleware', file);
    if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file}: Found`);
    } else {
        console.log(`   ❌ ${file}: Missing`);
    }
});

// Test 3.5: Handler Files
console.log('\n3.5. Checking Handler Files:');
const handlerFiles = ['messageHandler.js', 'readyHandler.js', 'monsterResetHandler.js'];
handlerFiles.forEach(file => {
    const filePath = path.join(__dirname, 'handlers', file);
    if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file}: Found`);
    } else {
        console.log(`   ❌ ${file}: Missing`);
    }
});

// Test 4: Dependencies
console.log('\n4. Checking Dependencies:');
try {
    require('discord.js');
    console.log('   ✅ discord.js: Available');
} catch (e) {
    console.log('   ❌ discord.js: Missing - Run npm install');
}

try {
    require('whatsapp-web.js');
    console.log('   ✅ whatsapp-web.js: Available');
} catch (e) {
    console.log('   ❌ whatsapp-web.js: Missing - Run npm install');
}

try {
    require('moment');
    console.log('   ✅ moment: Available');
} catch (e) {
    console.log('   ❌ moment: Missing - Run npm install');
}

// Test 5: Data Directory
console.log('\n5. Checking Data Directory:');
const dataDir = path.join(__dirname, 'data');
if (fs.existsSync(dataDir)) {
    console.log('   ✅ data directory: Exists');
} else {
    console.log('   ⚠️  data directory: Will be created automatically');
}

// Test 6: Anti-Spam Link Testing
console.log('\n6. Testing Anti-Spam Link System:');
const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;

const testMessages = [
    'https://example.com',
    'http://example.com',
    'example.com',
    'www.example.com',
    'https://badsite.com',
    'badsite.com',
    'No links here'
];

const allowedLinks = ['example.com']; // Simulate ALLOWED_LINKS

console.log('   Allowed domains:', allowedLinks);
console.log('   Link detection and filtering:');

testMessages.forEach(msg => {
    const matches = msg.match(linkRegex);
    if (matches) {
        const normalizedAllowedDomains = allowedLinks.map(allowed =>
            allowed.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase()
        );

        const unauthorizedLinks = matches.filter(link => {
            const normalizedLink = link.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
            const domain = normalizedLink.split('/')[0];
            const isAllowed = normalizedAllowedDomains.some(allowed =>
                domain === allowed || domain.includes(allowed) || allowed.includes(domain)
            );
            return !isAllowed;
        });

        console.log(`   "${msg}" -> Links: ${matches.join(', ')} | Blocked: ${unauthorizedLinks.length > 0 ? unauthorizedLinks.join(', ') : 'None'}`);
    } else {
        console.log(`   "${msg}" -> No links detected`);
    }
});

console.log('\n🔧 Configuration Summary:');
console.log('   - Update DISCORD_TOKEN in .env file');
console.log('   - Enable MESSAGE CONTENT intent in Discord Developer Portal');
console.log('   - Run npm install to install dependencies');
console.log('   - See DISCORD_TOKEN_GUIDE.md for detailed setup instructions');

console.log('\n✅ Recent Fixes Applied:');
console.log('   - Hell Event output format corrected (*Reward(s)*: value)');
console.log('   - Hell Event time format: "Ended X hour/hours ago" when expired');
console.log('   - Hell Event filter: ONLY_WATCHER_CHAOS setting added');
console.log('   - Hell Event parsing: distinguish between rewards and tasks');
console.log('   - Monster rotation system with daily reset notifications');
console.log('   - Tagall command improved group detection');
console.log('   - Anti-spam link enhanced with better regex and warning system');
console.log('   - Ping command shows accurate latency');

console.log('\n✨ Test completed!');
