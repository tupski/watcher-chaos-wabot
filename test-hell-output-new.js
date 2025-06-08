/**
 * Test script untuk memverifikasi output Hell Event yang baru
 * Run this with: node test-hell-output-new.js
 */

const moment = require('moment');

console.log('🔥 Testing New Hell Event Output Format...\n');

// Simulasi data Hell Event
const mockEvents = [
    {
        eventName: 'Building',
        taskName: '',
        points: '230K',
        timestamp: '2025-06-08T03:59:44.000Z',
        endTime: '2025-06-08T04:04:44.000Z', // Event sudah berakhir
        isActive: false
    },
    {
        eventName: 'Chaos Dragon',
        taskName: 'Tycoon',
        points: '175K',
        timestamp: '2025-06-08T03:59:44.000Z',
        endTime: '2025-06-08T04:04:44.000Z', // Event sudah berakhir
        isActive: false
    },
    {
        eventName: 'Watcher',
        taskName: 'Building',
        points: '590K',
        timestamp: '2025-06-08T03:59:44.000Z',
        endTime: '2025-06-08T05:04:44.000Z', // Event masih aktif
        isActive: true
    }
];

function generateHellEventOutput(eventData, onlyWatcherChaos = true) {
    const eventTime = moment(eventData.timestamp).utcOffset(7);
    const eventEndTime = moment(eventData.endTime).utcOffset(7);
    const now = moment();
    
    const isWatcherOrChaos = eventData.eventName.toLowerCase().includes('watcher') || 
                           eventData.eventName.toLowerCase().includes('chaos dragon');
    
    if (eventData.isActive) {
        // Event masih aktif
        const timeLeftMinutes = Math.ceil(moment.duration(eventEndTime.diff(now)).asMinutes());
        const timeLeftFormatted = `${timeLeftMinutes}m left`;
        
        let replyMessage = `🔥 *Hell Event* 🔥\n\n`;
        replyMessage += `*Reward(s)*: ${eventData.eventName}\n`;
        if (eventData.taskName && eventData.taskName.trim() !== '') {
            replyMessage += `*Task(s)*: ${eventData.taskName}\n`;
        }
        replyMessage += `*Time left*: ${timeLeftFormatted}\n`;
        replyMessage += `*Phase 3 points*: ${eventData.points}\n\n`;
        replyMessage += `Message received at: *${eventTime.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*`;
        
        return replyMessage;
    } else {
        // Event sudah berakhir
        let replyMessage;
        
        if (onlyWatcherChaos) {
            // Show specific message for Watcher/Chaos filter
            replyMessage = `🔥 *Hell Event Watcher* 🔥\n\n`;
            replyMessage += `No Hell Event for Watcher and Chaos Dragon at this moment.\n\n`;
            replyMessage += `Last event at:\n`;
            replyMessage += `${eventTime.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)\n\n`;
            replyMessage += `*Reward*: ${eventData.eventName}\n`;
            if (eventData.taskName && eventData.taskName.trim() !== '') {
                replyMessage += `*Task*: ${eventData.taskName}\n`;
            }
            replyMessage += `-------------------------------------------\n\n`;
            
            // Check if current event is Watcher/Chaos Dragon
            if (isWatcherOrChaos) {
                replyMessage += `🔥 *Hell Event* 🔥\n\n`;
                replyMessage += `*Reward(s)*: ${eventData.eventName}\n`;
                if (eventData.taskName && eventData.taskName.trim() !== '') {
                    replyMessage += `*Task(s)*: ${eventData.taskName}\n`;
                }
                replyMessage += `*Time left*: Event ended\n`;
                replyMessage += `*Phase 3 points*: ${eventData.points}\n\n`;
                replyMessage += `Message received at: *${eventTime.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*`;
            }
        } else {
            // Show current event regardless of type
            replyMessage = `🔥 *Hell Event* 🔥\n\n`;
            replyMessage += `*Reward(s)*: ${eventData.eventName}\n`;
            if (eventData.taskName && eventData.taskName.trim() !== '') {
                replyMessage += `*Task(s)*: ${eventData.taskName}\n`;
            }
            replyMessage += `*Time left*: Event ended\n`;
            replyMessage += `*Phase 3 points*: ${eventData.points}\n\n`;
            replyMessage += `Message received at: *${eventTime.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*`;
        }
        
        return replyMessage;
    }
}

console.log('1. Event Building (ended) with ONLY_WATCHER_CHAOS=true:');
console.log('='.repeat(60));
console.log(generateHellEventOutput(mockEvents[0], true));

console.log('\n\n2. Event Chaos Dragon (ended) with ONLY_WATCHER_CHAOS=true:');
console.log('='.repeat(60));
console.log(generateHellEventOutput(mockEvents[1], true));

console.log('\n\n3. Event Watcher (active) with ONLY_WATCHER_CHAOS=true:');
console.log('='.repeat(60));
console.log(generateHellEventOutput(mockEvents[2], true));

console.log('\n\n4. Event Building (ended) with ONLY_WATCHER_CHAOS=false:');
console.log('='.repeat(60));
console.log(generateHellEventOutput(mockEvents[0], false));

console.log('\n\n✨ Test completed!');
console.log('\nKey Features:');
console.log('- ONLY_WATCHER_CHAOS=true shows special format with separator line');
console.log('- ONLY_WATCHER_CHAOS=false shows current event regardless of type');
console.log('- Active events show time left');
console.log('- Ended events show "Event ended"');
console.log('- Format adapts based on whether task is present');
