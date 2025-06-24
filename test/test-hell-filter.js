/**
 * Test script untuk memverifikasi filter Hell Event
 * Run this with: node test-hell-filter.js
 */

require('dotenv').config();

console.log('🔥 Testing Hell Event Filter System...\n');

// Test messages dari Discord
const testMessages = [
    'Hell | Watcher | Building | 58m left | 590K',
    'Hell | Chaos Dragon | Tycoon | 58m left | 175K',
    'Hell | Building | 59m left | 230K', // Format tanpa task
    'Hell | Ancient Core, Red Orb | Merging, Building, Research | 58m left | 630K',
    'Hell | Watcher | | 45m left | 400K', // Watcher dengan task kosong
    'Hell | Chaos Dragon | | 30m left | 300K', // Chaos Dragon dengan task kosong
    'Hell | Research | 45m left | 350K' // Format tanpa task
];

function testHellEventFilter(message, onlyWatcherChaos = true) {
    // Try format with task first: Hell | Reward | Task | Xm left | XK
    let regex = /Hell\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+)(?:m| minutes) left\s*\|\s*([\d.]+K)/;
    let matches = message.match(regex);

    // If no match, try format without task: Hell | Reward | Xm left | XK
    if (!matches) {
        regex = /Hell\s*\|\s*([^|]+)\s*\|\s*(\d+)(?:m| minutes) left\s*\|\s*([\d.]+K)/;
        matches = message.match(regex);
    }

    if (!matches) {
        return { processed: false, reason: 'No Hell Event pattern found' };
    }

    let eventName, taskName, minutesLeft, points;

    if (matches.length === 5) {
        // Format with task: Hell | Reward | Task | Xm left | XK
        eventName = matches[1].trim();
        taskName = matches[2].trim();
        minutesLeft = parseInt(matches[3]);
        points = matches[4].trim();
    } else {
        // Format without task: Hell | Reward | Xm left | XK
        eventName = matches[1].trim();
        taskName = ''; // No task
        minutesLeft = parseInt(matches[2]);
        points = matches[3].trim();
    }
    
    const isWatcherOrChaos = eventName.toLowerCase().includes('watcher') || 
                           eventName.toLowerCase().includes('chaos dragon');
    
    if (onlyWatcherChaos && !isWatcherOrChaos) {
        return { 
            processed: false, 
            reason: 'Filtered out (not Watcher/Chaos Dragon)',
            eventName,
            taskName,
            minutesLeft,
            points
        };
    }
    
    return { 
        processed: true, 
        reason: 'Event will be sent to WhatsApp',
        eventName,
        taskName,
        minutesLeft,
        points,
        isWatcherOrChaos
    };
}

console.log('Current ONLY_WATCHER_CHAOS setting:', process.env.ONLY_WATCHER_CHAOS);
console.log('='.repeat(60));

// Test dengan filter ON (true)
console.log('\n1. Testing with ONLY_WATCHER_CHAOS = true');
console.log('-'.repeat(50));
testMessages.forEach((msg, index) => {
    const result = testHellEventFilter(msg, true);
    console.log(`${index + 1}. "${msg}"`);
    console.log(`   Result: ${result.processed ? '✅ SENT' : '❌ FILTERED'}`);
    console.log(`   Reason: ${result.reason}`);
    if (result.eventName) {
        console.log(`   Event: ${result.eventName} | Task: ${result.taskName || 'None'}`);
    }
    console.log('');
});

// Test dengan filter OFF (false)
console.log('\n2. Testing with ONLY_WATCHER_CHAOS = false');
console.log('-'.repeat(50));
testMessages.forEach((msg, index) => {
    const result = testHellEventFilter(msg, false);
    console.log(`${index + 1}. "${msg}"`);
    console.log(`   Result: ${result.processed ? '✅ SENT' : '❌ FILTERED'}`);
    console.log(`   Reason: ${result.reason}`);
    if (result.eventName) {
        console.log(`   Event: ${result.eventName} | Task: ${result.taskName || 'None'}`);
    }
    console.log('');
});

console.log('\n📊 Summary:');
console.log('='.repeat(60));
console.log('When ONLY_WATCHER_CHAOS = true:');
console.log('  ✅ Watcher events will be sent');
console.log('  ✅ Chaos Dragon events will be sent');
console.log('  ❌ Other Hell Events will be filtered out');
console.log('');
console.log('When ONLY_WATCHER_CHAOS = false:');
console.log('  ✅ ALL Hell Events will be sent');
console.log('');
console.log('Note: !hell command always shows latest event regardless of filter');

console.log('\n✨ Test completed!');
