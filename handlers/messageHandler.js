const fs = require('fs');
const path = require('path');

module.exports = async (client, message) => {
    // Ignore messages that do not start with "!"
    if (!message.body.startsWith('!')) return;

    // Get the command name (e.g. "!tagall" becomes "tagall")
    const commandName = message.body.split(' ')[0].substring(1).toLowerCase();
    const commandPath = path.join(__dirname, '..', 'commands', `${commandName}.js`);

    // Check if command file exists
    if (fs.existsSync(commandPath)) {
        try {
            // Load the command file and run it
            const command = require(commandPath);
            await command(client, message);
        } catch (error) {
            console.error(`Terjadi kesalahan saat menjalankan perintah "${commandName}":`, error);
            message.reply(`Maaf, terjadi kesalahan saat menjalankan perintah "${commandName}".`);
        }
    } else {
        // Response if command not found
        message.reply(`Perintah "${commandName}" tidak ditemukan.`);
    }
};
