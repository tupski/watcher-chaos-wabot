const fs = require('fs');
const path = require('path');

// Path to the command database file
const commandDbPath = path.join(__dirname, '..', 'data', 'commands.json');

// Ensure data directory exists
const dataDir = path.dirname(commandDbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Default command messages and settings
const defaultCommands = {
    'ping': {
        message: 'Pong! 🏓\n\nBot is online and responding.\nUptime: {uptime}',
        accessLevel: 'all', // all, member, admin
        enabled: true,
        description: 'Check if bot is online'
    },
    'help': {
        message: '🤖 *Bot Lords Mobile - Help*\n\n*Available Commands:*\n• !ping - Check bot status\n• !hell - Hell Event information\n• !monster - Monster rotation\n• !tagall - Tag all members (Admin only)\n• !rent - Bot rental info\n• !ai - AI assistant\n\n*Need help?* Contact bot owner.',
        accessLevel: 'all',
        enabled: true,
        description: 'Show available commands'
    },
    'hell': {
        message: '🔥 *Hell Event Information*\n\n{hellEventData}\n\n_Last updated: {time}_',
        accessLevel: 'all',
        enabled: true,
        description: 'Show Hell Event information'
    },
    'monster': {
        message: '👹 *Monster Rotation*\n\n{monsterData}\n\n_Next rotation: {nextRotation}_',
        accessLevel: 'all',
        enabled: true,
        description: 'Show monster rotation schedule'
    },
    'tagall': {
        message: '📢 *Attention Everyone!*\n\n{tags}\n\n_Message from: {user}_',
        accessLevel: 'admin',
        enabled: true,
        description: 'Tag all group members'
    },
    'rent': {
        message: '💰 *Bot Rental Information*\n\n{rentInfo}\n\n_For more info, contact bot owner._',
        accessLevel: 'all',
        enabled: true,
        description: 'Show bot rental information'
    },
    'ai': {
        message: '🤖 *AI Assistant*\n\n{aiResponse}\n\n_Powered by AI technology_',
        accessLevel: 'all',
        enabled: true,
        description: 'AI assistant for questions'
    }
};

// Initialize database if it doesn't exist
function initializeDatabase() {
    if (!fs.existsSync(commandDbPath)) {
        const initialData = {
            commands: defaultCommands,
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(commandDbPath, JSON.stringify(initialData, null, 2));
    }
}

/**
 * Get all commands from database
 * @returns {Object} - All commands with their settings
 */
function getAllCommands() {
    try {
        initializeDatabase();
        const data = JSON.parse(fs.readFileSync(commandDbPath, 'utf8'));
        return data.commands || defaultCommands;
    } catch (error) {
        console.error('Error reading command database:', error);
        return defaultCommands;
    }
}

/**
 * Get a specific command from database
 * @param {string} commandName - Name of the command
 * @returns {Object|null} - Command data or null if not found
 */
function getCommand(commandName) {
    try {
        const commands = getAllCommands();
        return commands[commandName] || null;
    } catch (error) {
        console.error('Error getting command:', error);
        return null;
    }
}

/**
 * Update a command in the database
 * @param {string} commandName - Name of the command
 * @param {Object} commandData - Command data to update
 * @returns {boolean} - Success status
 */
function updateCommand(commandName, commandData) {
    try {
        initializeDatabase();
        const data = JSON.parse(fs.readFileSync(commandDbPath, 'utf8'));
        
        if (!data.commands) {
            data.commands = {};
        }
        
        // Update command data
        data.commands[commandName] = {
            ...data.commands[commandName],
            ...commandData,
            lastUpdated: new Date().toISOString()
        };
        
        data.lastUpdated = new Date().toISOString();
        
        // Write back to file
        fs.writeFileSync(commandDbPath, JSON.stringify(data, null, 2));
        
        return true;
    } catch (error) {
        console.error('Error updating command:', error);
        return false;
    }
}

/**
 * Get command message with variable replacement
 * @param {string} commandName - Name of the command
 * @param {Object} variables - Variables to replace in message
 * @returns {string} - Formatted message
 */
function getCommandMessage(commandName, variables = {}) {
    try {
        const command = getCommand(commandName);
        if (!command || !command.enabled) {
            return null;
        }
        
        let message = command.message;
        
        // Replace variables in message
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{${key}}`, 'g');
            message = message.replace(regex, value);
        }
        
        return message;
    } catch (error) {
        console.error('Error getting command message:', error);
        return null;
    }
}

/**
 * Check if command is enabled
 * @param {string} commandName - Name of the command
 * @returns {boolean} - Whether command is enabled
 */
function isCommandEnabled(commandName) {
    try {
        const command = getCommand(commandName);
        return command ? command.enabled !== false : false;
    } catch (error) {
        console.error('Error checking command status:', error);
        return false;
    }
}

/**
 * Get command access level
 * @param {string} commandName - Name of the command
 * @returns {string} - Access level (all, member, admin)
 */
function getCommandAccessLevel(commandName) {
    try {
        const command = getCommand(commandName);
        return command ? command.accessLevel || 'all' : 'all';
    } catch (error) {
        console.error('Error getting command access level:', error);
        return 'all';
    }
}

/**
 * Reset command to default
 * @param {string} commandName - Name of the command
 * @returns {boolean} - Success status
 */
function resetCommand(commandName) {
    try {
        if (defaultCommands[commandName]) {
            return updateCommand(commandName, defaultCommands[commandName]);
        }
        return false;
    } catch (error) {
        console.error('Error resetting command:', error);
        return false;
    }
}

/**
 * Delete a custom command
 * @param {string} commandName - Name of the command
 * @returns {boolean} - Success status
 */
function deleteCommand(commandName) {
    try {
        // Don't allow deletion of default commands
        if (defaultCommands[commandName]) {
            return false;
        }
        
        initializeDatabase();
        const data = JSON.parse(fs.readFileSync(commandDbPath, 'utf8'));
        
        if (data.commands && data.commands[commandName]) {
            delete data.commands[commandName];
            data.lastUpdated = new Date().toISOString();
            
            fs.writeFileSync(commandDbPath, JSON.stringify(data, null, 2));
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error deleting command:', error);
        return false;
    }
}

module.exports = {
    getAllCommands,
    getCommand,
    updateCommand,
    getCommandMessage,
    isCommandEnabled,
    getCommandAccessLevel,
    resetCommand,
    deleteCommand
};
