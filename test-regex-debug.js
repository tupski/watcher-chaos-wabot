/**
 * Test script untuk debug regex Hell Event
 * Run this with: node test-regex-debug.js
 */

console.log('🔍 Testing Hell Event Regex Patterns...\n');

// Test messages dari Discord (berdasarkan contoh user)
const testMessages = [
    'Hell | Chaos Dragon | Tycoon | 58m left | 175K',
    'Hell | Building | 59m left | 230K',
    'Hell | Watcher | Building | 58m left | 590K',
    'Hell | Ancient Core, Red Orb | Merging, Building, Research | 58m left | 630K',
    'Hell | Research | 45m left | 350K'
];

function testRegexPatterns(message) {
    console.log(`Testing: "${message}"`);
    console.log('-'.repeat(60));
    
    // Pattern 1: With task - Hell | Reward | Task | Xm left | XK
    const regex1 = /Hell\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+)(?:m| minutes) left\s*\|\s*([\d.]+K)/;
    const matches1 = message.match(regex1);
    
    console.log('Pattern 1 (with task):');
    console.log('Regex:', regex1.toString());
    if (matches1) {
        console.log('✅ MATCH!');
        console.log('  Full match:', matches1[0]);
        console.log('  Reward:', matches1[1].trim());
        console.log('  Task:', matches1[2].trim());
        console.log('  Minutes:', matches1[3]);
        console.log('  Points:', matches1[4].trim());
    } else {
        console.log('❌ No match');
    }
    
    // Pattern 2: Without task - Hell | Reward | Xm left | XK
    const regex2 = /Hell\s*\|\s*([^|]+)\s*\|\s*(\d+)(?:m| minutes) left\s*\|\s*([\d.]+K)/;
    const matches2 = message.match(regex2);
    
    console.log('\nPattern 2 (without task):');
    console.log('Regex:', regex2.toString());
    if (matches2) {
        console.log('✅ MATCH!');
        console.log('  Full match:', matches2[0]);
        console.log('  Reward:', matches2[1].trim());
        console.log('  Minutes:', matches2[2]);
        console.log('  Points:', matches2[3].trim());
    } else {
        console.log('❌ No match');
    }
    
    // Final result
    let finalResult;
    if (matches1) {
        finalResult = {
            eventName: matches1[1].trim(),
            taskName: matches1[2].trim(),
            minutesLeft: parseInt(matches1[3]),
            points: matches1[4].trim(),
            format: 'with_task'
        };
    } else if (matches2) {
        finalResult = {
            eventName: matches2[1].trim(),
            taskName: '',
            minutesLeft: parseInt(matches2[2]),
            points: matches2[3].trim(),
            format: 'without_task'
        };
    } else {
        finalResult = null;
    }
    
    console.log('\n🎯 Final Result:');
    if (finalResult) {
        console.log('✅ Successfully parsed!');
        console.log('  Event Name:', finalResult.eventName);
        console.log('  Task Name:', finalResult.taskName || '(none)');
        console.log('  Minutes Left:', finalResult.minutesLeft);
        console.log('  Points:', finalResult.points);
        console.log('  Format:', finalResult.format);
        
        // Check if it's Watcher or Chaos Dragon
        const isWatcherOrChaos = finalResult.eventName.toLowerCase().includes('watcher') || 
                               finalResult.eventName.toLowerCase().includes('chaos dragon');
        console.log('  Is Watcher/Chaos:', isWatcherOrChaos ? '✅ YES' : '❌ NO');
    } else {
        console.log('❌ Failed to parse');
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
}

// Test all messages
testMessages.forEach(testRegexPatterns);

console.log('✨ Regex testing completed!');
console.log('\nKey findings:');
console.log('- Messages with task use 4 parts: Hell | Reward | Task | Time | Points');
console.log('- Messages without task use 3 parts: Hell | Reward | Time | Points');
console.log('- Need to try both patterns to catch all formats');
