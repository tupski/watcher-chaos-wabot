require('dotenv').config();

console.log('🧪 Testing Discord Connection and Hell Event System\n');

// Test Discord connection
async function testDiscordConnection() {
    try {
        console.log('1. Testing Discord configuration...');
        
        const discordToken = process.env.DISCORD_TOKEN;
        const discordChannelId = process.env.DISCORD_CHANNEL_ID;
        const whatsappGroupIds = process.env.WHATSAPP_GROUP_IDS;
        const onlyWatcherChaos = process.env.ONLY_WATCHER_CHAOS;
        
        console.log('✅ Environment variables:');
        console.log(`   DISCORD_TOKEN: ${discordToken ? 'SET' : 'NOT SET'}`);
        console.log(`   DISCORD_CHANNEL_ID: ${discordChannelId || 'NOT SET'}`);
        console.log(`   WHATSAPP_GROUP_IDS: ${whatsappGroupIds || 'NOT SET'}`);
        console.log(`   ONLY_WATCHER_CHAOS: ${onlyWatcherChaos || 'NOT SET'}`);
        
        if (!discordToken) {
            console.log('❌ DISCORD_TOKEN is not set!');
            return false;
        }
        
        if (!discordChannelId) {
            console.log('❌ DISCORD_CHANNEL_ID is not set!');
            return false;
        }
        
        if (!whatsappGroupIds) {
            console.log('❌ WHATSAPP_GROUP_IDS is not set!');
            return false;
        }
        
        console.log('\n2. Testing Discord.js import...');
        
        try {
            const { Client: DiscordClient, GatewayIntentBits } = require('discord.js');
            console.log('✅ Discord.js imported successfully');
            
            // Test Discord client creation
            const discordClient = new DiscordClient({
                intents: [
                    GatewayIntentBits.Guilds,
                    GatewayIntentBits.GuildMessages,
                    GatewayIntentBits.MessageContent
                ],
            });
            
            console.log('✅ Discord client created successfully');
            
            // Test connection
            console.log('\n3. Testing Discord connection...');
            
            discordClient.on('ready', () => {
                console.log(`✅ Discord logged in as: ${discordClient.user.tag}`);
                console.log(`✅ Discord client ready!`);
                
                // Test channel access
                const channel = discordClient.channels.cache.get(discordChannelId);
                if (channel) {
                    console.log(`✅ Channel found: ${channel.name}`);
                } else {
                    console.log(`❌ Channel not found: ${discordChannelId}`);
                }
                
                discordClient.destroy();
                console.log('✅ Discord connection test completed');
            });
            
            discordClient.on('error', (error) => {
                console.log('❌ Discord error:', error.message);
            });
            
            await discordClient.login(discordToken);
            
        } catch (error) {
            console.log('❌ Discord.js error:', error.message);
            return false;
        }
        
    } catch (error) {
        console.log('❌ Test error:', error.message);
        return false;
    }
}

// Test Hell Event processing logic
function testHellEventLogic() {
    console.log('\n4. Testing Hell Event processing logic...');
    
    // Import Hell Event functions
    const { shouldReceiveHellNotifications, isBotActiveInGroup } = require('./utils/groupSettings');
    
    const testGroupId = '120363364063161357@g.us';
    
    console.log('✅ Testing group settings functions:');
    
    // Test bot active status
    const isBotActive = isBotActiveInGroup(testGroupId);
    console.log(`   isBotActiveInGroup(${testGroupId}): ${isBotActive}`);
    
    // Test hell notifications settings
    const shouldReceiveAll = shouldReceiveHellNotifications(testGroupId, 'all');
    const shouldReceiveWatcher = shouldReceiveHellNotifications(testGroupId, 'watcher');
    const shouldReceiveChaos = shouldReceiveHellNotifications(testGroupId, 'chaos');
    const shouldReceiveOther = shouldReceiveHellNotifications(testGroupId, 'other');
    
    console.log(`   shouldReceiveHellNotifications (all): ${shouldReceiveAll}`);
    console.log(`   shouldReceiveHellNotifications (watcher): ${shouldReceiveWatcher}`);
    console.log(`   shouldReceiveHellNotifications (chaos): ${shouldReceiveChaos}`);
    console.log(`   shouldReceiveHellNotifications (other): ${shouldReceiveOther}`);
    
    // Test ONLY_WATCHER_CHAOS setting
    const onlyWatcherChaos = process.env.ONLY_WATCHER_CHAOS === 'true';
    console.log(`   ONLY_WATCHER_CHAOS setting: ${onlyWatcherChaos}`);
    
    if (onlyWatcherChaos) {
        console.log('⚠️  ONLY_WATCHER_CHAOS is TRUE - only Watcher/Chaos events will be sent');
    } else {
        console.log('✅ ONLY_WATCHER_CHAOS is FALSE - all Hell Events will be sent');
    }
}

