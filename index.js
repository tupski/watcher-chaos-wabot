require('dotenv').config();
const { Client: WhatsAppClient, LocalAuth } = require('whatsapp-web.js');
const { Client: DiscordClient, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Handlers
const messageHandler = require('./handlers/messageHandler');
const readyHandler = require('./handlers/readyHandler');

// Initialize WhatsApp Client
const whatsappClient = new WhatsAppClient({
    authStrategy: new LocalAuth({
        clientId: process.env.WHATSAPP_CLIENT_ID,
    }),
    puppeteer: { headless: true },
});

// Initialize Discord Client
const discordClient = new DiscordClient({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Event: WhatsApp Client Ready
whatsappClient.on('ready', () => readyHandler(whatsappClient));

// Event: Discord Client Ready
discordClient.on('ready', () => {
    console.log(`Discord bot logged in as ${discordClient.user.tag}`);
});

// Event: WhatsApp Messages
whatsappClient.on('message', (message) => messageHandler(whatsappClient, message));

// Start Clients
whatsappClient.initialize();
discordClient.login(process.env.DISCORD_TOKEN);
