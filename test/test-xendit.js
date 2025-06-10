require('dotenv').config();
const { createPaymentTransaction } = require('./utils/xenditPayment');

async function testXendit() {
    console.log('Testing Xendit Configuration...\n');
    
    // Check environment variables
    console.log('Environment Variables:');
    console.log('XENDIT_SECRET_KEY:', process.env.XENDIT_SECRET_KEY ? 'SET' : 'NOT SET');
    console.log('XENDIT_PUBLIC_KEY:', process.env.XENDIT_PUBLIC_KEY ? 'SET' : 'NOT SET');
    console.log('XENDIT_WEBHOOK_TOKEN:', process.env.XENDIT_WEBHOOK_TOKEN ? 'SET' : 'NOT SET');
    console.log('XENDIT_IS_PRODUCTION:', process.env.XENDIT_IS_PRODUCTION);
    console.log('BASE_URL:', process.env.BASE_URL);
    console.log('');
    
    // Test payment creation
    const testGroupId = '1234567890@g.us';
    const testGroupName = 'Test Group';
    const testOwnerInfo = {
        name: 'Test User',
        number: '081234567890',
        id: 'test@test.com'
    };
    const testDuration = 1; // 1 day
    
    console.log('Creating test payment invoice...');
    console.log('Group ID:', testGroupId);
    console.log('Duration:', testDuration, 'days');
    console.log('');
    
    try {
        const result = await createPaymentTransaction(
            testGroupId,
            testGroupName,
            testOwnerInfo,
            testDuration
        );
        
        if (result.success) {
            console.log('✅ SUCCESS! Payment invoice created');
            console.log('Order ID:', result.orderId);
            console.log('Invoice ID:', result.invoiceId);
            console.log('Payment URL:', result.paymentUrl);
            console.log('Price:', 'Rp', result.pricing.price.toLocaleString('id-ID'));
            console.log('Expiry Date:', result.expiryDate);
        } else {
            console.log('❌ FAILED! Error creating payment invoice');
            console.log('Error:', result.error);
        }
        
    } catch (error) {
        console.log('❌ EXCEPTION! Unexpected error');
        console.log('Error:', error.message);
        console.log('Stack:', error.stack);
    }
}

// Run test
testXendit().then(() => {
    console.log('\nTest completed.');
    process.exit(0);
}).catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
