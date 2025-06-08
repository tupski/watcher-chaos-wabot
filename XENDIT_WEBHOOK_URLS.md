# Xendit Webhook URLs Configuration

## Overview

Bot Lords Mobile menyediakan berbagai webhook endpoints untuk menerima notifikasi dari Xendit. Setiap endpoint dirancang untuk menangani jenis event tertentu dengan optimal.

## Available Webhook Endpoints

### 1. Primary Invoice Webhook (Recommended)
```
POST /payment/webhook/invoice
```

**Purpose:** Menangani semua event terkait invoice
**Events:** `invoice.paid`, `invoice.expired`, `invoice.pending`
**Usage:** Primary webhook untuk semua pembayaran invoice

### 2. Payment Method Specific Webhooks

#### Virtual Account Webhook
```
POST /payment/webhook/va
```
**Events:** `virtual_account.paid`, `virtual_account.expired`

#### E-Wallet Webhook
```
POST /payment/webhook/ewallet
```
**Events:** `ewallet.payment.paid`, `ewallet.payment.failed`

#### General Payment Webhook
```
POST /payment/webhook/payment
```
**Events:** `payment.paid`, `payment.succeeded`, `payment.failed`

### 3. Development & Testing

#### Test Webhook
```
POST /payment/webhook/test
```
**Purpose:** Testing webhook delivery tanpa processing
**Response:** JSON dengan data yang diterima

#### Status Check
```
GET /payment/webhook/status
```
**Purpose:** Monitoring status webhook endpoints
**Response:** List semua endpoints dan server info

### 4. Legacy Support
```
POST /payment/notification
```
**Purpose:** Backward compatibility (redirects ke invoice webhook)

## Complete URL Setup

### Development (ngrok)
```
Base URL: https://your-ngrok-url.ngrok.io

Primary Webhook:
https://your-ngrok-url.ngrok.io/payment/webhook/invoice

Alternative Webhooks:
https://your-ngrok-url.ngrok.io/payment/webhook/va
https://your-ngrok-url.ngrok.io/payment/webhook/ewallet
https://your-ngrok-url.ngrok.io/payment/webhook/payment

Testing:
https://your-ngrok-url.ngrok.io/payment/webhook/test
https://your-ngrok-url.ngrok.io/payment/webhook/status

Redirect URLs:
https://your-ngrok-url.ngrok.io/payment/finish
https://your-ngrok-url.ngrok.io/payment/unfinish
https://your-ngrok-url.ngrok.io/payment/error
```

### Production
```
Base URL: https://yourdomain.com

Primary Webhook:
https://yourdomain.com/payment/webhook/invoice

Alternative Webhooks:
https://yourdomain.com/payment/webhook/va
https://yourdomain.com/payment/webhook/ewallet
https://yourdomain.com/payment/webhook/payment

Testing:
https://yourdomain.com/payment/webhook/test
https://yourdomain.com/payment/webhook/status

Redirect URLs:
https://yourdomain.com/payment/finish
https://yourdomain.com/payment/unfinish
https://yourdomain.com/payment/error
```

## Xendit Dashboard Configuration

