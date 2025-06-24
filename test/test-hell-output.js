/**
 * Test script untuk memverifikasi output Hell Event yang baru
 * Run this with: node test-hell-output.js
 */

const moment = require('moment');

console.log('🔥 Testing Hell Event Output Format...\n');

// Simulasi data Hell Event
const mockEventData = {
    eventName: 'Watcher',
    taskName: 'Building',
    points: '590K',
    timestamp: '2025-06-08T03:59:44.000Z',
    endTime: '2025-06-08T04:04:44.000Z'
};

function generateHellEventOutput(eventData, isActive = false) {
    const eventTime = moment(eventData.timestamp).utcOffset(7);
    const eventEndTime = moment(eventData.endTime).utcOffset(7);
    const now = moment();
    
    if (isActive) {
        // Event masih aktif
        const timeLeftMinutes = Math.ceil(moment.duration(eventEndTime.diff(now)).asMinutes());
        const timeLeftFormatted = `${timeLeftMinutes}m left`;
        
        return `🔥 *Hell Event* 🔥

*Reward(s)*: ${eventData.eventName}
*Task(s)*: ${eventData.taskName}
*Time left*: ${timeLeftFormatted}
*Phase 3 points*: ${eventData.points}

Message received at: *${eventTime.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*`;
    } else {
        // Event sudah berakhir
        return `🔥 *Hell Event Watcher* 🔥

No Hell Event for Watcher and Chaos Dragon at the moment.

Last event at: *${eventEndTime.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*

*Reward*: ${eventData.eventName}
*Task*: ${eventData.taskName}`;
    }
}

console.log('1. Output untuk Event yang Masih Aktif:');
console.log('=====================================');
console.log(generateHellEventOutput(mockEventData, true));

console.log('\n\n2. Output untuk Event yang Sudah Berakhir:');
console.log('==========================================');
console.log(generateHellEventOutput(mockEventData, false));

console.log('\n\n3. Perbandingan dengan Output Lama:');
console.log('===================================');
console.log('❌ Output Lama (yang tidak diinginkan):');
console.log(`🔥 Hell Event 🔥

Reward(s): Watcher
Task(s): Building
Time left: 0m left
Phase 3: 590K

Message received at: 08/06/2025 03:59:44 (GMT+7)`);

console.log('\n✅ Output Baru (yang diinginkan):');
console.log(generateHellEventOutput(mockEventData, false));

console.log('\n\n✨ Test completed!');
console.log('\nKey Changes:');
console.log('- No more "0m left" display');
console.log('- Clear "No Hell Event" message in English');
console.log('- Shows last event details (Reward & Task)');
console.log('- Consistent formatting across all scenarios');
