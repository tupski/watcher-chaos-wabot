const fs = require('fs');
const path = require('path');

// File to store promo settings
const promoFile = path.join(__dirname, '..', 'data', 'promoSettings.json');

// Default promo settings
const defaultPromoSettings = {
    isActive: false,
    duration: null, // in days
    originalPrice: null,
    promoPrice: null,
    createdAt: null,
    createdBy: null
};

// Load promo settings from file
function loadPromoSettings() {
    try {
        if (fs.existsSync(promoFile)) {
            const data = fs.readFileSync(promoFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading promo settings:', error);
    }
    return { ...defaultPromoSettings };
}

// Save promo settings to file
function savePromoSettings(settings) {
    try {
        // Ensure data directory exists
        const dataDir = path.dirname(promoFile);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        fs.writeFileSync(promoFile, JSON.stringify(settings, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving promo settings:', error);
        return false;
    }
}

// Get current promo settings
function getPromoSettings() {
    return loadPromoSettings();
}

// Set promo
function setPromo(duration, promoPrice, createdBy) {
    try {
        // Get original price from pricing
        const { PRICING } = require('./xenditPayment');
        const originalPrice = PRICING[duration.toString()]?.price;
        
        if (!originalPrice) {
            return { success: false, error: 'Durasi tidak valid' };
        }
        
        if (promoPrice >= originalPrice) {
            return { success: false, error: 'Harga promo harus lebih kecil dari harga normal' };
        }
        
        const promoSettings = {
            isActive: true,
            duration: duration,
            originalPrice: originalPrice,
            promoPrice: promoPrice,
            createdAt: new Date().toISOString(),
            createdBy: createdBy
        };
        
        const success = savePromoSettings(promoSettings);
        
        if (success) {
            console.log(`Promo activated: ${duration} days - Rp ${promoPrice} (was Rp ${originalPrice}) by ${createdBy}`);
            return { success: true, promo: promoSettings };
        } else {
            return { success: false, error: 'Gagal menyimpan pengaturan promo' };
        }
        
    } catch (error) {
        console.error('Error setting promo:', error);
        return { success: false, error: error.message };
    }
}

// Disable promo
function disablePromo(disabledBy) {
    try {
        const promoSettings = {
            ...defaultPromoSettings,
            disabledAt: new Date().toISOString(),
            disabledBy: disabledBy
        };
        
        const success = savePromoSettings(promoSettings);
        
        if (success) {
            console.log(`Promo disabled by ${disabledBy}`);
            return { success: true };
        } else {
            return { success: false, error: 'Gagal menyimpan pengaturan promo' };
        }
        
    } catch (error) {
        console.error('Error disabling promo:', error);
        return { success: false, error: error.message };
    }
}

// Check if promo is active for specific duration
function isPromoActive(duration) {
    const promo = getPromoSettings();
    return promo.isActive && promo.duration === parseInt(duration);
}

// Get promo price for specific duration
function getPromoPrice(duration) {
    const promo = getPromoSettings();
    if (promo.isActive && promo.duration === parseInt(duration)) {
        return {
            hasPromo: true,
            originalPrice: promo.originalPrice,
            promoPrice: promo.promoPrice,
            savings: promo.originalPrice - promo.promoPrice
        };
    }
    return { hasPromo: false };
}

// Generate promo message
function generatePromoMessage() {
    const promo = getPromoSettings();
    
    if (!promo.isActive) {
        return '';
    }
    
    const savings = promo.originalPrice - promo.promoPrice;
    const discountPercent = Math.round((savings / promo.originalPrice) * 100);
    
    return `>🔥 *PROMO SPESIAL!*\n` +
           `• Paket ${promo.duration} hari\n` +
           `• ~~Rp ${promo.originalPrice.toLocaleString('id-ID')}~~ → **Rp ${promo.promoPrice.toLocaleString('id-ID')}**\n` +
           `• Hemat Rp ${savings.toLocaleString('id-ID')} (${discountPercent}%)\n` +
           `• Command: \`*!rent pay promo*\`\n\n`;
}

// Get promo info for display
function getPromoInfo() {
    const promo = getPromoSettings();
    
    if (!promo.isActive) {
        return null;
    }
    
    const savings = promo.originalPrice - promo.promoPrice;
    const discountPercent = Math.round((savings / promo.originalPrice) * 100);
    
    return {
        duration: promo.duration,
        originalPrice: promo.originalPrice,
        promoPrice: promo.promoPrice,
        savings: savings,
        discountPercent: discountPercent,
        createdAt: promo.createdAt,
        createdBy: promo.createdBy
    };
}

module.exports = {
    getPromoSettings,
    setPromo,
    disablePromo,
    isPromoActive,
    getPromoPrice,
    generatePromoMessage,
    getPromoInfo
};
