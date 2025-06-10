require('dotenv').config();

console.log('🧪 Testing Hell Event Filtering Logic\n');

// Test Hell Event filtering
function testHellEventFiltering() {
    console.log('1. Testing ONLY_WATCHER_CHAOS filtering...');
    
    const onlyWatcherChaos = process.env.ONLY_WATCHER_CHAOS === 'true';
    console.log(`ONLY_WATCHER_CHAOS setting: ${onlyWatcherChaos}`);
    
    // Test different event types
    const testEvents = [
        { eventName: 'Watcher', taskName: 'Kill monsters', expected: true },
        { eventName: 'Chaos Dragon', taskName: 'Gather resources', expected: true },
        { eventName: 'Ancient Core', taskName: 'Complete quests', expected: false },
        { eventName: 'Red Orb', taskName: 'Train troops', expected: false },
        { eventName: 'Speed Up', taskName: 'Use items', expected: false },
        { eventName: 'Gem', taskName: 'Spend gems', expected: false },
        { eventName: 'Gold', taskName: 'Collect gold', expected: false },
        { eventName: 'Watcher Fragment', taskName: 'Hunt monsters', expected: true },
        { eventName: 'Chaos Dragon Scale', taskName: 'Battle', expected: true },
        { eventName: 'Random Reward', taskName: 'Do something', expected: false }
    ];
    
    console.log('\n📋 Testing event filtering:');
    
    for (const event of testEvents) {
        const isWatcherOrChaos = event.eventName && (
            event.eventName.toLowerCase().includes('watcher') ||
            event.eventName.toLowerCase().includes('chaos dragon')
        );
        
        const shouldSend = !onlyWatcherChaos || isWatcherOrChaos;
        const status = shouldSend ? '✅ SEND' : '❌ FILTER';
        const expectedStatus = event.expected ? '✅ SEND' : '❌ FILTER';
        const match = shouldSend === event.expected ? '✅' : '❌';
        
        console.log(`${match} "${event.eventName}" → ${status} (expected: ${expectedStatus})`);
        
        if (shouldSend !== event.expected) {
            console.log(`   ⚠️  MISMATCH! Expected ${event.expected ? 'SEND' : 'FILTER'}, got ${shouldSend ? 'SEND' : 'FILTER'}`);
        }
    }
}

// Test real Discord message parsing
function testDiscordMessageParsing() {
    console.log('\n2. Testing Discord message parsing...');
    
    // Sample Discord messages (real examples)
    const testMessages = [
        {
            content: 'Hell | Watcher | Kill 500 monsters | 45m left | 2.5K',
            description: 'Watcher event with task'
        },
        {
            content: 'Hell | Chaos Dragon | Gather 1M resources | 30m left | 3.2K',
            description: 'Chaos Dragon event with task'
        },
        {
            content: 'Hell | Ancient Core | Complete 10 quests | 60m left | 1.8K',
            description: 'Ancient Core event (should be filtered)'
        },
        {
            content: 'Hell | Red Orb | 25m left | 2.1K',
            description: 'Red Orb event without task (should be filtered)'
        },
        {
            content: 'Hell | Speed Up | Train 1000 troops | 15m left | 1.5K',
            description: 'Speed Up event (should be filtered)'
        }
    ];
    
    console.log('\n📋 Testing message parsing and filtering:');
    
    for (const test of testMessages) {
        console.log(`\n🔍 Testing: ${test.description}`);
        console.log(`   Message: "${test.content}"`);
        
        // Parse the message (simplified version of the real parsing logic)
        let eventName = '', taskName = '', minutesLeft = 0, points = '';
        
        // Try format with task first: Hell | Reward | Task | Xm left | XK
        let regex = /Hell\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+)(?:m| minutes) left\s*\|\s*([\d.]+K)/;
        let matches = test.content.match(regex);
        
        if (matches) {
            // Format with 2 parts: Hell | Part1 | Part2 | Xm left | XK
            const part1 = matches[1].trim();
            const part2 = matches[2].trim();
            minutesLeft = parseInt(matches[3]);
            points = matches[4].trim();
            
            // Check if part1 contains special rewards
            const specialRewards = ['watcher', 'chaos dragon', 'ancient core', 'red orb', 'speed up', 'gem', 'gold'];
            const hasSpecialReward = specialRewards.some(reward => 
                part1.toLowerCase().includes(reward)
            );
            
            if (hasSpecialReward) {
                // Part1 is reward, Part2 is task
                eventName = part1;
                taskName = part2;
            } else {
                // Part1 is task, Part2 is reward
                eventName = part2;
                taskName = part1;
            }
        } else {
            // Try format without task: Hell | Reward | Xm left | XK
            regex = /Hell\s*\|\s*([^|]+)\s*\|\s*(\d+)(?:m| minutes) left\s*\|\s*([\d.]+K)/;
            matches = test.content.match(regex);
            
            if (matches) {
                const part1 = matches[1].trim();
                minutesLeft = parseInt(matches[2]);
                points = matches[3].trim();
                
                // Check if part1 contains special rewards
                const specialRewards = ['watcher', 'chaos dragon', 'ancient core', 'red orb', 'speed up', 'gem', 'gold'];
                const hasSpecialReward = specialRewards.some(reward => 
                    part1.toLowerCase().includes(reward)
                );
                
                if (hasSpecialReward) {
                    // Part1 is reward
                    eventName = part1;
                    taskName = '';
                } else {
                    // Part1 is task
                    eventName = '';
                    taskName = part1;
                }
            }
        }
        
        console.log(`   Parsed → Reward: "${eventName}", Task: "${taskName}", Time: ${minutesLeft}m, Points: ${points}`);
        
        // Test filtering
        const onlyWatcherChaos = process.env.ONLY_WATCHER_CHAOS === 'true';
        const isWatcherOrChaos = eventName && (
            eventName.toLowerCase().includes('watcher') ||
            eventName.toLowerCase().includes('chaos dragon')
        );
        
        console.log(`   Filter check: ONLY_WATCHER_CHAOS=${onlyWatcherChaos}, isWatcherOrChaos=${isWatcherOrChaos}`);
        
        if (onlyWatcherChaos && !isWatcherOrChaos) {
            console.log(`   ❌ FILTERED OUT: Non-Watcher/Chaos event`);
        } else {
            console.log(`   ✅ WILL SEND: Event passes filter`);
        }
    }
}

