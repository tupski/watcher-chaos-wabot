/**
 * Deletes unauthorized link messages from a given message object.
 *
 * @param {import('whatsapp-web.js').Message} message - The message object to check.
 * @param {string[]} allowedLinks - An array of strings representing the allowed links.
 * @return {Promise<boolean>} A promise that resolves to true if the message was deleted, false if not.
 */
module.exports = async (message, allowedLinks) => {
    if (!message || !message.body) {
        console.log('Message or message body is null, skipping link check');
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
        const normalizedAllowedDomains = allowedLinks.map(allowed => {
            return allowed.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
        });

        console.log('Normalized allowed domains:', normalizedAllowedDomains);

        const unauthorizedLinks = links.filter(link => {
            // Normalize the found link to just domain name
            const normalizedLink = link.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
            // Extract just the domain part (before first slash)
            const domain = normalizedLink.split('/')[0];

            console.log(`Checking link: "${link}" -> domain: "${domain}"`);

            // Check if this domain is in the allowed list
            const isAllowed = normalizedAllowedDomains.some(allowed =>
                domain === allowed || domain.includes(allowed) || allowed.includes(domain)
            );

            console.log(`Domain "${domain}" is ${isAllowed ? 'ALLOWED' : 'BLOCKED'}`);
            return !isAllowed;
        });

        if (unauthorizedLinks.length > 0) {
            console.log(`Found unauthorized link message from ${message.author || message.from}: "${message.body}"`);

            // Try to delete the message
            try {
                await message.delete(true); // true = delete for everyone
                console.log('Successfully deleted unauthorized link message');
                return true;
            } catch (deleteError) {
                console.log('Could not delete message (may not have permission), sending warning instead');

                // If we can't delete, send a warning message
                try {
                    const chat = await message.getChat();
                    const contact = await message.getContact();
                    const warningMsg = `⚠️ *Link Tidak Diizinkan* ⚠️\n\n@${contact.number} link yang Anda kirim tidak diizinkan di grup ini.\n\nLink yang diblokir: ${unauthorizedLinks.join(', ')}`;

                    await chat.sendMessage(warningMsg, {
                        mentions: [message.from]
                    });

                    console.log('Warning message sent for unauthorized link');
                } catch (warningError) {
                    console.error('Error sending warning message:', warningError);
                }

                return false; // Message wasn't deleted but was processed
            }
        }
    } catch (error) {
        console.error(`Error while checking for unauthorized links in message: ${error}`);
        return false;
    }

    return false;
};
