const { getAllGroupsSettings, isBotOwner, isRentActive } = require('../utils/groupSettings');

/**
 * Command untuk melihat daftar semua grup dan status sewa
 * Hanya bisa digunakan di pesan pribadi oleh BOT_OWNER
 * Usage: !grouprent
 */
module.exports = async (client, message) => {
    try {
        const contact = await message.getContact();
        const chat = await message.getChat();
        
        // Check if this is a private message (not group)
        if (chat.isGroup) {
            await message.reply(
                '❌ *Command Tidak Tersedia di Grup*\n\n' +
                'Command `!grouprent` hanya bisa digunakan di pesan pribadi.\n\n' +
                '📱 *Cara menggunakan:*\n' +
                '1. Kirim pesan pribadi ke bot\n' +
                '2. Ketik `!grouprent`\n' +
                '3. Bot akan kirim daftar semua grup'
            );
            return;
        }
        
        // Check if user is bot owner
        if (!isBotOwner(contact)) {
            await message.reply(
                '❌ *Akses Ditolak*\n\n' +
                'Hanya BOT_OWNER yang dapat melihat daftar grup.\n\n' +
                '**Info:**\n' +
                '• Command ini memerlukan akses BOT_OWNER\n' +
                '• Hubungi administrator bot untuk akses'
            );
            return;
        }
        
        // Get all groups from WhatsApp
        const allChats = await client.getChats();
        const groupChats = allChats.filter(c => c.isGroup || (c.id && c.id._serialized && c.id._serialized.endsWith('@g.us')));
        
        // Get all group settings
        const allSettings = getAllGroupsSettings();
        
        let groupList = '📊 *Daftar Semua Grup Bot*\n\n';
        groupList += `**Total Grup:** ${groupChats.length}\n\n`;
        
        if (groupChats.length === 0) {
            groupList += '❌ Tidak ada grup yang ditemukan.\n\n';
            groupList += '**Catatan:** Bot belum bergabung dengan grup manapun.';
            await message.reply(groupList);
            return;
        }
        
        // Categorize groups
        let activeRentGroups = [];
        let expiredRentGroups = [];
        let permanentGroups = [];
        let inactiveGroups = [];
        
        groupChats.forEach((chat, index) => {
            const groupId = chat.id._serialized;
            const settings = allSettings[groupId] || {};
            
            const groupInfo = {
                number: index + 1,
                name: chat.name || 'Nama Tidak Diketahui',
                id: groupId,
                settings: settings
            };
            
            if (settings.rentMode) {
                if (isRentActive(groupId)) {
                    activeRentGroups.push(groupInfo);
                } else {
                    expiredRentGroups.push(groupInfo);
                }
            } else if (settings.botEnabled !== false) {
                permanentGroups.push(groupInfo);
            } else {
                inactiveGroups.push(groupInfo);
            }
        });
        
        // Display active rent groups
        if (activeRentGroups.length > 0) {
            groupList += '🟢 **GRUP SEWA AKTIF:**\n';
            activeRentGroups.forEach(group => {
                const expiryDate = new Date(group.settings.rentExpiry);
                const now = new Date();
                const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                
                groupList += `${group.number}. ${group.name}\n`;
                groupList += `   • Status: 🟢 Aktif (Sewa)\n`;
                groupList += `   • Kadaluarsa: ${expiryDate.toLocaleDateString('id-ID')} ${expiryDate.toLocaleTimeString('id-ID')}\n`;
                groupList += `   • Sisa: ${daysLeft} hari\n`;
                
                if (group.settings.rentOwner && group.settings.rentOwner.name !== 'Trial User') {
                    groupList += `   • Owner: ${group.settings.rentOwner.name} (${group.settings.rentOwner.number})\n`;
                } else if (group.settings.rentOwner && group.settings.rentOwner.name === 'Trial User') {
                    groupList += `   • Status: 🆓 Trial Gratis\n`;
                }
                
                if (group.settings.rentPrice && group.settings.rentPrice > 0) {
                    groupList += `   • Harga: Rp ${group.settings.rentPrice.toLocaleString('id-ID')}\n`;
                }
                
                groupList += '\n';
            });
        }
        
        // Display permanent groups
        if (permanentGroups.length > 0) {
            groupList += '🔵 **GRUP PERMANEN:**\n';
            permanentGroups.forEach(group => {
                groupList += `${group.number}. ${group.name}\n`;
                groupList += `   • Status: 🔵 Aktif (Permanen)\n`;
                groupList += `   • Kadaluarsa: Tidak ada (Permanen)\n\n`;
            });
        }
        
        // Display expired rent groups
        if (expiredRentGroups.length > 0) {
            groupList += '🔴 **GRUP SEWA KADALUARSA:**\n';
            expiredRentGroups.forEach(group => {
                const expiryDate = new Date(group.settings.rentExpiry);
                
                groupList += `${group.number}. ${group.name}\n`;
                groupList += `   • Status: 🔴 Nonaktif (Kadaluarsa)\n`;
                groupList += `   • Kadaluarsa: ${expiryDate.toLocaleDateString('id-ID')} ${expiryDate.toLocaleTimeString('id-ID')}\n`;
                
                if (group.settings.rentOwner && group.settings.rentOwner.name !== 'Trial User') {
                    groupList += `   • Owner: ${group.settings.rentOwner.name} (${group.settings.rentOwner.number})\n`;
                } else if (group.settings.rentOwner && group.settings.rentOwner.name === 'Trial User') {
                    groupList += `   • Status: 🆓 Trial Berakhir\n`;
                }
                
                groupList += '\n';
            });
        }
        
        // Display inactive groups
        if (inactiveGroups.length > 0) {
            groupList += '⚫ **GRUP NONAKTIF:**\n';
            inactiveGroups.forEach(group => {
                groupList += `${group.number}. ${group.name}\n`;
                groupList += `   • Status: ⚫ Nonaktif (Manual)\n`;
                groupList += `   • Kadaluarsa: Tidak ada\n\n`;
            });
        }
        
        // Summary
        groupList += '📈 **RINGKASAN:**\n';
        groupList += `• Sewa Aktif: ${activeRentGroups.length} grup\n`;
        groupList += `• Permanen: ${permanentGroups.length} grup\n`;
        groupList += `• Kadaluarsa: ${expiredRentGroups.length} grup\n`;
        groupList += `• Nonaktif: ${inactiveGroups.length} grup\n`;
        groupList += `• **Total: ${groupChats.length} grup**\n\n`;
        
        // Revenue calculation
        let totalRevenue = 0;
        activeRentGroups.forEach(group => {
            if (group.settings.rentPrice && group.settings.rentPrice > 0) {
                totalRevenue += group.settings.rentPrice;
            }
        });
        
        if (totalRevenue > 0) {
            groupList += `💰 **Total Pendapatan Aktif:** Rp ${totalRevenue.toLocaleString('id-ID')}\n\n`;
        }
        
        groupList += '**Catatan:**\n';
        groupList += '• Data diperbarui real-time\n';
        groupList += '• Gunakan `!rent status` di grup untuk detail\n';
        groupList += '• Notifikasi perpanjangan otomatis 3 hari sebelum kadaluarsa';
        
        await message.reply(groupList);
        
    } catch (error) {
        console.error('Error in grouprent command:', error);
        await message.reply('Terjadi error saat mengambil daftar grup.');
    }
};
