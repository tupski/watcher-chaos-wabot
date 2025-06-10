/**
 * Bot Owner Utilities
 * Handles bot owner override functionality
 */

/**
 * Check if user is bot owner
 * @param {string} userNumber - User's phone number
 * @returns {boolean} - True if user is bot owner
 */
function isBotOwner(userNumber) {
    const botOwnerNumber = process.env.BOT_OWNER_NUMBER;
    if (!botOwnerNumber) return false;
    
    // Clean phone numbers for comparison
    const cleanUserNumber = userNumber.replace(/[^\d]/g, '');
    const cleanOwnerNumber = botOwnerNumber.replace(/[^\d]/g, '');
    
    return cleanUserNumber === cleanOwnerNumber;
}

/**
 * Check if user can execute admin command
 * Bot owner can override admin restrictions
 * @param {Object} message - WhatsApp message object
 * @param {Object} chat - WhatsApp chat object
 * @returns {boolean} - True if user can execute admin command
 */
async function canExecuteAdminCommand(message, chat) {
    try {
        const userNumber = message.from;
        
        // Bot owner can always execute admin commands
        if (isBotOwner(userNumber)) {
            console.log(`Bot owner ${userNumber} executing admin command`);
            return true;
        }
        
        // Check if user is group admin
        if (chat.isGroup) {
            const participants = await chat.getParticipants();
            const user = participants.find(p => p.id._serialized === userNumber);
            
            if (user && (user.isAdmin || user.isSuperAdmin)) {
                return true;
            }
        }
        
        return false;
        
    } catch (error) {
        console.error('Error checking admin permissions:', error);
        return false;
    }
}

/**
 * Check if user can modify group settings
 * Bot owner can override group admin restrictions
 * @param {string} userNumber - User's phone number
 * @param {string} groupId - Group ID
 * @param {Object} chat - WhatsApp chat object
 * @returns {boolean} - True if user can modify settings
 */
async function canModifyGroupSettings(userNumber, groupId, chat) {
    try {
        // Bot owner can always modify settings
        if (isBotOwner(userNumber)) {
            console.log(`Bot owner ${userNumber} modifying group settings for ${groupId}`);
            return true;
        }
        
        // Check if user is group admin
        if (chat && chat.isGroup) {
            const participants = await chat.getParticipants();
            const user = participants.find(p => p.id._serialized === userNumber);
            
            if (user && (user.isAdmin || user.isSuperAdmin)) {
                return true;
            }
        }
        
        return false;
        
    } catch (error) {
        console.error('Error checking group modification permissions:', error);
        return false;
    }
}

/**
 * Get user role for display purposes
 * @param {string} userNumber - User's phone number
 * @param {Object} chat - WhatsApp chat object
 * @returns {string} - User role (owner, admin, member)
 */
async function getUserRole(userNumber, chat) {
    try {
        // Check if bot owner
        if (isBotOwner(userNumber)) {
            return 'owner';
        }
        
        // Check if group admin
        if (chat && chat.isGroup) {
            const participants = await chat.getParticipants();
            const user = participants.find(p => p.id._serialized === userNumber);
            
            if (user) {
                if (user.isSuperAdmin) return 'superadmin';
                if (user.isAdmin) return 'admin';
            }
        }
        
        return 'member';
        
    } catch (error) {
        console.error('Error getting user role:', error);
        return 'member';
    }
}

/**
 * Log bot owner action for audit purposes
 * @param {string} userNumber - User's phone number
 * @param {string} action - Action performed
 * @param {string} groupId - Group ID (optional)
 * @param {Object} details - Additional details (optional)
 */
function logBotOwnerAction(userNumber, action, groupId = null, details = {}) {
    if (isBotOwner(userNumber)) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            botOwner: userNumber,
            action: action,
            groupId: groupId,
            details: details
        };
        
        console.log('BOT_OWNER_ACTION:', JSON.stringify(logEntry));
        
        // In production, you might want to save this to a database or log file
        // saveAuditLog(logEntry);
    }
}

/**
 * Check if command requires admin privileges
 * @param {string} command - Command name (e.g., "hell", "tagall")
 * @returns {boolean} - True if command requires admin privileges
 */
function isAdminCommand(command) {
    const adminCommands = [
        'tagall',
        'permission',
        'enablebot',
        'disablebot',
        'hell all',
        'hell watcherchaos',
        'hell off'
    ];
    
    return adminCommands.some(adminCmd => 
        command.toLowerCase().includes(adminCmd.toLowerCase())
    );
}

/**
 * Check if command requires bot owner privileges
 * @param {string} command - Command name
 * @returns {boolean} - True if command requires bot owner privileges
 */
function isBotOwnerCommand(command) {
    const ownerCommands = [
        'restart',
        'grouprent',
        'activate',
        'sendpayment',
        'revenue',
        'paymentlog',
        'promo',
        'botowner'
    ];
    
    return ownerCommands.some(ownerCmd => 
        command.toLowerCase().includes(ownerCmd.toLowerCase())
    );
}

/**
 * Get permission level required for command
 * @param {string} command - Command name
 * @returns {string} - Permission level (owner, admin, member)
 */
function getCommandPermissionLevel(command) {
    if (isBotOwnerCommand(command)) {
        return 'owner';
    } else if (isAdminCommand(command)) {
        return 'admin';
    } else {
        return 'member';
    }
}

/**
 * Check if user has permission to execute command
 * @param {string} userNumber - User's phone number
 * @param {string} command - Command name
 * @param {Object} chat - WhatsApp chat object
 * @returns {boolean} - True if user has permission
 */
async function hasCommandPermission(userNumber, command, chat) {
    try {
        const requiredLevel = getCommandPermissionLevel(command);
        const userRole = await getUserRole(userNumber, chat);
        
        // Bot owner can execute any command
        if (userRole === 'owner') {
            return true;
        }
        
        // Admin can execute admin and member commands
        if (userRole === 'admin' || userRole === 'superadmin') {
            return requiredLevel === 'admin' || requiredLevel === 'member';
        }
        
        // Member can only execute member commands
        if (userRole === 'member') {
            return requiredLevel === 'member';
        }
        
        return false;
        
    } catch (error) {
        console.error('Error checking command permission:', error);
        return false;
    }
}

module.exports = {
    isBotOwner,
    canExecuteAdminCommand,
    canModifyGroupSettings,
    getUserRole,
    logBotOwnerAction,
    isAdminCommand,
    isBotOwnerCommand,
    getCommandPermissionLevel,
    hasCommandPermission
};
