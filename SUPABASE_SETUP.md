# Setup Autentikasi Supabase

Aplikasi Teka-Teki Silang ini sekarang menggunakan autentikasi Supabase dengan dukungan login Google.

## Setup yang diperlukan:

### 1. Buat Project Supabase
- Kunjungi [supabase.com](https://supabase.com)
- Buat project baru
- Catat URL project dan anon key

### 2. Konfigurasi Google OAuth
Di dashboard Supabase:
- Pergi ke Authentication > Providers
- Enable Google provider
- Tambahkan Client ID dan Client Secret dari Google Cloud Console

### 3. Environment Variables
Update file `.env.local` dengan nilai yang benar:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Google Cloud Console Setup
- Buat project di Google Cloud Console
- Enable Google+ API
- Buat OAuth 2.0 credentials
- Tambahkan redirect URI: `https://your-project.supabase.co/auth/v1/callback`

## Fitur Autentikasi:

### ✅ Yang sudah diimplementasi:
- Login dengan email/password
- Login dengan Google OAuth
- Middleware untuk melindungi route `/gameplay`
- Auto-redirect ke `/auth` jika belum login
- Auto-redirect ke `/gameplay` jika sudah login
- Logout functionality
- User info display
- Loading states

### 🔒 Protected Routes:
- `/gameplay` - Memerlukan login
- `/admin` - Terbuka (bisa ditambahkan proteksi jika diperlukan)

### 🔓 Public Routes:
- `/auth` - Halaman login
- `/` - Homepage (jika ada)

## Komponen yang ditambahkan:

1. **AuthContext** - Context untuk manajemen state autentikasi
2. **LoginForm** - Form login dengan Google OAuth dan email/password
3. **ProtectedRoute** - HOC untuk melindungi route
4. **Middleware** - Route protection di level server
5. **User Header** - Display user info dan logout button

## Testing:

Untuk testing lokal tanpa setup Supabase penuh, Anda bisa:
1. Comment middleware di `src/middleware.ts`
2. Comment ProtectedRoute wrapper di gameplay
3. Atau setup Supabase sesuai instruksi di atas
