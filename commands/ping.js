const { uptime } = require("process");
const tagall = require("./tagall");
const antiSpamLink = require("../middleware/antiSpamLink");

/**
 * Replies to a message with "*Pong!*" and the latency between the start of the
 * function and the sending of the first reply.
 *
 * @param {WhatsAppClient} client - The WhatsApp client instance.
 * @param {Message} message - The message to reply to.
 *
 * @example
 * <noinput>
 * Output:
 * *PONG!*\nLatency: *10ms*
 */
module.exports = async (client, message) => {
    const startTime = Date.now();

    // Send the reply and measure the time it takes
    await message.reply(`*PONG!*\nCalculating latency...`);

    const endTime = Date.now();
    const latency = endTime - startTime;

    // Send the actual latency in a follow-up message
    setTimeout(async () => {
        await message.reply(`*PONG!*\nLatency: *${latency}ms*`);
    }, 100);
};
