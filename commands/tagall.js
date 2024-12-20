const { WHATSAPP_GROUP_IDS } = process.env;

module.exports = async (client, message) => {
    const validGroupIds = WHATSAPP_GROUP_IDS
        ? WHATSAPP_GROUP_IDS.split(',').map(groupId => groupId.trim())
        : [];

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

        await chat.sendMessage('*[TAG ALL]*\n\n', { mentions });
        console.log('Pesan tagall berhasil dikirim.');
    } catch (error) {
        console.error('Terjadi kesalahan saat menjalankan perintah !tagall:', error);
    }
};
