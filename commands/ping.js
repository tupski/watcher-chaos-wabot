const { uptime } = require("process");
const tagall = require("./tagall");
const antiSpamLink = require("../middleware/antiSpamLink");

module.exports = async (client, message) => {
    const startTime = Date.now();
    await message.reply('*Pong!*\n');
    const latency = Date.now() - startTime;
    message.reply(`Latency: *${latency}ms*`);
};