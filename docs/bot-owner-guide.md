# Panduan BOT_OWNER - Kontrol Bot WhatsApp

## Deskripsi
Panduan lengkap untuk BOT_OWNER mengelola bot WhatsApp di multiple grup melalui pesan pribadi.

## Fitur Utama
- **Multi-grup Management**: Kelola bot di beberapa grup sekaligus
- **Kontrol via Pesan Pribadi**: Semua kontrol bisa dilakukan dari chat pribadi dengan bot
- **Sistem Sewa**: Aktifkan/nonaktifkan mode sewa dengan durasi tertentu
- **Enable/Disable Bot**: Kontrol status bot per grup
- **Monitoring Real-time**: Lihat status semua grup secara real-time

## Command Utama

### 1. Command !groups (Rekomendasi)
Command yang paling user-friendly untuk mengelola semua grup.

#### Melihat Semua Grup
```
!groups
```
Menampilkan daftar semua grup dengan nomor urut, status bot, dan mode sewa.

#### Melihat Detail Grup Spesifik
```
!groups <nomor>
```
Contoh: `!groups 1` - Melihat detail grup nomor 1

#### Mengaktifkan Bot di Grup
```
!groups <nomor> enable
```
Contoh: `!groups 1 enable` - Aktifkan bot di grup nomor 1

#### Menonaktifkan Bot di Grup
```
!groups <nomor> disable
```
Contoh: `!groups 1 disable` - Nonaktifkan bot di grup nomor 1

#### Mengaktifkan Mode Sewa
```
!groups <nomor> sewa <durasi>
```
Contoh:
- `!groups 1 sewa 30d` - Aktifkan sewa 30 hari
- `!groups 1 sewa 08072025` - Aktifkan sewa sampai 8 Juli 2025

#### Menonaktifkan Mode Sewa
```
!groups <nomor> rentoff
```
Contoh: `!groups 1 rentoff` - Nonaktifkan mode sewa di grup nomor 1

### 2. Command !botowner (Advanced)
Command untuk kontrol menggunakan Group ID langsung.

#### Melihat Bantuan
```
!botowner
```

#### Melihat Semua Grup
```
!botowner list
```

#### Melihat Status Grup
```
!botowner status <groupId>
```
Contoh: `!botowner status 120363364063161357`

#### Mengaktifkan/Menonaktifkan Bot
```
!botowner enable <groupId>
!botowner disable <groupId>
```

#### Mengatur Mode Sewa
```
!botowner sewa <groupId> <durasi>
!botowner rentoff <groupId>
```

## Format Durasi Sewa

### Format Hari (Rekomendasi)
- `7d` = 7 hari dari sekarang
- `30d` = 30 hari dari sekarang
- `90d` = 90 hari dari sekarang

### Format Tanggal Spesifik
- `08072025` = Sampai tanggal 8 Juli 2025
- `31122025` = Sampai tanggal 31 Desember 2025

## Status dan Legend

### Status Bot
- ✅ = Bot Aktif (merespon command)
- ❌ = Bot Nonaktif (tidak merespon command)

### Mode Operasi
- 🆓 = Mode Normal (bot aktif permanen)
- 🔄 = Mode Sewa Aktif (bot aktif dengan batas waktu)
- ⏰ = Mode Sewa Expired (bot nonaktif karena sewa habis)

## Workflow Penggunaan

### Skenario 1: Melihat Status Semua Grup
1. Kirim `!groups` ke bot via pesan pribadi
2. Bot akan menampilkan daftar semua grup dengan status
3. Catat nomor grup yang ingin dikelola

### Skenario 2: Mengaktifkan Bot di Grup Baru
1. Kirim `!groups` untuk melihat daftar grup
2. Kirim `!groups <nomor> enable` untuk mengaktifkan bot
3. Bot akan konfirmasi aktivasi

### Skenario 3: Mengatur Sewa untuk Klien
1. Kirim `!groups` untuk melihat daftar grup
2. Kirim `!groups <nomor> sewa 30d` untuk mengaktifkan sewa 30 hari
3. Bot akan konfirmasi aktivasi sewa dengan detail expiry

### Skenario 4: Menonaktifkan Bot Sementara
1. Kirim `!groups <nomor> disable` untuk nonaktifkan bot
2. Bot akan berhenti merespon command di grup tersebut
3. Untuk mengaktifkan kembali: `!groups <nomor> enable`

## Fitur Otomatis

### Auto-Disable Saat Sewa Habis
- Bot otomatis nonaktif saat masa sewa habis
- Mengirim notifikasi ke grup tentang expiry
- Menampilkan pesan promosi untuk perpanjang sewa

### Notifikasi ke BOT_OWNER
- Notifikasi saat pembayaran berhasil
- Notifikasi saat bot diaktifkan/dinonaktifkan
- Reminder sebelum sewa habis

### Pesan Promosi Otomatis
- Saat bot nonaktif, akan tampil pesan promosi
- Berisi info paket sewa dan cara pembayaran
- Otomatis update sesuai promo yang aktif

## Tips Penggunaan

### 1. Gunakan Command !groups
Command `!groups` lebih mudah digunakan karena menggunakan nomor urut, tidak perlu mengingat Group ID yang panjang.

### 2. Monitor Status Berkala
Cek status semua grup secara berkala dengan `!groups` untuk memastikan semua berjalan normal.

### 3. Set Reminder
Catat tanggal expiry sewa klien untuk follow-up perpanjang sebelum habis.

### 4. Backup Group ID
Simpan Group ID penting sebagai backup jika diperlukan kontrol manual via `!botowner`.

## Troubleshooting

### Bot Tidak Merespon di Grup
1. Cek status bot dengan `!groups`
2. Pastikan bot aktif (✅) bukan nonaktif (❌)
3. Jika mode sewa, pastikan belum expired
4. Aktifkan dengan `!groups <nomor> enable`

### Sewa Tidak Aktif Setelah Pembayaran
1. Cek status dengan `!groups <nomor>`
2. Jika perlu, aktifkan manual dengan `!groups <nomor> sewa <durasi>`
3. Cek log pembayaran di dashboard

### Group Tidak Muncul di Daftar
1. Pastikan bot sudah diundang ke grup
2. Pastikan bot sudah pernah menerima pesan di grup
3. Restart bot jika diperlukan

## Keamanan

### Akses BOT_OWNER
- Hanya nomor yang terdaftar di `BOT_OWNER_NUMBER` yang bisa menggunakan command ini
- Semua aktivitas BOT_OWNER dicatat di log
- Command ini bisa digunakan dari pesan pribadi maupun grup

### Override Permission
- BOT_OWNER bisa menggunakan semua command admin meskipun bukan admin grup
- BOT_OWNER bisa mengaktifkan/menonaktifkan bot meskipun bot sedang nonaktif
- BOT_OWNER memiliki akses penuh ke semua fitur

## Integrasi dengan Dashboard
- Semua perubahan via command akan tersinkron dengan dashboard web
- Log aktivitas BOT_OWNER tersimpan di database
- Status grup bisa dipantau juga via dashboard web

---

**Catatan**: Panduan ini untuk BOT_OWNER yang mengelola bot WhatsApp untuk multiple grup dengan sistem sewa. Pastikan environment variable `BOT_OWNER_NUMBER` sudah dikonfigurasi dengan benar.