### 1. Login ke Xendit Dashboard
1. Kunjungi [Xendit Dashboard](https://dashboard.xendit.co/)
2. Login dengan akun Anda
3. Go to **Settings** → **Webhooks**

### 2. Add Webhook URLs

#### Primary Setup (Recommended)
```
Webhook URL: https://your-domain.com/payment/webhook/invoice
Events to Enable:
- invoice.paid
- invoice.expired
- invoice.pending
```

#### Advanced Setup (Optional)
Jika ingin webhook terpisah per payment method:

**Virtual Account:**
```
URL: https://your-domain.com/payment/webhook/va
Events: virtual_account.paid, virtual_account.expired
```

**E-Wallet:**
```
URL: https://your-domain.com/payment/webhook/ewallet
Events: ewallet.payment.paid, ewallet.payment.failed
```

### 3. Webhook Security
```
Verification Token: your_webhook_verification_token
HTTP Method: POST
Content Type: application/json
```

## Testing Webhooks

### 1. Test Webhook Delivery
```bash
# Test basic connectivity
curl -X GET https://your-domain.com/payment/webhook/status

# Test webhook endpoint
curl -X POST https://your-domain.com/payment/webhook/test \
  -H "Content-Type: application/json" \
  -H "x-callback-token: your_webhook_token" \
  -d '{"test": "data"}'
```

### 2. Test with ngrok
```bash
# Terminal 1: Start bot
node index.js

# Terminal 2: Start ngrok
ngrok http 3000

# Copy ngrok URL dan setup di Xendit Dashboard
# Test payment: !rent pay 1
```

### 3. Webhook Event Testing
```bash
# Simulate invoice paid event
curl -X POST https://your-domain.com/payment/webhook/invoice \
  -H "Content-Type: application/json" \
  -H "x-callback-token: your_webhook_token" \
  -d '{
    "id": "test-invoice-id",
    "external_id": "RENT_1234567890_1234567890",
    "status": "PAID",
    "amount": 2000,
    "paid_at": "2025-01-01T12:00:00.000Z",
    "metadata": {
      "group_id": "1234567890@g.us",
      "duration": "1",
      "owner_id": "test@test.com"
    }
  }'
```

## Webhook Event Handling

### 1. Invoice Events
```javascript
// invoice.paid
{
  "id": "64f12345678901234567890a",
  "external_id": "RENT_1234567890_1234567890",
  "status": "PAID",
  "amount": 2000,
  "paid_at": "2025-01-01T12:00:00.000Z",
  "metadata": {
    "group_id": "1234567890@g.us",
    "duration": "1",
    "owner_id": "test@test.com"
  }
}
```

### 2. Virtual Account Events
```javascript
// virtual_account.paid
{
  "id": "va_64f12345678901234567890a",
  "external_id": "RENT_1234567890_1234567890",
  "bank_code": "BCA",
  "account_number": "1234567890",
  "amount": 2000,
  "transaction_timestamp": "2025-01-01T12:00:00.000Z"
}
```

### 3. E-Wallet Events
```javascript
// ewallet.payment.paid
{
  "id": "ew_64f12345678901234567890a",
  "external_id": "RENT_1234567890_1234567890",
  "ewallet_type": "GOPAY",
  "amount": 2000,
  "transaction_timestamp": "2025-01-01T12:00:00.000Z"
}
```

## Monitoring & Debugging

### 1. Check Webhook Status
```bash
curl https://your-domain.com/payment/webhook/status
```

Response:
```json
{
  "status": "OK",
  "message": "Webhook endpoints are active",
  "endpoints": {
    "invoice": "/payment/webhook/invoice",
    "payment": "/payment/webhook/payment",
    "virtual_account": "/payment/webhook/va",
    "ewallet": "/payment/webhook/ewallet",
    "test": "/payment/webhook/test"
  },
  "timestamp": "2025-01-01T12:00:00.000Z",
  "server_info": {
    "base_url": "https://your-domain.com",
    "environment": "development"
  }
}
```

### 2. Bot Logs
```bash
# Monitor webhook processing
tail -f bot.log | grep "Xendit"

# Check specific webhook events
tail -f bot.log | grep "webhook received"
```

### 3. Xendit Dashboard
1. Go to **Transactions** → **Webhooks**
2. Check delivery status
3. View retry attempts
4. Debug failed deliveries

## Security Best Practices

### 1. Webhook Signature Verification
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(rawBody, signature) {
  const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN;
  const computedSignature = crypto
    .createHmac('sha256', webhookToken)
    .update(rawBody)
    .digest('hex');
  
  return signature === computedSignature;
}
```

### 2. HTTPS Only
- Always use HTTPS untuk production
- Xendit akan reject HTTP webhooks di production
- Use valid SSL certificate

### 3. Rate Limiting
```javascript
// Implement rate limiting untuk webhook endpoints
const rateLimit = require('express-rate-limit');

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many webhook requests'
});

router.use('/webhook', webhookLimiter);
```

## Troubleshooting

### Issue 1: Webhook Not Received
**Causes:**
- Wrong URL di Xendit Dashboard
- Server not running
- Firewall blocking requests

**Solutions:**
1. Check URL di Xendit Dashboard
2. Test dengan `curl` ke webhook endpoint
3. Check server logs
4. Verify ngrok/domain accessibility

### Issue 2: Signature Verification Failed
**Causes:**
- Wrong webhook token
- Body parsing issues
- Header missing

**Solutions:**
1. Check `XENDIT_WEBHOOK_TOKEN` di .env
2. Verify `x-callback-token` header
3. Check raw body parsing

### Issue 3: Payment Not Activating
**Causes:**
- Metadata parsing error
- Group ID mismatch
- Database error

**Solutions:**
1. Check webhook payload logs
2. Verify metadata structure
3. Manual activate dengan `!activate`

## Quick Setup Checklist

- [ ] Setup ngrok atau domain
- [ ] Update `.env` dengan Xendit credentials
- [ ] Start bot server
- [ ] Add webhook URL di Xendit Dashboard
- [ ] Enable required events
- [ ] Test webhook dengan `curl`
- [ ] Test payment flow dengan `!rent pay 1`
- [ ] Verify auto-activation
- [ ] Monitor logs untuk errors

Dengan webhook URLs yang lengkap ini, sistem pembayaran bot akan berjalan dengan optimal dan reliable! 🚀
