const moment = require('moment');
const { setMonsterNotifications, getGroupSettings, canExecuteCommand } = require('../utils/groupSettings');
const { isGroupChat } = require('../utils/chatUtils');

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

function getNextResetTime() {
    const now = moment().utcOffset(process.env.TIMEZONE_OFFSET || 7);
    let nextReset = now.clone().hour(11).minute(55).second(0).millisecond(0);
    
    // If current time is past 11:55, move to next day
    if (now.isAfter(nextReset)) {
        nextReset.add(1, 'day');
    }
    
    return nextReset;
}

function getTimeUntilReset() {
    const now = moment().utcOffset(process.env.TIMEZONE_OFFSET || 7);
    const nextReset = getNextResetTime();
    const duration = moment.duration(nextReset.diff(now));
    
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    
    return { hours, minutes, nextReset };
}

function getTimeUntilSpawn() {
    const now = moment().utcOffset(process.env.TIMEZONE_OFFSET || 7);
    let nextSpawn = now.clone().add(1, 'day').hour(12).minute(0).second(0).millisecond(0);
    
    // If today's spawn hasn't happened yet
    const todaySpawn = now.clone().hour(12).minute(0).second(0).millisecond(0);
    if (now.isBefore(todaySpawn)) {
        nextSpawn = todaySpawn;
    }
    
    const duration = moment.duration(nextSpawn.diff(now));
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    
    return { hours, minutes };
}

function findMonsterDate(monsterName) {
    const normalizedName = monsterName.toLowerCase().trim();
    
    for (let i = 0; i < monsterSchedule.length; i++) {
        const monsters = monsterSchedule[i];
        if (monsters.some(monster => monster.toLowerCase().includes(normalizedName))) {
            // Calculate the date for this monster
            const targetDate = baseDate.clone().add(i, 'days');
            
            // Find the next occurrence of this monster
            const now = moment().utcOffset(process.env.TIMEZONE_OFFSET || 7);
            const currentDay = getCurrentMonsterDay();
            
            let daysUntil;
            if (i >= currentDay) {
                daysUntil = i - currentDay;
            } else {
                daysUntil = (monsterSchedule.length - currentDay) + i;
            }
            
            const nextOccurrence = now.clone().add(daysUntil, 'days');
            
            return {
                monsters,
                date: nextOccurrence,
                daysUntil,
                isToday: daysUntil === 0
            };
        }
    }
    
    return null;
}

module.exports = async (client, message) => {
    try {
        const args = message.body.split(' ').slice(1); // Remove !monster
        const query = args.join(' ').trim().toLowerCase();

        // Handle notification settings
        if (query === 'off' || query === 'on') {
            const chat = await message.getChat();

            // Only work in groups
            if (!isGroupChat(chat)) {
                await message.reply('Monster notification settings can only be changed in group chats.');
                return;
            }

            // Check if user can execute admin commands
            const canExecute = await canExecuteCommand(message, 'monster', client);
            if (!canExecute) {
                await message.reply('❌ Only group admins can change monster notification settings.');
                return;
            }

            const groupId = chat.id._serialized;
            const preference = query; // 'on' or 'off'

            const success = setMonsterNotifications(groupId, preference);

            if (success) {
                if (preference === 'off') {
                    await message.reply('✅ Monster notifications have been *disabled* for this group.\n\nDaily monster reset notifications will no longer be sent.');
                } else {
                    await message.reply('✅ Monster notifications have been *enabled* for this group.\n\nDaily monster reset notifications will be sent at 11:55 AM (GMT+7).');
                }
            } else {
                await message.reply('❌ Failed to update monster notification settings. Please try again.');
            }
            return;
        }

        // Handle status check
        if (query === 'status') {
            const chat = await message.getChat();

            if (isGroupChat(chat)) {
                const groupId = chat.id._serialized;
                const settings = getGroupSettings(groupId);
                const notificationStatus = settings.monsterNotifications === 'off' ? 'Disabled' : 'Enabled';

                await message.reply(`🐉 *Monster Notification Status*\n\nNotifications: *${notificationStatus}*\n\nUse \`!monster off\` to disable or \`!monster on\` to enable daily notifications.`);
            } else {
                await message.reply('Monster notification status can only be checked in group chats.');
            }
            return;
        }

        if (query) {
            // Search for specific monster
            const result = findMonsterDate(query);

            if (!result) {
                await message.reply(`Monster "${query}" not found in the rotation schedule.`);
                return;
            }

            if (result.isToday) {
                const timeLeft = getTimeUntilReset();
                await message.reply(
                    `${result.monsters.find(m => m.toLowerCase().includes(query.toLowerCase()))} is exist today.\n\n` +
                    `Time left: *${timeLeft.hours} hours ${timeLeft.minutes} minutes*\n\n` +
                    `Go hunt!`
                );
            } else {
                const timeLeft = getTimeUntilSpawn();
                const targetMonster = result.monsters.find(m => m.toLowerCase().includes(query.toLowerCase()));

                await message.reply(
                    `${targetMonster} will spawn at *${result.date.format('DD MMMM YYYY')}*\n\n` +
                    `${result.daysUntil} day${result.daysUntil > 1 ? 's' : ''} ${timeLeft.hours} hours left`
                );
            }
        } else {
            // Show today and tomorrow monsters
            const todayMonsters = getMonsterByDay(0);
            const tomorrowMonsters = getMonsterByDay(1);
            const timeLeft = getTimeUntilReset();
            const spawnTime = getTimeUntilSpawn();

            let replyMessage = `🐉 *Monster Rotation* 🐉\n\n`;
            replyMessage += `*Today Monster:*\n`;
            replyMessage += `${todayMonsters[0]} & ${todayMonsters[1]} (time left ${timeLeft.hours}h ${timeLeft.minutes}m)\n\n`;
            replyMessage += `*Tomorrow Monster:*\n`;
            replyMessage += `${tomorrowMonsters[0]} & ${tomorrowMonsters[1]} (Spawn in ${spawnTime.hours}h ${spawnTime.minutes}m)`;

            await message.reply(replyMessage);
        }

    } catch (error) {
        console.error('Error in monster command:', error);
        await message.reply('An error occurred while processing the monster command.');
    }
};
