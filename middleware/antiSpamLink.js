// middleware/antiSpamLink.js
module.exports = async (message, allowedLinks) => {
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    const links = message.body.match(linkRegex);

    if (links && links.some(link => !allowedLinks.some(allowed => link.includes(allowed)))) {
        console.log(`Deleting unauthorized link message from ${message.author || message.from}: "${message.body}"`);
        await message.delete(); // Hapus pesan
        return true; // Tanda bahwa pesan telah dihapus
    }
    return false; // Pesan aman, tidak dihapus
};
