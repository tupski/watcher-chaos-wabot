module.exports = async (client, message) => {
    const startTime = Date.now();
    await message.reply('Pong!');
    const latency = Date.now() - startTime;
    message.reply(`Latency: ${latency}ms`);
};
