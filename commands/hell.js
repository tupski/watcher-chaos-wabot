const moment = require('moment');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js');

// Path to store the latest Hell Event data
const dataFilePath = path.join(__dirname, '..', 'data', 'lastHellEvent.json');

// Discord channel ID from environment variable
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

/**
 * Processes a message to extract Hell Event details and broadcasts them to specified WhatsApp groups.
 * Can handle both Discord messages and WhatsApp messages.
 *
 * @param {Object} whatsappClient - The WhatsApp client instance used to send messages.
 * @param {Object} message - The message object (either Discord or WhatsApp).
 *
 * @remarks
 * This function looks for a specific pattern in the message content to identify Hell Event details.
 * If an event is detected, it calculates the time remaining and formats a message to be sent to WhatsApp groups.
 * It handles errors during message processing and logs any issues encountered.
 */
module.exports = async (whatsappClient, message) => {
    const whatsappGroupIds = process.env.WHATSAPP_GROUP_IDS ? process.env.WHATSAPP_GROUP_IDS.split(',') : [];

    try {
        // Check if this is a WhatsApp message or Discord message
        const isWhatsAppMessage = message.hasOwnProperty('body');

        // If it's a WhatsApp message with the !hell command
        if (isWhatsAppMessage) {
            try {
                // Send a temporary response to indicate the command is being processed
                await message.reply('Fetching the latest Hell Event information... Please wait.');

                // Fetch the latest message from Discord
                const discordMessage = await fetchLatestDiscordMessage();

                if (discordMessage) {
                    // Process the Discord message
                    const { content, attachments, createdTimestamp } = discordMessage;

                    // Check if the message contains Hell Event information
                    const regex = /Hell\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+)(?:m| minutes) left\s*\|\s*([\d.]+K)/;
                    const matches = content ? content.match(regex) : null;

                    if (matches) {
                        const eventName = matches[1].trim(); // Reward(s)
                        const taskName = matches[2].trim(); // Task(s)
                        const minutesLeft = parseInt(matches[3]); // Time left in minutes
                        const points = matches[4].trim(); // Phase 3 points

                        // Get the message timestamp
                        const discordTimestamp = moment(createdTimestamp).utcOffset(process.env.TIMEZONE_OFFSET || 7);

                        // Current time
                        const now = moment();

                        // Calculate event end time
                        const eventEndTime = discordTimestamp.clone().add(minutesLeft, 'minutes');

                        // Calculate remaining time
                        const timeLeftMinutes = Math.max(0, Math.ceil(moment.duration(eventEndTime.diff(now)).asMinutes()));
                        const timeLeftFormatted = `${timeLeftMinutes}m left`;

                        // Format the message
                        let replyMessage = `🔥 *Hell Event* 🔥\n\n`;
                        replyMessage += `*Reward(s):* ${eventName}\n`;
                        replyMessage += `*Task(s):* ${taskName}\n`;
                        replyMessage += `*Time left:* ${timeLeftFormatted}\n`;
                        replyMessage += `*Phase 3:* ${points}\n\n`;
                        replyMessage += `Message received at: *${discordTimestamp.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*`;

                        // Check if there's an image attachment
                        const imageAttachment = attachments.find(attachment =>
                            attachment.contentType && attachment.contentType.startsWith('image/'));

                        if (imageAttachment) {
                            // Download the image
                            const imageUrl = imageAttachment.url;
                            const imageResponse = await fetch(imageUrl);
                            const imageBuffer = await imageResponse.buffer();

                            // Save the image temporarily
                            const imagePath = path.join(__dirname, '..', 'data', 'temp_image.jpg');
                            fs.writeFileSync(imagePath, imageBuffer);

                            // Send the image with the caption
                            await message.reply({
                                body: replyMessage,
                                media: fs.readFileSync(imagePath)
                            });

                            // Clean up the temporary image
                            fs.unlinkSync(imagePath);
                        } else {
                            // No image, just send the text
                            await message.reply(replyMessage);
                        }

                        // Save the event data for future reference
                        saveHellEvent({
                            eventName,
                            taskName,
                            points,
                            timestamp: discordTimestamp.toISOString(),
                            endTime: eventEndTime.toISOString(),
                            minutesLeft,
                            imageUrl: imageAttachment ? imageAttachment.url : null
                        });

                        return;
                    } else {
                        // No Hell Event information found in the latest message
                        await message.reply(
                            "🔥 *Hell Event Watcher* 🔥\n\n" +
                            "The latest Discord message does not contain Hell Event information.\n\n" +
                            "No Hell Watcher / Chaos right now."
                        );
                        return;
                    }
                } else {
                    // No Discord message found or error fetching
                    // Fall back to the saved data
                    let lastEventData = getLastHellEvent();

                    if (lastEventData) {
                        // Use the saved data
                        const now = moment();
                        const eventTime = moment(lastEventData.timestamp);
                        const eventEndTime = moment(lastEventData.endTime);

                        // Check if the event is still active or if it's more than 1 hour old
                        if (now.diff(eventTime, 'hours') >= 1) {
                            await message.reply(
                                "🔥 *Hell Event Watcher* 🔥\n\n" +
                                "No Hell Watcher / Chaos right now.\n\n" +
                                `Last event was more than 1 hour ago at *${eventTime.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*`
                            );
                            return;
                        }

                        // Check if the event is still active
                        if (now.isBefore(eventEndTime)) {
                            // Event is still active, calculate remaining time
                            const timeLeftMinutes = Math.ceil(moment.duration(eventEndTime.diff(now)).asMinutes());
                            const timeLeftFormatted = `${timeLeftMinutes}m left`;

                            let replyMessage = `🔥 *Hell Event* 🔥\n\n`;
                            replyMessage += `*Reward(s):* ${lastEventData.eventName}\n`;
                            replyMessage += `*Task(s):* ${lastEventData.taskName}\n`;
                            replyMessage += `*Time left:* ${timeLeftFormatted}\n`;
                            replyMessage += `*Phase 3:* ${lastEventData.points}\n\n`;
                            replyMessage += `Message received at: *${eventTime.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*`;

                            // Check if there's a saved image URL
                            if (lastEventData.imageUrl) {
                                try {
                                    // Download the image
                                    const imageResponse = await fetch(lastEventData.imageUrl);
                                    const imageBuffer = await imageResponse.buffer();

                                    // Save the image temporarily
                                    const imagePath = path.join(__dirname, '..', 'data', 'temp_image.jpg');
                                    fs.writeFileSync(imagePath, imageBuffer);

                                    // Send the image with the caption
                                    await message.reply({
                                        body: replyMessage,
                                        media: fs.readFileSync(imagePath)
                                    });

                                    // Clean up the temporary image
                                    fs.unlinkSync(imagePath);
                                    return;
                                } catch (error) {
                                    console.error('Error downloading image:', error);
                                    // Fall back to text-only message
                                    await message.reply(replyMessage);
                                    return;
                                }
                            } else {
                                // No image URL, just send the text
                                await message.reply(replyMessage);
                                return;
                            }
                        } else {
                            // Event has ended
                            await message.reply(
                                "🔥 *Hell Event Watcher* 🔥\n\n" +
                                "No active Hell Events at the moment.\n\n" +
                                `Last event ended at *${eventEndTime.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*`
                            );
                            return;
                        }
                    } else {
                        // No saved data
                        await message.reply(
                            "🔥 *Hell Event Watcher* 🔥\n\n" +
                            "No Hell Watcher / Chaos right now.\n\n" +
                            "No previous event data found."
                        );
                        return;
                    }
                }
            } catch (error) {
                console.error('Error processing !hell command:', error);
                await message.reply('An error occurred while fetching Hell Event information. Please try again later.');
                return;
            }
        }

        // For Discord messages, proceed with the original logic
        // Ambil pesan dari Discord
        const content = message.content;

        // Regular expression to match Hell Event details in the message content
        // Format: Hell | Red Orb, Ancient Core | Merging, Building | 59m left | 441K
        const regex = /Hell\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+)(?:m| minutes) left\s*\|\s*([\d.]+K)/;
        const matches = content ? content.match(regex) : null;

        if (matches) {
            const eventName = matches[1].trim(); // Nama event
            const taskName = matches[2].trim(); // Nama task
            const minutesLeft = parseInt(matches[3]); // Sisa waktu dalam menit
            const points = matches[4].trim(); // Jumlah poin yang diperoleh

            // Timestamp Discord di-convert menjadi UTC+7
            const discordTimestamp = moment(message.createdAt).utcOffset(process.env.TIMEZONE_OFFSET || 7);

            // Waktu sekarang
            const now = moment();

            // Waktu akhir event
            const eventEndTime = discordTimestamp.clone().add(minutesLeft, 'minutes');

            // Save the event data for future reference
            saveHellEvent({
                eventName,
                taskName,
                points,
                timestamp: discordTimestamp.toISOString(),
                endTime: eventEndTime.toISOString(),
                minutesLeft
            });

            let msgText = '';

            // Jika event sudah berakhir, maka tampilkan pesan "not available right now."
            if (now.isAfter(eventEndTime)) {
                msgText = `Hell Watcher/Chaos Dragon *not available right now.*\nLast event at:\n*${discordTimestamp.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*\nEvent: *${eventName}*\nTask: *${taskName}*`;
            } else {
                // Hitung waktu yang tersisa dalam format "Xm left"
                let timeLeftFormatted = `${Math.ceil(moment.duration(eventEndTime.diff(now)).asMinutes())}m left`;

                // Buat pesan yang akan dikirim ke WhatsApp groups
                // Format the message according to the new requirements
                // Red Orb, Ancient Core : Reward(s)
                // Merging, Building : Task(s)
                // 59m left : time left (calculated)
                // 441K : Phase 3 points
                msgText = `🔥 *Hell Event* 🔥\n\n`;
                msgText += `*${eventName}* : Reward(s)\n`;
                msgText += `*${taskName}* : Task(s)\n`;
                msgText += `*${timeLeftFormatted}* : Time left\n`;
                msgText += `*${points}* : Phase 3 points\n\n`;
                msgText += `Message received at: *${discordTimestamp.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*`;
            }

            // Only send to WhatsApp groups if there are any configured
            if (whatsappGroupIds.length > 0) {
                for (const groupId of whatsappGroupIds) {
                    try {
                        // Ambil daftar chat WhatsApp
                        const chats = await whatsappClient.getChats();
                        const chat = chats.find(c => c.id._serialized === groupId.trim());

                        // Jika grup WhatsApp ditemukan, maka kirimkan pesan ke grup
                        if (chat) {
                            await chat.sendMessage(msgText);
                            console.log(`Message sent to WhatsApp group ${groupId}`);
                        } else {
                            console.error(`Group chat ${groupId} not found`);
                        }
                    } catch (error) {
                        console.error('Error sending message to WhatsApp group:', error);
                    }
                }
            } else {
                console.log('No WhatsApp groups configured. Skipping message broadcast.');
            }
        } else {
            console.log('No Hell/Chaos Dragon event detected in message');
        }
    } catch (error) {
        console.error('Error during Discord message processing:', error);
    }
};

