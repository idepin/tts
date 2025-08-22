# Troubleshooting Google OAuth Login

Jika login Google tidak berfungsi, ikuti langkah-langkah berikut:

## 1. Setup Google Cloud Console

### Buat OAuth 2.0 Credentials:
1. Pergi ke [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang sudah ada
3. Enable Google+ API atau Google Identity API
4. Pergi ke "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Application type: "Web application"
6. Authorized redirect URIs: `https://okcnpfkinsedpqpkuomg.supabase.co/auth/v1/callback`

## 2. Setup Supabase Dashboard

### Konfigurasi Google Provider:
1. Login ke [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Pergi ke Authentication → Providers
4. Enable Google provider
5. Masukkan Client ID dan Client Secret dari Google Cloud Console
6. Site URL: `http://localhost:3000` (untuk development)
7. Redirect URLs: `http://localhost:3000/auth/callback`

## 3. Verifikasi Environment Variables

Pastikan `.env.local` berisi:
```
NEXT_PUBLIC_SUPABASE_URL=https://okcnpfkinsedpqpkuomg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 4. Testing & Debug

### Development Mode:
- Gunakan tombol "Bypass Auth (Dev Only)" untuk testing tanpa auth
- Check browser console untuk error messages
- Restart development server setelah perubahan .env

### Error Messages:
- "Provider not enabled" → Enable Google di Supabase
- "Invalid client" → Check Client ID/Secret
- "Redirect URI mismatch" → Check redirect URIs

## 5. Common Issues:

### Domain Mismatch:
- Development: `http://localhost:3000`
- Production: Ganti dengan domain actual

### Client ID/Secret:
- Pastikan tidak ada trailing spaces
- Copy ulang dari Google Cloud Console

### Supabase Project:
- Pastikan project aktif dan tidak suspended
- Check billing status jika menggunakan features premium

## 6. Alternative Testing:

Jika Google OAuth masih bermasalah:
1. Gunakan email/password login (sudah tersedia di form)
2. Gunakan development bypass button
3. Test dengan provider lain (GitHub, Facebook, etc.)

## 7. Browser Console Debugging:

Buka Developer Tools → Console untuk melihat:
- Network requests ke Supabase
- Error messages dari auth
- Redirect flow

Restart development server setelah perubahan konfigurasi!
