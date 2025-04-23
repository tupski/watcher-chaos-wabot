const db = require('../utils/database');

/**
 * Message model for handling message operations
 */
class Message {
    /**
     * Create a new message
     * @param {Object} messageData - Message data
     * @returns {Object} - The created message
     */
    static create(messageData) {
        return db.addMessage(messageData);
    }

    /**
     * Get messages with pagination
     * @param {number} page - Page number
     * @param {number} limit - Number of items per page
     * @returns {Object} - Object containing messages and pagination info
     */
    static getAll(page = 1, limit = 10) {
        return db.getMessages(page, limit);
    }

    /**
     * Delete a message
     * @param {string} id - ID of the message to delete
     * @returns {boolean} - Whether the deletion was successful
     */
    static delete(id) {
        return db.deleteMessage(id);
    }
}

module.exports = Message;
