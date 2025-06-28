/**
 * Handler untuk auto-join grup dan kirim pesan welcome
 */

async function handleGroupJoin(client, notification) {
    try {
        console.log('Group join notification received:', notification);

        // Check if this is a group add notification for the bot
        if (notification.type === 'group_participant_add' &&
            notification.recipientIds &&
            notification.recipientIds.includes(client.info.wid._serialized)) {

            console.log('Bot was added to a group:', notification.chatId);

            // Get group info
            const chat = await client.getChatById(notification.chatId);
            console.log(`Joined group: ${chat.name}`);

            // Send welcome message
            await sendWelcomeMessage(chat, client);

        }
    } catch (error) {
        console.error('Error handling group join:', error);
    }
}

async function sendWelcomeMessage(chat, client) {
    try {
        const welcomeMessage =
            '🎉 *Selamat datang di Bot Lords Mobile!* 🎉\n\n' +
            '🤖 Bot ini akan membantu Anda dengan:\n' +
            '• 🔥 Notifikasi Hell Event otomatis\n' +
            '• 🐉 Jadwal Monster Rotation harian\n' +
            '• 📢 Tag all member grup\n' +
            '• 🎮 Berbagai fitur gaming lainnya\n\n' +
            '📋 *Cara Menggunakan:*\n' +
            '• Ketik `!help` untuk melihat semua command\n' +
            '• Ketik `!hell` untuk info Hell Event\n' +
            '• Ketik `!monster` untuk jadwal monster\n' +
            '• Ketik `!tagall [pesan]` untuk tag semua member\n\n' +
            '⚙️ *Pengaturan:*\n' +
            '• Ketik `!permission` untuk melihat pengaturan\n' +
            '• Admin grup bisa atur permission dengan `!cmd`\n\n' +
            'Selamat menggunakan Bot Lords Mobile! 🎮✨';

        await chat.sendMessage(welcomeMessage);
        console.log(`Welcome message sent to group: ${chat.name}`);

    } catch (error) {
        console.error('Error sending welcome message:', error);
    }
}

module.exports = {
    handleGroupJoin,
    sendWelcomeMessage
};
