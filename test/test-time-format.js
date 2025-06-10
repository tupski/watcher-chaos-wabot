/**
 * Test script untuk memverifikasi format waktu Hell Event
 * Run this with: node test-time-format.js
 */

const moment = require('moment');

console.log('🕐 Testing Hell Event Time Formatting...\n');

// Simulasi berbagai skenario waktu
const testScenarios = [
    { name: 'Event masih berlangsung - 30 menit tersisa', minutesLeft: 30 },
    { name: 'Event masih berlangsung - 5 menit tersisa', minutesLeft: 5 },
    { name: 'Event baru saja berakhir - 0 menit', minutesLeft: 0 },
    { name: 'Event berakhir 15 menit lalu', minutesLeft: -15 },
    { name: 'Event berakhir 45 menit lalu', minutesLeft: -45 },
    { name: 'Event berakhir 1 jam lalu', minutesLeft: -60 },
    { name: 'Event berakhir 2 jam lalu', minutesLeft: -120 },
    { name: 'Event berakhir 5 jam lalu', minutesLeft: -300 }
];

function formatTimeLeft(minutesFromNow) {
    const now = moment();
    const eventEndTime = now.clone().add(minutesFromNow, 'minutes');
    const minutesLeft = Math.ceil(moment.duration(eventEndTime.diff(now)).asMinutes());
    
    let timeLeftFormatted;

    if (minutesLeft <= 0) {
        // Event sudah berakhir, hitung berapa jam yang lalu
        const hoursAgo = Math.floor(moment.duration(now.diff(eventEndTime)).asHours());
        if (hoursAgo === 1) {
            timeLeftFormatted = `Ended 1 hour ago`;
        } else if (hoursAgo > 1) {
            timeLeftFormatted = `Ended ${hoursAgo} hours ago`;
        } else {
            // Kurang dari 1 jam, tampilkan dalam menit
            const minutesAgo = Math.floor(moment.duration(now.diff(eventEndTime)).asMinutes());
            timeLeftFormatted = `Ended ${minutesAgo}m ago`;
        }
    } else {
        timeLeftFormatted = `${minutesLeft}m left`;
    }
    
    return timeLeftFormatted;
}

testScenarios.forEach((scenario, index) => {
    const result = formatTimeLeft(scenario.minutesLeft);
    console.log(`${index + 1}. ${scenario.name}`);
    console.log(`   Input: ${scenario.minutesLeft} minutes from now`);
    console.log(`   Output: "${result}"`);
    console.log('');
});

console.log('✅ Time formatting test completed!');
console.log('\nExpected behavior:');
console.log('- Positive minutes: "Xm left"');
console.log('- 0 minutes: "Ended 0m ago"');
console.log('- 1-59 minutes ago: "Ended Xm ago"');
console.log('- Exactly 1 hour ago: "Ended 1 hour ago"');
console.log('- More than 1 hour ago: "Ended X hours ago"');
