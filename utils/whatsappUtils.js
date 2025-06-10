const { getAllGroupsSettings } = require('./groupSettings');

/**
 * Get all WhatsApp groups that bot has joined
 */
async function getJoinedGroups(whatsappClient) {
    try {
        if (!whatsappClient) {
            console.log('WhatsApp client not available');
            return [];
        }

        const chats = await whatsappClient.getChats();
        const groups = chats.filter(chat => chat.isGroup);
        
        const joinedGroups = [];
        
        for (const group of groups) {
            // Include all groups with valid names
            if (group.name && group.name.trim() !== '') {
                joinedGroups.push({
                    id: group.id._serialized,
                    name: group.name,
                    participantCount: group.participants ? group.participants.length : 0,
                    description: group.description || '',
                    isActive: true
                });
            }
        }
        
        return joinedGroups;
        
    } catch (error) {
        console.error('Error getting joined groups:', error);
        return [];
    }
}

/**
 * Get configured groups from settings that are actually joined
 */
async function getConfiguredJoinedGroups(whatsappClient) {
    try {
        const joinedGroups = await getJoinedGroups(whatsappClient);
        const allSettings = getAllGroupsSettings();
        
        const configuredGroups = [];
        
        for (const joinedGroup of joinedGroups) {
            const settings = allSettings[joinedGroup.id] || {};
            
            configuredGroups.push({
                ...joinedGroup,
                settings: settings,
                botEnabled: settings.botEnabled !== false,
                rentMode: settings.rentMode || false,
                hellNotifications: settings.hellNotifications || 'all',
                rentExpiry: settings.rentExpiry || null,
                rentOwner: settings.rentOwner || null
            });
        }
        
        return configuredGroups;
        
    } catch (error) {
        console.error('Error getting configured joined groups:', error);
        return [];
    }
}

/**
 * Get groups that are configured in WHATSAPP_GROUP_IDS but not joined
 */
async function getConfiguredNotJoinedGroups(whatsappClient) {
    try {
        const joinedGroups = await getJoinedGroups(whatsappClient);
        const joinedGroupIds = joinedGroups.map(g => g.id);
        
        const configuredGroupIds = process.env.WHATSAPP_GROUP_IDS ? 
            process.env.WHATSAPP_GROUP_IDS.split(',').map(id => id.trim()) : [];
        
        const notJoinedGroups = [];
        
        for (const groupId of configuredGroupIds) {
            if (!joinedGroupIds.includes(groupId)) {
                notJoinedGroups.push({
                    id: groupId,
                    name: 'Unknown Group (Not Joined)',
                    participantCount: 0,
                    description: 'Bot is not a member of this group',
                    isActive: false
                });
            }
        }
        
        return notJoinedGroups;
        
    } catch (error) {
        console.error('Error getting configured not joined groups:', error);
        return [];
    }
}

/**
 * Check if bot is member of a specific group
 */
async function isBotMemberOfGroup(whatsappClient, groupId) {
    try {
        const joinedGroups = await getJoinedGroups(whatsappClient);
        return joinedGroups.some(group => group.id === groupId);
    } catch (error) {
        console.error('Error checking bot membership:', error);
        return false;
    }
}

/**
 * Get all available commands with categories
 */
function getAllCommands() {
    return {
        'Basic Commands': [
            { command: '!ping', description: 'Check bot response time', adminOnly: false },
            { command: '!help', description: 'Show help message', adminOnly: false },
            { command: '!cmd', description: 'List all available commands', adminOnly: false }
        ],
        'Game Commands': [
            { command: '!hell', description: 'Get current Hell Event info', adminOnly: false },
            { command: '!hell all', description: 'Set group to receive all Hell Events', adminOnly: true },
            { command: '!hell watcherchaos', description: 'Set group to receive Watcher & Chaos Dragon only', adminOnly: true },
            { command: '!hell off', description: 'Disable Hell Event notifications', adminOnly: true },
            { command: '!hell status', description: 'Check current Hell Event setting', adminOnly: false },
            { command: '!monster', description: 'Get current monster rotation', adminOnly: false }
        ],
        'Group Management': [
            { command: '!tagall', description: 'Tag all group members', adminOnly: true },
            { command: '!permission', description: 'Show command permissions', adminOnly: true },
            { command: '!enablebot', description: 'Enable bot in group', adminOnly: true },
            { command: '!disablebot', description: 'Disable bot in group', adminOnly: true }
        ],
        'Rent System': [
            { command: '!rent', description: 'Show rent information', adminOnly: false },
            { command: '!rent pay <duration>', description: 'Pay for bot rental', adminOnly: true },
            { command: '!rent status', description: 'Check rental status', adminOnly: true },
            { command: '!grouprent', description: 'List all group rentals (BOT_OWNER)', adminOnly: false },
            { command: '!promo', description: 'Manage promotional pricing (BOT_OWNER)', adminOnly: false }
        ],
        'Payment System': [
            { command: '!sendpayment', description: 'Send payment link (BOT_OWNER)', adminOnly: false },
            { command: '!activate', description: 'Activate group manually (BOT_OWNER)', adminOnly: false },
            { command: '!revenue', description: 'Check revenue statistics (BOT_OWNER)', adminOnly: false },
            { command: '!paymentlog', description: 'View payment logs (BOT_OWNER)', adminOnly: false }
        ],
        'AI Commands': [
            { command: '!ai <message>', description: 'Chat with AI assistant', adminOnly: false }
        ],
        'System Commands': [
            { command: '!debug', description: 'Show debug information', adminOnly: true },
            { command: '!restart', description: 'Restart bot (BOT_OWNER)', adminOnly: false },
            { command: '!restart now', description: 'Restart bot immediately (BOT_OWNER)', adminOnly: false },
            { command: '!restart everyday', description: 'Schedule daily restart (BOT_OWNER)', adminOnly: false },
            { command: '!restart status', description: 'Check restart schedule (BOT_OWNER)', adminOnly: false },
            { command: '!botowner', description: 'BOT_OWNER commands', adminOnly: false }
        ]
    };
}

module.exports = {
    getJoinedGroups,
    getConfiguredJoinedGroups,
    getConfiguredNotJoinedGroups,
    isBotMemberOfGroup,
    getAllCommands
};
