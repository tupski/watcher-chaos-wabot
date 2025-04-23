const express = require('express');
const router = express.Router();
const Message = require('../models/message');

// Reference to the WhatsApp client (will be set from index.js)
let whatsappClient = null;

/**
 * Set the WhatsApp client for use in the routes
 * @param {Object} client - The WhatsApp client instance
 */
function setWhatsAppClient(client) {
    whatsappClient = client;
}

/**
 * GET /api/messages
 * Get all messages with pagination
 */
router.get('/messages', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = Message.getAll(page, limit);
    res.json(result);
});

/**
 * DELETE /api/messages/:id
 * Delete a message
 */
router.delete('/messages/:id', (req, res) => {
    const { id } = req.params;
    const success = Message.delete(id);

    if (success) {
        res.json({ success: true, message: 'Message deleted successfully' });
    } else {
        res.status(404).json({ success: false, message: 'Message not found' });
    }
});

/**
 * GET /api/groups
 * Get all WhatsApp groups
 */
router.get('/groups', async (req, res) => {
    console.log('API: Fetching WhatsApp groups...');

    if (!whatsappClient) {
        console.log('API: WhatsApp client not available');
        return res.status(503).json({
            success: false,
            message: 'WhatsApp client not available. Please make sure the bot is connected.'
        });
    }

    try {
        // Check if client is ready
        if (!whatsappClient.info) {
            console.log('API: WhatsApp client info not available, client may not be fully initialized');
            return res.status(503).json({
                success: false,
                message: 'WhatsApp client not fully initialized. Please wait a moment and try again.'
            });
        }

        console.log('API: Getting all chats...');
        // Get all chats
        const chats = await whatsappClient.getChats();
        console.log(`API: Found ${chats.length} total chats`);

        // Log all chats for debugging
        chats.forEach((chat, index) => {
            console.log(`Chat ${index + 1}: ${chat.name} (${chat.id._serialized}) - isGroup: ${chat.isGroup}`);
        });

        // Filter only group chats - check for group IDs that end with @g.us
        const groups = chats.filter(chat => {
            // Check if it's a group by ID pattern (ends with @g.us)
            return chat.id && chat.id._serialized && chat.id._serialized.endsWith('@g.us');
        }).map(group => {
            console.log(`Processing group: ${group.name}`);
            return {
                id: group.id._serialized,
                name: group.name,
                participants: group.participants ? group.participants.length : 0,
                isAdmin: group.participants ? group.participants.some(p =>
                    p.id._serialized === whatsappClient.info.wid._serialized && p.isAdmin) : false,
                unreadCount: group.unreadCount || 0,
                timestamp: group.timestamp ? new Date(group.timestamp * 1000).toISOString() : null
            };
        });

        console.log(`API: Returning ${groups.length} groups`);
        res.json({ success: true, groups });
    } catch (error) {
        console.error('Error fetching WhatsApp groups:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching WhatsApp groups',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = { router, setWhatsAppClient };