/**
 * Saves Hell Event data to a file for future reference
 * @param {Object} eventData - The event data to save
 */
function saveHellEvent(eventData) {
    try {
        // Create data directory if it doesn't exist
        const dataDir = path.dirname(dataFilePath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Save the event data
        fs.writeFileSync(dataFilePath, JSON.stringify(eventData, null, 2));
        console.log('Hell Event data saved successfully');
    } catch (error) {
        console.error('Error saving Hell Event data:', error);
    }
}

/**
 * Gets the last Hell Event data from the file
 * @returns {Object|null} - The last Hell Event data or null if not found
 */
function getLastHellEvent() {
    try {
        if (fs.existsSync(dataFilePath)) {
            const data = fs.readFileSync(dataFilePath, 'utf8');
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error('Error reading Hell Event data:', error);
        return null;
    }
}

/**
 * Fetches the latest message from the Discord channel
 * @returns {Object|null} - The latest Discord message or null if not found
 */
async function fetchLatestDiscordMessage() {
    if (!DISCORD_TOKEN || !DISCORD_CHANNEL_ID) {
        console.error('Discord token or channel ID not set in environment variables');
        return null;
    }

    try {
        console.log('Initializing Discord client to fetch latest message...');

        // Create a new Discord client with minimal intents
        const client = new Client({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
        });

        // Wait for the client to be ready
        await new Promise((resolve, reject) => {
            client.once('ready', () => {
                console.log(`Discord client ready as ${client.user.tag}`);
                resolve();
            });

            client.once('error', (error) => {
                console.error('Discord client error:', error);
                reject(error);
            });

            // Login to Discord
            client.login(DISCORD_TOKEN).catch(reject);
        });

        // Fetch the channel
        const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
        if (!channel) {
            console.error(`Channel with ID ${DISCORD_CHANNEL_ID} not found`);
            await client.destroy();
            return null;
        }

        // Fetch the latest messages
        const messages = await channel.messages.fetch({ limit: 10 });
        if (messages.size === 0) {
            console.log('No messages found in the channel');
            await client.destroy();
            return null;
        }

        // Find the latest message with Hell Event information
        const regex = /Hell\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+)(?:m| minutes) left\s*\|\s*([\d.]+K)/;

        for (const [_, msg] of messages) {
            if (msg.content && regex.test(msg.content)) {
                console.log('Found Hell Event message:', msg.content);

                // Destroy the client before returning
                await client.destroy();

                return {
                    content: msg.content,
                    attachments: Array.from(msg.attachments.values()),
                    createdTimestamp: msg.createdTimestamp
                };
            }
        }

        console.log('No Hell Event messages found in the latest messages');
        await client.destroy();
        return null;
    } catch (error) {
        console.error('Error fetching Discord message:', error);
        return null;
    }
}

/**
 * Calculates the time of the next Hell Event
 * Hell events start at X:55 and end at X:00 (5 minutes duration)
 * @param {moment} currentTime - The current time as a moment object
 * @returns {moment} - The time of the next Hell Event
 */
function calculateNextHellEventTime(currentTime) {
    // Clone the current time to avoid modifying it
    const nextEventTime = currentTime.clone();

    // Get the current minute
    const currentMinute = nextEventTime.minute();

    // If the current minute is less than 55, the next event is at XX:55 of the current hour
    if (currentMinute < 55) {
        nextEventTime.minute(55);
        nextEventTime.second(0);
        nextEventTime.millisecond(0);
    } else {
        // If the current minute is 55 or greater, the next event is at XX:55 of the next hour
        nextEventTime.add(1, 'hour');
        nextEventTime.minute(55);
        nextEventTime.second(0);
        nextEventTime.millisecond(0);
    }

    return nextEventTime;
}
