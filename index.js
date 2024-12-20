require('dotenv').config();
const { Client: WhatsAppClient, LocalAuth } = require('whatsapp-web.js');
const { Client: DiscordClient, GatewayIntentBits } = require('discord.js');
const qrcode = require('qrcode-terminal');

// Import command handlers
const hellEventHandler = require('./commands/hell');

// initialize WhatsApp clients
const whatsappClient = new WhatsAppClient({
    authStrategy: new LocalAuth({
        clientId: process.env.WHATSAPP_CLIENT_ID,
    }),
    puppeteer: { 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
});

// initialize Discord clients
const discordClient = new DiscordClient({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// qr code generator
whatsappClient.on('qr', (qr) => {
    console.log('Scan QR Code untuk WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// handle ready event
const readyHandler = require('./handlers/readyHandler');
whatsappClient.on('ready', readyHandler);

// Discord ready event
discordClient.on('ready', () => {
    console.log(`Discord logged in as: ${discordClient.user.tag}`);
});

// Discord message event
discordClient.on('messageCreate', async (message) => {
    console.log('Pesan diterima dari Discord:', message.content);
    
    // check if the message is from the correct channel
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

// handle discord client login
discordClient.login(process.env.DISCORD_TOKEN)
    .then(() => {
        console.log('Discord client logged in successfully');
    })
    .catch((error) => {
        console.error('Failed to login to Discord client:', error);
    });

// Login to WhatsApp
whatsappClient.initialize();
