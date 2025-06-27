# Final Setup Instructions - Xendit Payment System

## ✅ Status: Migration Complete

Bot Lords Mobile telah berhasil dimigrasikan dari Midtrans ke Xendit! Semua file telah diupdate dan siap digunakan.

## 🚀 Quick Start (5 Langkah)

### 1. Setup Environment Variables
Update file `.env` dengan konfigurasi Xendit:

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

### 2. Start Bot Server
```bash
# Terminal 1: Start bot
npm start
# atau
node index.js
```

### 3. Start ngrok (Terminal Baru)
```bash
# Terminal 2: Start ngrok
ngrok http 3000
```

### 4. Update BASE_URL
```bash
# Copy ngrok URL (contoh: https://abc123.ngrok.io)
# Update .env file:
BASE_URL=https://abc123.ngrok.io

# Restart bot (Ctrl+C di Terminal 1, lalu npm start lagi)
```

### 5. Test Configuration
```bash
# Terminal 3: Test Xendit
node test-xendit.js

# Expected output:
# ✅ SUCCESS! Payment invoice created
# Order ID: RENT_1234567890_1234567890123
# Payment URL: https://checkout.xendit.co/web/...
```

## 🔧 Webhook Setup

### Option A: Automatic Setup
```bash
node setup-xendit-webhooks.js setup
```

### Option B: Manual Setup
1. Login ke [Xendit Dashboard](https://dashboard.xendit.co/)
2. Go to **Settings** → **Webhooks**
3. Add webhook:
   ```
   URL: https://your-ngrok-url.ngrok.io/payment/webhook/invoice
   Events: invoice.paid, invoice.expired, invoice.pending
   ```

## 🧪 Testing

### Test Payment Creation
```bash
node test-xendit.js
```

### Test Webhook Endpoints (Setelah bot running)
```bash
node test-webhook.js
```

### Test Bot Commands
```bash
# In WhatsApp group:
!rent pay 1          # Test normal payment
!promo 30 30000      # Set promo (BOT_OWNER private message)
!rent pay promo      # Test promo payment
```

## 📋 Complete Webhook URLs

**Primary Webhook (Required):**
```
https://your-ngrok-url.ngrok.io/payment/webhook/invoice
```

**Additional Webhooks (Optional):**
```
https://your-ngrok-url.ngrok.io/payment/webhook/va
https://your-ngrok-url.ngrok.io/payment/webhook/ewallet
https://your-ngrok-url.ngrok.io/payment/webhook/payment
```

**Redirect URLs:**
```
Success: https://your-ngrok-url.ngrok.io/payment/finish
Unfinish: https://your-ngrok-url.ngrok.io/payment/unfinish
Error: https://your-ngrok-url.ngrok.io/payment/error
```

**Testing & Monitoring:**
```
Test: https://your-ngrok-url.ngrok.io/payment/webhook/test
Status: https://your-ngrok-url.ngrok.io/payment/webhook/status
```

## 🎯 Payment Flow

1. **Customer:** `!rent pay 1` di grup WhatsApp
2. **Bot:** Buat invoice Xendit
3. **Customer:** Dapat link pembayaran
4. **Customer:** Pilih metode pembayaran (QRIS, E-Wallet, Bank Transfer, dll)
5. **Customer:** Bayar via Xendit
6. **Xendit:** Kirim webhook ke bot
7. **Bot:** Aktif otomatis di grup
8. **Bot:** Kirim konfirmasi ke grup dan owner

## 💳 Payment Methods Available

- 📱 **QRIS** - Universal scan & pay
- 💳 **E-Wallet** - GoPay, OVO, DANA, ShopeePay, LinkAja
- 🏦 **Bank Transfer** - BCA, BNI, BRI, Mandiri, Permata
- 🔢 **Virtual Account** - All major banks
- 🏪 **Retail Outlets** - Alfamart, Indomaret
- 💳 **Credit/Debit Cards** - Visa, Mastercard

## 🛠️ Management Commands (BOT_OWNER)

### Promo Management
```bash
# Private message to bot:
!promo 30 30000      # Set promo 30 hari Rp 30,000
!promo status        # Check promo status
!promo off           # Disable promo
```

### Group Management
```bash
!grouprent           # List all groups with status
!sendpayment all     # Send payment message to expired groups
!activate [groupId] [days] [price] [ownerName] [ownerNumber]  # Manual activation
!revenue             # Revenue statistics
!paymentlog 20       # Payment activity logs
```

## 🔍 Monitoring & Debugging

### Check Bot Status
```bash
# Check if bot is running
curl https://your-ngrok-url.ngrok.io/payment/webhook/status
```

### Monitor Logs
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

### Issue 2: "Connection refused" (ngrok error)
```bash
# Make sure bot is running first
npm start

# Then start ngrok in another terminal
ngrok http 3000
```

### Issue 3: "Payment created but bot not activated"
```bash
# Check webhook logs
tail -f bot.log | grep "webhook received"

# Manual activation
!activate [groupId] [days] [price] [ownerName] [ownerNumber]
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

## 📚 Documentation Files

- 📖 `XENDIT_SETUP_GUIDE.md` - Complete setup guide
- 🔗 `XENDIT_WEBHOOK_URLS.md` - Webhook configuration
- 🚀 `QUICK_START_XENDIT.md` - 5-minute setup guide
- 📋 `CHANGELOG_XENDIT_MIGRATION.md` - Migration details

## 🆘 Support

### Xendit Support
- **Documentation:** https://docs.xendit.co/
- **Support Email:** support@xendit.co
- **Status Page:** https://status.xendit.co/

### Bot Support
- **WhatsApp:** 0822-1121-9993 (Angga)
- **Commands:** `!help` untuk list commands

## ✅ Success Checklist

- [ ] Environment variables configured
- [ ] Bot server running (`npm start`)
- [ ] ngrok running (`ngrok http 3000`)
- [ ] BASE_URL updated in .env
- [ ] Xendit test passed (`node test-xendit.js`)
- [ ] Webhooks created in Xendit Dashboard
- [ ] Payment flow test passed (`!rent pay 1`)
- [ ] Auto-activation working

## 🎉 Ready to Use!

Sistem pembayaran Xendit sudah siap digunakan! Bot sekarang mendukung:

✅ **Multiple Payment Methods** - QRIS, E-Wallet, Bank Transfer, VA, Retail Outlets
✅ **Auto-Activation** - Bot aktif otomatis setelah pembayaran
✅ **Promo System** - Sistem promo yang fleksibel
✅ **Management Tools** - Tools lengkap untuk BOT_OWNER
✅ **Webhook Security** - Signature verification
✅ **Comprehensive Logging** - Monitoring dan debugging
✅ **User-Friendly Interface** - Modern payment experience

Selamat menggunakan sistem pembayaran Xendit yang baru! 🚀
