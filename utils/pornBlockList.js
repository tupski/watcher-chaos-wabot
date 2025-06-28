/**
 * Daftar domain dan keyword untuk memblokir link porno secara otomatis
 */

// Daftar domain yang dikenal aman (whitelist)
const SAFE_DOMAINS = [
    'google.com', 'youtube.com', 'facebook.com', 'fb.com', 'instagram.com', 'twitter.com', 'x.com',
    'tiktok.com', 'vt.tiktok.com', 'whatsapp.com', 'wa.me', 'telegram.org', 't.me',
    'github.com', 'stackoverflow.com', 'reddit.com', 'wikipedia.org', 'amazon.com',
    'netflix.com', 'spotify.com', 'apple.com', 'microsoft.com', 'linkedin.com',
    'discord.com', 'zoom.us', 'gmail.com', 'yahoo.com', 'outlook.com',
    'shopee.co.id', 'tokopedia.com', 'bukalapak.com', 'lazada.co.id', 'blibli.com',
    'detik.com', 'kompas.com', 'tribunnews.com', 'liputan6.com', 'okezone.com'
];

// Daftar domain porno yang dikenal
const PORN_DOMAINS = [
    // Adult video sites - Major ones
    'pornhub.com',
    'xvideos.com',
    'xnxx.com',
    'redtube.com',
    'youporn.com',
    'tube8.com',
    'spankbang.com',
    'xhamster.com',
    'beeg.com',
    'tnaflix.com',
    'drtuber.com',
    'sunporno.com',
    'porn.com',
    'sex.com',
    'xxx.com',
    'adult.com',

    // Premium adult sites
    'brazzers.com',
    'bangbros.com',
    'naughtyamerica.com',
    'realitykings.com',
    'mofos.com',
    'digitalplayground.com',
    'twistys.com',
    'babes.com',
    'teamskeet.com',
    'fakehub.com',

    // Other adult sites
    'eporner.com',
    'gotporn.com',
    'upornia.com',
    'txxx.com',
    'hdzog.com',
    'ok.xxx',

    // JAV sites
    'vjav.com',
    'javhd.com',
    'javmost.com',
    'javfree.me',
    'javbangers.com',
    'jav777.com',
    'javhihi.com',
    'javdoe.com',
    'javguru.com',
    'javmix.tv',
    'javporn.tv',

    // Cam sites
    'chaturbate.com',
    'myfreecams.com',
    'cam4.com',
    'bongacams.com',
    'stripchat.com',
    'camsoda.com',
    'livejasmin.com',
    'flirt4free.com',

    // Dating/hookup sites
    'adultfriendfinder.com',
    'ashley-madison.com',
    'benaughty.com',
    'fuckbook.com',
    'hookup.com',
    'sexdating.com',

    // Indonesian adult sites
    'bokep.com',
    'bokepindo.com',
    'bokepsin.com',
    'memek.com',
    'ngentot.com',
    'colmek.com'
];

// Keyword yang menunjukkan konten dewasa
const PORN_KEYWORDS = [
    // English keywords - explicit only
    'porn', 'xxx', 'adult', 'nude', 'naked', 'erotic', 'horny', 'kinky', 'fetish', 'bdsm',
    'blowjob', 'handjob', 'masturbate', 'orgasm', 'anal', 'oral', 'threesome', 'gangbang', 'bukkake',
    'escort', 'prostitute', 'brothel', 'stripper', 'hookup', 'affair', 'swinger',

    // Indonesian keywords
    'bokep', 'ngentot', 'memek', 'kontol', 'colmek', 'coli', 'onani', 'bugil', 'telanjang', 'porno',
    'mesum', 'cabul', 'birahi', 'nafsu', 'syahwat', 'lendir', 'sperma', 'orgasme', 'klimaks',
    'pelacur', 'sundal', 'lacur', 'wts', 'bo', 'open bo', 'ml', 'bercinta',

    // Body parts (explicit)
    'penis', 'vagina', 'boobs', 'tits', 'pussy', 'dick', 'cock', 'cunt',
    'payudara', 'toket', 'pantat', 'bokong', 'kemaluan', 'kelamin', 'burung', 'titit',

    // Actions (explicit)
    'fuck', 'fucking', 'fucked', 'cum', 'cumming', 'jizz', 'sperm', 'semen',
    'penetration', 'insertion', 'fingering', 'licking', 'sucking', 'deepthroat',
    'ewe', 'ewean', 'entot', 'entotan', 'colok', 'colokan', 'jilat', 'jilatan', 'isap', 'isapan',

    // Dating/hookup terms
    'one night stand', 'fwb', 'friends with benefits', 'sugar daddy', 'sugar baby',
    'janda kesepian', 'kencan dewasa', 'teman kencan'
];

/**
 * Check if a domain or URL contains pornographic content
 * @param {string} url - URL or domain to check
 * @returns {boolean} - True if contains porn content
 */
function isPornContent(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }

    const normalizedUrl = url.toLowerCase();

    // Extract domain from URL
    const domain = normalizedUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

    // First check if domain is in safe list (whitelist)
    const isSafeDomain = SAFE_DOMAINS.some(safeDomain => {
        return domain === safeDomain.toLowerCase() || domain.endsWith('.' + safeDomain.toLowerCase());
    });

    if (isSafeDomain) {
        return false; // Safe domain, not porn
    }

    // Check against known porn domains
    const isPornDomain = PORN_DOMAINS.some(pornDomain => {
        return domain === pornDomain.toLowerCase() || domain.includes(pornDomain.toLowerCase());
    });

    if (isPornDomain) {
        return true;
    }

    // Check against porn keywords in the full URL (not just domain)
    // But be more careful to avoid false positives
    const containsPornKeyword = PORN_KEYWORDS.some(keyword => {
        const keywordLower = keyword.toLowerCase();

        // Skip very common words that might cause false positives
        if (['face', 'book', 'tube', 'cam', 'bo'].includes(keywordLower)) {
            // Only match if it's a standalone word or part of obvious porn context
            const regex = new RegExp(`\\b${keywordLower}\\b|${keywordLower}(?=porn|sex|xxx)`, 'i');
            return regex.test(normalizedUrl);
        }

        // For other keywords, check if they appear in the URL
        return normalizedUrl.includes(keywordLower);
    });

    return containsPornKeyword;
}

module.exports = {
    SAFE_DOMAINS,
    PORN_DOMAINS,
    PORN_KEYWORDS,
    isPornContent
};
