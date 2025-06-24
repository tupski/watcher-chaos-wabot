/**
 * Utility functions for handling WhatsApp chat operations
 */

/**
 * Check if a chat is a group chat using multiple detection methods
 * @param {Object} chat - The chat object
 * @returns {boolean} - True if it's a group chat
 */
function isGroupChat(chat) {
    // Primary method: Check if ID ends with @g.us (group pattern)
    if (chat.id && chat.id._serialized && chat.id._serialized.endsWith('@g.us')) {
        return true;
    }
    
    // Secondary method: Check isGroup property if available
    if (chat.isGroup === true) {
        return true;
    }
    
    // Tertiary method: Check if participants exist (groups have participants)
    if (chat.participants && Array.isArray(chat.participants) && chat.participants.length > 0) {
        return true;
    }
    
    return false;
}

/**
 * Get group participants with retry mechanism - optimized for whatsapp-web.js v1.26.0
 * @param {Object} client - WhatsApp client
 * @param {Object} chat - The chat object
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Array} - Array of participants or empty array
 */
async function getGroupParticipants(client, chat, maxRetries = 3) {
    console.log('=== Starting participant retrieval ===');

    // Method 1: Direct participants property
    if (chat.participants && Array.isArray(chat.participants) && chat.participants.length > 0) {
        console.log(`✅ Method 1: Found ${chat.participants.length} participants from chat.participants`);
        return chat.participants;
    }
    console.log('❌ Method 1: chat.participants empty or undefined');

    // Method 2: Try to wait and access participants (timing issue fix)
    console.log('⏳ Method 2: Waiting 3 seconds for participants to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (chat.participants && Array.isArray(chat.participants) && chat.participants.length > 0) {
        console.log(`✅ Method 2: Found ${chat.participants.length} participants after waiting`);
        return chat.participants;
    }
    console.log('❌ Method 2: Still no participants after waiting');

    // Method 3: Force refresh chat multiple times
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 Method 3.${attempt}: Force refreshing chat data...`);
            const freshChat = await client.getChatById(chat.id._serialized);

            // Wait a bit for data to load
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (freshChat.participants && Array.isArray(freshChat.participants) && freshChat.participants.length > 0) {
                console.log(`✅ Method 3.${attempt}: Found ${freshChat.participants.length} participants`);
                return freshChat.participants;
            }

            console.log(`❌ Method 3.${attempt}: No participants found`);

        } catch (error) {
            console.log(`❌ Method 3.${attempt}: Error - ${error.message}`);
        }
    }

    // Method 4: Get all chats and find group with proper filtering
    try {
        console.log('🔍 Method 4: Searching through all chats...');
        const allChats = await client.getChats();
        console.log(`Total chats found: ${allChats.length}`);

        // Find all group chats
        const groupChats = allChats.filter(c => {
            const isGroup = c.id._serialized.endsWith('@g.us');
            if (isGroup) {
                console.log(`Group found: ${c.name} (${c.id._serialized}) - participants: ${c.participants ? c.participants.length : 'undefined'}`);
            }
            return isGroup;
        });

        console.log(`Total group chats: ${groupChats.length}`);

        // Find our specific group
        const targetChat = groupChats.find(c => c.id._serialized === chat.id._serialized);

        if (targetChat) {
            console.log(`✅ Found target group: ${targetChat.name}`);

            if (targetChat.participants && Array.isArray(targetChat.participants) && targetChat.participants.length > 0) {
                console.log(`✅ Method 4: Found ${targetChat.participants.length} participants`);
                return targetChat.participants;
            } else {
                console.log(`❌ Method 4: Target group found but no participants`);
                console.log(`Participants property: ${typeof targetChat.participants}`);
                console.log(`Participants value:`, targetChat.participants);
            }
        } else {
            console.log(`❌ Method 4: Target group not found in all chats`);
        }
    } catch (error) {
        console.log(`❌ Method 4: Error - ${error.message}`);
    }

    // Fourth try: Try to get group metadata (alternative method)
    try {
        console.log('Trying to get group metadata...');
        if (client.getGroupMetadata) {
            const groupMetadata = await client.getGroupMetadata(chat.id._serialized);
            if (groupMetadata && groupMetadata.participants && Array.isArray(groupMetadata.participants)) {
                console.log(`Found ${groupMetadata.participants.length} participants from group metadata`);
                return groupMetadata.participants;
            }
        }
    } catch (error) {
        console.log('Error getting group metadata:', error.message);
    }

    // Fifth try: Try accessing participants property directly from fresh group chats
    try {
        console.log('Trying to access participants from fresh group chats...');
        const allChats = await client.getChats();

        // Filter for group chats and log details
        const groupChats = allChats.filter(c => {
            const isGroup = c.isGroup || (c.id && c.id._serialized && c.id._serialized.endsWith('@g.us'));
            return isGroup && c.id._serialized === chat.id._serialized;
        });

        console.log(`Found ${groupChats.length} matching group chats`);

        if (groupChats.length > 0) {
            const groupChat = groupChats[0];
            console.log(`Processing group: ${groupChat.name}, isGroup: ${groupChat.isGroup}`);

            // Try participants property
            if (groupChat.participants && Array.isArray(groupChat.participants) && groupChat.participants.length > 0) {
                console.log(`Found ${groupChat.participants.length} participants from fresh group participants property`);
                return groupChat.participants;
            }

            // Try getParticipants method if available
            if (groupChat.getParticipants && typeof groupChat.getParticipants === 'function') {
                try {
                    const participants = await groupChat.getParticipants();
                    if (participants && Array.isArray(participants) && participants.length > 0) {
                        console.log(`Found ${participants.length} participants from fresh groupChat.getParticipants()`);
                        return participants;
                    }
                } catch (methodError) {
                    console.log('Error calling getParticipants method:', methodError.message);
                }
            }

            console.log('Fresh group chat found but no participants available');
        } else {
            console.log('No matching group chat found in getChats() results');
        }
    } catch (error) {
        console.log('Error accessing fresh group chats:', error.message);
    }

    // Sixth try: Force refresh and wait
    try {
        console.log('Trying force refresh with delay...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

        const refreshedChat = await client.getChatById(chat.id._serialized);
        if (refreshedChat && refreshedChat.participants && Array.isArray(refreshedChat.participants) && refreshedChat.participants.length > 0) {
            console.log(`Found ${refreshedChat.participants.length} participants after force refresh`);
            return refreshedChat.participants;
        }
    } catch (error) {
        console.log('Error in force refresh:', error.message);
    }

    // Method 7: Experimental - Try to inspect chat object deeply
    try {
        console.log('🧪 Method 7: Deep inspection of chat object...');

        const freshChat = await client.getChatById(chat.id._serialized);

        // Log all properties
        console.log('Chat object properties:', Object.keys(freshChat));

        // Try to find any property that might contain participants
        for (const [key, value] of Object.entries(freshChat)) {
            if (key.toLowerCase().includes('participant') || key.toLowerCase().includes('member')) {
                console.log(`Found potential property: ${key}`, typeof value);

                if (Array.isArray(value) && value.length > 0) {
                    console.log(`✅ Method 7: Found ${value.length} participants via property: ${key}`);
                    return value;
                }
            }
        }

        // Try accessing internal properties (might be hidden)
        const internalProps = ['_participants', '__participants', 'groupMetadata', '_data'];
        for (const prop of internalProps) {
            if (freshChat[prop]) {
                console.log(`Found internal property: ${prop}`, typeof freshChat[prop]);

                if (Array.isArray(freshChat[prop])) {
                    console.log(`✅ Method 7: Found ${freshChat[prop].length} participants via ${prop}`);
                    return freshChat[prop];
                }

                if (freshChat[prop] && freshChat[prop].participants) {
                    console.log(`✅ Method 7: Found ${freshChat[prop].participants.length} participants via ${prop}.participants`);
                    return freshChat[prop].participants;
                }
            }
        }

    } catch (error) {
        console.log(`❌ Method 7: Error - ${error.message}`);
    }

    console.log('❌ Semua metode gagal mengambil data participants');
    return [];
}

/**
 * Check if a user is admin in a group
 * @param {Object} client - WhatsApp client
 * @param {Object} chat - The chat object
 * @param {Object} contact - The contact object
 * @returns {boolean} - True if user is admin
 */
async function isUserAdmin(client, chat, contact) {
    try {
        // Only check admin status in groups
        if (!isGroupChat(chat)) {
            return false;
        }

        const participants = await getGroupParticipants(client, chat);

        if (participants.length === 0) {
            console.log('No participants found, cannot determine admin status');

            // Fallback: Check environment variable for bypass
            const bypassAdminCheck = process.env.BYPASS_ADMIN_CHECK === 'true';
            if (bypassAdminCheck) {
                console.log('BYPASS_ADMIN_CHECK is enabled, allowing admin access');
                return true;
            }

            // Alternative: Check if user is the bot owner (if configured)
            const botOwnerNumber = process.env.BOT_OWNER_NUMBER;
            if (botOwnerNumber && contact.number && contact.number.includes(botOwnerNumber)) {
                console.log('User is configured as bot owner, granting admin access');
                return true;
            }

            return false;
        }

        const participant = participants.find(p => p.id._serialized === contact.id._serialized);
        const isAdmin = participant && participant.isAdmin;

        console.log(`User ${contact.pushname || contact.number} admin status: ${isAdmin}`);
        return isAdmin;

    } catch (error) {
        console.error('Error checking admin status:', error);

        // Fallback on error: Check environment variable for bypass
        const bypassAdminCheck = process.env.BYPASS_ADMIN_CHECK === 'true';
        if (bypassAdminCheck) {
            console.log('Error occurred but BYPASS_ADMIN_CHECK is enabled, allowing admin access');
            return true;
        }

        return false;
    }
}

/**
 * Get chat info with enhanced detection
 * @param {Object} client - WhatsApp client
 * @param {Object} message - The message object
 * @returns {Object} - Enhanced chat info
 */
async function getChatInfo(client, message) {
    try {
        const chat = await message.getChat();
        const contact = await message.getContact();
        
        const chatInfo = {
            chat: chat,
            contact: contact,
            isGroup: isGroupChat(chat),
            participants: [],
            isUserAdmin: false
        };
        
        if (chatInfo.isGroup) {
            chatInfo.participants = await getGroupParticipants(client, chat);
            chatInfo.isUserAdmin = await isUserAdmin(client, chat, contact);
        }
        
        console.log('Chat info:', {
            id: chat.id._serialized,
            name: chat.name,
            isGroup: chatInfo.isGroup,
            participantCount: chatInfo.participants.length,
            isUserAdmin: chatInfo.isUserAdmin,
            bypassEnabled: process.env.BYPASS_ADMIN_CHECK === 'true',
            contactNumber: contact.number,
            contactName: contact.pushname || contact.number
        });
        
        return chatInfo;
        
    } catch (error) {
        console.error('Error getting chat info:', error);
        throw error;
    }
}

module.exports = {
    isGroupChat,
    getGroupParticipants,
    isUserAdmin,
    getChatInfo
};
