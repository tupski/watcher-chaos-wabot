require('dotenv').config();

/**
 * Manual activation script for successful Xendit payments
 * Use this when webhook doesn't work but payment is successful
 */

// Extract group info from reference number
function parseReference(reference) {
    // Format: PROMO_groupId_timestamp atau RENT_groupId_timestamp
    const parts = reference.split('_');
    
    if (parts.length < 3) {
        throw new Error('Invalid reference format. Expected: PROMO_groupId_timestamp or RENT_groupId_timestamp');
    }
    
    const type = parts[0]; // PROMO or RENT
    const groupId = parts[1] + '@g.us'; // Add WhatsApp group suffix
    const timestamp = parts[2];
    
    return {
        type,
        groupId,
        timestamp,
        isPromo: type === 'PROMO'
    };
}

// Get duration from promo or rent type
function getDurationFromType(type, amount) {
    // Standard pricing
    const pricing = {
        2000: 1,    // 1 day
        12000: 7,   // 1 week
        50000: 30,  // 1 month
        500000: 180, // 6 months
        950000: 365  // 1 year
    };
    
    // Check if it's a standard price
    if (pricing[amount]) {
        return pricing[amount];
    }
    
    // For promo prices, assume common durations
    if (type === 'PROMO') {
        if (amount <= 5000) return 1;
        if (amount <= 15000) return 7;
        if (amount <= 60000) return 30;
        if (amount <= 600000) return 180;
        return 365;
    }
    
    // Default to 1 day if can't determine
    return 1;
}

// Manual activation function
async function manualActivatePayment(reference, amount, customerName = 'Customer', customerNumber = '081234567890') {
    try {
        console.log('🔧 Manual Payment Activation\n');
        console.log('Reference:', reference);
        console.log('Amount: IDR', amount);
        console.log('Customer:', customerName);
        console.log('Number:', customerNumber);
        console.log('');
        
        // Parse reference to get group info
        const paymentInfo = parseReference(reference);
        console.log('Parsed Payment Info:');
        console.log('- Type:', paymentInfo.type);
        console.log('- Group ID:', paymentInfo.groupId);
        console.log('- Is Promo:', paymentInfo.isPromo);
        console.log('- Timestamp:', new Date(parseInt(paymentInfo.timestamp)).toLocaleString());
        console.log('');
        
        // Determine duration
        const duration = getDurationFromType(paymentInfo.type, amount);
        console.log('Determined Duration:', duration, 'days');
        console.log('');
        
        // Import required modules
        const { setRentMode } = require('./utils/groupSettings');
        
        // Calculate expiry date
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + duration);
        
        // Activate rental
        const success = setRentMode(paymentInfo.groupId, 'active', expiryDate);
        
        if (success) {
            console.log('✅ Rental Activated Successfully!');
            console.log('- Group ID:', paymentInfo.groupId);
            console.log('- Duration:', duration, 'days');
            console.log('- Expiry Date:', expiryDate.toLocaleDateString('id-ID'), expiryDate.toLocaleTimeString('id-ID'));
            console.log('- Amount Paid: IDR', amount);
            console.log('');
            
            // Generate activation command for WhatsApp
            console.log('📱 WhatsApp Activation Command:');
            console.log(`!activate ${paymentInfo.groupId} ${duration} ${amount} "${customerName}" "${customerNumber}"`);
            console.log('');
            
            // Log payment for records
            const paymentLog = {
                timestamp: new Date().toISOString(),
                reference: reference,
                groupId: paymentInfo.groupId,
                duration: duration,
                amount: amount,
                customer: {
                    name: customerName,
                    number: customerNumber
                },
                type: paymentInfo.isPromo ? 'promo' : 'normal',
                method: 'manual_activation',
                status: 'success'
            };
            
            console.log('💾 Payment Log Entry:');
            console.log(JSON.stringify(paymentLog, null, 2));
            
            // Save to payment log file
            const fs = require('fs');
            const path = require('path');
            const logFile = path.join(__dirname, 'data', 'payment_logs.json');
            
            try {
                // Ensure data directory exists
                const dataDir = path.dirname(logFile);
                if (!fs.existsSync(dataDir)) {
                    fs.mkdirSync(dataDir, { recursive: true });
                }
                
                // Load existing logs
                let logs = [];
                if (fs.existsSync(logFile)) {
                    const data = fs.readFileSync(logFile, 'utf8');
                    logs = JSON.parse(data);
                }
                
                // Add new log
                logs.push(paymentLog);
                
                // Keep only last 1000 logs
                if (logs.length > 1000) {
                    logs = logs.slice(-1000);
                }
                
                // Save logs
                fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
                console.log('✅ Payment logged successfully');
                
            } catch (error) {
                console.log('⚠️  Could not save payment log:', error.message);
            }
            
        } else {
            console.log('❌ Failed to activate rental');
            console.log('Please check group ID and try again');
        }
        
    } catch (error) {
        console.error('❌ Error during manual activation:', error.message);
        console.log('');
        console.log('💡 Usage:');
        console.log('node manual-activate-payment.js <reference> <amount> [customerName] [customerNumber]');
        console.log('');
        console.log('Example:');
        console.log('node manual-activate-payment.js PROMO_120363364063161357_1749406160119 100 "John Doe" "081234567890"');
    }
}

// Command line interface
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log('🔧 Manual Payment Activation Tool\n');
        console.log('Usage:');
        console.log('node manual-activate-payment.js <reference> <amount> [customerName] [customerNumber]');
        console.log('');
        console.log('Parameters:');
        console.log('- reference: Transaction reference from Xendit (e.g., PROMO_120363364063161357_1749406160119)');
        console.log('- amount: Payment amount in IDR (e.g., 100)');
        console.log('- customerName: Customer name (optional, default: "Customer")');
        console.log('- customerNumber: Customer WhatsApp number (optional, default: "081234567890")');
        console.log('');
        console.log('Example:');
        console.log('node manual-activate-payment.js PROMO_120363364063161357_1749406160119 100 "John Doe" "081234567890"');
        console.log('');
        console.log('For your current transaction:');
        console.log('node manual-activate-payment.js PROMO_120363364063161357_1749406160119 100');
        return;
    }
    
    const reference = args[0];
    const amount = parseInt(args[1]);
    const customerName = args[2] || 'Customer';
    const customerNumber = args[3] || '081234567890';
    
    if (isNaN(amount) || amount <= 0) {
        console.log('❌ Invalid amount. Please provide a valid number.');
        return;
    }
    
    await manualActivatePayment(reference, amount, customerName, customerNumber);
}

// Run the script
main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
});
