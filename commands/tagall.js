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
        if (!chat.isGroup) {
            await message.reply('This command can only be used in group chats.');
            return;
        }

        // Extract any message after the command
        const commandParts = message.body.split(' ');
        commandParts.shift(); // Remove the command itself
        const userMessage = commandParts.join(' ');

        // Create the mention list
        const mentions = [];
        let mentionText = userMessage ? `*${userMessage}*\n\n` : '*[TAG ALL]*\n\n';

        for (let participant of chat.participants) {
            // Skip the bot itself
            if (participant.id._serialized === client.info.wid._serialized) {
                continue;
            }

            mentionText += `@${participant.id.user} `;
            mentions.push(participant.id._serialized);
        }

        // Send the message with mentions
        await chat.sendMessage(mentionText, {
            mentions: mentions.map(id => ({ id }))
        });

        console.log('Tag all message sent successfully.');
    } catch (error) {
        console.error('Error executing tagall command:', error);
        await message.reply('An error occurred while executing the command.');
    }
};
