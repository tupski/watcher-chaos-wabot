const fs = require('fs');
const path = require('path');

// Path to the JSON file that will store our messages
const dbPath = path.join(__dirname, '..', 'data', 'messages.json');

// Ensure the data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize the database file if it doesn't exist
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ messages: [] }));
}

/**
 * Get all messages from the database
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Number of items per page
 * @returns {Object} - Object containing messages and pagination info
 */
function getMessages(page = 1, limit = 10) {
    try {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

        // Sort messages by timestamp (newest first)
        const sortedMessages = data.messages.sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const results = {
            messages: sortedMessages.slice(startIndex, endIndex),
            totalMessages: sortedMessages.length,
            totalPages: Math.ceil(sortedMessages.length / limit),
            currentPage: page,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(sortedMessages.length / limit),
                totalItems: sortedMessages.length,
                itemsPerPage: limit
            }
        };

        return results;
    } catch (error) {
        console.error('Error reading messages from database:', error);
        return { messages: [], totalMessages: 0, totalPages: 0, currentPage: 1, pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: limit } };
    }
}

/**
 * Add a new message to the database
 * @param {Object} message - Message object to add
 * @returns {Object} - The added message with ID
 */
function addMessage(message) {
    try {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        
        // Generate a unique ID for the message
        const id = Date.now().toString();
        const newMessage = { id, ...message, timestamp: new Date().toISOString() };
        
        // Add to the beginning of the array (newest first)
        data.messages.unshift(newMessage);
        
        // Write back to the file
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        
        return newMessage;
    } catch (error) {
        console.error('Error adding message to database:', error);
        return null;
    }
}

/**
 * Delete a message from the database
 * @param {string} id - ID of the message to delete
 * @returns {boolean} - Whether the deletion was successful
 */
function deleteMessage(id) {
    try {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

        // Find the index of the message with the given ID
        const index = data.messages.findIndex(msg => msg.id === id);

        if (index === -1) {
            return false;
        }

        // Remove the message from the array
        data.messages.splice(index, 1);

        // Write back to the file
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

        return true;
    } catch (error) {
        console.error('Error deleting message from database:', error);
        return false;
    }
}

/**
 * Clear all messages from the database
 * @returns {boolean} - Whether the clearing was successful
 */
function clearAllMessages() {
    try {
        const data = { messages: [] };

        // Write empty messages array to the file
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

        return true;
    } catch (error) {
        console.error('Error clearing all messages from database:', error);
        return false;
    }
}

module.exports = {
    getMessages,
    addMessage,
    deleteMessage,
    clearAllMessages
};
