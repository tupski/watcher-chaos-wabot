/**
 * Sends the uptime of the system as a message reply.
 *
 * Calculates the uptime in terms of months, weeks, and days, and formats it
 * into a human-readable string. If the uptime is less than a day, it will
 * indicate "Kurang dari 1 hari".
 *
 * @param {WhatsAppClient} client - The WhatsApp client instance.
 * @param {Message} message - The message to reply to.
 */
module.exports = async (client, message) => {
    const uptime = process.uptime(); // In seconds
    let days = Math.floor(uptime / 86400);
    let weeks = Math.floor(days / 7);
    let months = Math.floor(weeks / 4);

    days = days % 7;
    weeks = weeks % 4;

    const uptimeString = `${months > 0 ? `${months} bulan` : ''} ${weeks > 0 ? `${weeks} minggu` : ''} ${days > 0 ? `${days} hari` : ''}`;
    message.reply(`Uptime: ${uptimeString === '' ? 'Kurang dari 1 hari' : uptimeString}`);
};
