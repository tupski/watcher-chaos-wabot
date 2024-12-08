require('dotenv').config();
const { Client: WhatsAppClient, LocalAuth } = require('whatsapp-web.js');
const { Client: DiscordClient, GatewayIntentBits } = require('discord.js');
const qrcode = require('qrcode-terminal');

// Import Commands
const hellEventHandler = require('./commands/hell');

// Inisialisasi WhatsApp dan Discord Client
const whatsappClient = new WhatsAppClient({
    authStrategy: new LocalAuth({
        clientId: process.env.WHATSAPP_CLIENT_ID,
    }),
    puppeteer: { headless: true },
});

const discordClient = new DiscordClient({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// QR Code untuk WhatsApp
whatsappClient.on('qr', (qr) => {
    console.log('Scan QR Code untuk WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Handle WhatsApp Ready
whatsappClient.on('ready', () => {
    console.log('WhatsApp client is ready');
});

// Debugging untuk Discord
discordClient.on('ready', () => {
    console.log(`Discord logged in as: ${discordClient.user.tag}`);
});

// Handle pesan dari Discord
discordClient.on('messageCreate', async (message) => {
    console.log('Pesan diterima dari Discord:', message.content);
    
    // Periksa apakah pesan berasal dari channel yang dimaksud
    if (message.channelId === process.env.DISCORD_CHANNEL_ID) {
        console.log('Memproses pesan karena channel ID cocok');
        try {
            await hellEventHandler(whatsappClient, message);
        } catch (error) {
            console.error('Error saat memproses pesan Discord:', error);
        }
    } else {
        console.log('Pesan datang dari channel yang tidak cocok');
    }
});

// Tangani error pada Discord login
discordClient.login(process.env.DISCORD_TOKEN)
    .then(() => {
        console.log('Discord client logged in successfully');
    })
    .catch((error) => {
        console.error('Failed to login to Discord client:', error);
    });

// Login ke WhatsApp
whatsappClient.initialize();
