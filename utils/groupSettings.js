const fs = require('fs');
const path = require('path');
const { isGroupChat, isUserAdmin } = require('./chatUtils');

// File to store group settings
const settingsFile = path.join(__dirname, '..', 'data', 'groupSettings.json');

// Default settings for new groups
const defaultSettings = {
    hellNotifications: 'all', // 'all', 'watcherchaos', 'off'
    botEnabled: true, // true = bot aktif, false = bot nonaktif
    rentMode: false, // true = mode sewa, false = mode normal
    rentExpiry: null, // tanggal kadaluarsa sewa (ISO string)
    rentActivatedAt: null, // tanggal aktivasi sewa (ISO string)
    rentOwner: null, // info owner yang bayar sewa { name, number, id }
    rentDuration: null, // durasi sewa dalam hari
    rentPrice: null, // harga sewa yang dibayar
    paymentId: null, // ID pembayaran Midtrans
    hasUsedTrial: false, // true jika grup sudah pernah pakai trial
    trialUsedAt: null, // tanggal pertama kali pakai trial (ISO string)
    commandPermissions: {
        hell: 'all',     // 'all', 'admin'
        monster: 'all',
        tagall: 'all',
        ping: 'all',
        ai: 'all',
        help: 'all',
        cmd: 'admin',
        debug: 'admin',
        permission: 'admin',
        rent: 'admin'
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

// Set rent mode for a group
function setRentMode(groupId, enabled, expiryDate = null, ownerInfo = null, duration = null, price = null, paymentId = null) {
    try {
        const updateData = {
            rentMode: enabled,
            rentExpiry: expiryDate && expiryDate instanceof Date && !isNaN(expiryDate.getTime()) ? expiryDate.toISOString() : null,
            rentActivatedAt: enabled ? new Date().toISOString() : null,
            rentOwner: enabled ? ownerInfo : null,
            rentDuration: enabled ? duration : null,
            rentPrice: enabled ? price : null,
            paymentId: enabled ? paymentId : null
        };

        return updateGroupSettings(groupId, updateData);
    } catch (error) {
        console.error('Error in setRentMode:', error);
        return false;
    }
}

// Extend rent mode for a group (add duration to existing expiry)
function extendRentMode(groupId, additionalDays, ownerInfo = null, price = null, paymentId = null) {
    try {
        const settings = getGroupSettings(groupId);

        let newExpiryDate;
        if (settings.rentMode && settings.rentExpiry) {
            // If already in rent mode, extend from current expiry
            const currentExpiry = new Date(settings.rentExpiry);
            if (!isNaN(currentExpiry.getTime())) {
                newExpiryDate = new Date(currentExpiry);
                newExpiryDate.setDate(newExpiryDate.getDate() + additionalDays);
            } else {
                // If current expiry is invalid, start from now
                newExpiryDate = new Date();
                newExpiryDate.setDate(newExpiryDate.getDate() + additionalDays);
            }
        } else {
            // If not in rent mode, start from now
            newExpiryDate = new Date();
            newExpiryDate.setDate(newExpiryDate.getDate() + additionalDays);
        }

        // Set to end of day
        newExpiryDate.setHours(23, 59, 59, 999);

        const updateData = {
            rentMode: true,
            rentExpiry: newExpiryDate.toISOString(),
            rentActivatedAt: settings.rentActivatedAt || new Date().toISOString(),
            rentOwner: ownerInfo || settings.rentOwner,
            rentDuration: additionalDays,
            rentPrice: price || settings.rentPrice,
            paymentId: paymentId || settings.paymentId
        };

        console.log(`Extending rent for group ${groupId}: +${additionalDays} days, new expiry: ${newExpiryDate.toISOString()}`);
        return updateGroupSettings(groupId, updateData);
    } catch (error) {
        console.error('Error in extendRentMode:', error);
        return false;
    }
}

// Check if rent is active and not expired
function isRentActive(groupId) {
    const settings = getGroupSettings(groupId);

    if (!settings.rentMode || !settings.rentExpiry) {
        return false;
    }

    const now = new Date();
    const expiry = new Date(settings.rentExpiry);

    return now < expiry;
}

// Get rent status info
function getRentStatus(groupId) {
    const settings = getGroupSettings(groupId);

    return {
        rentMode: settings.rentMode || false,
        rentExpiry: settings.rentExpiry ? new Date(settings.rentExpiry) : null,
        rentActivatedAt: settings.rentActivatedAt ? new Date(settings.rentActivatedAt) : null,
        isActive: isRentActive(groupId)
    };
}

// Check if bot should be active (considering both normal enable and rent)
function isBotActiveInGroup(groupId) {
    const settings = getGroupSettings(groupId);

    // If rent mode is enabled, check rent expiry
    if (settings.rentMode) {
        return isRentActive(groupId);
    }

    // Otherwise, check normal bot enabled status
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

// Get groups that are expired and need payment
function getExpiredGroups() {
    const allSettings = getAllGroupsSettings();
    const expiredGroups = [];
    const now = new Date();

    for (const [groupId, settings] of Object.entries(allSettings)) {
        if (settings.rentMode && settings.rentExpiry) {
            const expiryDate = new Date(settings.rentExpiry);
            if (now >= expiryDate) {
                expiredGroups.push({
                    groupId,
                    settings,
                    expiryDate,
                    daysExpired: Math.ceil((now - expiryDate) / (1000 * 60 * 60 * 24))
                });
            }
        }
    }

    return expiredGroups;
}

// Get groups that need renewal notification (less than 3 days left)
function getGroupsNeedingRenewal() {
    const allSettings = getAllGroupsSettings();
    const needRenewal = [];
    const now = new Date();

    for (const [groupId, settings] of Object.entries(allSettings)) {
        if (settings.rentMode && settings.rentExpiry && settings.rentOwner) {
            const expiryDate = new Date(settings.rentExpiry);
            const timeDiff = expiryDate.getTime() - now.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            const hoursLeft = Math.ceil(timeDiff / (1000 * 60 * 60));

            // Get current hour to match expiry time
            const currentHour = now.getHours();
            const expiryHour = expiryDate.getHours();

            // Send notifications at the same hour as expiry time for 3, 2, 1 days before
            if (expiryDate > now && currentHour === expiryHour) {
                if (daysLeft === 3 || daysLeft === 2 || daysLeft === 1) {
                    needRenewal.push({
                        groupId,
                        settings,
                        expiryDate,
                        daysLeft,
                        hoursLeft,
                        notificationType: 'daily'
                    });
                }
            }

            // Send final notification 12 hours before expiry (regardless of hour)
            if (timeDiff > 0 && timeDiff <= 12 * 60 * 60 * 1000) {
                needRenewal.push({
                    groupId,
                    settings,
                    expiryDate,
                    daysLeft,
                    hoursLeft,
                    notificationType: 'final'
                });
            }
        }
    }

    return needRenewal;
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
    setRentMode,
    extendRentMode,
    isRentActive,
    getRentStatus,
    isBotActiveInGroup,
    getAllGroupsSettings,
    getGroupsNeedingRenewal,
    getExpiredGroups,
    defaultSettings
};
