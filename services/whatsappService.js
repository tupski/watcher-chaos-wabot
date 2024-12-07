const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const client = new Client();

// Logika koneksi
client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp bot is ready!');
});

// Mulai koneksi
client.initialize();

// Fungsi kirim pesan ke WhatsApp Group
const sendToWhatsapp = async (message) => {
    try {
        const chatId = process.env.WHATSAPP_GROUP_ID + '@g.us'; // Group ID dari env file
        const chat = await client.getChatById(chatId);

        if (chat) {
            await chat.sendMessage(message);
            console.log('Message sent to WhatsApp successfully!');
        } else {
            console.error('Failed to find chat with WhatsApp group');
        }
    } catch (error) {
        console.error('Failed to send message to WhatsApp:', error);
    }
};

module.exports = { sendToWhatsapp };
