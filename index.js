require('dotenv').config(); // Load .env file
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

// Load Handlers
const messageHandler = require('./handlers/messageHandler');
const readyHandler = require('./handlers/readyHandler');

// Inisialisasi WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: process.env.WHATSAPP_CLIENT_ID, // Client ID dari file .env
    }),
    puppeteer: { headless: true },
});

// Event: Client Ready
client.on('ready', () => readyHandler(client));

// Event: Pesan Masuk
client.on('message', message => messageHandler(client, message));

// Jalankan Client
client.initialize();
