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

    const linkRegex = /(https?:\/\/[^\s]+)/g;
    const links = message.body.match(linkRegex);

    if (!links) {
        console.log('No links found in message, skipping link check');
        return false;
    }

    try {
        const unauthorizedLinks = links.filter(link => !allowedLinks.some(allowed => link.includes(allowed)));
        if (unauthorizedLinks.length > 0) {
            console.log(`Deleting unauthorized link message from ${message.author || message.from}: "${message.body}"`);
            await message.delete();
            return true;
        }
    } catch (error) {
        console.error(`Error while checking for unauthorized links in message: ${error}`);
        return false;
    }

    return false;
};
