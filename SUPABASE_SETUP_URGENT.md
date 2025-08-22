# ⚠️ URGENT: Setup Admin System - Save to Supabase Gagal!

## Status Masalah Saat Ini:
- ❌ Save to Supabase gagal meskipun user login
- ❌ Email di setup-admin-system.sql masih `'your-email@example.com'` 
- ❌ User belum di-set sebagai admin di database
- ❌ SQL setup belum dijalankan

## SOLUSI CEPAT - Ikuti Langkah Ini:

### 1. ⚠️ PENTING: Ganti Email di setup-admin-system.sql
**File**: `setup-admin-system.sql` **Line 95**

```sql
-- GANTI DARI:
WHERE email = 'your-email@example.com'  -- GANTI INI!

-- MENJADI (gunakan email yang Anda pakai login):
WHERE email = 'ervin@example.com'  -- Ganti dengan email Anda!
```

### 2. Jalankan SQL di Supabase Dashboard
1. Login ke [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda  
3. Klik **SQL Editor** di sidebar
4. Copy SELURUH isi file `setup-admin-system.sql`
5. Paste dan klik **Run**

### 3. Verifikasi Setup Berhasil
Output harus menunjukkan:
```
email               | role  | created_at
your-email@xxx.com  | admin | 2025-08-22 10:30:00
```

### 4. Test di Aplikasi
1. Refresh halaman aplikasi
2. Status harus muncul "👑 Admin" 
3. Button "💾 Save to Supabase" harus enabled
4. Klik "🔧 Test Database" untuk cek koneksi

---

## 🚨 Apakah RLS Policies Wajib?

**JAWABAN: YA, SANGAT WAJIB!** 

Tanpa RLS Policies:
- ❌ Semua user bisa lihat data crossword orang lain
- ❌ User A bisa edit/hapus game milik User B
- ❌ Data tidak aman dan bisa bocor

Dengan RLS Policies:
- ✅ User hanya bisa lihat game mereka sendiri
- ✅ Data aman dan private
- ✅ Multi-user support yang proper

### 🚀 SETUP CEPAT (Copy-Paste Sekali Jalan)

Buka **SQL Editor** di Supabase dan jalankan ini **SEKALI SAJA**:

### 🚀 SETUP CEPAT (Copy-Paste Sekali Jalan)

Buka **SQL Editor** di Supabase dan jalankan ini **SEKALI SAJA**:

```sql
-- LANGKAH 1: Buat Tabel + RLS (All-in-One)
CREATE TABLE IF NOT EXISTS crossword_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'Teka-Teki Silang',
    description TEXT,
    grid_size INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS crossword_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES crossword_games(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    answer TEXT NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('horizontal', 'vertical')),
    start_row INTEGER NOT NULL,
    start_col INTEGER NOT NULL,
    length INTEGER NOT NULL,
    UNIQUE(game_id, question_number)
);

-- LANGKAH 2: Enable RLS + Policies (Keamanan)
ALTER TABLE crossword_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossword_questions ENABLE ROW LEVEL SECURITY;

-- Policies untuk crossword_games (pisah per operasi)
CREATE POLICY "Users can insert their own games" ON crossword_games 
    FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can select their own games" ON crossword_games 
    FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can update their own games" ON crossword_games 
    FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own games" ON crossword_games 
    FOR DELETE USING (auth.uid() = created_by);

-- Policies untuk crossword_questions
CREATE POLICY "Users can insert questions for their games" ON crossword_questions 
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM crossword_games WHERE crossword_games.id = crossword_questions.game_id AND crossword_games.created_by = auth.uid())
    );
CREATE POLICY "Users can select questions for their games" ON crossword_questions 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM crossword_games WHERE crossword_games.id = crossword_questions.game_id AND crossword_games.created_by = auth.uid())
    );
CREATE POLICY "Users can update questions for their games" ON crossword_questions 
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM crossword_games WHERE crossword_games.id = crossword_questions.game_id AND crossword_games.created_by = auth.uid())
    );
CREATE POLICY "Users can delete questions for their games" ON crossword_questions 
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM crossword_games WHERE crossword_games.id = crossword_questions.game_id AND crossword_games.created_by = auth.uid())
    );

-- LANGKAH 3: Indexes untuk Performance
CREATE INDEX IF NOT EXISTS idx_games_user ON crossword_games(created_by);
CREATE INDEX IF NOT EXISTS idx_questions_game ON crossword_questions(game_id);
```

**✅ SELESAI!** Cuma perlu jalankan sekali, langsung beres semua.
**✅ SELESAI!** Cuma perlu jalankan sekali, langsung beres semua.

### 🔧 Test Setelah Setup
1. Klik tab **Table Editor** - pastikan ada 2 tabel
2. Login ke aplikasi Anda
3. Masuk ke Question Manager  
4. Klik **"Test Database"** - harus sukses
5. Klik **"Save to Supabase"** - harus berhasil!

## 🆘 Kalau Masih Error

### "new row violates row-level security policy"
**Penyebab:** Policy untuk INSERT belum benar  
**Solusi Cepat:** Jalankan SQL ini untuk fix policy:

```sql
-- Drop policy lama yang bermasalah
DROP POLICY IF EXISTS "Users manage their own games" ON crossword_games;
DROP POLICY IF EXISTS "Users manage their own questions" ON crossword_questions;

-- Buat policy baru yang benar
CREATE POLICY "Users can insert their own games" ON crossword_games 
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can manage their existing games" ON crossword_games 
    FOR SELECT, UPDATE, DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can insert questions for their games" ON crossword_questions 
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM crossword_games WHERE crossword_games.id = crossword_questions.game_id AND crossword_games.created_by = auth.uid())
    );

CREATE POLICY "Users can manage their existing questions" ON crossword_questions 
    FOR SELECT, UPDATE, DELETE USING (
        EXISTS (SELECT 1 FROM crossword_games WHERE crossword_games.id = crossword_questions.game_id AND crossword_games.created_by = auth.uid())
    );
```

### "relation crossword_games does not exist" 
**Penyebab:** Belum jalankan SQL create table  
**Solusi:** Jalankan SQL di atas

### "permission denied for table"
**Penyebab:** RLS enabled tapi policy belum ada  
**Solusi:** Jalankan bagian policy di SQL

## 💡 Kenapa RLS Penting?

**Tanpa RLS:**
```sql
-- User A bisa lihat game User B 😱
SELECT * FROM crossword_games; -- Semua data terbuka!
```

**Dengan RLS:**
```sql  
-- User A cuma bisa lihat game sendiri 😊
SELECT * FROM crossword_games; -- Cuma data dia sendiri
```

**Kesimpulan:** RLS = Data Privacy + Security. **WAJIB PAKAI!**

## ⚡ Quick Fix untuk Error RLS

Jika dapat error "new row violates row-level security policy":

1. **Cek apakah sudah login** - Harus login dulu!
2. **Jalankan file `fix-rls-policy.sql`** - Copy paste ke SQL Editor
3. **Test lagi di aplikasi** - Klik "Test Database" lalu "Save to Supabase"

**Root cause:** Policy `FOR ALL` tidak bekerja untuk INSERT, harus dipisah jadi:
- `FOR INSERT WITH CHECK` - untuk data baru
- `FOR SELECT, UPDATE, DELETE USING` - untuk data existing
