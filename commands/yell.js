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
