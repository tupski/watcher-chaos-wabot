module.exports = async (client, message) => {
    const uptime = process.uptime(); // In seconds
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    message.reply(`Uptime: ${hours}h ${minutes}m ${seconds}s`);
};
