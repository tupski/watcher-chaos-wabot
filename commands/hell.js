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
const { shouldReceiveHellNotifications, isBotActiveInGroup } = require('../utils/groupSettings');

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
                    // Try format with task first: Hell | Reward | Task | Xm left | XK
                    let regex = /Hell\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+)(?:m| minutes) left\s*\|\s*([\d.]+K)/;
                    let matches = content ? content.match(regex) : null;

                    // If no match, try format without task: Hell | Reward | Xm left | XK
                    if (!matches) {
                        regex = /Hell\s*\|\s*([^|]+)\s*\|\s*(\d+)(?:m| minutes) left\s*\|\s*([\d.]+K)/;
                        matches = content ? content.match(regex) : null;
                    }

                    if (matches) {
                        let eventName, taskName, minutesLeft, points;

                        if (matches.length === 5) {
                            // Format with 2 parts: Hell | Part1 | Part2 | Xm left | XK
                            const part1 = matches[1].trim();
                            const part2 = matches[2].trim();
                            minutesLeft = parseInt(matches[3]);
                            points = matches[4].trim();

                            // Check if part1 contains special rewards (Watcher, Chaos Dragon, Ancient Core, Red Orb, etc.)
                            const specialRewards = ['watcher', 'chaos dragon', 'ancient core', 'red orb', 'speed up', 'gem', 'gold'];
                            const hasSpecialReward = specialRewards.some(reward =>
                                part1.toLowerCase().includes(reward)
                            );

                            if (hasSpecialReward) {
                                // Part1 is reward, Part2 is task
                                eventName = part1;
                                taskName = part2;
                            } else {
                                // Part1 is task, Part2 is also task (or empty)
                                eventName = ''; // No special reward
                                taskName = part2 ? `${part1}, ${part2}` : part1;
                            }
                        } else {
                            // Format with 1 part: Hell | Part1 | Xm left | XK
                            const part1 = matches[1].trim();
                            minutesLeft = parseInt(matches[2]);
                            points = matches[3].trim();

                            // Check if part1 contains special rewards
                            const specialRewards = ['watcher', 'chaos dragon', 'ancient core', 'red orb', 'speed up', 'gem', 'gold'];
                            const hasSpecialReward = specialRewards.some(reward =>
                                part1.toLowerCase().includes(reward)
                            );

                            if (hasSpecialReward) {
                                // Part1 is reward
                                eventName = part1;
                                taskName = '';
                            } else {
                                // Part1 is task
                                eventName = '';
                                taskName = part1;
                            }
                        }

                        // Get the message timestamp
                        const discordTimestamp = moment(createdTimestamp).utcOffset(process.env.TIMEZONE_OFFSET || 7);

                        // Current time
                        const now = moment();

                        // Calculate event end time
                        const eventEndTime = discordTimestamp.clone().add(minutesLeft, 'minutes');

                        // Calculate remaining time
                        const timeLeftMinutes = Math.max(0, Math.ceil(moment.duration(eventEndTime.diff(now)).asMinutes()));

                        // Check if we should filter based on group setting or ONLY_WATCHER_CHAOS setting
                        // For WhatsApp command, use group setting; for Discord auto-notification, use global setting
                        const { getGroupSettings } = require('../utils/groupSettings');
                        let onlyWatcherChaos = process.env.ONLY_WATCHER_CHAOS === 'true'; // Default from .env

                        // If this is a WhatsApp command (!hell), check group setting
                        if (isWhatsAppMessage && message.from) {
                            const groupSettings = getGroupSettings(message.from);
                            if (groupSettings.hellNotifications === 'watcherchaos') {
                                onlyWatcherChaos = true;
                            } else if (groupSettings.hellNotifications === 'all') {
                                onlyWatcherChaos = false;
                            }
                        }

                        const isWatcherOrChaos = eventName.toLowerCase().includes('watcher') ||
                                               eventName.toLowerCase().includes('chaos dragon');

                        if (timeLeftMinutes > 0) {
                            // Current event is still active
                            const timeLeftFormatted = `${timeLeftMinutes}m left`;

                            // Format the message
                            let replyMessage = `🔥 *Hell Event* 🔥\n\n`;
                            if (eventName && eventName.trim() !== '') {
                                replyMessage += `*Reward(s)*: ${eventName}\n`;
                            }
                            if (taskName && taskName.trim() !== '') {
                                replyMessage += `*Task(s)*: ${taskName}\n`;
                            }
                            replyMessage += `*Time left*: ${timeLeftFormatted}\n`;
                            replyMessage += `*Phase 3 points*: ${points}\n\n`;
                            replyMessage += `Message received at: *${discordTimestamp.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*`;

                            await message.reply(replyMessage);

                            // Save the event data
                            const imageAttachment = attachments.find(attachment =>
                                attachment.contentType && attachment.contentType.startsWith('image/'));

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
                            // Current event has ended, show "no event" message with current event details
                            let replyMessage;

                            if (onlyWatcherChaos) {
                                // Show specific message for Watcher/Chaos filter
                                replyMessage = `🔥 *Hell Event Watcher* 🔥\n\n`;
                                replyMessage += `No Hell Event for Watcher and Chaos Dragon at this moment.\n\n`;
                                replyMessage += `Last event at:\n`;
                                replyMessage += `${discordTimestamp.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)\n\n`;
                                if (eventName && eventName.trim() !== '') {
                                    replyMessage += `*Reward*: ${eventName}\n`;
                                }
                                if (taskName && taskName.trim() !== '') {
                                    replyMessage += `*Task*: ${taskName}\n`;
                                }
                                replyMessage += `-------------------------------------------\n\n`;

                                // Check if current event is Watcher/Chaos Dragon
                                if (isWatcherOrChaos) {
                                    replyMessage += `🔥 *Hell Event* 🔥\n\n`;
                                    if (eventName && eventName.trim() !== '') {
                                        replyMessage += `*Reward(s)*: ${eventName}\n`;
                                    }
                                    if (taskName && taskName.trim() !== '') {
                                        replyMessage += `*Task(s)*: ${taskName}\n`;
                                    }
                                    replyMessage += `*Time left*: Event ended\n`;
                                    replyMessage += `*Phase 3 points*: ${points}\n\n`;
                                    replyMessage += `Message received at: *${discordTimestamp.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*`;
                                }
                            } else {
                                // Show current event regardless of type
                                replyMessage = `🔥 *Hell Event* 🔥\n\n`;
                                if (eventName && eventName.trim() !== '') {
                                    replyMessage += `*Reward(s)*: ${eventName}\n`;
                                }
                                if (taskName && taskName.trim() !== '') {
                                    replyMessage += `*Task(s)*: ${taskName}\n`;
                                }
                                replyMessage += `*Time left*: Event ended\n`;
                                replyMessage += `*Phase 3 points*: ${points}\n\n`;
                                replyMessage += `Message received at: *${discordTimestamp.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*`;
                            }

                            await message.reply(replyMessage);

                            // Save the event data
                            const imageAttachment = attachments.find(attachment =>
                                attachment.contentType && attachment.contentType.startsWith('image/'));

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
                        }
                    } else {
                        // No Hell Event information found in the latest message
                        // Check for last saved event data
                        let lastEventData = getLastHellEvent();
                        if (lastEventData && lastEventData.timestamp) {
                            const lastEventTime = moment(lastEventData.timestamp).utcOffset(process.env.TIMEZONE_OFFSET || 7);
                            await message.reply(
                                "🔥 *Hell Event Watcher* 🔥\n\n" +
                                "No Hell Event for Watcher and Chaos Dragon at the moment.\n\n" +
                                `Last event at: *${lastEventTime.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*\n\n` +
                                `*Reward*: ${lastEventData.eventName}\n` +
                                `*Task*: ${lastEventData.taskName}`
                            );
                        } else {
                            await message.reply(
                                "🔥 *Hell Event Watcher* 🔥\n\n" +
                                "No Hell Event for Watcher and Chaos Dragon at the moment.\n\n" +
                                "Last event at: *Data not available*"
                            );
                        }
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
                                "No Hell Event for Watcher and Chaos Dragon at the moment.\n\n" +
                                `Last event was more than 1 hour ago at *${eventTime.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*\n\n` +
                                `*Reward*: ${lastEventData.eventName}\n` +
                                `*Task*: ${lastEventData.taskName}`
                            );
                            return;
                        }

                        // Check if the event is still active
                        const timeLeftMinutes = Math.ceil(moment.duration(eventEndTime.diff(now)).asMinutes());

                        if (timeLeftMinutes > 0) {
                            // Event is still active, show the event details
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
                            // Event has ended - show "no event" message
                            await message.reply(
                                "🔥 *Hell Event Watcher* 🔥\n\n" +
                                "No Hell Event for Watcher and Chaos Dragon at the moment.\n\n" +
                                `Last event at: *${eventEndTime.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*\n\n` +
                                `*Reward*: ${lastEventData.eventName}\n` +
                                `*Task*: ${lastEventData.taskName}`
                            );
                            return;
                        }
                    } else {
                        // No saved data
                        await message.reply(
                            "🔥 *Hell Event Watcher* 🔥\n\n" +
                            "No Hell Event for Watcher and Chaos Dragon at the moment.\n\n" +
                            "Last event at: *Data not available*"
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
        // Format examples:
        // Hell | Watcher | Building | 58m left | 590K (with task)
        // Hell | Chaos Dragon | Tycoon | 58m left | 175K (with task)
        // Hell | Building | 59m left | 230K (without task)
        // Hell | Ancient Core, Red Orb | Merging, Building, Research | 58m left | 630K (with task)

        // Try format with task first: Hell | Reward | Task | Xm left | XK
        let regex = /Hell\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+)(?:m| minutes) left\s*\|\s*([\d.]+K)/;
        let matches = content ? content.match(regex) : null;

        // If no match, try format without task: Hell | Reward | Xm left | XK
        if (!matches) {
            regex = /Hell\s*\|\s*([^|]+)\s*\|\s*(\d+)(?:m| minutes) left\s*\|\s*([\d.]+K)/;
            matches = content ? content.match(regex) : null;
        }

        if (matches) {
            let eventName, taskName, minutesLeft, points;

            if (matches.length === 5) {
                // Format with 2 parts: Hell | Part1 | Part2 | Xm left | XK
                const part1 = matches[1].trim();
                const part2 = matches[2].trim();
                minutesLeft = parseInt(matches[3]);
                points = matches[4].trim();

                // Check if part1 contains special rewards (Watcher, Chaos Dragon, Ancient Core, Red Orb, etc.)
                const specialRewards = ['watcher', 'chaos dragon', 'ancient core', 'red orb', 'speed up', 'gem', 'gold'];
                const hasSpecialReward = specialRewards.some(reward =>
                    part1.toLowerCase().includes(reward)
                );

                if (hasSpecialReward) {
                    // Part1 is reward, Part2 is task
                    eventName = part1;
                    taskName = part2;
                } else {
                    // Part1 is task, Part2 is also task (or empty)
                    eventName = ''; // No special reward
                    taskName = part2 ? `${part1}, ${part2}` : part1;
                }
            } else {
                // Format with 1 part: Hell | Part1 | Xm left | XK
                const part1 = matches[1].trim();
                minutesLeft = parseInt(matches[2]);
                points = matches[3].trim();

                // Check if part1 contains special rewards
                const specialRewards = ['watcher', 'chaos dragon', 'ancient core', 'red orb', 'speed up', 'gem', 'gold'];
                const hasSpecialReward = specialRewards.some(reward =>
                    part1.toLowerCase().includes(reward)
                );

                if (hasSpecialReward) {
                    // Part1 is reward
                    eventName = part1;
                    taskName = '';
                } else {
                    // Part1 is task
                    eventName = '';
                    taskName = part1;
                }
            }

            // Check if we should filter for only Watcher/Chaos Dragon events
            // Priority: Group setting > Global .env setting
            const { getGroupSettings } = require('../utils/groupSettings');
            const groupSettings = getGroupSettings(message.from || 'global');

            // Use group setting if available, otherwise fall back to .env
            let onlyWatcherChaos;
            if (groupSettings.hellNotifications === 'watcherchaos') {
                onlyWatcherChaos = true;
            } else if (groupSettings.hellNotifications === 'all') {
                onlyWatcherChaos = false;
            } else {
                // Fall back to .env setting
                onlyWatcherChaos = process.env.ONLY_WATCHER_CHAOS === 'true';
            }

            const isWatcherOrChaos = eventName && (eventName.toLowerCase().includes('watcher') ||
                                    eventName.toLowerCase().includes('chaos dragon'));

            console.log(`Found Hell Event: Reward="${eventName}" | Task="${taskName}" | ${minutesLeft}m left | ${points}`);
            console.log(`Filter setting: Group=${groupSettings.hellNotifications}, Env=${process.env.ONLY_WATCHER_CHAOS}, Final=${onlyWatcherChaos}, isWatcherOrChaos=${isWatcherOrChaos}`);

            if (onlyWatcherChaos && !isWatcherOrChaos) {
                console.log(`Filtering out non-Watcher/Chaos event: Reward="${eventName}" Task="${taskName}"`);
                return; // Skip this event
            }

            console.log(`Processing Hell Event: ${eventName} | ${taskName} | ${minutesLeft}m left | ${points}`);

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

            // Check if event is still active or has ended
            const currentMinutesLeft = Math.ceil(moment.duration(eventEndTime.diff(now)).asMinutes());

            if (currentMinutesLeft <= 0) {
                // Event has ended - don't send automatic message for ended events
                console.log('Event has ended, not sending automatic message');
                return;
            } else {
                // Hitung waktu yang tersisa dalam menit
                const minutesLeft = Math.ceil(moment.duration(eventEndTime.diff(now)).asMinutes());
                let timeLeftFormatted;

                if (minutesLeft <= 0) {
                    // Event sudah berakhir, hitung berapa jam yang lalu
                    const hoursAgo = Math.floor(moment.duration(now.diff(eventEndTime)).asHours());
                    if (hoursAgo === 1) {
                        timeLeftFormatted = `Ended 1 hour ago`;
                    } else if (hoursAgo > 1) {
                        timeLeftFormatted = `Ended ${hoursAgo} hours ago`;
                    } else {
                        // Kurang dari 1 jam, tampilkan dalam menit
                        const minutesAgo = Math.floor(moment.duration(now.diff(eventEndTime)).asMinutes());
                        timeLeftFormatted = `Ended ${minutesAgo}m ago`;
                    }
                } else {
                    timeLeftFormatted = `${minutesLeft}m left`;
                }

                // Buat pesan yang akan dikirim ke WhatsApp groups
                // Format pesan berdasarkan apakah ada reward atau hanya task
                msgText = `🔥 *Hell Event* 🔥\n\n`;
                if (eventName && eventName.trim() !== '') {
                    msgText += `*Reward(s)*: ${eventName}\n`;
                }
                if (taskName && taskName.trim() !== '') {
                    msgText += `*Task(s)*: ${taskName}\n`;
                }
                msgText += `*Time left*: ${timeLeftFormatted}\n`;
                msgText += `*Phase 3 points*: ${points}\n\n`;
                msgText += `Message received at:*\n${discordTimestamp.format('DD/MM/YYYY HH:mm:ss')} (GMT+7)*`;
            }

            // Only send to WhatsApp groups if there are any configured
            if (whatsappGroupIds.length > 0) {
                for (const groupId of whatsappGroupIds) {
                    try {
                        // Check if bot is active in this group (considering both normal enable and rent)
                        if (!isBotActiveInGroup(groupId.trim())) {
                            console.log(`Skipping group ${groupId} - bot is not active`);
                            continue;
                        }

                        // Check if this group should receive hell notifications
                        // Use group-specific setting, not global .env setting
                        const { getGroupSettings } = require('../utils/groupSettings');
                        const groupSettings = getGroupSettings(groupId.trim());

                        let shouldSendToGroup = true;

                        // Check group-specific hell notification setting
                        if (groupSettings.hellNotifications === 'off') {
                            shouldSendToGroup = false;
                        } else if (groupSettings.hellNotifications === 'watcherchaos') {
                            shouldSendToGroup = isWatcherOrChaos;
                        } else {
                            // 'all' or undefined (default to all)
                            shouldSendToGroup = true;
                        }

                        if (!shouldSendToGroup) {
                            console.log(`Skipping group ${groupId} - group setting: ${groupSettings.hellNotifications}, isWatcherOrChaos: ${isWatcherOrChaos}`);
                            continue;
                        }

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
        for (const [_, msg] of messages) {
            if (msg.content) {
                // Try format with task first: Hell | Reward | Task | Xm left | XK
                let regex = /Hell\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+)(?:m| minutes) left\s*\|\s*([\d.]+K)/;
                let matches = msg.content.match(regex);

                // If no match, try format without task: Hell | Reward | Xm left | XK
                if (!matches) {
                    regex = /Hell\s*\|\s*([^|]+)\s*\|\s*(\d+)(?:m| minutes) left\s*\|\s*([\d.]+K)/;
                    matches = msg.content.match(regex);
                }

                if (matches) {
                    console.log('Found Hell Event message:', msg.content);

                    // For !hell command, always return the latest message regardless of filter
                    // The filter is only applied for automatic notifications
                    await client.destroy();

                    return {
                        content: msg.content,
                        attachments: Array.from(msg.attachments.values()),
                        createdTimestamp: msg.createdTimestamp
                    };
                }
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
