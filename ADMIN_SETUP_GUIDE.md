# SETUP ADMIN SYSTEM - INSTRUKSI LENGKAP

## 🎯 Sistem Baru: Admin vs Player

**KONSEP:**
- ✅ **Admin**: Bisa create/edit/delete crossword games & questions
- ✅ **Player**: Cuma bisa view & main crossword
- ✅ **Keamanan**: RLS melindungi data, admin required untuk manage

## 📋 LANGKAH SETUP

### 1. Jalankan Setup Admin SQL
1. Buka **Supabase Dashboard** → **SQL Editor**
2. Copy paste file `setup-admin-system.sql`
3. **PENTING**: Ganti email di baris ini:
   ```sql
   WHERE email = 'your-email@example.com'  -- GANTI DENGAN EMAIL ANDA!
   ```
4. Klik **RUN**

### 2. Verifikasi Setup
Setelah run SQL, cek di **Table Editor**:
- Table `crossword_games` ✅
- Table `crossword_questions` ✅  
- Table `user_roles` ✅ (baru)

### 3. Test Admin Access
1. Login ke aplikasi dengan email yang sudah di-set sebagai admin
2. Masuk ke Question Manager
3. Lihat status **👑 Admin** di pojok kanan atas
4. Semua button Save/Import seharusnya aktif

## 🔧 Cara Tambah Admin Baru

```sql
-- Ganti 'new-admin@example.com' dengan email admin baru
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'new-admin@example.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

## 🔍 Troubleshooting

### "Only admins can create games"
**Solusi:**
1. Cek status di Question Manager - harus ada **👑 Admin**
2. Jika masih **👤 Player**, berarti email di SQL belum sesuai
3. Run SQL untuk set admin lagi dengan email yang benar

### "User is not admin" di console
**Penyebab:** Email di SQL tidak cocok dengan email login
**Solusi:** Double check email di Supabase Auth users vs SQL

### Button Save/Import disabled
**Normal jika:** User bukan admin
**Solusi:** Set user jadi admin dulu dengan SQL

## 📊 Check Siapa Saja Admin

```sql
SELECT 
    u.email,
    ur.role,
    ur.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY ur.role DESC, u.created_at;
```

## 🎮 Flow Kerja Normal

1. **Admin** login → bisa manage di Question Manager
2. **Admin** create/edit crossword questions  
3. **Admin** save to Supabase
4. **Players** login → bisa main di Gameplay (auto load dari Supabase)
5. **Players** tidak bisa akses Question Manager atau cuma read-only

## 🔄 Migration dari System Lama

Jika punya data di localStorage:
1. Login sebagai **Admin**
2. Click **"Import from Local Storage"**
3. Data otomatis pindah ke Supabase
4. Semua players bisa main data yang sama

**Selesai!** 🎉
