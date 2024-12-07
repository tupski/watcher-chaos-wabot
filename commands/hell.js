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
            const content = hellEvent.content;
            const discordTimestamp = moment(hellEvent.timestamp).utcOffset(process.env.TIMEZONE_OFFSET);

            const regex = /Hell\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+)m left\s*\|\s*([\d]+K)/;
            const matches = content.match(regex);

            if (matches) {
                const eventName = matches[1].trim();
                const taskName = matches[2].trim();
                const minutesLeft = parseInt(matches[3]);
                const points = matches[4].trim();

                const now = moment();
                const eventEndTime = discordTimestamp.clone().add(minutesLeft, 'minutes');

                let msgText = '';

                if (now.isAfter(eventEndTime)) {
                    msgText = `Hell Watcher/Chaos Dragon *not available right now.*\nLast event at:\n*${discordTimestamp.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*\nEvent: *${eventName}*\nTask: *${taskName}*`;
                } else {
                    let timeLeftFormatted = '';

                    if (now.minute() >= 55 && now.minute() <= 59) {
                        const remainingMinutes = 59 - now.minute() + 1;
                        timeLeftFormatted = `Starts in ${remainingMinutes} min`;
                    } else if (now.isBefore(eventEndTime)) {
                        const timeDiffMinutes = Math.ceil(moment.duration(eventEndTime.diff(now)).asMinutes());
                        timeLeftFormatted = `${timeDiffMinutes}m left`;
                    }

                    msgText = `Hell | *${eventName}*\nTask(s): *${taskName}*\nTime left: *${timeLeftFormatted}*\nPhase 3 points: *${points}*\nMessage received at:\n*${discordTimestamp.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*`;
                }

                // Send this message to the WhatsApp group
                const chatId = `${process.env.WHATSAPP_GROUP_ID}@g.us`;
                const chat = await client.getChatById(chatId);
                if (chat) {
                    await chat.sendMessage(msgText);
                }

                // Reply back in the WhatsApp interface
                message.reply(msgText);
            } else {
                message.reply('Failed to parse Hell event details from Discord.');
            }
        } else {
            const lastMessageTime = moment(messages[0]?.timestamp).utcOffset(process.env.TIMEZONE_OFFSET).format('DD/MM/YYYY HH:mm:ss (GMT+7)');
            const chatId = `${process.env.WHATSAPP_GROUP_ID}@g.us`;
            const chat = await client.getChatById(chatId);
            if (chat) {
                await chat.sendMessage(`No Hell Watcher/Chaos Dragon found. Last event at ${lastMessageTime}`);
            }
            message.reply(`No Hell Watcher/Chaos Dragon found. Last event at:\n${lastMessageTime}`);
        }
    } catch (error) {
        console.error(error);
        message.reply('Failed to fetch Hell event from Discord.');

        const chatId = `${process.env.WHATSAPP_GROUP_ID}@g.us`;
        const chat = await client.getChatById(chatId);
        if (chat) {
            await chat.sendMessage('Failed to fetch Hell event from Discord.');
        }
    }
};
