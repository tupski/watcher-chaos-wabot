const { setAntiSpamLink, getAntiSpamLinkSettings, canExecuteCommand } = require('../utils/groupSettings');
const { isGroupChat } = require('../utils/chatUtils');

module.exports = async (client, message) => {
    try {
        const chat = await message.getChat();
        
        // Only work in groups
        if (!isGroupChat(chat)) {
            await message.reply('Pengaturan anti-spam link hanya bisa diubah di grup.');
            return;
        }

        // Check if user can execute admin commands
        const canExecute = await canExecuteCommand(message, 'antispam', client);
        if (!canExecute) {
            await message.reply('❌ Hanya admin grup yang bisa mengubah pengaturan anti-spam link.');
            return;
        }

        const args = message.body.split(' ').slice(1); // Remove !antispam
        const subCommand = args[0]?.toLowerCase();
        const groupId = chat.id._serialized;

        if (!subCommand) {
            // Show current settings
            const settings = getAntiSpamLinkSettings(groupId);
            
            let statusMessage = '🛡️ *Pengaturan Anti-Spam Link* 🛡️\n\n';
            statusMessage += `Status: ${settings.enabled ? '✅ Aktif' : '❌ Nonaktif'}\n`;
            statusMessage += `Auto-block Porno: ${settings.blockPorn ? '✅ Aktif' : '❌ Nonaktif'}\n`;
            statusMessage += `Aksi: ${settings.action === 'delete' ? '🗑️ Hapus Pesan' : '⚠️ Beri Peringatan'}\n\n`;
            
            statusMessage += `📋 *Domain yang Diblokir:*\n`;
            if (settings.blockedDomains.length > 0) {
                settings.blockedDomains.forEach((domain, index) => {
                    statusMessage += `${index + 1}. ${domain}\n`;
                });
            } else {
                statusMessage += 'Tidak ada domain yang diblokir\n';
            }
            
            statusMessage += '\n📖 *Cara Penggunaan:*\n';
            statusMessage += '• `!antispam on/off` - Aktifkan/nonaktifkan\n';
            statusMessage += '• `!antispam porn on/off` - Auto-block porno\n';
            statusMessage += '• `!antispam action delete/warn` - Atur aksi\n';
            statusMessage += '• `!antispam add [domain]` - Tambah domain ke blokir\n';
            statusMessage += '• `!antispam remove [domain]` - Hapus domain dari blokir\n';
            statusMessage += '• `!antispam reset` - Reset ke default';
            
            await message.reply(statusMessage);
            return;
        }

        const settings = getAntiSpamLinkSettings(groupId);

        switch (subCommand) {
            case 'on':
                setAntiSpamLink(groupId, { enabled: true });
                await message.reply('✅ Anti-spam link telah *diaktifkan* untuk grup ini.');
                break;

            case 'off':
                setAntiSpamLink(groupId, { enabled: false });
                await message.reply('❌ Anti-spam link telah *dinonaktifkan* untuk grup ini.');
                break;

            case 'porn':
                const pornAction = args[1]?.toLowerCase();
                if (pornAction === 'on') {
                    setAntiSpamLink(groupId, { blockPorn: true });
                    await message.reply('✅ Auto-block link porno telah *diaktifkan*.');
                } else if (pornAction === 'off') {
                    setAntiSpamLink(groupId, { blockPorn: false });
                    await message.reply('❌ Auto-block link porno telah *dinonaktifkan*.');
                } else {
                    await message.reply('❌ Gunakan: `!antispam porn on` atau `!antispam porn off`');
                }
                break;

            case 'action':
                const actionType = args[1]?.toLowerCase();
                if (actionType === 'delete') {
                    setAntiSpamLink(groupId, { action: 'delete' });
                    await message.reply('🗑️ Aksi anti-spam diubah ke *hapus pesan*.');
                } else if (actionType === 'warn') {
                    setAntiSpamLink(groupId, { action: 'warn' });
                    await message.reply('⚠️ Aksi anti-spam diubah ke *beri peringatan*.');
                } else {
                    await message.reply('❌ Gunakan: `!antispam action delete` atau `!antispam action warn`');
                }
                break;

            case 'add':
                const domainToAdd = args[1];
                if (!domainToAdd) {
                    await message.reply('❌ Masukkan domain yang ingin ditambahkan ke daftar blokir.\nContoh: `!antispam add barongsay.id`');
                    return;
                }

                // Clean domain (remove protocol and www)
                const cleanDomain = domainToAdd.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();

                if (!settings.blockedDomains.includes(cleanDomain)) {
                    const newBlockedDomains = [...settings.blockedDomains, cleanDomain];
                    setAntiSpamLink(groupId, { blockedDomains: newBlockedDomains });
                    await message.reply(`✅ Domain *${cleanDomain}* telah ditambahkan ke daftar yang diblokir.`);
                } else {
                    await message.reply(`❌ Domain *${cleanDomain}* sudah ada dalam daftar yang diblokir.`);
                }
                break;

            case 'remove':
                const domainToRemove = args[1];
                if (!domainToRemove) {
                    await message.reply('❌ Masukkan domain yang ingin dihapus dari daftar blokir.\nContoh: `!antispam remove barongsay.id`');
                    return;
                }

                // Clean domain (remove protocol and www)
                const cleanDomainToRemove = domainToRemove.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();

                if (settings.blockedDomains.includes(cleanDomainToRemove)) {
                    const newBlockedDomains = settings.blockedDomains.filter(domain => domain !== cleanDomainToRemove);
                    setAntiSpamLink(groupId, { blockedDomains: newBlockedDomains });
                    await message.reply(`✅ Domain *${cleanDomainToRemove}* telah dihapus dari daftar yang diblokir.`);
                } else {
                    await message.reply(`❌ Domain *${cleanDomainToRemove}* tidak ada dalam daftar yang diblokir.`);
                }
                break;

            case 'reset':
                const { defaultSettings } = require('../utils/groupSettings');
                setAntiSpamLink(groupId, defaultSettings.antiSpamLink);
                await message.reply('🔄 Pengaturan anti-spam link telah direset ke default.');
                break;

            default:
                await message.reply('❌ Perintah tidak dikenal.\n\nGunakan `!antispam` untuk melihat pengaturan dan cara penggunaan.');
                break;
        }

    } catch (error) {
        console.error('Error in antispam command:', error);
        await message.reply('❌ Terjadi kesalahan saat memproses perintah anti-spam.');
    }
};
