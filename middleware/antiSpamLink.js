/**
 * Deletes unauthorized link messages from a given message object.
 * Now uses per-group settings instead of global allowed links.
 *
 * @param {import('whatsapp-web.js').Message} message - The message object to check.
 * @param {import('whatsapp-web.js').Client} client - The WhatsApp client instance.
 * @return {Promise<boolean>} A promise that resolves to true if the message was deleted, false if not.
 */
module.exports = async (message, client) => {
    if (!message || !message.body) {
        console.log('Message or message body is null, skipping link check');
        return false;
    }

    // Get chat info to determine if this is a group and get group settings
    const chat = await message.getChat();
    if (!chat.isGroup) {
        console.log('Message is not from a group, skipping link check');
        return false;
    }

    // Get anti-spam link settings for this group
    const { getAntiSpamLinkSettings } = require('../utils/groupSettings');
    const { isPornContent } = require('../utils/pornBlockList');
    const antiSpamSettings = getAntiSpamLinkSettings(chat.id._serialized);

    // Check if anti-spam link is enabled for this group
    if (!antiSpamSettings.enabled) {
        console.log('Anti-spam link is disabled for this group, skipping link check');
        return false;
    }

    // Enhanced regex to detect various link formats
    const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;
    const links = message.body.match(linkRegex);

    if (!links) {
        console.log('No links found in message, skipping link check');
        return false;
    }

    try {
        // Normalize allowed links to just domain names (remove protocols)
        const normalizedAllowedDomains = antiSpamSettings.allowedDomains.map(allowed => {
            return allowed.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
        });

        console.log('Normalized allowed domains:', normalizedAllowedDomains);

        const unauthorizedLinks = links.filter(link => {
            // Normalize the found link to just domain name
            const normalizedLink = link.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
            // Extract just the domain part (before first slash)
            const domain = normalizedLink.split('/')[0];

            console.log(`Checking link: "${link}" -> domain: "${domain}"`);

            // First check if it's porn content (auto-block if enabled)
            if (antiSpamSettings.blockPorn && isPornContent(link)) {
                console.log(`PORN CONTENT DETECTED: "${link}" - AUTO BLOCKED`);
                return true; // Block this link
            }

            // Check if this domain is in the allowed list
            const isAllowed = normalizedAllowedDomains.some(allowed =>
                domain === allowed || domain.includes(allowed) || allowed.includes(domain)
            );

            console.log(`Domain "${domain}" is ${isAllowed ? 'ALLOWED' : 'BLOCKED'}`);
            return !isAllowed;
        });

        if (unauthorizedLinks.length > 0) {
            console.log(`Found unauthorized link message from ${message.author || message.from}: "${message.body}"`);

            // Check if action is delete or warn
            if (antiSpamSettings.action === 'delete') {
                // Try to delete the message
                try {
                    await message.delete(true); // true = delete for everyone
                    console.log('Successfully deleted unauthorized link message');

                    // Send notification about deleted message
                    try {
                        const contact = await message.getContact();
                        const notificationMsg = `🚫 *Link Dihapus Otomatis* 🚫\n\n@${contact.number || contact.pushname || 'Unknown'} pesan Anda dihapus karena mengandung link yang tidak diizinkan.\n\nLink yang diblokir: ${unauthorizedLinks.join(', ')}`;

                        await chat.sendMessage(notificationMsg, {
                            mentions: [message.from]
                        });

                        console.log('Deletion notification sent');
                    } catch (notificationError) {
                        console.error('Error sending deletion notification:', notificationError);
                    }

                    return true;
                } catch (deleteError) {
                    console.log('Could not delete message (may not have permission), sending warning instead');
                }
            }

            // If action is 'warn' or delete failed, send warning message
            try {
                const contact = await message.getContact();
                const warningMsg = `⚠️ *Link Tidak Diizinkan* ⚠️\n\n@${contact.number || contact.pushname || 'Unknown'} link yang Anda kirim tidak diizinkan di grup ini.\n\n${antiSpamSettings.action === 'delete' ? '⚠️ Pesan akan dihapus jika bot memiliki izin admin.' : '⚠️ Mohon hapus pesan ini secara manual.'}`;

                await chat.sendMessage(warningMsg, {
                    mentions: [message.from]
                });

                console.log('Warning message sent for unauthorized link');
            } catch (warningError) {
                console.error('Error sending warning message:', warningError);
            }

            return antiSpamSettings.action === 'delete' ? false : true; // Return based on action type
        }
    } catch (error) {
        console.error(`Error while checking for unauthorized links in message: ${error}`);
        return false;
    }

    return false;
};
