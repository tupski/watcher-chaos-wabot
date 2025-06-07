const fs = require('fs');
const path = require('path');
const antiSpamLink = require('../middleware/antiSpamLink');

/**
 * Handles incoming messages from WhatsApp.
 *
 * @param {WhatsAppClient} client - The WhatsApp client instance.
 * @param {Message} message - The incoming message.
 *
 * @remarks
 * This function will ignore messages that do not start with a "!" character.
 * It will then attempt to load a command file from the "commands" directory.
 * If the file exists, it will call the exported function from the file with the
 * client and message as arguments.
 * If the file does not exist, or if there is an error while running the command,
 * it will send a reply to the message with an error message.
 */
module.exports = async (client, message) => {
    console.log('Received message:', message.body);

    // Check for spam links first (before processing commands)
    const allowedLinks = process.env.ALLOWED_LINKS ? process.env.ALLOWED_LINKS.split(',') : [];
    const wasDeleted = await antiSpamLink(message, allowedLinks);

    if (wasDeleted) {
        console.log('Message was deleted due to unauthorized links');
        return;
    }

    // Abaikan pesan yang tidak diawali dengan "!"
    if (!message.body.startsWith('!')) {
        console.log('Message does not start with "!". Ignoring.');
        return;
    }

    // Ambil nama perintah (misalnya "!tagall" menjadi "tagall")
    const commandName = message.body.split(' ')[0].substring(1).toLowerCase();
    console.log('Command name extracted:', commandName);

    const commandPath = path.join(__dirname, '..', 'commands', `${commandName}.js`);
    console.log('Command path:', commandPath);

    // Periksa apakah file perintah ada
    if (fs.existsSync(commandPath)) {
        console.log(`Command file found for "${commandName}". Executing command.`);
        try {
            // Muat file perintah dan jalankan
            const command = require(commandPath);
            await command(client, message);
            console.log(`Command "${commandName}" executed successfully.`);
        } catch (error) {
            console.error(`Error executing command "${commandName}":`, error);
            message.reply(`Maaf, terjadi kesalahan saat menjalankan perintah "${commandName}".`);
        }
    } else {
        console.log(`Command "${commandName}" not found.`);
        // Tanggapan jika perintah tidak ditemukan
        message.reply(`Perintah "${commandName}" tidak ditemukan.`);
    }
};
