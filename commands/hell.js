const moment = require('moment');
const fetch = require('node-fetch');

module.exports = async (whatsappClient, discordMessage) => {
    const whatsappGroupIds = process.env.WHATSAPP_GROUP_IDS.split(',');

    try {
        const content = discordMessage.content; // Ambil pesan dari Discord
        const regex = /Hell\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+)(?:m| minutes) left\s*\|\s*([\d.]+K)/;
        const matches = content.match(regex);

        if (matches) {
            const eventName = matches[1].trim();
            const taskName = matches[2].trim();
            const minutesLeft = parseInt(matches[3]);
            const points = matches[4].trim();
            const discordTimestamp = moment(discordMessage.createdAt).utcOffset(process.env.TIMEZONE_OFFSET);

            const now = moment();
            const eventEndTime = discordTimestamp.clone().add(minutesLeft, 'minutes');
            let msgText = '';

            if (now.isAfter(eventEndTime)) {
                msgText = `Hell Watcher/Chaos Dragon *not available right now.*\nLast event at:\n*${discordTimestamp.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*\nEvent: *${eventName}*\nTask: *${taskName}*`;
            } else {
                let timeLeftFormatted = `${Math.ceil(moment.duration(eventEndTime.diff(now)).asMinutes())}m left`;
                msgText = `Hell | *${eventName}*\nTask(s): *${taskName}*\nTime left: *${timeLeftFormatted}*\nPhase 3 points: *${points}*\nMessage received at:\n*${discordTimestamp.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*`;
            }

            for (const groupId of whatsappGroupIds) {
                try {
                    const chats = await whatsappClient.getChats();
                    const chat = chats.find(c => c.id._serialized === groupId.trim());
                    if (chat) {
                        await chat.sendMessage(msgText);
                        console.log(`Message sent to WhatsApp group ${groupId}`);
                    } else {
                        console.error(`Group chat ${groupId} not found`);
                    }
                } catch (error) {
                    console.error('Error sending message to WhatsApp group:', error);
                }
            }
        } else {
            console.log('No Hell/Chaos Dragon event detected in message');
        }
    } catch (error) {
        console.error('Error during Discord message processing:', error);
    }
};
