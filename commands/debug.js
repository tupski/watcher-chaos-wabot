const { getChatInfo } = require('../utils/chatUtils');

/**
 * Debug command to help troubleshoot group and participant issues
 * Usage: !debug
 */
module.exports = async (client, message) => {
    try {
        await message.reply('🔍 *Running diagnostics...*');
        
        const chat = await message.getChat();
        const contact = await message.getContact();
        
        let debugInfo = '📊 *Bot Diagnostic Report*\n\n';
        
        // Basic chat info
        debugInfo += '**Chat Information:**\n';
        debugInfo += `• ID: \`${chat.id._serialized}\`\n`;
        debugInfo += `• Name: ${chat.name || 'Unknown'}\n`;
        debugInfo += `• Type: ${chat.id._serialized.endsWith('@g.us') ? 'Group' : 'Individual'}\n`;
        debugInfo += `• isGroup property: ${chat.isGroup}\n`;

        // Inspect chat object properties and methods
        debugInfo += `• Chat object keys: ${Object.keys(chat).join(', ')}\n`;
        debugInfo += `• Has participants property: ${chat.hasOwnProperty('participants')}\n`;
        debugInfo += `• Participants type: ${typeof chat.participants}\n`;
        debugInfo += `• Has getParticipants method: ${typeof chat.getParticipants === 'function'}\n\n`;
        
        // Contact info
        debugInfo += '**User Information:**\n';
        debugInfo += `• Name: ${contact.pushname || 'Unknown'}\n`;
        debugInfo += `• Number: ${contact.number || 'Unknown'}\n`;
        debugInfo += `• ID: \`${contact.id._serialized}\`\n\n`;
        
        // Client info
        debugInfo += '**Bot Information:**\n';
        try {
            if (client.info && client.info.wid) {
                debugInfo += `• Bot ID: \`${client.info.wid._serialized}\`\n`;
                debugInfo += `• Bot Number: ${client.info.wid.user}\n`;
            } else {
                debugInfo += `• Bot Info: Not available\n`;
            }
        } catch (error) {
            debugInfo += `• Bot Info Error: ${error.message}\n`;
        }
        debugInfo += '\n';
        
        // Environment variables
        debugInfo += '**Configuration:**\n';
        debugInfo += `• BYPASS_ADMIN_CHECK: ${process.env.BYPASS_ADMIN_CHECK}\n`;
        debugInfo += `• BOT_OWNER_NUMBER: ${process.env.BOT_OWNER_NUMBER || 'Not set'}\n`;
        debugInfo += `• WHATSAPP_CLIENT_ID: ${process.env.WHATSAPP_CLIENT_ID || 'Not set'}\n\n`;
        
        // Participant loading test
        if (chat.id._serialized.endsWith('@g.us')) {
            debugInfo += '**Participant Loading Test:**\n';
            
            // Test 1: Direct participants
            if (chat.participants && Array.isArray(chat.participants)) {
                debugInfo += `• Direct participants: ${chat.participants.length} found\n`;
            } else {
                debugInfo += `• Direct participants: None\n`;
            }
            
            // Test 2: Fresh chat data
            try {
                const freshChat = await client.getChatById(chat.id._serialized);
                if (freshChat.participants && Array.isArray(freshChat.participants)) {
                    debugInfo += `• Fresh chat data: ${freshChat.participants.length} found\n`;
                } else {
                    debugInfo += `• Fresh chat data: None\n`;
                }
            } catch (error) {
                debugInfo += `• Fresh chat data: Error - ${error.message}\n`;
            }
            
            // Test 3: All chats search
            try {
                const allChats = await client.getChats();
                const targetChat = allChats.find(c => c.id._serialized === chat.id._serialized);
                if (targetChat && targetChat.participants && Array.isArray(targetChat.participants)) {
                    debugInfo += `• All chats search: ${targetChat.participants.length} found\n`;
                } else {
                    debugInfo += `• All chats search: None\n`;
                }
            } catch (error) {
                debugInfo += `• All chats search: Error - ${error.message}\n`;
            }
            
            // Test 4: Group metadata
            try {
                if (client.getGroupMetadata) {
                    const groupMetadata = await client.getGroupMetadata(chat.id._serialized);
                    if (groupMetadata && groupMetadata.participants) {
                        debugInfo += `• Group metadata: ${groupMetadata.participants.length} found\n`;
                    } else {
                        debugInfo += `• Group metadata: None\n`;
                    }
                } else {
                    debugInfo += `• Group metadata: Method not available\n`;
                }
            } catch (error) {
                debugInfo += `• Group metadata: Error - ${error.message}\n`;
            }

            // Test 5: chat.getParticipants method
            try {
                if (chat.getParticipants && typeof chat.getParticipants === 'function') {
                    const chatParticipants = await chat.getParticipants();
                    if (chatParticipants && Array.isArray(chatParticipants)) {
                        debugInfo += `• chat.getParticipants(): ${chatParticipants.length} found\n`;
                    } else {
                        debugInfo += `• chat.getParticipants(): None\n`;
                    }
                } else {
                    debugInfo += `• chat.getParticipants(): Method not available\n`;
                }
            } catch (error) {
                debugInfo += `• chat.getParticipants(): Error - ${error.message}\n`;
            }

            // Test 6: Fresh group chat getParticipants
            try {
                const allChats = await client.getChats();
                const groupChats = allChats.filter(c => c.isGroup && c.id._serialized === chat.id._serialized);

                if (groupChats.length > 0) {
                    const groupChat = groupChats[0];
                    debugInfo += `• Fresh group found: ${groupChat.name}\n`;

                    if (groupChat.getParticipants && typeof groupChat.getParticipants === 'function') {
                        const participants = await groupChat.getParticipants();
                        if (participants && Array.isArray(participants)) {
                            debugInfo += `• Fresh groupChat.getParticipants(): ${participants.length} found\n`;
                        } else {
                            debugInfo += `• Fresh groupChat.getParticipants(): None\n`;
                        }
                    } else {
                        debugInfo += `• Fresh groupChat.getParticipants(): Method not available\n`;
                    }
                } else {
                    debugInfo += `• Fresh group chat: Not found in getChats()\n`;
                }
            } catch (error) {
                debugInfo += `• Fresh group test: Error - ${error.message}\n`;
            }
            
            debugInfo += '\n';
        }
        
        // Enhanced chat info test
        debugInfo += '**Enhanced Chat Info Test:**\n';
        try {
            const chatInfo = await getChatInfo(client, message);
            debugInfo += `• Group detected: ${chatInfo.isGroup}\n`;
            debugInfo += `• Participants found: ${chatInfo.participants.length}\n`;
            debugInfo += `• User is admin: ${chatInfo.isUserAdmin}\n`;
            debugInfo += `• Bypass enabled: ${chatInfo.bypassEnabled || false}\n`;
        } catch (error) {
            debugInfo += `• Enhanced info error: ${error.message}\n`;
        }
        
        debugInfo += '\n**Recommendations:**\n';
        if (chat.id._serialized.endsWith('@g.us')) {
            debugInfo += '• This is a group chat ✅\n';
            if (process.env.BYPASS_ADMIN_CHECK === 'true') {
                debugInfo += '• Admin bypass is enabled ✅\n';
                debugInfo += '• Commands should work even without participant data\n';
            } else {
                debugInfo += '• Consider enabling BYPASS_ADMIN_CHECK=true\n';
            }
        } else {
            debugInfo += '• This is not a group chat\n';
            debugInfo += '• Group commands will not work here\n';
        }
        
        await message.reply(debugInfo);
        
    } catch (error) {
        console.error('Error in debug command:', error);
        await message.reply(`❌ Debug command failed: ${error.message}`);
    }
};
