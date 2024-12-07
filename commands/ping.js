module.exports = async (client, message) => {
    const startTime = Date.now();
    await message.reply('*Pong!*\n');
    const latency = Date.now() - startTime;
    message.reply(`Latency: *${latency}ms*`);
};