// Test group notification settings
function testGroupNotificationSettings() {
    console.log('\n3. Testing group notification settings...');
    
    const { shouldReceiveHellNotifications } = require('./utils/groupSettings');
    
    const testGroupId = '120363364063161357@g.us';
    
    console.log(`Testing group: ${testGroupId}`);
    
    const eventTypes = ['all', 'watcher', 'chaos', 'other'];
    
    for (const eventType of eventTypes) {
        const shouldReceive = shouldReceiveHellNotifications(testGroupId, eventType);
        console.log(`   shouldReceiveHellNotifications(${eventType}): ${shouldReceive}`);
    }
}

// Test complete flow
function testCompleteFlow() {
    console.log('\n4. Testing complete notification flow...');
    
    const onlyWatcherChaos = process.env.ONLY_WATCHER_CHAOS === 'true';
    const { shouldReceiveHellNotifications, isBotActiveInGroup } = require('./utils/groupSettings');
    
    const whatsappGroupIds = process.env.WHATSAPP_GROUP_IDS ? 
        process.env.WHATSAPP_GROUP_IDS.split(',') : [];
    
    console.log(`ONLY_WATCHER_CHAOS: ${onlyWatcherChaos}`);
    console.log(`Configured groups: ${whatsappGroupIds.length}`);
    
    // Test scenarios
    const scenarios = [
        { eventName: 'Watcher', isWatcherOrChaos: true },
        { eventName: 'Chaos Dragon', isWatcherOrChaos: true },
        { eventName: 'Ancient Core', isWatcherOrChaos: false },
        { eventName: 'Red Orb', isWatcherOrChaos: false }
    ];
    
    for (const scenario of scenarios) {
        console.log(`\n📋 Scenario: ${scenario.eventName} event`);
        
        // Check global filter
        if (onlyWatcherChaos && !scenario.isWatcherOrChaos) {
            console.log(`   ❌ GLOBAL FILTER: Event filtered out by ONLY_WATCHER_CHAOS`);
            continue;
        }
        
        console.log(`   ✅ GLOBAL FILTER: Event passes ONLY_WATCHER_CHAOS check`);
        
        // Check each group
        for (const groupId of whatsappGroupIds) {
            const trimmedGroupId = groupId.trim();
            
            // Check if bot is active
            const isBotActive = isBotActiveInGroup(trimmedGroupId);
            if (!isBotActive) {
                console.log(`   ❌ Group ${trimmedGroupId}: Bot not active`);
                continue;
            }
            
            // Check notification settings
            const eventType = scenario.isWatcherOrChaos ? 
                (scenario.eventName.toLowerCase().includes('watcher') ? 'watcher' : 'chaos') : 
                'other';
            
            const shouldReceive = shouldReceiveHellNotifications(trimmedGroupId, eventType);
            if (!shouldReceive) {
                console.log(`   ❌ Group ${trimmedGroupId}: Notifications disabled for ${eventType}`);
                continue;
            }
            
            console.log(`   ✅ Group ${trimmedGroupId}: Will receive notification`);
        }
    }
}

// Run all tests
function runAllTests() {
    console.log('🚀 Starting Hell Event filtering tests...\n');
    
    testHellEventFiltering();
    testDiscordMessageParsing();
    testGroupNotificationSettings();
    testCompleteFlow();
    
    console.log('\n🎉 All filtering tests completed!');
    
    console.log('\n📋 Diagnosis:');
    const onlyWatcherChaos = process.env.ONLY_WATCHER_CHAOS === 'true';
    
    if (onlyWatcherChaos) {
        console.log('⚠️  ONLY_WATCHER_CHAOS is TRUE');
        console.log('   → Only Watcher and Chaos Dragon events will be sent');
        console.log('   → All other Hell Events (Ancient Core, Red Orb, etc.) are filtered out');
        console.log('   → If you want all Hell Events, set ONLY_WATCHER_CHAOS=false');
    } else {
        console.log('✅ ONLY_WATCHER_CHAOS is FALSE');
        console.log('   → All Hell Events will be sent (if bot is active and notifications enabled)');
    }
    
    console.log('\n💡 Troubleshooting steps:');
    console.log('1. Check if recent Hell Event was Watcher/Chaos Dragon');
    console.log('2. Verify Discord bot is receiving messages from correct channel');
    console.log('3. Check if main bot process is running with schedulers');
    console.log('4. Test with !hell command to see if manual fetch works');
    console.log('5. Consider setting ONLY_WATCHER_CHAOS=false for testing');
}

// Run tests
runAllTests();
