const moment = require('moment');
const fetch = require('node-fetch');

module.exports = async (client, message) => {
    const discordChannelId = process.env.DISCORD_CHANNEL_ID;
    const discordToken = process.env.DISCORD_TOKEN;

    try {
        const response = await fetch(`https://discord.com/api/v10/channels/${discordChannelId}/messages`, {
            headers: { Authorization: `Bot ${discordToken}` },
        });
        const messages = await response.json();

        const hellEvent = messages.find(msg => msg.content.includes('Hell'));
        if (hellEvent) {
            const eventTime = moment(hellEvent.timestamp).utcOffset(process.env.TIMEZONE_OFFSET).format('DD/MM/YYYY HH:mm:ss (GMT+7)');
            message.reply(`Hell Notification\n\n${hellEvent.content}\n\n${eventTime}`);
        } else {
            const lastMessageTime = moment(messages[0]?.timestamp).utcOffset(process.env.TIMEZONE_OFFSET).format('DD/MM/YYYY HH:mm:ss (GMT+7)');
            message.reply(`No Hell Watcher/Chaos Dragon found. Last event:\n${lastMessageTime}`);
        }
    } catch (err) {
        console.error(err);
        message.reply('Failed to fetch Hell event from Discord.');
    }
};
