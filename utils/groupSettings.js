const fs = require('fs');
const path = require('path');
const { isGroupChat, isUserAdmin } = require('./chatUtils');

// File to store group settings
const settingsFile = path.join(__dirname, '..', 'data', 'groupSettings.json');

// Default settings for new groups
const defaultSettings = {
    hellNotifications: 'all', // 'all', 'watcherchaos', 'off'
    botEnabled: true, // true = bot aktif, false = bot nonaktif
    commandPermissions: {
        hell: 'all',     // 'all', 'admin'
        monster: 'all',
        tagall: 'all',
        ping: 'all',
        ai: 'all',
        help: 'all',
        cmd: 'admin',
        debug: 'admin',
        permission: 'admin'
    }
};

// Load settings from file
function loadSettings() {
    try {
        if (fs.existsSync(settingsFile)) {
            const data = fs.readFileSync(settingsFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading group settings:', error);
    }
    return {};
}

// Save settings to file
function saveSettings(settings) {
    try {
        // Ensure data directory exists
        const dataDir = path.dirname(settingsFile);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving group settings:', error);
        return false;
    }
}

// Get settings for a specific group
function getGroupSettings(groupId) {
    const allSettings = loadSettings();
    if (!allSettings[groupId]) {
        // Create default settings for new group
        allSettings[groupId] = { ...defaultSettings };
        saveSettings(allSettings);
    }
    return allSettings[groupId];
}

// Update settings for a specific group
function updateGroupSettings(groupId, newSettings) {
    const allSettings = loadSettings();
    if (!allSettings[groupId]) {
        allSettings[groupId] = { ...defaultSettings };
    }
    
    // Merge new settings with existing ones
    allSettings[groupId] = { ...allSettings[groupId], ...newSettings };
    
    return saveSettings(allSettings);
}

// Set hell notification preference for a group
function setHellNotifications(groupId, preference) {
    const validPreferences = ['all', 'watcherchaos', 'off'];
    if (!validPreferences.includes(preference)) {
        return false;
    }
    
    return updateGroupSettings(groupId, { hellNotifications: preference });
}

// Set command permission for a group
function setCommandPermission(groupId, command, permission) {
    const validPermissions = ['all', 'admin'];
    if (!validPermissions.includes(permission)) {
        return false;
    }
    
    const settings = getGroupSettings(groupId);
    settings.commandPermissions[command] = permission;
    
    return updateGroupSettings(groupId, settings);
}

// Check if user can execute command in group
async function canExecuteCommand(message, command, client = null) {
    try {
        const chat = await message.getChat();

        // Only apply restrictions in groups
        if (!isGroupChat(chat)) {
            return true;
        }

        const groupId = chat.id._serialized;
        const settings = getGroupSettings(groupId);

        // Get command permission setting
        const permission = settings.commandPermissions[command] || 'all';

        if (permission === 'all') {
            return true;
        }

        if (permission === 'admin') {
            // Check if user is admin
            const contact = await message.getContact();

            // If client is provided, use the enhanced admin check
            if (client) {
                return await isUserAdmin(client, chat, contact);
            }

            // Fallback to basic check
            const participants = chat.participants;
            if (participants) {
                const participant = participants.find(p => p.id._serialized === contact.id._serialized);
                return participant && participant.isAdmin;
            }
        }

        return false;
    } catch (error) {
        console.error('Error checking command permission:', error);
        return true; // Default to allow if error
    }
}

// Check if group should receive hell notifications
function shouldReceiveHellNotifications(groupId, eventType = 'all') {
    const settings = getGroupSettings(groupId);
    const preference = settings.hellNotifications;

    if (preference === 'off') {
        return false;
    }

    if (preference === 'watcherchaos') {
        // Only send if it's a Watcher or Chaos Dragon event
        return eventType === 'watcher' || eventType === 'chaos';
    }

    // preference === 'all'
    return true;
}

// Set bot enabled/disabled status for a group
function setBotEnabled(groupId, enabled) {
    return updateGroupSettings(groupId, { botEnabled: enabled });
}

// Check if bot is enabled in a group
function isBotEnabled(groupId) {
    const settings = getGroupSettings(groupId);
    return settings.botEnabled !== false; // Default to true if not set
}

// Check if user is bot owner
function isBotOwner(contact) {
    const botOwnerNumber = process.env.BOT_OWNER_NUMBER;
    if (!botOwnerNumber) {
        return false;
    }

    // Check if contact number contains bot owner number
    return contact.number && contact.number.includes(botOwnerNumber);
}

module.exports = {
    getGroupSettings,
    updateGroupSettings,
    setHellNotifications,
    setCommandPermission,
    canExecuteCommand,
    shouldReceiveHellNotifications,
    setBotEnabled,
    isBotEnabled,
    isBotOwner,
    defaultSettings
};
