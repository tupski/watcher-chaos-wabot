# 🎮 Lords Mobile Features Guide

Panduan lengkap fitur-fitur Lords Mobile di Bot WhatsApp: Hell Event Notifications dan Monster Rotation.

## 🔥 Hell Event Notifications

### Overview
Bot secara otomatis memantau Hell Event dari Discord server Lords Mobile dan mengirim notifikasi ke grup WhatsApp yang terdaftar.

### Fitur Utama
- **Real-time Monitoring**: Pantau Discord channel 24/7
- **Smart Filtering**: Filter khusus Watcher dan Chaos Dragon
- **Multi-Group Support**: Kirim ke multiple grup WhatsApp
- **Customizable Settings**: Pengaturan per grup

### Command Hell Event

#### !hell
**Deskripsi**: Info Hell Event saat ini (khusus Watcher/Chaos Dragon)  
**Output**:
```
🔥 Hell Event - Watcher 🔥

⏰ Waktu: 2 jam 30 menit lagi
🎯 Target: Watcher
🏆 Reward: Speed Up, Gems, Resources
📋 Task: Kill monsters, Gather resources, Complete quests

🚀 Siap-siap hunt Watcher!
```

#### !hell all
**Deskripsi**: Info semua Hell Event yang aktif  
**Output**: Daftar lengkap semua Hell Event yang sedang berlangsung

#### !hell watcherchaos
**Deskripsi**: Info khusus Watcher dan Chaos Dragon  
**Output**: Sama seperti `!hell` tapi lebih spesifik

### Pengaturan Notifikasi

#### Per-Group Settings
Setiap grup bisa mengatur jenis notifikasi Hell Event:

| Setting | Deskripsi |
|---------|-----------|
| `all` | Semua Hell Event |
| `watcherchaos` | Hanya Watcher & Chaos Dragon |
| `off` | Nonaktifkan notifikasi |

#### Mengubah Pengaturan
```bash
# Via dashboard web (recommended)
http://localhost:3000/dashboard/settings

# Via command (jika tersedia)
!hell settings watcherchaos
```

### Discord Integration

#### Setup Requirements
1. **Discord Bot Token**: Token bot Discord
2. **Channel ID**: ID channel Hell Event
3. **Permissions**: Read message history

#### Configuration (.env)
```env
DISCORD_TOKEN=your-discord-bot-token
DISCORD_CHANNEL_ID=your-channel-id
```

#### Message Format Detection
Bot mendeteksi Hell Event berdasarkan format pesan Discord:
```
🔥 Hell Event - Watcher 🔥
Time: 2 hours 30 minutes
Target: Watcher
Reward: Speed Up, Gems
Task: Kill monsters
```

---

## 🐉 Monster Rotation

### Overview
Sistem rotasi monster 12 hari dengan notifikasi otomatis setiap hari jam 11:55 WIB (GMT+7).

### Jadwal Rotasi
Rotasi 12 hari dimulai dari **8 Juni 2025**:

| Hari | Monster 1 | Monster 2 |
|------|-----------|-----------|
| 1 | Gargantua | Hardrox |
| 2 | Bon Appeti | Noceros |
| 3 | Snow Beast | Frostwing |
| 4 | Saberfang | Blackwing |
| 5 | Tidal Titan | Mega Maggot |
| 6 | Terrorthorn | Voodoo Shaman |
| 7 | Grim Reaper | Hell Drider |
| 8 | Jade Wyrm | Gemming Gremlin |
| 9 | Gryphon | Queen Bee |
| 10 | Sea Squire | Mecha Trojan |
| 11 | Huey Hops | Gargantua |
| 12 | Hardrox | Bon Appeti |

*Setelah hari ke-12, rotasi kembali ke hari ke-1*

### Command Monster Rotation

#### !monster
**Deskripsi**: Jadwal monster hari ini dan besok  
**Output**:
```
🐉 Monster Rotation 🐉

Today Monster:
Gargantua & Hardrox (time left 5h 23m)

Tomorrow Monster:
Bon Appeti & Noceros (Spawn in 17h 23m)
```

#### !monster <nama>
**Deskripsi**: Cari kapan monster tertentu spawn  
**Contoh**: `!monster gargantua`  
**Output**:
```
Gargantua will spawn at 15 Juni 2025

7 days 12 hours left
```

#### !monster status
**Deskripsi**: Status notifikasi monster untuk grup  
**Output**:
```
🐉 Monster Notification Status

Notifications: Enabled

Use !monster off to disable or !monster on to enable daily notifications.
```

### Notifikasi Otomatis

#### Jadwal Notifikasi
- **Waktu**: Setiap hari jam **11:55 WIB** (GMT+7)
- **Konten**: Monster hari ini dan besok
- **Target**: Semua grup yang mengaktifkan notifikasi

