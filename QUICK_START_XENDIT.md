# Quick Start: Xendit Payment Setup

## 🚀 Complete Setup in 5 Minutes

### Step 1: Environment Setup
```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env file dengan Xendit credentials
nano .env
```

**Required Environment Variables:**
```env
# Xendit Configuration
XENDIT_SECRET_KEY=xnd_development_your_secret_key_here
XENDIT_PUBLIC_KEY=xnd_public_development_your_public_key_here
XENDIT_WEBHOOK_TOKEN=your_webhook_verification_token
XENDIT_IS_PRODUCTION=false

# Server Configuration
BASE_URL=https://your-ngrok-url.ngrok.io
PORT=3000

# Bot Configuration
BOT_OWNER_NUMBER=6281234567890
```

### Step 2: Install Dependencies
```bash
npm install xendit-node
```

### Step 3: Start Development Server
```bash
# Terminal 1: Start bot
node index.js

# Terminal 2: Start ngrok
ngrok http 3000
```

### Step 4: Update BASE_URL
```bash
# Copy ngrok URL (example: https://abc123.ngrok.io)
# Update .env file:
BASE_URL=https://abc123.ngrok.io

# Restart bot
# Ctrl+C then node index.js
```

### Step 5: Setup Webhooks (Automatic)
```bash
# Setup webhooks automatically
node setup-xendit-webhooks.js setup
```

**Expected Output:**
```
✅ Created webhook: Bot Lords Mobile - Invoice Events
   URL: https://abc123.ngrok.io/payment/webhook/invoice
   ID: wh_abc123...
   Status: ACTIVE
   Events: invoice.paid, invoice.expired, invoice.pending
```

### Step 6: Test Configuration
```bash
# Test Xendit configuration
node test-xendit.js

# Test webhook endpoints
node test-webhook.js
```

### Step 7: Test Payment Flow
```bash
# In WhatsApp group:
!rent pay 1

# Expected: Payment link generated successfully
```

## 🛠️ Manual Webhook Setup (Alternative)

If automatic setup fails, setup manually in Xendit Dashboard:

### 1. Login to Xendit Dashboard
- Go to [Xendit Dashboard](https://dashboard.xendit.co/)
- Login dengan akun Anda

### 2. Add Webhook URLs
**Settings → Webhooks → Add Webhook**

**Primary Webhook (Required):**
```
URL: https://your-ngrok-url.ngrok.io/payment/webhook/invoice
Events: invoice.paid, invoice.expired, invoice.pending
```

**Optional Webhooks:**
```
Virtual Account: https://your-ngrok-url.ngrok.io/payment/webhook/va
E-Wallet: https://your-ngrok-url.ngrok.io/payment/webhook/ewallet
```

### 3. Webhook Security
```
Verification Token: your_webhook_verification_token
HTTP Method: POST
Content Type: application/json
```

## 🧪 Testing Commands

### Test Configuration
```bash
# Test Xendit API connection
node test-xendit.js

# Expected output:
# ✅ SUCCESS! Payment invoice created
# Order ID: RENT_1234567890_1234567890123
# Payment URL: https://checkout.xendit.co/web/...
```

### Test Webhooks
```bash
# Test all webhook endpoints
node test-webhook.js

# Test specific webhook
node test-webhook.js invoice paid
node test-webhook.js va paid
node test-webhook.js ewallet paid
```

### Test Bot Commands
```bash
# In WhatsApp group:
!rent pay 1          # Test normal payment
!promo 30 30000      # Set promo (BOT_OWNER private message)
!rent pay promo      # Test promo payment
!rent status         # Check rental status
```

## 🔍 Monitoring & Debugging

### Check Webhook Status
```bash
# Check if webhooks are active
curl https://your-ngrok-url.ngrok.io/payment/webhook/status
```

### Monitor Bot Logs
```bash
# Monitor webhook processing
tail -f bot.log | grep "Xendit"

# Monitor payment creation
tail -f bot.log | grep "Creating Xendit invoice"
```

### Check Xendit Dashboard
1. **Transactions** → View all payments
2. **Webhooks** → Check delivery status
3. **API Logs** → Debug API calls

## ⚠️ Troubleshooting

### Issue 1: "XENDIT_SECRET_KEY not found"
```bash
# Check environment variables
node -e "require('dotenv').config(); console.log('Secret Key:', process.env.XENDIT_SECRET_KEY ? 'SET' : 'NOT SET')"

# Solution: Add correct secret key to .env file
```

### Issue 2: "Webhook endpoint not accessible"
```bash
# Test webhook connectivity
curl https://your-ngrok-url.ngrok.io/payment/webhook/status

# Solutions:
# 1. Make sure bot is running (node index.js)
# 2. Make sure ngrok is running (ngrok http 3000)
# 3. Update BASE_URL in .env with correct ngrok URL
```

### Issue 3: "Payment created but bot not activated"
```bash
# Check webhook logs
tail -f bot.log | grep "webhook received"

# Manual activation
!activate [groupId] [days] [price] [ownerName] [ownerNumber]
```

### Issue 4: "Invalid webhook signature"
```bash
# Check webhook token
echo $XENDIT_WEBHOOK_TOKEN

# Solution: Make sure XENDIT_WEBHOOK_TOKEN matches Xendit Dashboard
```

## 📱 Production Deployment

### 1. Get Production Keys
```env
XENDIT_SECRET_KEY=xnd_production_your_secret_key
XENDIT_PUBLIC_KEY=xnd_public_production_your_public_key
XENDIT_IS_PRODUCTION=true
BASE_URL=https://yourdomain.com
```

### 2. Update Webhooks
```bash
# Update BASE_URL in .env
# Re-run webhook setup
node setup-xendit-webhooks.js setup
```

### 3. Test Production
```bash
# Test with small amount first
!rent pay 1

# Monitor transactions in Xendit Dashboard
```

## 🎯 Success Checklist

- [ ] ✅ Environment variables configured
- [ ] ✅ Dependencies installed
- [ ] ✅ Bot server running
- [ ] ✅ ngrok running (development)
- [ ] ✅ BASE_URL updated
- [ ] ✅ Webhooks created in Xendit
- [ ] ✅ Configuration test passed
- [ ] ✅ Webhook test passed
- [ ] ✅ Payment flow test passed
- [ ] ✅ Auto-activation working

## 🆘 Need Help?

### Documentation
- 📖 `XENDIT_SETUP_GUIDE.md` - Complete setup guide
- 🔗 `XENDIT_WEBHOOK_URLS.md` - Webhook configuration
- 📋 `CHANGELOG_XENDIT_MIGRATION.md` - Migration details

### Support
- **Xendit Support:** support@xendit.co
- **Bot Support:** 0822-1121-9993 (Angga)
- **Documentation:** https://docs.xendit.co/

### Quick Commands Reference
```bash
# Setup
node setup-xendit-webhooks.js setup

# Test
node test-xendit.js
node test-webhook.js

# Monitor
node setup-xendit-webhooks.js list
curl https://your-domain.com/payment/webhook/status

# Debug
tail -f bot.log | grep "Xendit"
```

Dengan mengikuti quick start ini, sistem pembayaran Xendit akan berjalan dalam 5 menit! 🚀
