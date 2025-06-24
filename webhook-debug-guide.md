# Webhook Debugging Guide - Xendit

## 🔍 Problem Analysis

Payment successful but no webhook received by bot:
- ✅ Payment Status: Success
- ✅ Reference: PROMO_120363364063161357_1749406160119
- ❌ Bot not activated automatically

## 🛠️ Step-by-Step Fix

### 1. Check Xendit Dashboard Webhook Settings

**Login to Xendit Dashboard:**
1. Go to [Xendit Dashboard](https://dashboard.xendit.co/)
2. Navigate to **Settings** → **Webhooks**

**Required Webhook Configuration:**
```
Webhook URL: https://your-ngrok-url.ngrok.io/payment/webhook/invoice
Events to Enable:
✅ invoice.paid
✅ invoice.expired  
✅ invoice.pending
✅ invoice.created (optional)

HTTP Method: POST
Content Type: application/json
```

### 2. Check Webhook Delivery Status

**In Xendit Dashboard:**
1. Go to **Transactions** → Find your transaction
2. Click on transaction details
3. Look for **Webhook Delivery** section
4. Check delivery status and any error messages

**Common Issues:**
- ❌ Webhook URL not reachable
- ❌ Wrong webhook URL format
- ❌ Webhook events not enabled
- ❌ Signature verification failed

### 3. Verify ngrok and Bot Status

**Check if bot is running:**
```bash
# Test bot endpoint
curl https://your-ngrok-url.ngrok.io/payment/webhook/status

# Expected response:
{
  "status": "OK",
  "message": "Webhook endpoints are active",
  "endpoints": {...}
}
```

**Check ngrok status:**
```bash
# In ngrok terminal, look for incoming requests
# Should show webhook attempts from Xendit
```

### 4. Test Webhook Manually

**Simulate webhook with actual transaction data:**
```bash
node test-webhook.js invoice paid
```

**Or test with curl:**
```bash
curl -X POST https://your-ngrok-url.ngrok.io/payment/webhook/invoice \
  -H "Content-Type: application/json" \
  -H "x-callback-token: your_webhook_token" \
  -d '{
    "id": "test-invoice-id",
    "external_id": "PROMO_120363364063161357_1749406160119",
    "status": "PAID",
    "amount": 100,
    "paid_at": "2025-01-11T18:11:00.000Z",
    "metadata": {
      "group_id": "120363364063161357@g.us",
      "duration": "30",
      "owner_id": "test@test.com",
      "is_promo": "true"
    }
  }'
```

### 5. Manual Activation (Temporary Fix)

**If webhook still not working, activate manually:**
```bash
# In WhatsApp (BOT_OWNER):
!activate 120363364063161357@g.us 30 30000 "Customer Name" "081234567890"
```

## 🔧 Xendit Dashboard Configuration

### Required Webhook Settings

**Webhook URL Format:**
```
https://your-ngrok-url.ngrok.io/payment/webhook/invoice
```

**Events to Enable:**
- ✅ `invoice.paid` - When invoice is successfully paid
- ✅ `invoice.expired` - When invoice expires
- ✅ `invoice.pending` - When payment is pending
- ❌ `invoice.created` - Optional (not needed for activation)

**Security Settings:**
- ✅ Enable webhook signature verification
- ✅ Set webhook verification token (same as XENDIT_WEBHOOK_TOKEN in .env)

### Alternative Webhook URLs

**If main webhook doesn't work, try:**
```
Primary: /payment/webhook/invoice
Alternative: /payment/notification (legacy)
Test: /payment/webhook/test
```

## 🐛 Common Issues & Solutions

### Issue 1: Webhook URL Not Reachable
**Symptoms:** Xendit shows delivery failed
**Solutions:**
1. Make sure bot is running (`npm start`)
2. Make sure ngrok is running (`ngrok http 3000`)
3. Update webhook URL in Xendit Dashboard
4. Test URL accessibility: `curl https://your-ngrok-url.ngrok.io/payment/webhook/status`

### Issue 2: Wrong Event Configuration
**Symptoms:** Webhook delivered but bot doesn't respond
**Solutions:**
1. Enable `invoice.paid` event in Xendit Dashboard
2. Check webhook payload format
3. Verify event handling in bot code

### Issue 3: Signature Verification Failed
**Symptoms:** Webhook received but returns 401 error
**Solutions:**
1. Check `XENDIT_WEBHOOK_TOKEN` in .env
2. Verify token matches Xendit Dashboard
3. Check signature verification code

### Issue 4: Metadata Missing
**Symptoms:** Webhook processed but group not found
**Solutions:**
1. Check external_id format: `PROMO_groupId_timestamp`
2. Verify metadata structure in webhook payload
3. Check group ID extraction logic

## 🔍 Debugging Commands

### Check Bot Logs
```bash
# Monitor webhook processing
tail -f bot.log | grep "Xendit"

# Check for webhook errors
tail -f bot.log | grep "webhook"

# Monitor payment processing
tail -f bot.log | grep "payment"
```

### Test Webhook Endpoints
```bash
# Test all endpoints
node test-webhook.js

# Test specific endpoint
node test-webhook.js invoice paid

# Check webhook status
curl https://your-ngrok-url.ngrok.io/payment/webhook/status
```

### Verify Environment
```bash
# Check environment variables
node -e "
require('dotenv').config();
console.log('BASE_URL:', process.env.BASE_URL);
console.log('WEBHOOK_TOKEN:', process.env.XENDIT_WEBHOOK_TOKEN ? 'SET' : 'NOT SET');
console.log('SECRET_KEY:', process.env.XENDIT_SECRET_KEY ? 'SET' : 'NOT SET');
"
```

## 📱 Quick Fix Steps

### Immediate Solution
1. **Manual Activation:**
   ```
   !activate 120363364063161357@g.us 30 30000 "Customer Name" "Customer Number"
   ```

2. **Check Webhook Setup:**
   ```bash
   node setup-xendit-webhooks.js list
   ```

3. **Re-setup Webhooks:**
   ```bash
   node setup-xendit-webhooks.js setup
   ```

### Long-term Solution
1. **Fix webhook configuration in Xendit Dashboard**
2. **Verify ngrok URL is accessible**
3. **Test webhook delivery**
4. **Monitor future transactions**

## 📞 Support

**If issues persist:**
1. **Check Xendit Dashboard** → Webhooks → Delivery logs
2. **Contact Xendit Support:** support@xendit.co
3. **Bot Support:** 0822-1121-9993 (Angga)

**Provide this info when asking for help:**
- Transaction Reference: PROMO_120363364063161357_1749406160119
- Webhook URL: https://your-ngrok-url.ngrok.io/payment/webhook/invoice
- Error logs from bot console
- Webhook delivery status from Xendit Dashboard
