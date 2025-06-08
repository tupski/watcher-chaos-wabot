const { setHellNotifications, getGroupSettings } = require('../utils/groupSettings');
const { getChatInfo } = require('../utils/chatUtils');
const hellEventHandler = require('./hell');

module.exports = async (client, message) => {
    try {
        // Parse command arguments
        const args = message.body.split(' ').slice(1); // Remove !hell
        const option = args[0] ? args[0].toLowerCase() : null;
        
        // Handle hell notification settings (admin only)
        if (option && ['watcherchaos', 'all', 'off', 'on', 'status'].includes(option)) {
            const chatInfo = await getChatInfo(client, message);

            // Only work in groups for settings
            if (!chatInfo.isGroup) {
                await message.reply('Hell notification settings can only be configured in group chats.');
                return;
            }

            // Check if user is admin for settings
            if (!chatInfo.isUserAdmin) {
                await message.reply('❌ Only group admins can change Hell Event notification settings.');
                return;
            }

            const groupId = chatInfo.chat.id._serialized;
            
            switch (option) {
                case 'watcherchaos':
                    setHellNotifications(groupId, 'watcherchaos');
                    await message.reply(
                        '✅ *Hell Event Notifications Updated*\n\n' +
                        'This group will now receive notifications for *Watcher and Chaos Dragon events only*.\n\n' +
                        'Other Hell Events will be filtered out.'
                    );
                    break;
                    
                case 'all':
                case 'on':
                    setHellNotifications(groupId, 'all');
                    await message.reply(
                        '✅ *Hell Event Notifications Updated*\n\n' +
                        'This group will now receive notifications for *all Hell Events*.\n\n' +
                        'Including Watcher, Chaos Dragon, and other events.'
                    );
                    break;
                    
                case 'off':
                    setHellNotifications(groupId, 'off');
                    await message.reply(
                        '✅ *Hell Event Notifications Updated*\n\n' +
                        'Hell Event notifications have been *disabled* for this group.\n\n' +
                        'Use `!hell on` to re-enable notifications.'
                    );
                    break;
                    
                case 'status':
                    const settings = getGroupSettings(groupId);
                    const status = settings.hellNotifications;
                    let statusText;
                    
                    switch (status) {
                        case 'watcherchaos':
                            statusText = '🔶 *Watcher & Chaos Dragon only*';
                            break;
                        case 'all':
                            statusText = '🟢 *All Hell Events*';
                            break;
                        case 'off':
                            statusText = '🔴 *Disabled*';
                            break;
                        default:
                            statusText = '🟢 *All Hell Events* (default)';
                    }
                    
                    await message.reply(
                        '📊 *Hell Event Notification Status*\n\n' +
                        `Current setting: ${statusText}\n\n` +
                        '*Available options:*\n' +
                        '• `!hell watcherchaos` - Watcher/Chaos Dragon only\n' +
                        '• `!hell all` - All Hell Events\n' +
                        '• `!hell off` - Disable notifications\n' +
                        '• `!hell on` - Enable all notifications'
                    );
                    break;
            }
            return;
        }
        
        // Regular !hell command - show current event
        // Call the original hell handler
        await hellEventHandler(client, message);
        
    } catch (error) {
        console.error('Error in hell command:', error);
        await message.reply('An error occurred while processing the hell command.');
    }
};
