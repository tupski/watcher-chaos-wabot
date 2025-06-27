# WhatsApp Bot Database System Guide

## 🎉 Overview

The WhatsApp Bot has been successfully migrated from file-based configuration to a comprehensive MySQL database system. This provides better scalability, reliability, and web-based management capabilities.

## 🚀 Quick Start

### 1. Database Setup

```bash
# Install MySQL dependencies
npm install mysql2

# Setup database and tables
node scripts/setupDatabase.js

# Migrate existing .env settings to database
node scripts/migrateEnvToDatabase.js
```

### 2. Start Bot with Database Configuration

```bash
# Start with database configuration
node start-database.js

# Or use the original start method (with fallback to .env)
node index.js
```

### 3. Access Web Interface

- **Settings Dashboard**: http://localhost:3000/settings-dashboard.html
- **Database Settings**: http://localhost:3000/database-settings.html
- **Real-time Settings**: http://localhost:3000/realtime-settings.html
- **Backup Manager**: http://localhost:3000/backup-manager.html

## 📊 Database Schema

### Core Tables

#### `bot_settings`
Stores all bot configuration settings
```sql
- id (AUTO_INCREMENT)
- setting_key (VARCHAR, UNIQUE)
- setting_value (TEXT)
- setting_type (ENUM: string, number, boolean, json)
- description (TEXT)
- category (VARCHAR)
- is_sensitive (BOOLEAN)
- created_at, updated_at (DATETIME)
```

#### `group_settings`
Manages WhatsApp group configurations
```sql
- id (AUTO_INCREMENT)
- group_id (VARCHAR, UNIQUE)
- group_name (VARCHAR)
- is_active (BOOLEAN)
- bot_enabled (BOOLEAN)
- rental_status (ENUM: inactive, trial, active, expired)
- rental_expires_at (DATETIME)
- trial_used (BOOLEAN)
- settings (JSON)
- created_at, updated_at (DATETIME)
```

#### `payment_logs`
Tracks payment transactions
```sql
- id (AUTO_INCREMENT)
- payment_id (VARCHAR, UNIQUE)
- group_id (VARCHAR)
- buyer_name, buyer_number (VARCHAR)
- amount (DECIMAL)
- duration_days (INT)
- payment_method (VARCHAR)
- status (ENUM: pending, paid, expired, failed)
- xendit_invoice_id (VARCHAR)
- xendit_data (JSON)
- paid_at, expires_at (DATETIME)
- created_at, updated_at (DATETIME)
```

#### `command_settings`
Configures bot commands
```sql
- id (AUTO_INCREMENT)
- command_name (VARCHAR, UNIQUE)
- message_template (TEXT)
- access_level (ENUM: all, member, admin)
- is_enabled (BOOLEAN)
- description (TEXT)
- category (VARCHAR)
- created_at, updated_at (DATETIME)
```

#### `messages`
Stores message logs
```sql
- id (VARCHAR, PRIMARY KEY)
- content (TEXT)
- sender (VARCHAR)
- chat_id (VARCHAR)
- chat_name (VARCHAR)
- message_type (VARCHAR)
- timestamp (DATETIME)
- created_at (DATETIME)
```

#### `system_logs`
System activity logs
```sql
- id (AUTO_INCREMENT)
- log_level (ENUM: info, warn, error, debug)
- message (TEXT)
- context (JSON)
- source (VARCHAR)
- timestamp (DATETIME)
```

## 🔧 Configuration Management

### Settings Categories

1. **Discord Settings**
   - DISCORD_TOKEN
   - DISCORD_CHANNEL_ID
   - DISCORD_CLIENT_ID
   - DISCORD_CLIENT_SECRET

2. **WhatsApp Settings**
   - WHATSAPP_CLIENT_ID
   - WHATSAPP_GROUP_IDS
   - BOT_OWNER_NUMBER

3. **Payment Settings**
   - XENDIT_SECRET_KEY
   - XENDIT_PUBLIC_KEY
   - XENDIT_WEBHOOK_TOKEN
   - XENDIT_IS_PRODUCTION

4. **General Settings**
   - TIMEZONE_OFFSET
   - ALLOWED_LINKS
   - ONLY_WATCHER_CHAOS

5. **Server Settings**
   - PORT
   - BASE_URL
   - SESSION_SECRET

6. **AI Settings**
   - GEMINI_API_KEY

7. **Game Settings**
   - MONSTER_RESET_TIME
   - MONSTER_NOTIFICATIONS

### Using Configuration Loader

```javascript
const configLoader = require('./utils/configLoader');

// Initialize configuration
await configLoader.initialize();

// Get specific setting
const discordToken = configLoader.get('DISCORD_TOKEN');

// Get category-specific config
const discordConfig = configLoader.getDiscordConfig();
const paymentConfig = configLoader.getPaymentConfig();

// Update setting
await configLoader.set('TIMEZONE_OFFSET', '8', 'number', 'Timezone offset', 'general');
```

