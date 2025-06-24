module.exports = async (client, message) => {
    try {
        const helpMessage = `🤖 *Bot Help & Commands* 🤖

*📋 Available Commands:*

*🔥 Hell Event Commands:*
• \`!hell\` - Show current Hell Event status
• \`!hell watcherchaos\` - Enable only Watcher/Chaos Dragon notifications
• \`!hell all\` - Enable all Hell Event notifications  
• \`!hell off\` - Disable Hell Event notifications for this group
• \`!hell on\` - Enable all Hell Event notifications
• \`!hell status\` - Check current notification settings

*🐉 Monster Commands:*
• \`!monster\` - Show today and tomorrow monster rotation
• \`!monster [name]\` - Search when specific monster will spawn

*👥 Group Commands:*
• \`!tagall [message]\` - Tag all group members
• \`!ping\` - Check bot response time

*🤖 AI Commands:*
• \`!ai <prompt>\` - Ask AI assistant a question

*⚙️ Admin Commands:*
• \`!cmd <command> <admin/all>\` - Set command permissions
  Example: \`!cmd hell admin\` (only admins can use !hell)
• \`!permission\` - View all command permissions and bot settings
• \`!debug\` - Show bot diagnostic information
• \`!help\` - Show this help message

*🔧 Bot Owner Commands:*
• \`!enablebot\` - Activate bot in this group (BOT_OWNER only)
• \`!disablebot\` - Deactivate bot in this group (BOT_OWNER only)
• \`!rent <option>\` - Manage bot rental (BOT_OWNER only)
  - \`!rent DDMMYYYY\` - Set expiry date (e.g., !rent 08072025)
  - \`!rent 30d\` - Set 30 days from now
  - \`!rent disable\` - Disable rental mode
  - \`!rent status\` - Check rental status (Admin can use)

*🔧 Permission System:*
• Most commands can be used by all members by default
• Admins can restrict commands using \`!cmd\`
• Hell notification settings are per-group
• Only admins can change Hell notifications and command permissions
• BOT_OWNER has full control over bot activation/deactivation

*📱 Features:*
• Automatic Hell Event notifications from Discord
• Daily monster reset notifications at 11:55 AM (GMT+7)
• Anti-spam link protection
• AI-powered question answering

*💡 Tips:*
• All settings are per-group (won't affect other groups)
• Use \`!hell status\` to check your group's notification settings
• Monster rotation follows a 12-day cycle
• AI responses are powered by Google Gemini

Need more help? Contact the bot administrator!`;

        await message.reply(helpMessage);
        
    } catch (error) {
        console.error('Error in help command:', error);
        await message.reply('An error occurred while showing help. Please try again.');
    }
};