#### Format Notifikasi
```
🐉 Monster Reset - 8 Juni 2025 🐉

🔥 Today's Monsters:
• Gargantua
• Hardrox

⏰ Reset in: 5 minutes (12:00 WIB)

🌅 Tomorrow's Monsters:
• Bon Appeti  
• Noceros

📅 Next Reset: 9 Juni 2025, 12:00 WIB

Happy hunting! 🎯
```

### Pengaturan Per-Grup

#### Mengaktifkan Notifikasi
```bash
!monster on
```
**Output**: `✅ Monster notifications have been enabled for this group`

#### Menonaktifkan Notifikasi
```bash
!monster off
```
**Output**: `✅ Monster notifications have been disabled for this group`

#### Cek Status
```bash
!monster status
```

### Technical Details

#### Timezone Configuration
```env
TIMEZONE_OFFSET=7  # GMT+7 untuk WIB
```

#### Reset Time Calculation
- **Server Time**: UTC
- **Local Time**: UTC + TIMEZONE_OFFSET
- **Reset Time**: 12:00 WIB = 05:00 UTC
- **Notification Time**: 11:55 WIB = 04:55 UTC

#### Database Storage
```javascript
groupSettings: {
    monsterNotifications: 'on' | 'off'  // Default: 'on'
}
```

---

## 🔧 Configuration & Setup

### Environment Variables
```env
# Discord Integration
DISCORD_TOKEN=your-discord-bot-token
DISCORD_CHANNEL_ID=your-hell-event-channel-id

# Timezone
TIMEZONE_OFFSET=7  # GMT+7 for Indonesia

# WhatsApp Groups (comma-separated)
WHATSAPP_GROUP_IDS=group1@g.us,group2@g.us,group3@g.us
```

### Discord Bot Setup

#### 1. Create Discord Application
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application
3. Go to "Bot" section
4. Create bot and copy token

#### 2. Bot Permissions
Required permissions:
- Read Messages
- Read Message History
- Send Messages (for testing)

#### 3. Add Bot to Server
1. Go to OAuth2 > URL Generator
2. Select "bot" scope
3. Select required permissions
4. Use generated URL to add bot

#### 4. Get Channel ID
1. Enable Developer Mode in Discord
2. Right-click on Hell Event channel
3. Copy ID

### WhatsApp Groups Setup

#### 1. Get Group IDs
```javascript
// Method 1: Via dashboard
http://localhost:3000/dashboard/groups

// Method 2: Via debug command
!debug  // Shows group ID in output
```

#### 2. Configure Groups
```env
# Add group IDs to .env
WHATSAPP_GROUP_IDS=120363123456789@g.us,120363987654321@g.us
```

#### 3. Test Configuration
```bash
# Test Hell Event
!hell

# Test Monster Rotation  
!monster

# Check group settings
!monster status
```

---

## 🛠️ Troubleshooting

### Common Issues

#### Hell Event Not Working
**Symptoms**: Tidak ada notifikasi Hell Event  
**Solutions**:
1. Check Discord token dan channel ID
2. Verify bot permissions di Discord server
3. Check internet connection
4. Restart bot

#### Monster Notification Not Sent
**Symptoms**: Notifikasi monster tidak terkirim  
**Solutions**:
1. Check timezone configuration
2. Verify group settings (`!monster status`)
3. Check WhatsApp connection
4. Verify group IDs

#### Wrong Timezone
**Symptoms**: Waktu notifikasi salah  
**Solutions**:
1. Set `TIMEZONE_OFFSET=7` untuk WIB
2. Restart bot setelah perubahan
3. Test dengan `!monster` command

### Debug Commands

#### Check Bot Status
```bash
!debug  # Shows technical information
!ping   # Check bot response time
```

#### Check Group Settings
```bash
!monster status  # Monster notification status
!permission      # Group permission settings
```

#### Manual Testing
```bash
# Test monster calculation
!monster gargantua

# Test Hell Event
!hell

# Test AI (if configured)
!ai test message
```

---

## 📈 Performance & Monitoring

### Performance Metrics
- **Discord Monitoring**: Real-time message processing
- **Notification Delivery**: < 5 seconds delay
- **Database Queries**: Optimized per-group settings
- **Memory Usage**: < 50MB for monitoring

### Monitoring Tools
- **Dashboard**: Real-time status monitoring
- **Logs**: Detailed activity logs
- **Alerts**: Error notifications
- **Statistics**: Usage and performance stats

### Maintenance
- **Daily**: Check notification delivery
- **Weekly**: Review error logs
- **Monthly**: Update monster rotation if needed
- **As needed**: Update Discord integration

---

*Untuk informasi lebih lanjut atau support, hubungi developer atau buka issue di GitHub.*
