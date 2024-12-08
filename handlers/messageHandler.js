const fs = require('fs');
const path = require('path');

module.exports = async (client, message) => {
    // Abaikan pesan yang tidak diawali dengan "!"
    if (!message.body.startsWith('!')) return;

    // Ambil nama perintah (misalnya "!tagall" menjadi "tagall")
    const commandName = message.body.split(' ')[0].substring(1).toLowerCase();
    const commandPath = path.join(__dirname, '..', 'commands', `${commandName}.js`);

    // Periksa apakah file perintah ada
    if (fs.existsSync(commandPath)) {
        try {
            // Muat file perintah dan jalankan
            const command = require(commandPath);
            await command(client, message);
        } catch (error) {
            console.error(`Terjadi kesalahan saat menjalankan perintah "${commandName}":`, error);
            message.reply(`Maaf, terjadi kesalahan saat menjalankan perintah "${commandName}".`);
        }
    } else {
        // Tanggapan jika perintah tidak ditemukan
        message.reply(`Perintah "${commandName}" tidak ditemukan.`);
    }
};