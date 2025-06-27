const { getChatInfo } = require('../utils/chatUtils');

/**
 * Tags all participants in a WhatsApp group.
 *
 * @param {Object} client - The WhatsApp client instance.
 * @param {Object} message - The message that triggered the command.
 */
module.exports = async (client, message) => {
    // Handle the !tagall command
    try {
        const chatInfo = await getChatInfo(client, message);

        if (!chatInfo.isGroup) {
            await message.reply('This command can only be used in group chats.');
            return;
        }

        // Extract any message after the command
        const commandParts = message.body.split(' ');
        commandParts.shift(); // Remove the command itself
        const userMessage = commandParts.join(' ');

        // Get participants using the utility function
        const participants = chatInfo.participants;

        if (!participants || participants.length === 0) {
            console.log('❌ Tidak dapat mengambil data member grup');

            await message.reply(
                '❌ *Tidak Dapat Tag Semua Member*\n\n' +
                '**Masalah:** Bot tidak dapat mengakses daftar member grup.\n\n' +
                '**Kemungkinan penyebab:**\n' +
                '• Sesi WhatsApp Web perlu di-refresh\n' +
                '• Metadata grup tidak dapat diakses\n' +
                '• Masalah kompatibilitas WhatsApp Web.js\n\n' +
                '**Solusi:**\n' +
                '1. Coba lagi dalam beberapa menit\n' +
                '2. Restart bot\n' +
                '3. Scan ulang QR code jika diperlukan\n' +
                '4. Gunakan `!debug` untuk diagnostik detail\n\n' +
                '**Catatan:** Bot sedang mencoba berbagai metode untuk mengakses data member secara otomatis.'
            );
            return;
        }

        console.log(`Found ${participants.length} participants in the group`);

        // Create the mention list
        const mentions = [];
        let mentionText = userMessage ? `*${userMessage}*\n\n` : '*[TAG ALL]*\n\n';

        for (let participant of participants) {
            try {
                // Skip the bot itself
                if (client.info && client.info.wid && participant.id._serialized === client.info.wid._serialized) {
                    continue;
                }

                // Add participant to mention
                if (participant.id && participant.id.user) {
                    mentionText += `@${participant.id.user}\n`;
                    mentions.push(participant.id._serialized);
                } else {
                    console.log('Skipping participant with invalid ID structure:', participant);
                }
            } catch (error) {
                console.log('Error processing participant:', participant, error.message);
            }
        }

        if (mentions.length === 0) {
            await message.reply('❌ No valid participants found to mention.');
            return;
        }

        console.log(`Mentioning ${mentions.length} participants`);

        try {
            // Send the message with mentions
            await chatInfo.chat.sendMessage(mentionText, {
                mentions: mentions
            });

            console.log('Tag all message sent successfully.');

            // Send confirmation
            await message.reply(`✅ Tagged ${mentions.length} group members successfully!`);

        } catch (sendError) {
            console.error('Error sending tag all message:', sendError);
            await message.reply('❌ Failed to send tag all message. Please try again.');
        }
    } catch (error) {
        console.error('Error executing tagall command:', error);
        await message.reply('An error occurred while executing the command.');
    }
};
