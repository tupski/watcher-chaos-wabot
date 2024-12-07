const fs = require('fs');
const path = require('path');

module.exports = async (client, message) => {
    if (!message.body.startsWith('!')) return;

    const commandName = message.body.split(' ')[0].substring(1).toLowerCase();
    const commandPath = path.join(__dirname, '..', 'commands', `${commandName}.js`);

    if (fs.existsSync(commandPath)) {
        const command = require(commandPath);
        command(client, message);
    } else {
        message.reply(`Command "${commandName}" tidak ditemukan.`);
    }
};
