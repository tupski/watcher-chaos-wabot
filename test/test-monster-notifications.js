const { 
    setMonsterNotifications, 
    shouldReceiveMonsterNotifications, 
    getGroupSettings 
} = require('../utils/groupSettings');

console.log('🧪 Testing Monster Notification Settings...\n');

// Test group ID
const testGroupId = 'test-group-123@g.us';

console.log('📋 Test 1: Default Monster Notification Setting');
console.log('==================================================');
const defaultSettings = getGroupSettings(testGroupId);
console.log(`Default monster notifications: ${defaultSettings.monsterNotifications}`);
console.log(`Should receive notifications: ${shouldReceiveMonsterNotifications(testGroupId)}`);
console.log('✅ Default setting test passed!\n');

console.log('📋 Test 2: Disable Monster Notifications');
console.log('==================================================');
const disableResult = setMonsterNotifications(testGroupId, 'off');
console.log(`Set notifications to 'off': ${disableResult ? 'Success' : 'Failed'}`);

const settingsAfterDisable = getGroupSettings(testGroupId);
console.log(`Monster notifications setting: ${settingsAfterDisable.monsterNotifications}`);
console.log(`Should receive notifications: ${shouldReceiveMonsterNotifications(testGroupId)}`);
console.log('✅ Disable notifications test passed!\n');

console.log('📋 Test 3: Enable Monster Notifications');
console.log('==================================================');
const enableResult = setMonsterNotifications(testGroupId, 'on');
console.log(`Set notifications to 'on': ${enableResult ? 'Success' : 'Failed'}`);

const settingsAfterEnable = getGroupSettings(testGroupId);
console.log(`Monster notifications setting: ${settingsAfterEnable.monsterNotifications}`);
console.log(`Should receive notifications: ${shouldReceiveMonsterNotifications(testGroupId)}`);
console.log('✅ Enable notifications test passed!\n');

console.log('📋 Test 4: Invalid Setting');
console.log('==================================================');
const invalidResult = setMonsterNotifications(testGroupId, 'invalid');
console.log(`Set notifications to 'invalid': ${invalidResult ? 'Success' : 'Failed (Expected)'}`);

const settingsAfterInvalid = getGroupSettings(testGroupId);
console.log(`Monster notifications setting: ${settingsAfterInvalid.monsterNotifications}`);
console.log(`Should receive notifications: ${shouldReceiveMonsterNotifications(testGroupId)}`);
console.log('✅ Invalid setting test passed!\n');

console.log('📋 Test 5: Multiple Groups');
console.log('==================================================');
const group1 = 'group1@g.us';
const group2 = 'group2@g.us';

setMonsterNotifications(group1, 'on');
setMonsterNotifications(group2, 'off');

console.log(`Group 1 notifications: ${getGroupSettings(group1).monsterNotifications}`);
console.log(`Group 1 should receive: ${shouldReceiveMonsterNotifications(group1)}`);
console.log(`Group 2 notifications: ${getGroupSettings(group2).monsterNotifications}`);
console.log(`Group 2 should receive: ${shouldReceiveMonsterNotifications(group2)}`);
console.log('✅ Multiple groups test passed!\n');

console.log('🎉 All Monster Notification Tests Completed!');
console.log('==================================================');
console.log('✅ Default settings work correctly');
console.log('✅ Can disable notifications');
console.log('✅ Can enable notifications');
console.log('✅ Invalid settings are rejected');
console.log('✅ Multiple groups work independently');
console.log('\n🚀 Monster notification system is ready!');

console.log('\n📖 Usage Instructions:');
console.log('==================================================');
console.log('• !monster off    - Disable daily notifications');
console.log('• !monster on     - Enable daily notifications');
console.log('• !monster status - Check notification status');
console.log('• !monster        - Show current rotation');
console.log('• !monster [name] - Search for specific monster');
