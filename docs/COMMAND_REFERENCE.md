# 📋 Command Reference - Bot Lords Mobile

Daftar lengkap semua command yang tersedia di Bot Lords Mobile WhatsApp.

## 🔧 Command Umum

### !help
**Deskripsi**: Menampilkan daftar semua command yang tersedia  
**Akses**: Semua user  
**Contoh**: `!help`  
**Output**: Daftar command dengan deskripsi singkat

### !ping
**Deskripsi**: Cek status bot dan waktu response  
**Akses**: Semua user  
**Contoh**: `!ping`  
**Output**: `🏓 Pong! Bot aktif. Response time: 45ms`

### !ai <pertanyaan>
**Deskripsi**: Tanya AI assistant menggunakan Google Gemini  
**Akses**: Semua user  
**Contoh**: `!ai Apa itu Lords Mobile?`  
**Output**: AI menjawab pertanyaan dengan informasi yang relevan

---

## 🎮 Command Lords Mobile

### !hell
**Deskripsi**: Info Hell Event saat ini (khusus Watcher/Chaos Dragon)  
**Akses**: Semua user  
**Contoh**: `!hell`  
**Output**: 
```
🔥 Hell Event - Watcher 🔥

⏰ Waktu: 2 jam 30 menit lagi
🎯 Target: Watcher
🏆 Reward: Speed Up, Gems
📋 Task: Kill monsters, Gather resources
```

### !hell all
**Deskripsi**: Info semua Hell Event yang aktif  
**Akses**: Semua user  
**Contoh**: `!hell all`  
**Output**: Daftar semua Hell Event yang sedang berlangsung

### !hell watcherchaos
**Deskripsi**: Info khusus Watcher dan Chaos Dragon  
**Akses**: Semua user  
**Contoh**: `!hell watcherchaos`  
**Output**: Info Hell Event Watcher/Chaos Dragon saja

### !monster
**Deskripsi**: Jadwal monster hari ini dan besok  
**Akses**: Semua user  
**Contoh**: `!monster`  
**Output**:
```
🐉 Monster Rotation 🐉

Today Monster:
Gargantua & Hardrox (time left 5h 23m)

Tomorrow Monster:
Bon Appeti & Noceros (Spawn in 17h 23m)
```

### !monster <nama>
**Deskripsi**: Cari kapan monster tertentu spawn  
**Akses**: Semua user  
**Contoh**: `!monster gargantua`  
**Output**: `Gargantua will spawn at 15 Juni 2025 (7 days 12 hours left)`

### !monster status
**Deskripsi**: Status notifikasi monster untuk grup  
**Akses**: Semua user  
**Contoh**: `!monster status`  
**Output**: `🐉 Monster Notification Status: Enabled`

### !monster on
**Deskripsi**: Aktifkan notifikasi monster harian  
**Akses**: Admin grup  
**Contoh**: `!monster on`  
**Output**: `✅ Monster notifications have been enabled for this group`

### !monster off
**Deskripsi**: Nonaktifkan notifikasi monster harian  
**Akses**: Admin grup  
**Contoh**: `!monster off`  
**Output**: `✅ Monster notifications have been disabled for this group`

---

## 👥 Command Group Management

### !tagall <pesan>
**Deskripsi**: Tag semua member grup dengan pesan  
**Akses**: Sesuai pengaturan grup (default: semua user)  
**Contoh**: `!tagall Meeting sekarang di voice chat!`  
**Output**: 
```
📢 Meeting sekarang di voice chat!

@user1
@user2
@user3
...
```

### !enablebot
**Deskripsi**: Aktifkan bot di grup  
**Akses**: Admin grup  
**Contoh**: `!enablebot`  
**Output**: `✅ Bot telah diaktifkan untuk grup ini`

### !disablebot
**Deskripsi**: Nonaktifkan bot di grup  
**Akses**: Admin grup  
**Contoh**: `!disablebot`  
**Output**: `❌ Bot telah dinonaktifkan untuk grup ini`

### !permission
**Deskripsi**: Lihat pengaturan permission grup  
**Akses**: Admin grup  
**Contoh**: `!permission`  
**Output**: Daftar permission command untuk grup

