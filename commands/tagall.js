module.exports = async (client, message) => {
    const validGroupIds = [
        '120363167287303832@g.us',
        '120363329911125895@g.us',
        '120363194079703816@g.us',
        '120363364063161357@g.us'
    ];

    // Make sure the message comes from a valid group
    if (!message.from.endsWith('@g.us') || !validGroupIds.includes(message.from)) {
        console.log('Pesan bukan dari grup yang valid.');
        return;
    }

    // Handle the !tagall command
    try {
        const chat = await message.getChat();
        if (!chat.isGroup) {
            console.log('Perintah hanya untuk grup.');
            return;
        }

        const mentions = [];
        for (let participant of chat.participants) {
            const contact = await client.getContactById(participant.id._serialized);
            mentions.push(contact);
        }

        await chat.sendMessage('Hello, semuanya!', { mentions });
        console.log('Pesan tagall berhasil dikirim.');
    } catch (error) {
        console.error('Terjadi kesalahan saat menjalankan perintah !tagall:', error);
    }
};
