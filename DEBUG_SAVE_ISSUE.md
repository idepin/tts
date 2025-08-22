# DEBUG: Save to Supabase Issue

## 🔍 Step-by-Step Troubleshooting

### 1. Pastikan Database Setup Sudah Benar
1. Buka Supabase dashboard: https://supabase.com/dashboard
2. Pilih project Anda
3. Klik "SQL Editor" di sidebar
4. Pastikan sudah menjalankan `setup-admin-system.sql` 
5. **PENTING**: Ganti email di line 95 dengan email Anda yang sebenarnya!

### 2. Cek Console Browser untuk Error
1. Buka aplikasi di browser: http://localhost:3000
2. Login dengan akun Anda
3. Tekan F12 untuk buka Developer Tools
4. Klik tab "Console"
5. Pergi ke halaman admin atau Question Manager
6. Klik tombol "🔧 Test Database" 
7. Lihat output di console

### 3. Expected Console Output (Sukses)
```
🔍 Checking admin status...
✅ User authenticated: [user-id] [your-email]
✅ Role found: admin
🔍 Testing database connection...
✅ Auth check passed: [user-id] [your-email]
✅ Admin status: true
✅ Database read test passed, found X games
✅ Database insert test passed
```

### 4. Common Error Scenarios

#### Error A: "No role found for user"
**Cause**: User belum ada di table `user_roles`
**Solution**: 
1. Pastikan email di `setup-admin-system.sql` line 95 benar
2. Jalankan ulang SQL tersebut di Supabase SQL Editor

#### Error B: "Insert error: new row violates row-level security"
**Cause**: RLS policies tidak mengizinkan user untuk insert
**Solution**:
1. Cek apakah user sudah jadi admin
2. Jalankan query ini di SQL Editor untuk cek:
   ```sql
   SELECT u.email, ur.role 
   FROM auth.users u 
   LEFT JOIN user_roles ur ON u.id = ur.user_id 
   WHERE u.email = 'your-email@example.com';
   ```

#### Error C: "Auth error" atau "Not authenticated"
**Cause**: User belum login atau session expired
**Solution**: Login ulang di aplikasi

### 5. Manual Database Check
Jalankan query ini di Supabase SQL Editor:
```sql
-- 1. Cek user di auth table
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Cek user_roles table
SELECT 
    ur.role,
    u.email,
    ur.created_at
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
ORDER BY ur.created_at DESC;

-- 3. Cek RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('crossword_games', 'crossword_questions', 'user_roles');

-- 4. Test admin function
SELECT is_admin('[your-user-id]');
```

### 6. Quick Fix Commands
Jika masih bermasalah, jalankan ini di SQL Editor:

```sql
-- Reset user sebagai admin (ganti email!)
DELETE FROM user_roles WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);

INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'your-email@example.com';

-- Verifikasi
SELECT u.email, ur.role 
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'your-email@example.com';
```

### 7. Last Resort: Reset Everything
```sql
-- DANGER: This will delete all data!
DROP TABLE IF EXISTS crossword_questions CASCADE;
DROP TABLE IF EXISTS crossword_games CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- Then run setup-admin-system.sql again
```

## 🎯 Next Steps
1. Follow steps 1-3 above
2. Report console output here
3. Try the test database button in app
4. Check if admin status shows "👑 Admin" in UI
