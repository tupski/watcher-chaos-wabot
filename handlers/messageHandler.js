const fs = require('fs');
const path = require('path');
const antiSpamLink = require('../middleware/antiSpamLink');
const { canExecuteCommand, isBotActiveInGroup } = require('../utils/groupSettings');
const { isGroupChat } = require('../utils/chatUtils');

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
    const wasDeleted = await antiSpamLink(message, client);

    if (wasDeleted) {
        console.log('Message was processed by anti-spam link filter');
        return;
    }

    // Abaikan pesan yang tidak diawali dengan "!"
    if (!message.body.startsWith('!')) {
        console.log('Message does not start with "!". Ignoring.');
        return;
    }

    // Extract command name
    const commandName = message.body.split(' ')[0].substring(1).toLowerCase();
    console.log('Command name extracted:', commandName);

    // Check if bot is active in this group
    const chat = await message.getChat();
    if (isGroupChat(chat) && !['enablebot', 'botowner', 'groups', 'restart'].includes(commandName)) {
        const groupId = chat.id._serialized;
        if (!isBotActiveInGroup(groupId)) {
            console.log(`Bot is not active in group ${groupId}, ignoring command: ${commandName}`);
            return;
        }
    }

    // Check command permissions
    const hasPermission = await canExecuteCommand(message, commandName, client);
    if (!hasPermission) {
        await message.reply('❌ You do not have permission to use this command.');
        return;
    }

    // Map commands to their files
    const commandMap = {
        'hell': 'hellCommand.js',
        'monster': 'monster.js',
        'tagall': 'tagall.js',
        'ping': 'ping.js',
        'ai': 'ai.js',
        'help': 'help.js',
        'cmd': 'cmd.js',
        'debug': 'debug.js',
        'permission': 'permission.js',
        'enablebot': 'enablebot.js',
        'disablebot': 'disablebot.js',

        'botowner': 'botowner.js',
        'groups': 'groups.js',
        'restart': 'restart.js'
    };

    // Get the actual command file
    const commandFile = commandMap[commandName];
    if (!commandFile) {
        console.log(`Unknown command: "${commandName}".`);
        await message.reply(`Unknown command: !${commandName}\n\nUse !help to see available commands.`);
        return;
    }

    // Construct the path to the command file
    const commandPath = path.join(__dirname, '..', 'commands', commandFile);
    console.log('Command path:', commandPath);

    // Check if the command file exists
    if (fs.existsSync(commandPath)) {
        console.log(`Command file found for "${commandName}". Executing command.`);
        try {
            // Load and execute the command
            const command = require(commandPath);
            await command(client, message);
            console.log(`Command "${commandName}" executed successfully.`);
        } catch (error) {
            console.error(`Error executing command "${commandName}":`, error);
            await message.reply('An error occurred while executing the command.');
        }
    } else {
        console.log(`Command file not found for "${commandName}".`);
        await message.reply(`Command file not found: !${commandName}`);
    }
};
