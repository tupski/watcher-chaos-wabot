const moment = require('moment');
const cron = require('node-cron');

// Monster rotation schedule (same as in monster.js)
const monsterSchedule = [
    ['Gargantua', 'Hardrox'],           // Day 0 - June 8, 2025
    ['Jade Wyrm', 'Grim Reaper'],      // Day 1 - June 9, 2025
    ['Hell Drider', 'Snow Beast'],     // Day 2 - June 10, 2025
    ['Arctic Flipper', 'Hootclaw'],    // Day 3 - June 11, 2025
    ['Queen Bee', 'Mega Maggot'],      // Day 4 - June 12, 2025
    ['Mecha Trojan', 'Voodoo Shaman'], // Day 5 - June 13, 2025
    ['Saberfang', 'Gryphon'],          // Day 6 - June 14, 2025
    ['Necrosis', 'Gawrilla'],          // Day 7 - June 15, 2025
    ['Bon Apetti', 'Noceros'],         // Day 8 - June 16, 2025
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

function startMonsterResetScheduler(whatsappClient) {
    console.log('Starting Monster Reset Scheduler...');
    
    // Schedule for 11:55 AM every day (GMT+7)
    // Cron format: minute hour day month dayOfWeek
    // 55 11 * * * means 11:55 AM every day
    cron.schedule('55 11 * * *', async () => {
        try {
            console.log('Monster reset time! Sending notifications...');
            
            const todayMonsters = getMonsterByDay(0);
            const tomorrowMonsters = getMonsterByDay(1);
            
            const resetMessage = `🐉 *Monster Reset!* 🐉\n\n` +
                `${todayMonsters[0]} & ${todayMonsters[1]} will spawn in 5 minutes...\n\n` +
                `*Today monster:*\n` +
                `*${todayMonsters[0]} & ${todayMonsters[1]}*\n\n` +
                `*Tomorrow monster:*\n` +
                `*${tomorrowMonsters[0]} & ${tomorrowMonsters[1]}*`;
            
            // Get WhatsApp group IDs from environment
            const whatsappGroupIds = process.env.WHATSAPP_GROUP_IDS ? 
                process.env.WHATSAPP_GROUP_IDS.split(',') : [];
            
            if (whatsappGroupIds.length > 0) {
                const chats = await whatsappClient.getChats();
                
                for (const groupId of whatsappGroupIds) {
                    const chat = chats.find(c => c.id._serialized === groupId.trim());
                    if (chat) {
                        await chat.sendMessage(resetMessage);
                        console.log(`Monster reset notification sent to group: ${groupId}`);
                    } else {
                        console.log(`Group not found: ${groupId}`);
                    }
                }
            } else {
                console.log('No WhatsApp groups configured for monster reset notifications');
            }
            
        } catch (error) {
            console.error('Error sending monster reset notification:', error);
        }
    }, {
        timezone: 'Asia/Jakarta' // GMT+7
    });
    
    console.log('Monster Reset Scheduler started! Will trigger at 11:55 AM (GMT+7) daily.');
}

module.exports = {
    startMonsterResetScheduler,
    getCurrentMonsterDay,
    getMonsterByDay,
    monsterSchedule
};
