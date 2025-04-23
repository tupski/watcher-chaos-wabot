const moment = require('moment');

/**
 * Sends the uptime of the system as a message reply.
 *
 * Calculates the uptime in days, hours, minutes, and seconds, and formats it
 * into a human-readable string.
 *
 * @param {WhatsAppClient} client - The WhatsApp client instance.
 * @param {Message} message - The message to reply to.
 */
module.exports = async (client, message) => {
    try {
        // Get uptime in seconds
        const uptime = process.uptime();

        // Calculate days, hours, minutes, seconds
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        // Format uptime message
        let uptimeMessage = '⏱️ *Bot Uptime* ⏱️\n\n';

        if (days > 0) {
            uptimeMessage += `${days} day${days !== 1 ? 's' : ''}, `;
        }

        uptimeMessage += `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}, ${seconds} second${seconds !== 1 ? 's' : ''}`;

        // Add system information
        const startTime = new Date(Date.now() - (uptime * 1000));
        uptimeMessage += '\n\n*Bot Status:* Online ✅';
        uptimeMessage += `\n*Started:* ${moment(startTime).format('DD/MM/YYYY HH:mm:ss')}`;
        uptimeMessage += `\n*Current Time:* ${moment().format('DD/MM/YYYY HH:mm:ss')}`;

        // Add memory usage information
        const memoryUsage = process.memoryUsage();
        const memoryUsedMB = Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100;
        uptimeMessage += `\n*Memory Usage:* ${memoryUsedMB} MB`;

        // Send the uptime message
        await message.reply(uptimeMessage);
    } catch (error) {
        console.error('Error executing uptime command:', error);
        await message.reply('An error occurred while executing the command.');
    }
};
