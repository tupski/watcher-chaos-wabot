const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { Client: DiscordClient, GatewayIntentBits } = require('discord.js');
const moment = require('moment');

// Inisialisasi Discord Client
const discordClient = new DiscordClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent]
});

// Login ke Discord
discordClient.login('YOUR_DISCORD_BOT_TOKEN');
discordClient.once('ready', () => console.log('Discord bot is ready'));

// Inisialisasi WhatsApp Client
const whatsappClient = new Client({
  authStrategy: new LocalAuth()
});

// Handle QR Code
whatsappClient.on('qr', (qr) => {
  console.log('QR RECEIVED', qr);
  qrcode.generate(qr, { small: true });
});

// Handle koneksi siap
whatsappClient.on('ready', () => {
  console.log('WhatsApp is ready');
});

// Handle pesan
whatsappClient.on('message', async (msg) => {
  if (msg.body.startsWith('!')) {
    const command = msg.body.split(' ')[0];
    switch (command) {
      case '!tagall':
        handleTagAll(msg);
        break;
      case '!hell':
        handleHell(msg);
        break;
      case '!ping':
        handlePing(msg);
        break;
      case '!uptime':
        handleUptime(msg);
        break;
      case '!yell':
        handleYell(msg);
        break;
    }
  }
});

// Uptime tracking
const startTime = Date.now();

// Handle perintah `!ping`
function handlePing(msg) {
  const latency = Date.now() - msg.timestamp;
  whatsappClient.sendMessage(msg.from, `🏓 Pong! Latency: ${latency}ms`);
}

// Handle perintah `!uptime`
function handleUptime(msg) {
  const uptime = moment.duration(Date.now() - startTime).humanize();
  whatsappClient.sendMessage(msg.from, `Uptime: ${uptime}`);
}

// Handle `!tagall`
function handleTagAll(msg) {
  const chat = msg.from;
  whatsappClient.getChatById(chat).then((chat) => {
    const mentions = chat.participants.map((p) => `@${p.id.replace(/@c.us$/, '')}`).join('\n');
    whatsappClient.sendMessage(chat.id, `*[TAG ALL]*\n${mentions}`);
  });
}

// Handle `!hell`
async function handleHell(msg) {
  try {
    const discordMessages = await discordClient.channels.cache.get('YOUR_DISCORD_CHANNEL_ID').messages.fetch({ limit: 1 });
    const lastEventMessage = discordMessages.first()?.content || 'No Hell Watcher/Chaos Dragon found.';
    whatsappClient.sendMessage(msg.from, `Hell Notification\n\n${lastEventMessage}`);
  } catch (error) {
    whatsappClient.sendMessage(
      msg.from,
      'No Hell Watcher/Chaos Dragon found. Last event:\n07/12/2024 22:56:56 (GMT+7)'
    );
  }
}

// Handle yell
function handleYell(msg) {
  const textToSend = msg.body.replace('!yell ', '');
  whatsappClient.sendMessage(msg.from, `🗣️ ${textToSend}`);
}

// Mulai WhatsApp
whatsappClient.initialize();