## 🌐 Web Interface Features

### 1. Settings Dashboard
- **Category-based organization** of settings
- **Real-time editing** with validation
- **Sensitive data protection** (hidden values)
- **Bulk editing** capabilities
- **Export/Import** functionality

### 2. Database Settings
- **Connection testing**
- **Database statistics**
- **Group management**
- **Migration tools**

### 3. Real-time Settings
- **Live WebSocket updates**
- **Multi-client synchronization**
- **Activity logging**
- **Quick edit functionality**

### 4. Backup Manager
- **Automated backups**
- **Restore functionality**
- **Cleanup tools**
- **Settings export/import**

## 🔄 Real-time Updates

The system supports real-time configuration updates via WebSocket:

```javascript
// Client-side WebSocket events
socket.on('config:updated', (data) => {
    // Handle configuration update
});

socket.emit('config:update', {
    key: 'TIMEZONE_OFFSET',
    value: '8',
    type: 'number',
    category: 'general'
});
```

## 💾 Backup & Restore

### Create Backup
```bash
# Command line
node scripts/databaseBackup.js backup --name=pre-update --desc="Before system update"

# Programmatic
const DatabaseBackupManager = require('./scripts/databaseBackup');
const backupManager = new DatabaseBackupManager();
await backupManager.createBackup({ name: 'manual-backup', description: 'Manual backup' });
```

### Restore Backup
```bash
# Command line
node scripts/databaseBackup.js restore backups/backup-2024-01-01.json --force

# Programmatic
await backupManager.restoreBackup('backups/backup-2024-01-01.json', { force: true });
```

### Export/Import Settings Only
```bash
# Export settings
node scripts/databaseBackup.js export-settings settings-export.json

# Import settings
node scripts/databaseBackup.js import-settings settings-export.json
```

## 🔒 Security Features

1. **Sensitive Data Protection**
   - Sensitive settings are marked and hidden in UI
   - Encrypted storage for sensitive values
   - Access control for configuration changes

2. **Session Management**
   - Web interface requires authentication
   - Session-based access control
   - Automatic session expiration

3. **Backup Security**
   - Compressed backup files
   - Metadata validation
   - Restore confirmation prompts

## 🚨 Migration from .env

The system automatically migrates existing .env settings to the database:

1. **Automatic Migration**: Run `node scripts/migrateEnvToDatabase.js`
2. **Backup Creation**: Original .env file is backed up
3. **Fallback Support**: System falls back to .env if database is unavailable
4. **Validation**: Settings are validated during migration

## 📈 Monitoring & Logging

### Database Statistics
- Real-time connection status
- Table record counts
- Database size monitoring
- Performance metrics

### Activity Logging
- Configuration changes
- System events
- Error tracking
- User actions

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check MySQL service
   systemctl status mysql
   
   # Verify credentials in .env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=mysql
   DB_NAME=wabot
   ```

2. **Migration Issues**
   ```bash
   # Reset database
   node scripts/setupDatabase.js
   
   # Re-run migration
   node scripts/migrateEnvToDatabase.js
   ```

3. **Web Interface Not Loading**
   - Check server is running on correct port
   - Verify session authentication
   - Check browser console for errors

### Backup Recovery
If database is corrupted:
```bash
# List available backups
node scripts/databaseBackup.js list

# Restore from backup
node scripts/databaseBackup.js restore backups/latest-backup.json --force --clear
```

## 🎯 Best Practices

1. **Regular Backups**
   - Schedule daily automated backups
   - Keep multiple backup versions
   - Test restore procedures regularly

2. **Configuration Management**
   - Use descriptive setting descriptions
   - Organize settings by category
   - Document sensitive settings

3. **Security**
   - Regularly update database credentials
   - Monitor access logs
   - Use HTTPS in production

4. **Performance**
   - Monitor database size
   - Clean up old logs regularly
   - Optimize queries for large datasets

## 📚 API Reference

### Settings API Endpoints

- `GET /api/settings/all` - Get all settings
- `GET /api/settings/category/:category` - Get category settings
- `POST /api/settings/update` - Update settings
- `GET /api/settings/database/stats` - Database statistics
- `POST /api/settings/migrate` - Migrate from .env

### Backup API Endpoints

- `POST /api/settings/database/backup` - Create backup
- `GET /api/settings/database/backups` - List backups
- `POST /api/settings/database/restore` - Restore backup
- `POST /api/settings/database/cleanup` - Cleanup old backups

## 🎉 Conclusion

The new database system provides:
- ✅ **Scalable configuration management**
- ✅ **Web-based administration**
- ✅ **Real-time updates**
- ✅ **Comprehensive backup system**
- ✅ **Enhanced security**
- ✅ **Better monitoring**

The system maintains backward compatibility while providing modern database-driven configuration management for the WhatsApp Bot.
