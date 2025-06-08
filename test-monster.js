/**
 * Test script untuk memverifikasi Monster Rotation System
 * Run this with: node test-monster.js
 */

require('dotenv').config();
const moment = require('moment');

console.log('🐉 Testing Monster Rotation System...\n');

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

// Test current time and monster rotation
console.log('📅 Current Time Information:');
console.log('='.repeat(50));
const now = moment().utcOffset(process.env.TIMEZONE_OFFSET || 7);
console.log(`Current time: ${now.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)`);
console.log(`Base date: ${baseDate.format('DD/MM/YYYY')} (June 8, 2025)`);
console.log(`Days since base: ${now.diff(baseDate, 'days')}`);
console.log(`Current monster day: ${getCurrentMonsterDay()}`);

// Test today and tomorrow monsters
console.log('\n🐉 Today & Tomorrow Monsters:');
console.log('='.repeat(50));
const todayMonsters = getMonsterByDay(0);
const tomorrowMonsters = getMonsterByDay(1);
const timeLeft = getTimeUntilReset();

console.log(`Today Monster: ${todayMonsters[0]} & ${todayMonsters[1]}`);
console.log(`Tomorrow Monster: ${tomorrowMonsters[0]} & ${tomorrowMonsters[1]}`);
console.log(`Time until reset: ${timeLeft.hours}h ${timeLeft.minutes}m`);
console.log(`Next reset: ${timeLeft.nextReset.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)`);

// Test monster search
console.log('\n🔍 Monster Search Tests:');
console.log('='.repeat(50));

const testMonsters = ['Frostwing', 'Hardrox', 'Gargantua', 'Blackwing'];

testMonsters.forEach(monsterName => {
    const result = findMonsterDate(monsterName);
    if (result) {
        console.log(`\n${monsterName}:`);
        if (result.isToday) {
            console.log(`  ✅ Available today!`);
            console.log(`  Time left: ${timeLeft.hours}h ${timeLeft.minutes}m`);
        } else {
            console.log(`  📅 Next spawn: ${result.date.format('DD MMMM YYYY')}`);
            console.log(`  ⏰ Days until: ${result.daysUntil} day${result.daysUntil > 1 ? 's' : ''}`);
        }
        console.log(`  👥 Pair: ${result.monsters[0]} & ${result.monsters[1]}`);
    } else {
        console.log(`\n${monsterName}: ❌ Not found`);
    }
});

// Test schedule display
console.log('\n📋 Full Monster Schedule:');
console.log('='.repeat(50));
for (let i = 0; i < monsterSchedule.length; i++) {
    const date = baseDate.clone().add(i, 'days');
    const monsters = monsterSchedule[i];
    const isCurrent = i === getCurrentMonsterDay();
    const marker = isCurrent ? ' ← TODAY' : '';
    console.log(`${date.format('DD MMM YYYY')}: ${monsters[0]} & ${monsters[1]}${marker}`);
}

// Test reset notification message
console.log('\n📢 Reset Notification Preview:');
console.log('='.repeat(50));
const resetMessage = `🐉 *Monster Reset!* 🐉

${todayMonsters[0]} & ${todayMonsters[1]} will spawn in 5 minutes...

*Today monster:*
*${todayMonsters[0]} & ${todayMonsters[1]}*

*Tomorrow monster:*
*${tomorrowMonsters[0]} & ${tomorrowMonsters[1]}*`;

console.log(resetMessage);

console.log('\n✨ Monster system test completed!');
console.log('\nKey Features:');
console.log('- 12-day rotation cycle starting June 8, 2025');
console.log('- Daily reset at 11:55 AM (GMT+7)');
console.log('- Automatic notifications at reset time');
console.log('- Monster search by name');
console.log('- Time calculations for spawns and resets');
