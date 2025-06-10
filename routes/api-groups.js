const express = require('express');
const router = express.Router();
const { checkSession } = require('../middleware/auth');
const { updateGroupSettings, getGroupSettings } = require('../utils/groupSettings');

// Reference to WhatsApp client (will be set from index.js)
let whatsappClientRef = null;

/**
 * Set WhatsApp client reference
 */
function setWhatsAppClientRef(client) {
    whatsappClientRef = client;
}

// Update group settings
router.post('/settings', checkSession, async (req, res) => {
    try {
        const { groupId, hellNotifications, botEnabled, rentExpiry, autoMessages } = req.body;
        
        if (!groupId) {
            return res.status(400).json({
                success: false,
                message: 'Group ID is required'
            });
        }

        // Update group settings
        const settings = {
            hellNotifications: hellNotifications || 'all',
            botEnabled: botEnabled !== false, // Default to true
            rentExpiry: rentExpiry || null,
            autoMessages: autoMessages !== false // Default to true
        };

        await updateGroupSettings(groupId, settings);

        res.json({
            success: true,
            message: 'Group settings updated successfully'
        });

    } catch (error) {
        console.error('Error updating group settings:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error: ' + error.message
        });
    }
});

// Toggle bot status for a group
router.post('/toggle-bot', checkSession, async (req, res) => {
    try {
        const { groupId, enabled } = req.body;
        
        if (!groupId) {
            return res.status(400).json({
                success: false,
                message: 'Group ID is required'
            });
        }

        // Update bot enabled status
        await updateGroupSettings(groupId, { botEnabled: enabled });

        res.json({
            success: true,
            message: `Bot ${enabled ? 'enabled' : 'disabled'} for group`
        });

    } catch (error) {
        console.error('Error toggling bot status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error: ' + error.message
        });
    }
});

// Leave a group
router.post('/leave', checkSession, async (req, res) => {
    try {
        const { groupId } = req.body;
        
        if (!groupId) {
            return res.status(400).json({
                success: false,
                message: 'Group ID is required'
            });
        }

        if (!whatsappClientRef) {
            return res.status(500).json({
                success: false,
                message: 'WhatsApp client not available'
            });
        }

        // Leave the group
        await whatsappClientRef.leaveGroup(groupId);

        // Remove group settings
        await updateGroupSettings(groupId, { botEnabled: false });

        res.json({
            success: true,
            message: 'Successfully left the group'
        });

    } catch (error) {
        console.error('Error leaving group:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to leave group: ' + error.message
        });
    }
});

// Get group information
router.get('/info/:groupId', checkSession, async (req, res) => {
    try {
        const { groupId } = req.params;
        
        if (!whatsappClientRef) {
            return res.status(500).json({
                success: false,
                message: 'WhatsApp client not available'
            });
        }

        // Get group info from WhatsApp
        const chat = await whatsappClientRef.getChatById(groupId);
        const settings = await getGroupSettings(groupId);

        res.json({
            success: true,
            data: {
                id: chat.id._serialized,
                name: chat.name,
                participantCount: chat.participants ? chat.participants.length : 0,
                isGroup: chat.isGroup,
                settings: settings
            }
        });

    } catch (error) {
        console.error('Error getting group info:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get group info: ' + error.message
        });
    }
});

// Get all groups
router.get('/list', checkSession, async (req, res) => {
    try {
        if (!whatsappClientRef) {
            return res.status(500).json({
                success: false,
                message: 'WhatsApp client not available'
            });
        }

        const { getConfiguredJoinedGroups } = require('../utils/whatsappUtils');
        const groups = await getConfiguredJoinedGroups(whatsappClientRef);

        res.json({
            success: true,
            data: groups
        });

    } catch (error) {
        console.error('Error getting groups list:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get groups list: ' + error.message
        });
    }
});

// Send message to group
router.post('/send-message', checkSession, async (req, res) => {
    try {
        const { groupId, message } = req.body;
        
        if (!groupId || !message) {
            return res.status(400).json({
                success: false,
                message: 'Group ID and message are required'
            });
        }

        if (!whatsappClientRef) {
            return res.status(500).json({
                success: false,
                message: 'WhatsApp client not available'
            });
        }

        // Send message to group
        await whatsappClientRef.sendMessage(groupId, message);

        res.json({
            success: true,
            message: 'Message sent successfully'
        });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message: ' + error.message
        });
    }
});

// Get group participants
router.get('/participants/:groupId', checkSession, async (req, res) => {
    try {
        const { groupId } = req.params;
        
        if (!whatsappClientRef) {
            return res.status(500).json({
                success: false,
                message: 'WhatsApp client not available'
            });
        }

        const chat = await whatsappClientRef.getChatById(groupId);
        
        if (!chat.isGroup) {
            return res.status(400).json({
                success: false,
                message: 'Not a group chat'
            });
        }

        const participants = chat.participants.map(participant => ({
            id: participant.id._serialized,
            isAdmin: participant.isAdmin,
            isSuperAdmin: participant.isSuperAdmin
        }));

        res.json({
            success: true,
            data: participants
        });

    } catch (error) {
        console.error('Error getting participants:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get participants: ' + error.message
        });
    }
});

module.exports = { router, setWhatsAppClientRef };
