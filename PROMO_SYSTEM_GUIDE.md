# Panduan Sistem Promo Bot Lords Mobile

## Overview
Sistem promo memungkinkan BOT_OWNER untuk mengatur promo khusus dengan harga diskon untuk paket tertentu. Promo akan ditampilkan di semua pesan bot yang berkaitan dengan pembayaran.

## Konfigurasi Environment

Pastikan environment variables berikut sudah diatur di file `.env`:

```env
# Midtrans Payment Gateway Configuration
MIDTRANS_MERCHANT_ID=G999832821
MIDTRANS_CLIENT_KEY=your_sandbox_client_key
MIDTRANS_SERVER_KEY=your_sandbox_server_key
MIDTRANS_IS_PRODUCTION=false
BASE_URL=http://localhost:3000

# Bot Owner Configuration
BOT_OWNER_NUMBER=your_whatsapp_number
```

## Command untuk BOT_OWNER

### 1. Mengatur Promo
**Command:** `!promo <durasi> <harga>`
**Lokasi:** Pesan pribadi ke bot (bukan di grup)
**Akses:** BOT_OWNER only

**Contoh:**
```
!promo 30 30000
```
Mengatur promo untuk paket 30 hari dengan harga Rp 30,000 (harga normal Rp 50,000)

**Paket yang tersedia:**
- 1 hari (Rp 2,000)
- 7 hari (Rp 12,000) 
- 30 hari (Rp 50,000)
- 180 hari (Rp 500,000)
- 365 hari (Rp 950,000)

### 2. Cek Status Promo
**Command:** `!promo status`

Menampilkan informasi promo yang sedang aktif:
- Durasi paket
- Harga normal vs harga promo
- Persentase diskon
- Tanggal dibuat
- Pembuat promo

### 3. Menonaktifkan Promo
**Command:** `!promo off` atau `!promo disable`

Menonaktifkan promo yang sedang aktif.

## Command untuk Customer

### Menggunakan Promo
**Command:** `!rent pay promo`
**Lokasi:** Di grup
**Akses:** Semua user

Customer dapat menggunakan promo yang sedang aktif dengan command ini. Bot akan otomatis menggunakan harga promo dan menampilkan detail penghematan.

## Tampilan Promo

### 1. Di Pesan Bot Nonaktif
Ketika bot expired atau nonaktif, pesan akan menampilkan promo di bagian atas:

```
🔥 PROMO SPESIAL!
• Paket 30 hari
• ~~Rp 50,000~~ → **Rp 30,000**
• Hemat Rp 20,000 (40%)
• Command: !rent pay promo

💰 Untuk menggunakan bot, silakan sewa:
...
```

### 2. Di Command !rent
Promo akan ditampilkan di bagian atas daftar paket:

```
💰 Paket Sewa Bot Lords Mobile

🔥 PROMO SPESIAL!
• Paket 30 hari
• ~~Rp 50,000~~ → **Rp 30,000**
• Hemat Rp 20,000 (40%)
• Command: !rent pay promo

📦 **1 Hari**
...
```

### 3. Di Pesan Pembayaran
Ketika customer menggunakan `!rent pay promo`, pesan pembayaran akan menampilkan detail promo:

```
💳 Link Pembayaran Berhasil Dibuat

🔥 PROMO SPESIAL DIGUNAKAN!

**Detail Pesanan:**
• Grup: Nama Grup
• Paket: 1 Bulan (30 Hari)
• Harga Normal: ~~Rp 50,000~~
• Harga Promo: **Rp 30,000**
• Hemat: Rp 20,000 (40%)
...
```

## Fitur Sistem Promo

### 1. Validasi Otomatis
- Harga promo harus lebih kecil dari harga normal
- Durasi harus sesuai dengan paket yang tersedia
- Hanya BOT_OWNER yang bisa mengatur promo

### 2. Tampilan Dinamis
- Promo otomatis muncul di semua pesan terkait pembayaran
- Jika tidak ada promo, pesan normal tanpa info promo
- Promo hilang otomatis setelah dinonaktifkan

### 3. Tracking & Logging
- Log aktivasi dan deaktivasi promo
- Info pembuat promo
- Timestamp pembuatan promo

## Troubleshooting

### Error Midtrans 401 Unauthorized
**Penyebab:** Konfigurasi Midtrans tidak benar
**Solusi:**
1. Pastikan `MIDTRANS_MERCHANT_ID` sudah diatur
2. Pastikan `MIDTRANS_SERVER_KEY` dan `MIDTRANS_CLIENT_KEY` benar
3. Pastikan menggunakan sandbox keys untuk testing

### Promo Tidak Muncul
**Penyebab:** Promo belum diaktifkan atau sudah expired
**Solusi:**
1. Cek status promo dengan `!promo status`
2. Aktifkan promo baru dengan `!promo <durasi> <harga>`

### Command !promo Tidak Bisa Digunakan
**Penyebab:** 
- Bukan BOT_OWNER
- Digunakan di grup (harus di pesan pribadi)

**Solusi:**
1. Pastikan nomor WhatsApp sesuai dengan `BOT_OWNER_NUMBER`
2. Kirim command di pesan pribadi ke bot, bukan di grup

## Best Practices

### 1. Pengaturan Promo
- Gunakan promo untuk paket yang ingin dipromosikan
- Berikan diskon yang menarik (20-50%)
- Aktifkan promo saat ada event khusus

### 2. Monitoring
- Cek efektivitas promo dengan `!revenue`
- Monitor conversion rate setelah promo aktif
- Nonaktifkan promo yang tidak efektif

### 3. Customer Communication
- Informasikan promo di grup-grup aktif
- Gunakan `!sendpayment all` untuk broadcast promo ke grup expired
- Berikan deadline promo untuk urgency

## Contoh Workflow

### Mengaktifkan Promo Bulanan
1. BOT_OWNER kirim pesan pribadi ke bot
2. `!promo 30 30000` (promo 30 hari Rp 30,000)
3. Bot konfirmasi promo aktif
4. Promo otomatis muncul di semua pesan pembayaran
5. Customer gunakan `!rent pay promo` untuk beli dengan harga promo
6. Monitor hasil dengan `!revenue` dan `!paymentlog`

### Menonaktifkan Promo
1. `!promo off`
2. Bot konfirmasi promo nonaktif
3. Pesan pembayaran kembali normal tanpa promo

## File Terkait

- `utils/promoSettings.js` - Core promo system
- `commands/promo.js` - Command untuk BOT_OWNER
- `commands/rent.js` - Integration dengan payment
- `handlers/rentExpiryHandler.js` - Promo di pesan expired
- `handlers/groupJoinHandler.js` - Promo di pesan trial used
- `commands/sendpayment.js` - Promo di broadcast payment

## Data Storage

Promo settings disimpan di `data/promoSettings.json`:
```json
{
  "isActive": true,
  "duration": 30,
  "originalPrice": 50000,
  "promoPrice": 30000,
  "createdAt": "2025-01-XX...",
  "createdBy": "BOT_OWNER_NAME"
}
```

File ini otomatis dibuat saat promo pertama kali diaktifkan.