// Test Monster Rotation logic
function testMonsterRotationLogic() {
    console.log('\n5. Testing Monster Rotation logic...');
    
    try {
        const moment = require('moment');
        
        // Monster rotation schedule (12-day cycle starting from June 8, 2025)
        const monsterSchedule = [
            ['Gargantua', 'Hardrox'],           // Day 0 - June 8, 2025
            ['Jade Wyrm', 'Grim Reaper'],      // Day 1 - June 9, 2025
            ['Hell Drider', 'Snow Beast'],     // Day 2 - June 10, 2025
            ['Arctic Flipper', 'Hootclaw'],    // Day 3 - June 11, 2025
            ['Queen Bee', 'Mega Maggot'],      // Day 4 - June 12, 2025
            ['Mecha Trojan', 'Voodoo Shaman'], // Day 5 - June 13, 2025
            ['Saberfang', 'Gryphon'],          // Day 6 - June 14, 2025
            ['Necrosis', 'Gawrilla'],          // Day 7 - June 15, 2025
            ['Bon Appeti', 'Noceros'],         // Day 8 - June 16, 2025
            ['Terrorthorn', 'Tidal Titan'],    // Day 9 - June 17, 2025
            ['Frostwing', 'Blackwing'],        // Day 10 - June 18, 2025
            ['Serpent Gladiator', 'Cottageroar'] // Day 11 - June 19, 2025
        ];
        
        // Base date: June 8, 2025 (start of the cycle)
        const baseDate = moment('2025-06-08').utcOffset(process.env.TIMEZONE_OFFSET || 7);
        
        function getCurrentMonsterDay() {
            const now = moment().utcOffset(process.env.TIMEZONE_OFFSET || 7);
            const daysSinceBase = now.diff(baseDate, 'days');
            return daysSinceBase % monsterSchedule.length;
        }
        
        function getMonsterByDay(dayOffset = 0) {
            const currentDay = getCurrentMonsterDay();
            const targetDay = (currentDay + dayOffset) % monsterSchedule.length;
            return monsterSchedule[targetDay];
        }
        
        const currentDay = getCurrentMonsterDay();
        const todayMonsters = getMonsterByDay(0);
        const tomorrowMonsters = getMonsterByDay(1);
        
        console.log('✅ Monster Rotation calculation:');
        console.log(`   Current day in cycle: ${currentDay}`);
        console.log(`   Today's monsters: ${todayMonsters[0]} & ${todayMonsters[1]}`);
        console.log(`   Tomorrow's monsters: ${tomorrowMonsters[0]} & ${tomorrowMonsters[1]}`);
        
        // Test if bot is active in groups for monster notifications
        const whatsappGroupIds = process.env.WHATSAPP_GROUP_IDS ? 
            process.env.WHATSAPP_GROUP_IDS.split(',') : [];
        
        console.log(`   Configured groups: ${whatsappGroupIds.length}`);
        
        for (const groupId of whatsappGroupIds) {
            const { isBotActiveInGroup } = require('./utils/groupSettings');
            const isActive = isBotActiveInGroup(groupId.trim());
            console.log(`   Group ${groupId.trim()}: ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
        }
        
    } catch (error) {
        console.log('❌ Monster Rotation test error:', error.message);
    }
}

// Test scheduler logic
function testSchedulerLogic() {
    console.log('\n6. Testing Scheduler logic...');
    
    try {
        const cron = require('node-cron');
        console.log('✅ node-cron imported successfully');
        
        // Test cron expression validation
        const monsterResetCron = '55 11 * * *'; // 11:55 AM every day
        const isValidCron = cron.validate(monsterResetCron);
        console.log(`   Monster reset cron (${monsterResetCron}): ${isValidCron ? 'VALID' : 'INVALID'}`);
        
        // Calculate next monster reset time
        const moment = require('moment');
        const now = moment().utcOffset(7); // GMT+7
        const nextReset = moment().utcOffset(7).hour(11).minute(55).second(0);
        
        if (nextReset.isBefore(now)) {
            nextReset.add(1, 'day');
        }
        
        console.log(`   Current time: ${now.format('YYYY-MM-DD HH:mm:ss')} (GMT+7)`);
        console.log(`   Next monster reset: ${nextReset.format('YYYY-MM-DD HH:mm:ss')} (GMT+7)`);
        console.log(`   Time until next reset: ${nextReset.diff(now, 'hours')} hours ${nextReset.diff(now, 'minutes') % 60} minutes`);
        
    } catch (error) {
        console.log('❌ Scheduler test error:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting comprehensive notification system tests...\n');
    
    await testDiscordConnection();
    testHellEventLogic();
    testMonsterRotationLogic();
    testSchedulerLogic();
    
    console.log('\n🎉 All tests completed!');
    
    console.log('\n📋 Troubleshooting Checklist:');
    console.log('□ Discord token valid and bot has permissions');
    console.log('□ Discord channel ID correct and bot has access');
    console.log('□ WhatsApp groups configured and bot is active');
    console.log('□ Hell Event notifications enabled in groups');
    console.log('□ ONLY_WATCHER_CHAOS setting matches expectations');
    console.log('□ Monster reset scheduler running (11:55 AM GMT+7)');
    console.log('□ Bot process running and schedulers started');
}

// Handle process exit
process.on('SIGINT', () => {
    console.log('\n👋 Test interrupted by user');
    process.exit(0);
});

// Run tests
runAllTests().catch(console.error);
