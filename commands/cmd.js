const { setCommandPermission, getGroupSettings } = require('../utils/groupSettings');
const { getChatInfo } = require('../utils/chatUtils');

module.exports = async (client, message) => {
    try {
        const chatInfo = await getChatInfo(client, message);

        // Only work in groups
        if (!chatInfo.isGroup) {
            await message.reply('This command can only be used in group chats.');
            return;
        }

        // Check if user is admin
        if (!chatInfo.isUserAdmin) {
            await message.reply('❌ Only group admins can use this command.');
            return;
        }
        
        // Parse command arguments
        const args = message.body.split(' ').slice(1); // Remove !cmd
        
        if (args.length !== 2) {
            await message.reply(
                '❌ Invalid usage.\n\n' +
                '*Usage:* `!cmd <command> <admin/all>`\n\n' +
                '*Examples:*\n' +
                '• `!cmd hell admin` - Only admins can use !hell\n' +
                '• `!cmd monster all` - All members can use !monster\n\n' +
                '*Available commands:* hell, monster, tagall, ping, ai, help'
            );
            return;
        }
        
        const [command, permission] = args;
        const validCommands = ['hell', 'monster', 'tagall', 'ping', 'ai', 'help'];
        const validPermissions = ['admin', 'all'];
        
        if (!validCommands.includes(command.toLowerCase())) {
            await message.reply(
                `❌ Invalid command: "${command}"\n\n` +
                `*Available commands:* ${validCommands.join(', ')}`
            );
            return;
        }
        
        if (!validPermissions.includes(permission.toLowerCase())) {
            await message.reply(
                `❌ Invalid permission: "${permission}"\n\n` +
                `*Valid permissions:* admin, all`
            );
            return;
        }
        
        // Update permission
        const groupId = chatInfo.chat.id._serialized;
        const success = setCommandPermission(groupId, command.toLowerCase(), permission.toLowerCase());
        
        if (success) {
            const permissionText = permission.toLowerCase() === 'admin' ? 'admins only' : 'all members';
            await message.reply(
                `✅ *Permission Updated*\n\n` +
                `Command: \`!${command}\`\n` +
                `Access: ${permissionText}\n\n` +
                `This setting applies only to this group.`
            );
        } else {
            await message.reply('❌ Failed to update permission. Please try again.');
        }
        
    } catch (error) {
        console.error('Error in cmd command:', error);
        await message.reply('An error occurred while updating permissions.');
    }
};
