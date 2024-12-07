module.exports = async (client, message) => {
    if (!message.isGroupMsg) {
        message.reply('Command ini hanya dapat digunakan di grup.');
        return;
    }

    const chat = await message.getChat();
    let mentions = [];

    chat.participants.forEach(participant => {
        mentions.push(participant.id._serialized);
    });

    const text = `*[TAG ALL]*\n${mentions.map(id => `@${id.split('@')[0]}`).join('\n')}`;
    await chat.sendMessage(text, { mentions });
};