---

## 🛡️ Command Anti-Spam

### !antispam
**Deskripsi**: Lihat pengaturan anti-spam link grup  
**Akses**: Admin grup  
**Contoh**: `!antispam`  
**Output**:
```
🛡️ Pengaturan Anti-Spam Link 🛡️

Status: ✅ Aktif
Auto-block Porno: ✅ Aktif
Aksi: 🗑️ Hapus Pesan

📋 Domain yang Diizinkan:
1. fb.com
2. facebook.com
3. google.com
...
```

### !antispam on/off
**Deskripsi**: Aktifkan/nonaktifkan anti-spam link  
**Akses**: Admin grup  
**Contoh**: `!antispam on`  
**Output**: `✅ Anti-spam link telah diaktifkan untuk grup ini`

### !antispam porn on/off
**Deskripsi**: Aktifkan/nonaktifkan auto-block link porno  
**Akses**: Admin grup  
**Contoh**: `!antispam porn on`  
**Output**: `✅ Auto-block link porno telah diaktifkan`

### !antispam action delete/warn
**Deskripsi**: Set aksi untuk link yang diblokir  
**Akses**: Admin grup  
**Contoh**: `!antispam action delete`  
**Output**: `🗑️ Aksi anti-spam diubah ke hapus pesan`

### !antispam add <domain>
**Deskripsi**: Tambah domain ke whitelist  
**Akses**: Admin grup  
**Contoh**: `!antispam add example.com`  
**Output**: `✅ Domain example.com telah ditambahkan ke daftar yang diizinkan`

### !antispam remove <domain>
**Deskripsi**: Hapus domain dari whitelist  
**Akses**: Admin grup  
**Contoh**: `!antispam remove example.com`  
**Output**: `✅ Domain example.com telah dihapus dari daftar yang diizinkan`

### !antispam reset
**Deskripsi**: Reset pengaturan ke default  
**Akses**: Admin grup  
**Contoh**: `!antispam reset`  
**Output**: `🔄 Pengaturan anti-spam link telah direset ke default`

---

## ⚙️ Command Admin/Owner

### !cmd <command> <level>
**Deskripsi**: Ubah permission command  
**Akses**: Admin grup  
**Contoh**: `!cmd hell admin`  
**Output**: `✅ Permission command 'hell' diubah ke 'admin'`

**Level yang tersedia**:
- `all` - Semua user bisa menggunakan
- `admin` - Hanya admin grup yang bisa menggunakan

### !debug
**Deskripsi**: Info debug dan diagnostik bot  
**Akses**: Admin grup  
**Contoh**: `!debug`  
**Output**: Informasi teknis bot dan grup

### !restart
**Deskripsi**: Restart bot dengan delay default (30 detik)  
**Akses**: Bot owner only  
**Contoh**: `!restart`  
**Output**: `🔄 Bot akan restart dalam 30 detik...`

### !restart <detik>
**Deskripsi**: Restart bot dengan delay custom  
**Akses**: Bot owner only  
**Contoh**: `!restart 60`  
**Output**: `🔄 Bot akan restart dalam 60 detik...`

---

## 📝 Catatan Penting

### Permission Levels
- **Semua user**: Command bisa digunakan oleh siapa saja di grup
- **Admin grup**: Hanya admin WhatsApp grup yang bisa menggunakan
- **Bot owner**: Hanya nomor yang terdaftar sebagai BOT_OWNER_NUMBER

### Bot Owner Override
Bot owner bisa menggunakan semua command admin tanpa perlu menjadi admin grup.

### Command Permissions
Setiap grup bisa mengatur permission command secara terpisah menggunakan `!cmd`.

### Anti-Spam Features
- **Auto-block porn**: Deteksi otomatis link porno dengan AI
- **Domain whitelist**: Hanya domain yang diizinkan yang bisa dikirim
- **Flexible actions**: Pilih hapus pesan atau warning saja
- **Per-group settings**: Setiap grup punya pengaturan terpisah

---

*Untuk informasi lebih lanjut, lihat [dokumentasi lengkap](../README.md) atau hubungi support.*
