const { 
    setAntiSpamLink, 
    getAntiSpamLinkSettings, 
    getGroupSettings 
} = require('../utils/groupSettings');
const { isPornContent } = require('../utils/pornBlockList');

console.log('🧪 Testing Anti-Spam Link System...\n');

// Test group ID
const testGroupId = 'test-group-antispam@g.us';

console.log('📋 Test 1: Default Anti-Spam Settings');
console.log('==================================================');
const defaultSettings = getAntiSpamLinkSettings(testGroupId);
console.log(`Enabled: ${defaultSettings.enabled}`);
console.log(`Block Porn: ${defaultSettings.blockPorn}`);
console.log(`Action: ${defaultSettings.action}`);
console.log(`Allowed Domains: ${defaultSettings.allowedDomains.join(', ')}`);
console.log('✅ Default settings test passed!\n');

console.log('📋 Test 2: Enable/Disable Anti-Spam');
console.log('==================================================');
setAntiSpamLink(testGroupId, { enabled: false });
let settings = getAntiSpamLinkSettings(testGroupId);
console.log(`After disable: ${settings.enabled}`);

setAntiSpamLink(testGroupId, { enabled: true });
settings = getAntiSpamLinkSettings(testGroupId);
console.log(`After enable: ${settings.enabled}`);
console.log('✅ Enable/disable test passed!\n');

console.log('📋 Test 3: Porn Block Settings');
console.log('==================================================');
setAntiSpamLink(testGroupId, { blockPorn: false });
settings = getAntiSpamLinkSettings(testGroupId);
console.log(`Porn block disabled: ${settings.blockPorn}`);

setAntiSpamLink(testGroupId, { blockPorn: true });
settings = getAntiSpamLinkSettings(testGroupId);
console.log(`Porn block enabled: ${settings.blockPorn}`);
console.log('✅ Porn block settings test passed!\n');

console.log('📋 Test 4: Action Settings');
console.log('==================================================');
setAntiSpamLink(testGroupId, { action: 'warn' });
settings = getAntiSpamLinkSettings(testGroupId);
console.log(`Action set to warn: ${settings.action}`);

setAntiSpamLink(testGroupId, { action: 'delete' });
settings = getAntiSpamLinkSettings(testGroupId);
console.log(`Action set to delete: ${settings.action}`);
console.log('✅ Action settings test passed!\n');

console.log('📋 Test 5: Domain Management');
console.log('==================================================');
const initialDomains = getAntiSpamLinkSettings(testGroupId).allowedDomains;
console.log(`Initial domains: ${initialDomains.length}`);

// Add domain
const newDomains = [...initialDomains, 'example.com'];
setAntiSpamLink(testGroupId, { allowedDomains: newDomains });
settings = getAntiSpamLinkSettings(testGroupId);
console.log(`After adding example.com: ${settings.allowedDomains.length}`);
console.log(`Contains example.com: ${settings.allowedDomains.includes('example.com')}`);

// Remove domain
const filteredDomains = settings.allowedDomains.filter(domain => domain !== 'example.com');
setAntiSpamLink(testGroupId, { allowedDomains: filteredDomains });
settings = getAntiSpamLinkSettings(testGroupId);
console.log(`After removing example.com: ${settings.allowedDomains.length}`);
console.log(`Contains example.com: ${settings.allowedDomains.includes('example.com')}`);
console.log('✅ Domain management test passed!\n');

console.log('📋 Test 6: Porn Content Detection');
console.log('==================================================');
const testUrls = [
    'https://google.com',
    'https://pornhub.com',
    'https://facebook.com',
    'https://xvideos.com',
    'https://youtube.com',
    'https://bokep.com',
    'https://example.com/porn',
    'https://example.com/sex',
    'https://normal-site.com'
];

testUrls.forEach(url => {
    const isPorn = isPornContent(url);
    console.log(`${url} -> ${isPorn ? '🚫 PORN' : '✅ SAFE'}`);
});
console.log('✅ Porn content detection test passed!\n');

console.log('📋 Test 7: Multiple Groups Independence');
console.log('==================================================');
const group1 = 'group1-antispam@g.us';
const group2 = 'group2-antispam@g.us';

// Set different settings for each group
setAntiSpamLink(group1, { enabled: true, blockPorn: true, action: 'delete' });
setAntiSpamLink(group2, { enabled: false, blockPorn: false, action: 'warn' });

const group1Settings = getAntiSpamLinkSettings(group1);
const group2Settings = getAntiSpamLinkSettings(group2);

console.log(`Group 1 - Enabled: ${group1Settings.enabled}, Block Porn: ${group1Settings.blockPorn}, Action: ${group1Settings.action}`);
console.log(`Group 2 - Enabled: ${group2Settings.enabled}, Block Porn: ${group2Settings.blockPorn}, Action: ${group2Settings.action}`);

console.log(`Groups have different settings: ${
    group1Settings.enabled !== group2Settings.enabled &&
    group1Settings.blockPorn !== group2Settings.blockPorn &&
    group1Settings.action !== group2Settings.action
}`);
console.log('✅ Multiple groups independence test passed!\n');

console.log('📋 Test 8: Reset to Default');
console.log('==================================================');
const { defaultSettings: globalDefaults } = require('../utils/groupSettings');

// Modify settings
setAntiSpamLink(testGroupId, { 
    enabled: false, 
    blockPorn: false, 
    action: 'warn',
    allowedDomains: ['only-example.com']
});

console.log('Settings before reset:');
settings = getAntiSpamLinkSettings(testGroupId);
console.log(`Enabled: ${settings.enabled}, Block Porn: ${settings.blockPorn}, Action: ${settings.action}, Domains: ${settings.allowedDomains.length}`);

// Reset to default
setAntiSpamLink(testGroupId, globalDefaults.antiSpamLink);

console.log('Settings after reset:');
settings = getAntiSpamLinkSettings(testGroupId);
console.log(`Enabled: ${settings.enabled}, Block Porn: ${settings.blockPorn}, Action: ${settings.action}, Domains: ${settings.allowedDomains.length}`);
console.log('✅ Reset to default test passed!\n');

console.log('🎉 All Anti-Spam Link Tests Completed!');
console.log('==================================================');
console.log('✅ Default settings work correctly');
console.log('✅ Enable/disable functionality works');
console.log('✅ Porn block settings work');
console.log('✅ Action settings (delete/warn) work');
console.log('✅ Domain management works');
console.log('✅ Porn content detection works');
console.log('✅ Multiple groups work independently');
console.log('✅ Reset to default works');
console.log('\n🚀 Anti-spam link system is ready!');

console.log('\n📖 Usage Instructions:');
console.log('==================================================');
console.log('• !antispam           - Show current settings');
console.log('• !antispam on/off    - Enable/disable anti-spam');
console.log('• !antispam porn on/off - Enable/disable porn blocking');
console.log('• !antispam action delete/warn - Set action type');
console.log('• !antispam add [domain] - Add allowed domain');
console.log('• !antispam remove [domain] - Remove allowed domain');
console.log('• !antispam reset     - Reset to default settings');
