const fs = require('fs');
const path = require('path');

// Reads all files in the commands directory and loads them
const commands = {};
fs.readdirSync(__dirname).forEach(file => {
    if (file.endsWith('.js')) {
        const commandName = file.replace('.js', '');
        commands[commandName] = require(path.join(__dirname, file));
    }
});

module.exports = { commands };