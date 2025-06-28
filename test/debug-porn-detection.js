const { isPornContent, PORN_DOMAINS, PORN_KEYWORDS } = require('../utils/pornBlockList');

console.log('🔍 Debugging Porn Detection for facebook.com\n');

const testUrl = 'https://facebook.com';
console.log(`Testing URL: ${testUrl}`);

// Step by step debugging
const normalizedUrl = testUrl.toLowerCase();
console.log(`Normalized URL: ${normalizedUrl}`);

const domain = normalizedUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
console.log(`Extracted domain: ${domain}`);

// Check against porn domains
console.log('\n📋 Checking against porn domains:');
const matchingPornDomains = PORN_DOMAINS.filter(pornDomain => {
    const matches = domain === pornDomain.toLowerCase() || domain.includes(pornDomain.toLowerCase());
    if (matches) {
        console.log(`  ❌ Matches porn domain: ${pornDomain}`);
    }
    return matches;
});

if (matchingPornDomains.length === 0) {
    console.log('  ✅ No matching porn domains');
}

// Check against keywords
console.log('\n📋 Checking against keywords:');
const matchingKeywords = PORN_KEYWORDS.filter(keyword => {
    const keywordLower = keyword.toLowerCase();
    
    // Skip very common words that might cause false positives
    if (['face', 'book', 'tube', 'cam'].includes(keywordLower)) {
        // Only match if it's a standalone word or part of obvious porn context
        const regex = new RegExp(`\\b${keywordLower}\\b|${keywordLower}(?=porn|sex|xxx)`, 'i');
        const matches = regex.test(normalizedUrl);
        if (matches) {
            console.log(`  ❌ Matches keyword (special): ${keyword} (regex: ${regex})`);
        }
        return matches;
    }
    
    // For other keywords, check if they appear in the URL
    const matches = normalizedUrl.includes(keywordLower);
    if (matches) {
        console.log(`  ❌ Matches keyword: ${keyword}`);
    }
    return matches;
});

if (matchingKeywords.length === 0) {
    console.log('  ✅ No matching keywords');
}

console.log(`\n🎯 Final result: ${isPornContent(testUrl) ? '🚫 PORN' : '✅ SAFE'}`);

// Test other URLs for comparison
console.log('\n📋 Testing other URLs for comparison:');
const testUrls = [
    'https://google.com',
    'https://youtube.com', 
    'https://pornhub.com',
    'https://facebook.com',
    'https://fb.com'
];

testUrls.forEach(url => {
    console.log(`${url} -> ${isPornContent(url) ? '🚫 PORN' : '✅ SAFE'}`);
});
