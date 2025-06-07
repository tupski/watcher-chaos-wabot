require('dotenv').config();
const { Client: WhatsAppClient, LocalAuth } = require('whatsapp-web.js');
const { Client: DiscordClient, GatewayIntentBits } = require('discord.js');
const qrcode = require('qrcode-terminal');
const qr = require('qrcode');
const { server, io, setWhatsAppClient } = require('./server');
const Message = require('./models/message');
const path = require('path');
const fs = require('fs');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Import command handlers
const hellEventHandler = require('./commands/hell');
const messageHandler = require('./handlers/messageHandler');

// Set the WhatsApp client for API routes (will be updated when client is ready)
setWhatsAppClient(null);

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
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

// qr code generator
whatsappClient.on('qr', (qrCode) => {
    console.log('Scan QR Code untuk WhatsApp:');
    qrcode.generate(qrCode, { small: true });

    // Generate QR code as data URL for web interface
    qr.toDataURL(qrCode, (err, url) => {
        if (err) {
            console.error('Error generating QR code for web:', err);
            return;
        }

        // Emit QR code to connected clients
        io.emit('qr', url);
    });
});

// handle ready event
const readyHandler = require('./handlers/readyHandler');
whatsappClient.on('ready', () => {
    console.log('WhatsApp client is ready!');
    readyHandler(whatsappClient);

    // Set the WhatsApp client for API routes
    setWhatsAppClient(whatsappClient);
    console.log('WhatsApp client set for API routes');

    // Notify web clients that WhatsApp is connected
    io.emit('whatsapp-connected');
});

// Discord ready event
discordClient.on('ready', () => {
    console.log(`Discord logged in as: ${discordClient.user.tag}`);
});

// Discord message event
discordClient.on('messageCreate', async (message) => {
    console.log('Pesan diterima dari Discord channel:', message.channelId);

    // check if the message is from the correct channel
    if (message.channelId === process.env.DISCORD_CHANNEL_ID) {
        console.log('Memproses pesan karena channel ID cocok');
        console.log('Message content:', message.content);

        // Process Hell Event messages
        try {
            await hellEventHandler(whatsappClient, message);
        } catch (error) {
            console.error('Error processing Discord message for Hell Event:', error);
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

// Handle WhatsApp message events
whatsappClient.on('message', async (message) => {
    try {
        // Process commands
        await messageHandler(whatsappClient, message);

        // Store the message in our database
        const contact = await message.getContact();
        const chat = await message.getChat();

        const messageData = {
            type: 'received',
            contact: chat.isGroup ? chat.name : contact.pushname || contact.number,
            body: message.body,
            status: 'received'
        };

        const savedMessage = Message.create(messageData);

        // Emit new message to web clients
        io.emit('new-message', savedMessage);
    } catch (error) {
        console.error('Error handling incoming message:', error);
    }
});

// Handle WhatsApp message_create events (outgoing messages)
whatsappClient.on('message_create', async (message) => {
    // Only process messages created by the user (not by the bot itself)
    if (!message.fromMe) return;

    try {
        const chat = await message.getChat();

        const messageData = {
            type: 'sent',
            contact: chat.isGroup ? chat.name : chat.name || message.to,
            body: message.body,
            status: 'sent'
        };

        const savedMessage = Message.create(messageData);

        // Emit new message to web clients
        io.emit('new-message', savedMessage);
    } catch (error) {
        console.error('Error handling outgoing message:', error);
    }
});

// Handle socket.io events
io.on('connection', (socket) => {
    console.log('Web client connected');

    // Handle refresh QR code request
    socket.on('refresh-qr', () => {
        console.log('QR code refresh requested');
        whatsappClient.logout();
        setTimeout(() => {
            whatsappClient.initialize();
        }, 1000);
    });

    // Handle delete message request
    socket.on('delete-message', async (id) => {
        console.log(`Delete message requested for ID: ${id}`);
        // Implement WhatsApp message deletion if needed
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Login to WhatsApp
whatsappClient.initialize();
