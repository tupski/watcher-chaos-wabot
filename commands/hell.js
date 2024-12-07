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

            // Regex untuk menangkap data dari pesan Discord
            const regex = /Hell\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+)m left\s*\|\s*([\d]+K)/;
            const matches = content.match(regex);

            if (matches) {
                const eventName = matches[1].trim(); // Chaos Dragon atau Watcher
                const taskName = matches[2].trim(); // Artifact
                const minutesLeft = parseInt(matches[3]); // ambil sisa menit
                const points = matches[4].trim();

                const now = moment();
                const eventEndTime = discordTimestamp.clone().add(minutesLeft, 'minutes');

                if (now.isAfter(eventEndTime)) {
                    // Jika event sudah berakhir, tampilkan not available message
                    message.reply(`
Hell Watcher/Chaos Dragon *not available right now.*
Last event at:
*${discordTimestamp.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*

Event: *${eventName}*
Task: *${taskName}*
                    `);
                } else {
                    let timeLeftFormatted = '';

                    if (now.minute() >= 55 && now.minute() <= 59) {
                        // Jika sekarang di antara menit 55 dan 59
                        const remainingMinutes = 59 - now.minute() + 1;
                        timeLeftFormatted = `Starts in ${remainingMinutes} min`;
                    } else if (now.isBefore(eventEndTime)) {
                        const timeDiffMinutes = Math.ceil(moment.duration(eventEndTime.diff(now)).asMinutes());
                        timeLeftFormatted = `${timeDiffMinutes}m left`;
                    }

                    message.reply(`
Hell | *${eventName}*

Task(s): *${taskName}*
Time left: *${timeLeftFormatted}*
Phase 3 points: *${points}*

Message received at:
*${discordTimestamp.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*
                    `);
                }
            } else {
                message.reply('Failed to parse Hell event details from Discord.');
            }
        } else {
            const lastMessageTime = moment(messages[0]?.timestamp).utcOffset(process.env.TIMEZONE_OFFSET).format('DD/MM/YYYY HH:mm:ss (GMT+7)');
            message.reply(`No Hell Watcher/Chaos Dragon found. Last event:\n${lastMessageTime}`);
        }
    } catch (err) {
        console.error(err);
        message.reply('Failed to fetch Hell event from Discord.');
    }
};
