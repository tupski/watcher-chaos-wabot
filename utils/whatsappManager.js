/**
 * WhatsApp Multi-Device Manager
 * Manages multiple WhatsApp clients for multi-device support
 */

const { Client: WhatsAppClient, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const qr = require('qrcode');
const fs = require('fs');
const path = require('path');

class WhatsAppManager {
    constructor(io, handlers = {}) {
        this.io = io;
        this.clients = new Map(); // deviceId -> client instance
        this.deviceSettings = new Map(); // deviceId -> settings
        this.dataDir = path.join(__dirname, '..', 'data', 'devices');
        this.messageHandler = handlers.messageHandler || null;
        this.groupJoinHandler = handlers.groupJoinHandler || null;
        
        // Create devices directory if it doesn't exist
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        
        this.loadDeviceSettings();
    }

    /**
     * Load device settings from file
     */
    loadDeviceSettings() {
        const settingsFile = path.join(this.dataDir, 'devices.json');
        try {
            if (fs.existsSync(settingsFile)) {
                const data = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
                this.deviceSettings = new Map(Object.entries(data));
            }
        } catch (error) {
            console.error('Error loading device settings:', error);
        }
    }

    /**
     * Save device settings to file
     */
    saveDeviceSettings() {
        const settingsFile = path.join(this.dataDir, 'devices.json');
        try {
            const data = Object.fromEntries(this.deviceSettings);
            fs.writeFileSync(settingsFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error saving device settings:', error);
        }
    }

    /**
     * Create a new WhatsApp client device
     */
    async createDevice(deviceId, deviceName = null) {
        if (this.clients.has(deviceId)) {
            throw new Error(`Device ${deviceId} already exists`);
        }

        const client = new WhatsAppClient({
            authStrategy: new LocalAuth({
                clientId: deviceId,
                dataPath: path.join(this.dataDir, deviceId)
            }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            },
        });

        // Set up event listeners
        this.setupClientEvents(client, deviceId);

        // Store client
        this.clients.set(deviceId, client);

        // Store device settings
        this.deviceSettings.set(deviceId, {
            id: deviceId,
            name: deviceName || `Device ${deviceId}`,
            status: 'initializing',
            createdAt: new Date().toISOString(),
            lastConnected: null,
            assignedGroups: [],
            phoneNumber: null,
            isActive: true
        });

        this.saveDeviceSettings();

        // Initialize client
        await client.initialize();

        return client;
    }

    /**
     * Setup event listeners for a WhatsApp client
     */
    setupClientEvents(client, deviceId) {
        // QR Code event
        client.on('qr', (qrCode) => {
            console.log(`QR Code for device ${deviceId}:`);
            qrcode.generate(qrCode, { small: true });

            // Generate QR code as data URL for web interface
            qr.toDataURL(qrCode, (err, url) => {
                if (err) {
                    console.error(`Error generating QR code for device ${deviceId}:`, err);
                    return;
                }

                // Update device status
                const settings = this.deviceSettings.get(deviceId);
                if (settings) {
                    settings.status = 'qr_ready';
                    settings.qrCode = url;
                    this.deviceSettings.set(deviceId, settings);
                    this.saveDeviceSettings();
                }

                // Emit QR code to connected clients
                this.io.emit('device-qr', { deviceId, qrCode: url });
            });
        });

        // Ready event
        client.on('ready', async () => {
            console.log(`WhatsApp client ${deviceId} is ready!`);
            
            try {
                const info = client.info;
                const settings = this.deviceSettings.get(deviceId);
                if (settings) {
                    settings.status = 'connected';
                    settings.lastConnected = new Date().toISOString();
                    settings.phoneNumber = info.wid.user;
                    settings.qrCode = null;
                    this.deviceSettings.set(deviceId, settings);
                    this.saveDeviceSettings();
                }

                this.io.emit('device-ready', { deviceId, phoneNumber: info.wid.user });
            } catch (error) {
                console.error(`Error getting info for device ${deviceId}:`, error);
            }
        });

        // Disconnected event
        client.on('disconnected', (reason) => {
            console.log(`WhatsApp client ${deviceId} disconnected:`, reason);
            
            const settings = this.deviceSettings.get(deviceId);
            if (settings) {
                settings.status = 'disconnected';
                this.deviceSettings.set(deviceId, settings);
                this.saveDeviceSettings();
            }

            this.io.emit('device-disconnected', { deviceId, reason });
        });

        // Authentication failure
        client.on('auth_failure', (msg) => {
            console.error(`Authentication failed for device ${deviceId}:`, msg);
            
            const settings = this.deviceSettings.get(deviceId);
            if (settings) {
                settings.status = 'auth_failed';
                this.deviceSettings.set(deviceId, settings);
                this.saveDeviceSettings();
            }

            this.io.emit('device-auth-failed', { deviceId, message: msg });
        });

        // Message event
        client.on('message', async (message) => {
            try {
                // Log message
                await this.logMessage(deviceId, message, 'received');

                // Call the main message handler if it exists
                if (this.messageHandler) {
                    await this.messageHandler(client, message);
                }
                
                // Emit to dashboard
                this.io.emit('new-message', {
                    deviceId,
                    type: 'received',
                    message: await this.formatMessage(message)
                });
            } catch (error) {
                console.error(`Error handling message for device ${deviceId}:`, error);
            }
        });

        client.on('message_create', async (message) => {
            if (!message.fromMe) return;
            try {
                await this.logMessage(deviceId, message, 'sent');
                this.io.emit('new-message', {
                    deviceId,
                    type: 'sent',
                    message: await this.formatMessage(message)
                });
            } catch (error) {
                console.error(`Error handling outgoing message for device ${deviceId}:`, error);
            }
        });

        client.on('group_join', async (notification) => {
            if (this.groupJoinHandler) {
                try {
                    await this.groupJoinHandler(client, notification);
                } catch (error) {
                    console.error(`Error handling group join for device ${deviceId}:`, error);
                }
            }
        });
    }

    /**
     * Get all devices
     */
    getAllDevices() {
        return Array.from(this.deviceSettings.values());
    }

    /**
     * Get device by ID
     */
    getDevice(deviceId) {
        return this.deviceSettings.get(deviceId);
    }

    /**
     * Get client by device ID
     */
    getClient(deviceId) {
        return this.clients.get(deviceId);
    }

    /**
     * Remove device
     */
    async removeDevice(deviceId) {
        const client = this.clients.get(deviceId);
        if (client) {
            await client.logout();
            await client.destroy();
            this.clients.delete(deviceId);
        }

        this.deviceSettings.delete(deviceId);
        this.saveDeviceSettings();

        // Remove device data directory
        const deviceDir = path.join(this.dataDir, deviceId);
        if (fs.existsSync(deviceDir)) {
            fs.rmSync(deviceDir, { recursive: true, force: true });
        }
    }

    /**
     * Assign groups to device
     */
    assignGroupsToDevice(deviceId, groupIds) {
        const settings = this.deviceSettings.get(deviceId);
        if (settings) {
            settings.assignedGroups = groupIds;
            this.deviceSettings.set(deviceId, settings);
            this.saveDeviceSettings();
            return true;
        }
        return false;
    }

    /**
     * Log message for analytics
     */
    async logMessage(deviceId, message, type) {
        const messageLogger = require('./messageLogger');
        
        const contact = await message.getContact();
        const chat = await message.getChat();
        
        const logData = {
            deviceId,
            type,
            chatId: chat.id._serialized,
            chatName: chat.isGroup ? chat.name : contact.pushname || contact.number,
            isGroup: chat.isGroup,
            fromNumber: contact.number,
            fromName: contact.pushname || contact.number,
            body: message.body,
            timestamp: new Date(message.timestamp * 1000).toISOString(),
            status: 'success'
        };

        messageLogger.logMessage(logData);
    }

    /**
     * Format message for dashboard display
     */
    async formatMessage(message) {
        const contact = await message.getContact();
        const chat = await message.getChat();
        
        return {
            id: message.id.id,
            body: message.body,
            timestamp: new Date(message.timestamp * 1000).toISOString(),
            from: contact.pushname || contact.number,
            chat: chat.isGroup ? chat.name : contact.pushname || contact.number,
            isGroup: chat.isGroup,
            type: message.type
        };
    }

    /**
     * Send message from specific device
     */
    async sendMessage(deviceId, chatId, message) {
        const client = this.getClient(deviceId);
        if (!client) {
            throw new Error(`Device ${deviceId} not found`);
        }

        try {
            const sentMessage = await client.sendMessage(chatId, message);
            
            // Log sent message
            await this.logMessage(deviceId, sentMessage, 'sent');
            
            return sentMessage;
        } catch (error) {
            console.error(`Error sending message from device ${deviceId}:`, error);
            throw error;
        }
    }

    /**
     * Get device statistics
     */
    getDeviceStats(deviceId) {
        const messageLogger = require('./messageLogger');
        return messageLogger.getDeviceStats(deviceId);
    }
}

module.exports = WhatsAppManager;
