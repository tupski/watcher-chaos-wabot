const moment = require('moment');
const fetch = require('node-fetch');

/**
 * Processes a Discord message to extract Hell Event details and broadcasts them to specified WhatsApp groups.
 *
 * @param {Object} whatsappClient - The WhatsApp client instance used to send messages.
 * @param {Object} discordMessage - The Discord message containing event details.
 *
 * @remarks
 * This function looks for a specific pattern in the Discord message content to identify Hell Event details.
 * If an event is detected, it calculates the time remaining and formats a message to be sent to WhatsApp groups.
 * It handles errors during message processing and logs any issues encountered.
 */
module.exports = async (whatsappClient, discordMessage) => {
    const whatsappGroupIds = process.env.WHATSAPP_GROUP_IDS.split(',');

    try {
        // Ambil pesan dari Discord
        const content = discordMessage.content;

        // Regular expression to match Hell Event details in the message content
        const regex = /Hell\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+)(?:m| minutes) left\s*\|\s*([\d.]+K)/;
        const matches = content.match(regex);

        if (matches) {
            const eventName = matches[1].trim(); // Nama event
            const taskName = matches[2].trim(); // Nama task
            const minutesLeft = parseInt(matches[3]); // Sisa waktu dalam menit
            const points = matches[4].trim(); // Jumlah poin yang diperoleh

            // Timestamp Discord di-convert menjadi UTC+7
            const discordTimestamp = moment(discordMessage.createdAt).utcOffset(process.env.TIMEZONE_OFFSET);

            // Waktu sekarang
            const now = moment();

            // Waktu akhir event
            const eventEndTime = discordTimestamp.clone().add(minutesLeft, 'minutes');

            let msgText = '';

            // Jika event sudah berakhir, maka tampilkan pesan "not available right now."
            if (now.isAfter(eventEndTime)) {
                msgText = `Hell Watcher/Chaos Dragon *not available right now.*\nLast event at:\n*${discordTimestamp.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*\nEvent: *${eventName}*\nTask: *${taskName}*`;
            } else {
                // Hitung waktu yang tersisa dalam format "Xm left"
                let timeLeftFormatted = `${Math.ceil(moment.duration(eventEndTime.diff(now)).asMinutes())}m left`;

                // Buat pesan yang akan dikirim ke WhatsApp groups
                msgText = `Hell | *${eventName}*\nTask(s): *${taskName}*\nTime left: *${timeLeftFormatted}*\nPhase 3 points: *${points}*\nMessage received at:\n*${discordTimestamp.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*`;
            }

            for (const groupId of whatsappGroupIds) {
                try {
                    // Ambil daftar chat WhatsApp
                    const chats = await whatsappClient.getChats();
                    const chat = chats.find(c => c.id._serialized === groupId.trim());

                    // Jika grup WhatsApp ditemukan, maka kirimkan pesan ke grup
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
