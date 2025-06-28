const fs = require('fs');
const path = require('path');
const { isGroupChat, isUserAdmin } = require('./chatUtils');

// File to store group settings
const settingsFile = path.join(__dirname, '..', 'data', 'groupSettings.json');

// Default settings for new groups
const defaultSettings = {
    hellNotifications: 'all', // 'all', 'watcherchaos', 'off'
    monsterNotifications: 'on', // 'on', 'off'
    botEnabled: true, // true = bot aktif, false = bot nonaktif
    antiSpamLink: {
        enabled: true, // true = aktif, false = nonaktif
        allowedDomains: ['fb.com', 'facebook.com', 'google.com', 'docs.google.com', 'wa.me', 'whatsapp.com', 'youtube.com', 'tiktok.com', 'vt.tiktok.com', 'youtu.be'],
        blockPorn: true, // true = auto block link porno, false = tidak
        action: 'delete' // 'delete' = hapus pesan, 'warn' = beri peringatan saja
    },
    commandPermissions: {
        hell: 'all',     // 'all', 'admin'
        monster: 'al l',
        tagall: 'all',
        ping: 'all',
        ai: 'all',
        help: 'all',
        cmd: 'admin',
        debug: 'admin',
        permission: 'admin',
        antispam: 'admin'
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

// Set monster notification preference for a group
function setMonsterNotifications(groupId, preference) {
    const validPreferences = ['on', 'off'];
    if (!validPreferences.includes(preference)) {
        return false;
    }

    return updateGroupSettings(groupId, { monsterNotifications: preference });
}

// Set anti spam link settings for a group
function setAntiSpamLink(groupId, settings) {
    const currentSettings = getGroupSettings(groupId);
    const newAntiSpamSettings = {
        ...currentSettings.antiSpamLink,
        ...settings
    };

    return updateGroupSettings(groupId, { antiSpamLink: newAntiSpamSettings });
}

// Get anti spam link settings for a group
function getAntiSpamLinkSettings(groupId) {
    const settings = getGroupSettings(groupId);
    return settings.antiSpamLink || defaultSettings.antiSpamLink;
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
            // Bot owner can override admin restrictions
            const { isBotOwner: isBotOwnerUtil, canExecuteAdminCommand } = require('./botOwnerUtils');
            if (isBotOwnerUtil(message.from)) {
                console.log(`Bot owner ${message.from} executing admin command: ${command}`);
                return true;
            }

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

// Check if group should receive monster notifications
function shouldReceiveMonsterNotifications(groupId) {
    const settings = getGroupSettings(groupId);
    const preference = settings.monsterNotifications;

    return preference !== 'off'; // Default to 'on' if not set
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

// Check if bot should be active
function isBotActiveInGroup(groupId) {
    const settings = getGroupSettings(groupId);

    // Check normal bot enabled status
    return settings.botEnabled !== false;
}

// Get all groups with their settings
function getAllGroupsSettings() {
    try {
        if (fs.existsSync(settingsFile)) {
            const data = fs.readFileSync(settingsFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading all group settings:', error);
    }
    return {};
}

// Set rent mode for a group
function setRentMode(groupId, enabled, expiryDate = null, ownerInfo = null, duration = null, price = null, paymentId = null) {
    try {
        const settings = {
            rentMode: enabled
        };

        if (enabled && expiryDate) {
            // Validate expiry date
            if (expiryDate && expiryDate instanceof Date && !isNaN(expiryDate.getTime())) {
                settings.rentExpiry = expiryDate.toISOString();
            } else {
                console.error('Invalid expiry date provided to setRentMode');
                return false;
            }
        }

        if (ownerInfo) {
            settings.rentOwner = ownerInfo;
        }

        if (duration) {
            settings.rentDuration = duration;
        }

        if (price) {
            settings.rentPrice = price;
        }

        if (paymentId) {
            settings.rentPaymentId = paymentId;
        }

        // If disabling rent mode, clear rent-related fields
        if (!enabled) {
            settings.rentExpiry = null;
            settings.rentOwner = null;
            settings.rentDuration = null;
            settings.rentPrice = null;
            settings.rentPaymentId = null;
        }

        return updateGroupSettings(groupId, settings);
    } catch (error) {
        console.error('Error setting rent mode:', error);
        return false;
    }
}

// Get rent status for a group
function getRentStatus(groupId) {
    try {
        const settings = getGroupSettings(groupId);

        if (!settings.rentMode) {
            return {
                rentMode: false,
                isActive: false,
                rentExpiry: null
            };
        }

        const now = new Date();
        const expiryDate = settings.rentExpiry ? new Date(settings.rentExpiry) : null;
        const isActive = expiryDate ? expiryDate > now : false;

        return {
            rentMode: true,
            isActive: isActive,
            rentExpiry: expiryDate,
            rentOwner: settings.rentOwner || null,
            rentDuration: settings.rentDuration || null,
            rentPrice: settings.rentPrice || null,
            rentPaymentId: settings.rentPaymentId || null
        };
    } catch (error) {
        console.error('Error getting rent status:', error);
        return {
            rentMode: false,
            isActive: false,
            rentExpiry: null
        };
    }
}

// Check if rent is currently active
function isRentActive(groupId) {
    const rentStatus = getRentStatus(groupId);
    return rentStatus.isActive;
}

// Extend rent mode duration
function extendRentMode(groupId, additionalDays, ownerInfo = null, price = null, paymentId = null) {
    try {
        const settings = getGroupSettings(groupId);
        const now = new Date();

        let newExpiryDate;

        if (settings.rentMode && settings.rentExpiry) {
            // If already active, extend from current expiry date
            const currentExpiry = new Date(settings.rentExpiry);
            if (currentExpiry > now) {
                // Still active, extend from current expiry
                newExpiryDate = new Date(currentExpiry);
            } else {
                // Expired, start from now
                newExpiryDate = new Date(now);
            }
        } else {
            // Not in rent mode or no expiry set, start from now
            newExpiryDate = new Date(now);
        }

        // Add additional days
        newExpiryDate.setDate(newExpiryDate.getDate() + additionalDays);

        // Set to end of day (23:59:59)
        newExpiryDate.setHours(23, 59, 59, 999);

        return setRentMode(groupId, true, newExpiryDate, ownerInfo, additionalDays, price, paymentId);
    } catch (error) {
        console.error('Error extending rent mode:', error);
        return false;
    }
}

module.exports = {
    getGroupSettings,
    updateGroupSettings,
    setHellNotifications,
    setMonsterNotifications,
    setAntiSpamLink,
    getAntiSpamLinkSettings,
    setCommandPermission,
    canExecuteCommand,
    shouldReceiveHellNotifications,
    shouldReceiveMonsterNotifications,
    setBotEnabled,
    isBotEnabled,
    isBotOwner,
    isBotActiveInGroup,
    getAllGroupsSettings,
    defaultSettings,
    setRentMode,
    getRentStatus,
    isRentActive,
    extendRentMode
};
