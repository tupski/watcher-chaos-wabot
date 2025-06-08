# Xendit Payment Gateway Setup Guide

## Overview

Bot Lords Mobile sekarang menggunakan **Xendit** sebagai payment gateway menggantikan Midtrans. Xendit menyediakan berbagai metode pembayaran yang populer di Indonesia.

## Keuntungan Xendit

### 1. Metode Pembayaran Lengkap
- **QRIS** - Scan & Pay universal
- **E-Wallet** - GoPay, OVO, DANA, ShopeePay, LinkAja
- **Bank Transfer** - BCA, BNI, BRI, Mandiri, Permata
- **Virtual Account** - Semua bank major
- **Retail Outlets** - Alfamart, Indomaret
- **Credit/Debit Cards** - Visa, Mastercard

### 2. Fitur Unggulan
- Invoice system yang user-friendly
- WhatsApp notifications otomatis
- Email notifications
- Dashboard yang mudah digunakan
- Settlement yang cepat
- Fee yang kompetitif

## Setup Xendit Account

### 1. Daftar Akun Xendit
1. Kunjungi [Xendit Dashboard](https://dashboard.xendit.co/)
2. Daftar akun baru atau login
3. Lengkapi verifikasi bisnis
4. Aktifkan test mode untuk development

### 2. Dapatkan API Keys
1. Login ke Xendit Dashboard
2. Go to **Settings** → **API Keys**
3. Copy keys berikut:
   - **Secret Key** (untuk server-side)
   - **Public Key** (untuk client-side, optional)
   - **Webhook Verification Token** (untuk webhook security)

### 3. Environment Configuration

Update file `.env` dengan konfigurasi Xendit:

```env
# Xendit Payment Gateway Configuration
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

## Webhook Setup

### 1. Webhook URLs
Setup webhook di Xendit Dashboard:

**Development (ngrok):**
```
Invoice Paid: https://your-ngrok-url.ngrok.io/payment/notification
Invoice Expired: https://your-ngrok-url.ngrok.io/payment/notification
```

**Production:**
```
Invoice Paid: https://yourdomain.com/payment/notification
Invoice Expired: https://yourdomain.com/payment/notification
```

### 2. Webhook Events
Enable events berikut di Xendit Dashboard:
- `invoice.paid` - Invoice berhasil dibayar
- `invoice.expired` - Invoice kadaluarsa
- `invoice.pending` - Invoice menunggu pembayaran

## Testing

### 1. Test Configuration
```bash
node test-xendit.js
```

Expected output:
```
✅ SUCCESS! Payment invoice created
Order ID: RENT_1234567890_1234567890123
Invoice ID: 64f12345678901234567890a
Payment URL: https://checkout.xendit.co/web/64f12345678901234567890a
Price: Rp 2,000
Expiry Date: 2025-01-XX...
```

### 2. Test Bot Payment
```bash
# Start bot
node index.js

# In WhatsApp group:
!rent pay 1
```

### 3. Test Promo System
```bash
# BOT_OWNER private message:
!promo 30 30000

# In group:
!rent pay promo
```

## Payment Flow

### 1. Customer Journey
1. Customer ketik `!rent pay 1` di grup
2. Bot buat invoice Xendit
3. Customer dapat link pembayaran
4. Customer pilih metode pembayaran
5. Customer bayar via Xendit
6. Xendit kirim webhook ke bot
7. Bot aktif otomatis di grup

### 2. Webhook Processing
1. Xendit kirim webhook ke `/payment/notification`
2. Bot verify webhook signature
3. Bot process payment status
4. Bot activate rental jika paid
5. Bot kirim konfirmasi ke grup dan owner

## Xendit vs Midtrans

| Feature | Xendit | Midtrans |
|---------|--------|----------|
| QRIS | ✅ Universal | ✅ Limited |
| E-Wallet | ✅ 5 providers | ✅ 4 providers |
| Retail Outlets | ✅ Alfamart, Indomaret | ❌ |
| WhatsApp Notifications | ✅ Built-in | ❌ |
| Invoice UI | ✅ Modern | ✅ Standard |
| Setup Complexity | ✅ Simple | ❌ Complex |
| Documentation | ✅ Excellent | ✅ Good |

## Production Checklist

### 1. Switch to Production
```env
XENDIT_SECRET_KEY=xnd_production_your_secret_key
XENDIT_PUBLIC_KEY=xnd_public_production_your_public_key
XENDIT_IS_PRODUCTION=true
BASE_URL=https://yourdomain.com
```

### 2. Webhook Security
- Enable webhook signature verification
- Use HTTPS for all endpoints
- Implement rate limiting
- Monitor webhook delivery

### 3. Testing Production
1. Test dengan amount kecil
2. Verify webhook delivery
3. Check settlement di dashboard
4. Monitor error logs

## Troubleshooting

### Issue 1: Invalid API Key
**Error:** `API key is invalid`
**Solution:**
1. Check API key format: `xnd_development_...` atau `xnd_production_...`
2. Verify key di Xendit Dashboard
3. Pastikan tidak ada extra spaces

### Issue 2: Webhook Not Received
**Causes:**
- Wrong webhook URL
- Webhook not enabled
- Firewall blocking

**Solutions:**
1. Check webhook URL di Xendit Dashboard
2. Enable required webhook events
3. Test webhook dengan ngrok
4. Check bot logs

### Issue 3: Payment Not Activating Bot
**Causes:**
- Webhook signature verification failed
- Metadata parsing error
- Group ID mismatch

**Solutions:**
1. Check webhook logs
2. Verify signature verification
3. Check metadata in webhook payload
4. Manual activate dengan `!activate`

## Monitoring

### 1. Xendit Dashboard
- Monitor transactions
- Check webhook delivery status
- Review settlement reports
- Track payment methods usage

### 2. Bot Logs
```bash
# Monitor webhook processing
tail -f bot.log | grep "Xendit"

# Check payment creation
tail -f bot.log | grep "Creating Xendit invoice"
```

### 3. Commands untuk Monitoring
```bash
# Check revenue
!revenue

# Check payment logs
!paymentlog 20

# Check group status
!grouprent
```

## Support

### Xendit Support
- **Documentation:** https://docs.xendit.co/
- **Support Email:** support@xendit.co
- **Status Page:** https://status.xendit.co/

### Bot Support
- **WhatsApp:** 0822-1121-9993 (Angga)
- **Commands:** `!help` untuk list commands
- **Logs:** Check console untuk detailed errors

## Quick Start

```bash
# 1. Install dependencies
npm install xendit-node

# 2. Setup environment
cp .env.example .env
# Edit .env dengan Xendit keys

# 3. Test configuration
node test-xendit.js

# 4. Start bot
node index.js

# 5. Test payment
# Di WhatsApp grup: !rent pay 1
```

Dengan Xendit, sistem pembayaran bot menjadi lebih stabil, user-friendly, dan mendukung lebih banyak metode pembayaran populer di Indonesia! 🚀
