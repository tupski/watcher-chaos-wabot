/**
 * Message Logger System
 * Handles logging and analytics for WhatsApp messages
 */

const fs = require('fs');
const path = require('path');

class MessageLogger {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.logFile = path.join(this.dataDir, 'messages.json');
        this.statsFile = path.join(this.dataDir, 'message_stats.json');
        
        // Create data directory if it doesn't exist
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        
        this.initializeFiles();
    }

    /**
     * Initialize log files if they don't exist
     */
    initializeFiles() {
        if (!fs.existsSync(this.logFile)) {
            fs.writeFileSync(this.logFile, JSON.stringify({ messages: [] }, null, 2));
        }
        
        if (!fs.existsSync(this.statsFile)) {
            const initialStats = {
                totalSent: 0,
                totalReceived: 0,
                totalFailed: 0,
                dailyStats: {},
                deviceStats: {},
                lastUpdated: new Date().toISOString()
            };
            fs.writeFileSync(this.statsFile, JSON.stringify(initialStats, null, 2));
        }
    }

    /**
     * Log a message
     */
    logMessage(messageData) {
        try {
            // Read current messages
            const data = JSON.parse(fs.readFileSync(this.logFile, 'utf8'));
            
            // Add new message with ID
            const message = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                ...messageData,
                loggedAt: new Date().toISOString()
            };
            
            // Add to beginning of array (newest first)
            data.messages.unshift(message);
            
            // Keep only last 10000 messages to prevent file from getting too large
            if (data.messages.length > 10000) {
                data.messages = data.messages.slice(0, 10000);
            }
            
            // Write back to file
            fs.writeFileSync(this.logFile, JSON.stringify(data, null, 2));
            
            // Update statistics
            this.updateStats(messageData);
            
            return message;
        } catch (error) {
            console.error('Error logging message:', error);
            return null;
        }
    }

    /**
     * Update message statistics
     */
    updateStats(messageData) {
        try {
            const stats = JSON.parse(fs.readFileSync(this.statsFile, 'utf8'));
            
            // Update total counters
            if (messageData.type === 'sent') {
                if (messageData.status === 'success') {
                    stats.totalSent++;
                } else {
                    stats.totalFailed++;
                }
            } else if (messageData.type === 'received') {
                stats.totalReceived++;
            }
            
            // Update daily stats
            const today = new Date().toISOString().split('T')[0];
            if (!stats.dailyStats[today]) {
                stats.dailyStats[today] = { sent: 0, received: 0, failed: 0 };
            }
            
            if (messageData.type === 'sent') {
                if (messageData.status === 'success') {
                    stats.dailyStats[today].sent++;
                } else {
                    stats.dailyStats[today].failed++;
                }
            } else if (messageData.type === 'received') {
                stats.dailyStats[today].received++;
            }
            
            // Update device stats
            if (messageData.deviceId) {
                if (!stats.deviceStats[messageData.deviceId]) {
                    stats.deviceStats[messageData.deviceId] = { sent: 0, received: 0, failed: 0 };
                }
                
                if (messageData.type === 'sent') {
                    if (messageData.status === 'success') {
                        stats.deviceStats[messageData.deviceId].sent++;
                    } else {
                        stats.deviceStats[messageData.deviceId].failed++;
                    }
                } else if (messageData.type === 'received') {
                    stats.deviceStats[messageData.deviceId].received++;
                }
            }
            
            // Clean up old daily stats (keep only last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
            
            Object.keys(stats.dailyStats).forEach(date => {
                if (date < cutoffDate) {
                    delete stats.dailyStats[date];
                }
            });
            
            stats.lastUpdated = new Date().toISOString();
            
            // Write back to file
            fs.writeFileSync(this.statsFile, JSON.stringify(stats, null, 2));
        } catch (error) {
            console.error('Error updating message stats:', error);
        }
    }

    /**
     * Get messages with pagination
     */
    getMessages(page = 1, limit = 10, filters = {}) {
        try {
            const data = JSON.parse(fs.readFileSync(this.logFile, 'utf8'));
            let messages = data.messages;
            
            // Apply filters
            if (filters.type) {
                messages = messages.filter(msg => msg.type === filters.type);
            }
            
            if (filters.deviceId) {
                messages = messages.filter(msg => msg.deviceId === filters.deviceId);
            }
            
            if (filters.status) {
                messages = messages.filter(msg => msg.status === filters.status);
            }
            
            if (filters.dateFrom) {
                const fromDate = new Date(filters.dateFrom);
                messages = messages.filter(msg => new Date(msg.timestamp) >= fromDate);
            }
            
            if (filters.dateTo) {
                const toDate = new Date(filters.dateTo);
                messages = messages.filter(msg => new Date(msg.timestamp) <= toDate);
            }
            
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                messages = messages.filter(msg => 
                    msg.body.toLowerCase().includes(searchTerm) ||
                    msg.chatName.toLowerCase().includes(searchTerm) ||
                    msg.fromName.toLowerCase().includes(searchTerm)
                );
            }
            
            // Calculate pagination
            const total = messages.length;
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;
            const paginatedMessages = messages.slice(offset, offset + limit);
            
            return {
                messages: paginatedMessages,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limit,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            console.error('Error getting messages:', error);
            return {
                messages: [],
                pagination: {
                    currentPage: 1,
                    totalPages: 0,
                    totalItems: 0,
                    itemsPerPage: limit,
                    hasNext: false,
                    hasPrev: false
                }
            };
        }
    }

    /**
     * Get message statistics
     */
    getStats() {
        try {
            return JSON.parse(fs.readFileSync(this.statsFile, 'utf8'));
        } catch (error) {
            console.error('Error getting message stats:', error);
            return {
                totalSent: 0,
                totalReceived: 0,
                totalFailed: 0,
                dailyStats: {},
                deviceStats: {},
                lastUpdated: new Date().toISOString()
            };
        }
    }

    /**
     * Get device-specific statistics
     */
    getDeviceStats(deviceId) {
        const stats = this.getStats();
        return stats.deviceStats[deviceId] || { sent: 0, received: 0, failed: 0 };
    }

    /**
     * Get today's statistics
     */
    getTodayStats() {
        const stats = this.getStats();
        const today = new Date().toISOString().split('T')[0];
        return stats.dailyStats[today] || { sent: 0, received: 0, failed: 0 };
    }

    /**
     * Get message by ID
     */
    getMessageById(messageId) {
        try {
            const data = JSON.parse(fs.readFileSync(this.logFile, 'utf8'));
            return data.messages.find(msg => msg.id === messageId);
        } catch (error) {
            console.error('Error getting message by ID:', error);
            return null;
        }
    }

    /**
     * Delete old messages (cleanup)
     */
    cleanupOldMessages(daysToKeep = 30) {
        try {
            const data = JSON.parse(fs.readFileSync(this.logFile, 'utf8'));
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            const filteredMessages = data.messages.filter(msg => 
                new Date(msg.timestamp) > cutoffDate
            );
            
            data.messages = filteredMessages;
            fs.writeFileSync(this.logFile, JSON.stringify(data, null, 2));
            
            console.log(`Cleaned up messages older than ${daysToKeep} days`);
            return true;
        } catch (error) {
            console.error('Error cleaning up old messages:', error);
            return false;
        }
    }

    /**
     * Export messages to CSV
     */
    exportToCSV(filters = {}) {
        try {
            const result = this.getMessages(1, 10000, filters); // Get all matching messages
            const messages = result.messages;
            
            if (messages.length === 0) {
                return null;
            }
            
            // CSV headers
            const headers = [
                'Tanggal',
                'Waktu',
                'Device ID',
                'Tipe',
                'Status',
                'Chat',
                'Dari',
                'Pesan'
            ];
            
            // CSV rows
            const rows = messages.map(msg => {
                const date = new Date(msg.timestamp);
                return [
                    date.toLocaleDateString('id-ID'),
                    date.toLocaleTimeString('id-ID'),
                    msg.deviceId || '',
                    msg.type,
                    msg.status,
                    msg.chatName,
                    msg.fromName,
                    `"${msg.body.replace(/"/g, '""')}"` // Escape quotes in message body
                ];
            });
            
            // Combine headers and rows
            const csvContent = [headers, ...rows]
                .map(row => row.join(','))
                .join('\n');
            
            return csvContent;
        } catch (error) {
            console.error('Error exporting messages to CSV:', error);
            return null;
        }
    }
}

// Create singleton instance
const messageLogger = new MessageLogger();

module.exports = messageLogger;
