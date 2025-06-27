const express = require('express');
const router = express.Router();
const { checkSession } = require('../middleware/auth');
const { getAllCommands, updateCommand, getCommand } = require('../utils/commandDatabase');

// Get all commands
router.get('/list', checkSession, (req, res) => {
    try {
        const commands = getAllCommands();
        res.json({
            success: true,
            data: commands
        });
    } catch (error) {
        console.error('Error getting commands:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get commands: ' + error.message
        });
    }
});

// Get specific command
router.get('/:commandName', checkSession, (req, res) => {
    try {
        const { commandName } = req.params;
        const command = getCommand(commandName);
        
        if (!command) {
            return res.status(404).json({
                success: false,
                message: 'Command not found'
            });
        }
        
        res.json({
            success: true,
            data: command
        });
    } catch (error) {
        console.error('Error getting command:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get command: ' + error.message
        });
    }
});

// Update command
router.post('/update', checkSession, async (req, res) => {
    try {
        const { commandName, description, accessLevel, message, enabled } = req.body;
        
        if (!commandName) {
            return res.status(400).json({
                success: false,
                message: 'Command name is required'
            });
        }
        
        const commandData = {
            description: description || '',
            accessLevel: accessLevel || 'all',
            message: message || '',
            enabled: enabled !== false
        };
        
        const success = updateCommand(commandName, commandData);
        
        if (success) {
            res.json({
                success: true,
                message: 'Command updated successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to update command'
            });
        }
        
    } catch (error) {
        console.error('Error updating command:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update command: ' + error.message
        });
    }
});

// Toggle command enabled/disabled
router.post('/toggle', checkSession, async (req, res) => {
    try {
        const { commandName, enabled } = req.body;
        
        if (!commandName) {
            return res.status(400).json({
                success: false,
                message: 'Command name is required'
            });
        }
        
        // Get current command data
        const currentCommand = getCommand(commandName);
        if (!currentCommand) {
            return res.status(404).json({
                success: false,
                message: 'Command not found'
            });
        }
        
        // Update only the enabled status
        const commandData = {
            ...currentCommand,
            enabled: enabled
        };
        
        const success = updateCommand(commandName, commandData);
        
        if (success) {
            res.json({
                success: true,
                message: `Command ${enabled ? 'enabled' : 'disabled'} successfully`
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to toggle command'
            });
        }
        
    } catch (error) {
        console.error('Error toggling command:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle command: ' + error.message
        });
    }
});

// Create new command
router.post('/create', checkSession, async (req, res) => {
    try {
        const { commandName, description, accessLevel, message, enabled } = req.body;
        
        if (!commandName) {
            return res.status(400).json({
                success: false,
                message: 'Command name is required'
            });
        }
        
        // Check if command already exists
        const existingCommand = getCommand(commandName);
        if (existingCommand) {
            return res.status(400).json({
                success: false,
                message: 'Command already exists'
            });
        }
        
        const commandData = {
            description: description || '',
            accessLevel: accessLevel || 'all',
            message: message || '',
            enabled: enabled !== false
        };
        
        const success = updateCommand(commandName, commandData);
        
        if (success) {
            res.json({
                success: true,
                message: 'Command created successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to create command'
            });
        }
        
    } catch (error) {
        console.error('Error creating command:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create command: ' + error.message
        });
    }
});

// Delete command
router.delete('/:commandName', checkSession, async (req, res) => {
    try {
        const { commandName } = req.params;
        
        // Get current command data
        const currentCommand = getCommand(commandName);
        if (!currentCommand) {
            return res.status(404).json({
                success: false,
                message: 'Command not found'
            });
        }
        
        // Disable the command instead of deleting (safer)
        const commandData = {
            ...currentCommand,
            enabled: false
        };
        
        const success = updateCommand(commandName, commandData);
        
        if (success) {
            res.json({
                success: true,
                message: 'Command disabled successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to disable command'
            });
        }
        
    } catch (error) {
        console.error('Error disabling command:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to disable command: ' + error.message
        });
    }
});

// Get command categories
router.get('/categories/list', checkSession, (req, res) => {
    try {
        const { getAllCommands: getCategorizedCommands } = require('../utils/whatsappUtils');
        const categorizedCommands = getCategorizedCommands();
        
        res.json({
            success: true,
            data: Object.keys(categorizedCommands)
        });
    } catch (error) {
        console.error('Error getting command categories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get command categories: ' + error.message
        });
    }
});

module.exports = router;
