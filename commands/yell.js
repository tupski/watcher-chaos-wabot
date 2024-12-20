/**
 * A command that sends a "yell" message to the group.
 *
 * It will reply with a message that has the format of:
 * *[YELL]*
 * <pesan>
 *
 * If no message is specified, it will tell the user the format of the command.
 *
 * @param {WhatsAppClient} client - The WhatsApp client.
 * @param {Message} message - The message that triggered the command.
 *
 * @example
 * !yell Hello World!
 * // Output: *[YELL]* Hello World!
 */
module.exports = async (client, message) => {
    const args = message.body.split(' ').slice(1);
    if (args.length === 0) {
        message.reply('Format: !yell <pesan>');
        return;
    }

    const text = args.join(' ');
    const chat = await message.getChat();

    await chat.sendMessage(`*[YELL]*\n\n${text}`);
};
