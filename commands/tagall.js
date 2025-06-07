/**
 * Tags all participants in a WhatsApp group.
 *
 * @param {Object} client - The WhatsApp client instance.
 * @param {Object} message - The message that triggered the command.
 */
module.exports = async (client, message) => {
    // Handle the !tagall command
    try {
        const chat = await message.getChat();

        // Debug logging
        console.log('Chat info:', {
            id: chat.id._serialized,
            name: chat.name,
            isGroup: chat.isGroup,
            participants: chat.participants ? chat.participants.length : 0
        });

        // Check if it's a group by ID pattern (ends with @g.us) or isGroup property
        const isGroupChat = chat.isGroup || (chat.id && chat.id._serialized && chat.id._serialized.endsWith('@g.us'));

        if (!isGroupChat) {
            await message.reply('This command can only be used in group chats.');
            return;
        }

        // Extract any message after the command
        const commandParts = message.body.split(' ');
        commandParts.shift(); // Remove the command itself
        const userMessage = commandParts.join(' ');

        // Get participants - try different methods to get them
        let participants = chat.participants;
        if (!participants || participants.length === 0) {
            console.log('No participants found, trying alternative methods...');
            try {
                // Try to get fresh chat data
                const freshChat = await client.getChatById(chat.id._serialized);
                participants = freshChat.participants;
                console.log(`Found ${participants ? participants.length : 0} participants after refresh`);
            } catch (error) {
                console.log('Error getting fresh chat data:', error.message);
            }
        }

        if (!participants || participants.length === 0) {
            await message.reply('Unable to get group participants. Please try again.');
            return;
        }

        console.log(`Found ${participants.length} participants in the group`);

        // Create the mention list
        const mentions = [];
        let mentionText = userMessage ? `*${userMessage}*\n\n` : '*[TAG ALL]*\n\n';

        for (let participant of participants) {
            // Skip the bot itself
            if (participant.id._serialized === client.info.wid._serialized) {
                continue;
            }

            mentionText += `@${participant.id.user} `;
            mentions.push(participant.id._serialized);
        }

        console.log(`Mentioning ${mentions.length} participants`);

        // Send the message with mentions
        await chat.sendMessage(mentionText, {
            mentions: mentions
        });

        console.log('Tag all message sent successfully.');
    } catch (error) {
        console.error('Error executing tagall command:', error);
        await message.reply('An error occurred while executing the command.');
    }
};
