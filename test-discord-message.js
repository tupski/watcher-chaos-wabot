// This script simulates a Discord message with Hell Event details
// Run it with: node test-discord-message.js

const hellCommand = require('./commands/hell');

// Create a mock Discord message with the new format
const mockDiscordMessage = {
    content: 'Hell | Red Orb, Ancient Core | Merging, Building | 59m left | 441K\n|| <@&1301050950651220020> <@&1301050788260483093> <@&1301050786846871582> <@&1301050789334093845> <@&1301050951901380630> <@&1301050952811548775> <@&1301050624837812265> <@&1301050626834169948> <@&1301050623591972905>||',
    createdAt: new Date(),
    // Add any other properties needed by the hell command
};

// Create a mock WhatsApp client
const mockWhatsAppClient = {
    getChats: async () => {
        return []; // Return empty array for testing
    }
};

// Call the hell command with the mock message
(async () => {
    console.log('Testing hell command with mock Discord message...');
    await hellCommand(mockWhatsAppClient, mockDiscordMessage);
    console.log('Test completed!');
})();
