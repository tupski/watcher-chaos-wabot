require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js');

// Load Handlers
const messageHandler = require('./handlers/messageHandler');
const readyHandler = require('./handlers/readyHandler');

const discordClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Needed to read message content
    ],
});

// Log in to Discord
discordClient.login(process.env.DISCORD_TOKEN);

// Event Listener: When a new message is created
discordClient.on('messageCreate', async (message) => {
    if (message.channel.id === process.env.DISCORD_CHANNEL_ID) {
        // Process the new message
        const whatsappGroupId = process.env.WHATSAPP_GROUP_ID;
        const chat = await whatsappClient.getChatById(`${whatsappGroupId}@g.us`);

        if (chat) {
            await chat.sendMessage(`New message from Discord: ${message.content}`);
        }
    }
});

// Initialize WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: process.env.WHATSAPP_CLIENT_ID,
    }),
    puppeteer: { headless: true },
});

// Event: Client Ready
client.on('ready', () => readyHandler(client));

// Event: Pesan Masuk
client.on('message', message => messageHandler(client, message));

// Jalankan Client
client.initialize();
