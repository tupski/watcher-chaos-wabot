/**
 * Test script untuk memverifikasi parsing Hell Event yang baru
 * Run this with: node test-hell-parsing.js
 */

console.log('🔍 Testing Hell Event Parsing Logic...\n');

// Test messages dari Discord
const testMessages = [
    'Hell | Watcher | Building | 58m left | 590K',
    'Hell | Chaos Dragon | Tycoon | 58m left | 175K',
    'Hell | Training, Research | 42m left | 560K',
    'Hell | Building | 59m left | 230K',
    'Hell | Ancient Core, Red Orb | Merging, Building, Research | 58m left | 630K',
    'Hell | Research | 45m left | 350K',
    'Hell | Training, Building, Research | 59m left | 420K'
];

function parseHellEvent(message) {
    console.log(`Testing: "${message}"`);
    console.log('-'.repeat(60));
    
    // Try format with task first: Hell | Reward | Task | Xm left | XK
    let regex = /Hell\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+)(?:m| minutes) left\s*\|\s*([\d.]+K)/;
    let matches = message.match(regex);
    
    // If no match, try format without task: Hell | Reward | Xm left | XK
    if (!matches) {
        regex = /Hell\s*\|\s*([^|]+)\s*\|\s*(\d+)(?:m| minutes) left\s*\|\s*([\d.]+K)/;
        matches = message.match(regex);
    }
    
    if (!matches) {
        console.log('❌ No Hell Event pattern found');
        return null;
    }
    
    let eventName, taskName, minutesLeft, points;
    
    if (matches.length === 5) {
        // Format with 2 parts: Hell | Part1 | Part2 | Xm left | XK
        const part1 = matches[1].trim();
        const part2 = matches[2].trim();
        minutesLeft = parseInt(matches[3]);
        points = matches[4].trim();
        
        console.log(`Raw parts: Part1="${part1}", Part2="${part2}"`);
        
        // Check if part1 contains special rewards (Watcher, Chaos Dragon, Ancient Core, Red Orb, etc.)
        const specialRewards = ['watcher', 'chaos dragon', 'ancient core', 'red orb', 'speed up', 'gem', 'gold'];
        const hasSpecialReward = specialRewards.some(reward => 
            part1.toLowerCase().includes(reward)
        );
        
        console.log(`Has special reward in Part1: ${hasSpecialReward}`);
        
        if (hasSpecialReward) {
            // Part1 is reward, Part2 is task
            eventName = part1;
            taskName = part2;
            console.log('✅ Parsed as: Reward + Task format');
        } else {
            // Part1 is task, Part2 is also task (or empty)
            eventName = ''; // No special reward
            taskName = part2 ? `${part1}, ${part2}` : part1;
            console.log('✅ Parsed as: Task + Task format');
        }
    } else {
        // Format with 1 part: Hell | Part1 | Xm left | XK
        const part1 = matches[1].trim();
        minutesLeft = parseInt(matches[2]);
        points = matches[3].trim();
        
        console.log(`Raw parts: Part1="${part1}"`);
        
        // Check if part1 contains special rewards
        const specialRewards = ['watcher', 'chaos dragon', 'ancient core', 'red orb', 'speed up', 'gem', 'gold'];
        const hasSpecialReward = specialRewards.some(reward => 
            part1.toLowerCase().includes(reward)
        );
        
        console.log(`Has special reward in Part1: ${hasSpecialReward}`);
        
        if (hasSpecialReward) {
            // Part1 is reward
            eventName = part1;
            taskName = '';
            console.log('✅ Parsed as: Reward only format');
        } else {
            // Part1 is task
            eventName = '';
            taskName = part1;
            console.log('✅ Parsed as: Task only format');
        }
    }
    
    const result = {
        eventName,
        taskName,
        minutesLeft,
        points
    };
    
    console.log('\n🎯 Final Result:');
    console.log(`  Reward: "${result.eventName || '(none)'}"`);
    console.log(`  Task: "${result.taskName || '(none)'}"`);
    console.log(`  Minutes Left: ${result.minutesLeft}`);
    console.log(`  Points: ${result.points}`);
    
    // Generate output format
    console.log('\n📱 WhatsApp Output:');
    let output = `🔥 *Hell Event* 🔥\n\n`;
    if (result.eventName && result.eventName.trim() !== '') {
        output += `*Reward(s)*: ${result.eventName}\n`;
    }
    if (result.taskName && result.taskName.trim() !== '') {
        output += `*Task(s)*: ${result.taskName}\n`;
    }
    output += `*Time left*: ${result.minutesLeft}m left\n`;
    output += `*Phase 3 points*: ${result.points}`;
    
    console.log(output);
    
    // Check if it's Watcher or Chaos Dragon for filtering
    const isWatcherOrChaos = result.eventName && (result.eventName.toLowerCase().includes('watcher') || 
                           result.eventName.toLowerCase().includes('chaos dragon'));
    console.log(`\n🔍 Filter Check: Is Watcher/Chaos Dragon? ${isWatcherOrChaos ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    return result;
}

// Test all messages
testMessages.forEach(parseHellEvent);

console.log('✨ Parsing test completed!');
console.log('\nKey Logic:');
console.log('- If Part1 contains special rewards → Part1=Reward, Part2=Task');
console.log('- If Part1 is regular task → Part1=Task, Part2=Task (combined)');
console.log('- Special rewards: watcher, chaos dragon, ancient core, red orb, speed up, gem, gold');
console.log('- Filter applies only to events with special rewards (Watcher/Chaos Dragon)');
