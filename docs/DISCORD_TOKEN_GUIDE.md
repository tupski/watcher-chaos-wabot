# Discord Token Setup Guide

## Apa itu DISCORD_TOKEN?

`DISCORD_TOKEN` adalah token autentikasi bot Discord yang memungkinkan aplikasi Anda terhubung ke Discord. Token ini bersifat rahasia dan harus dijaga keamanannya.

## Cara Mendapatkan DISCORD_TOKEN

### Langkah 1: Buat Aplikasi Discord
1. Kunjungi [Discord Developer Portal](https://discord.com/developers/applications)
2. Klik tombol **"New Application"**
3. Berikan nama untuk aplikasi Anda (contoh: "Hell Event Watcher")
4. Klik **"Create"**

### Langkah 2: Buat Bot
1. Di sidebar kiri, klik **"Bot"**
2. Klik tombol **"Add Bot"**
3. Konfirmasi dengan klik **"Yes, do it!"**

### Langkah 3: Dapatkan Token
1. Di bagian **"Token"**, klik tombol **"Copy"** untuk menyalin token
2. Simpan token ini dengan aman
3. Tambahkan ke file `.env` Anda:
   ```
   DISCORD_TOKEN=your_token_here
   ```

### Langkah 4: Aktifkan Privileged Intents
1. Scroll ke bawah ke bagian **"Privileged Gateway Intents"**
2. Aktifkan **"MESSAGE CONTENT INTENT"**
3. Klik **"Save Changes"**

### Langkah 5: Undang Bot ke Server
1. Di sidebar kiri, klik **"OAuth2"** > **"URL Generator"**
2. Di bagian **"Scopes"**, pilih **"bot"**
3. Di bagian **"Bot Permissions"**, pilih:
   - Read Messages/View Channels
   - Send Messages
   - Read Message History
4. Salin URL yang dihasilkan dan buka di browser
5. Pilih server dan klik **"Authorize"**

## ⚠️ Keamanan Token

- **JANGAN** bagikan token Anda kepada siapa pun
- **JANGAN** commit token ke repository publik
- Jika token bocor, segera regenerate token baru di Discord Developer Portal
- Gunakan file `.env` untuk menyimpan token secara aman

## Troubleshooting

### Error: "An invalid token was provided"
- Pastikan token disalin dengan benar tanpa spasi tambahan
- Pastikan tidak ada karakter tambahan di awal atau akhir token
- Coba regenerate token baru jika masalah berlanjut

### Error: "Used disallowed intents"
- Pastikan MESSAGE CONTENT INTENT sudah diaktifkan di Discord Developer Portal
- Tunggu beberapa menit setelah mengaktifkan intent sebelum mencoba lagi

### Bot tidak merespons pesan
- Pastikan bot sudah diundang ke server dengan permissions yang tepat
- Pastikan DISCORD_CHANNEL_ID di .env sesuai dengan channel yang diinginkan
- Periksa console untuk error messages
