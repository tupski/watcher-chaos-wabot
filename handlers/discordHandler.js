require('dotenv').config();
const fetch = require('node-fetch'); // Library untuk HTTP requests
const moment = require('moment-timezone'); // Untuk format waktu

// Fungsi untuk fetch data dari Discord
const fetchDiscordData = async () => {
    try {
        const response = await fetch(`https://discord.com/api/v10/channels/${process.env.DISCORD_CHANNEL_ID}/messages`, {
            method: 'GET',
            headers: {
                Authorization: `Bot ${process.env.DISCORD_API_KEY}`,
            },
        });

        if (!response.ok) {
            console.error('Failed to fetch Discord messages:', response.statusText);
            return [];
        }

        const messages = await response.json();
        return messages;
    } catch (error) {
        console.error('Error fetching Discord messages:', error);
        return [];
    }
};

// Fungsi untuk memproses data dari Discord
const processDiscordMessages = (messages) => {
    // Filter pesan dengan format "Hell"
    const hellMessages = messages.filter(message =>
        message.content.includes('Hell') &&
        message.content.includes('|') &&
        message.content.match(/Hunting \|\s?\d{1,2}[mh] left/)
    );

    if (hellMessages.length === 0) {
        // Jika tidak ada pesan yang sesuai, kembalikan pesan default
        const lastMessage = messages[0] || { timestamp: 'No messages yet' };
        const formattedTime = lastMessage.timestamp
            ? moment(lastMessage.timestamp).tz('Asia/Jakarta').format('DD MMM YYYY HH:mm:ss (z)')
            : 'Unknown time';

        return `No Hell Watcher/Chaos Dragon found. Last event:\n${formattedTime}`;
    }

    // Ambil pesan terakhir dengan informasi "Hell"
    const latestHellMessage = hellMessages[0];
    const timestamp = moment(latestHellMessage.timestamp)
        .tz('Asia/Jakarta')
        .format('DD MMM YYYY HH:mm:ss (z)');
    const dateOnly = moment(latestHellMessage.timestamp)
        .tz('Asia/Jakarta')
        .format('DD MMM YYYY');

    // Format isi pesan
    const content = latestHellMessage.content;

    // Parse pesan untuk mendapatkan Task, Time left, dan Phase
    const taskMatch = content.match(/Hell\s\|\s(.*?)\s\|/);
    const task = taskMatch ? taskMatch[1] : 'Unknown Task';

    const timeLeftMatch = content.match(/Hunting \|\s?(\d{1,2}[mh] left)/);
    const timeLeft = timeLeftMatch ? timeLeftMatch[1] : 'Unknown Time Left';

    const phaseMatch = content.match(/\|\s(\d{1,3}(\.\d{1,3})?[KMB])$/);
    const phasePoints = phaseMatch ? phaseMatch[1] : 'Unknown Points';

    // Format pesan menjadi output yang diinginkan
    return `Hell Notification | ${task}\n\nTask: *${task}*\nTime left: *${timeLeft}*\nPhase 3: *${phasePoints}*\n\n${timestamp}`;
};

module.exports = {
    fetchDiscordData,
    processDiscordMessages,
};
