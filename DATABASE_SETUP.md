# Setup Database Supabase untuk Teka-Teki Silang

## Langkah Setup Database

### 1. Buka Supabase Dashboard
- Login ke [supabase.com](https://supabase.com)
- Pilih project Anda
- Masuk ke tab **SQL Editor**

### 2. Jalankan Schema SQL
Copy dan paste kode SQL dari file `supabase-schema.sql` ke SQL Editor, lalu klik **Run**.

```sql
-- Create crossword_games table
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

-- Create crossword_questions table
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
```

### 3. Setup Row Level Security (RLS)
RLS sudah termasuk dalam schema SQL di atas. Pastikan policies berikut aktif:

**crossword_games policies:**
- Users can view active games
- Users can create their own games  
- Users can update their own games
- Users can delete their own games

**crossword_questions policies:**
- Users can view questions for active games
- Users can manage questions for their own games

### 4. Test Database
- Masuk ke tab **Table Editor**
- Pastikan tabel `crossword_games` dan `crossword_questions` sudah ada
- Coba insert data manual untuk testing

## Fitur Database

### Struktur Tabel
1. **crossword_games**: Menyimpan metadata game
2. **crossword_questions**: Menyimpan pertanyaan dan jawaban

### Fitur Otomatis
- ✅ Auto-load data dari Supabase saat buka aplikasi
- ✅ Save to Supabase dari Question Manager
- ✅ Import dari localStorage ke Supabase
- ✅ Backup ke localStorage secara otomatis
- ✅ Row Level Security untuk multi-user

### API Methods
- `CrosswordService.getActiveGame()` - Load game aktif
- `CrosswordService.createGame()` - Buat game baru
- `CrosswordService.updateGame()` - Update game existing
- `CrosswordService.importFromLocalStorage()` - Import dari localStorage

## Troubleshooting

### Error: relation "crossword_games" does not exist
- Pastikan sudah menjalankan schema SQL di SQL Editor
- Check di Table Editor apakah tabel sudah ada

### Error: RLS policy violation
- Pastikan user sudah login
- Check policies di Authentication > Policies

### Data tidak muncul di gameplay
- Check di browser console untuk error messages
- Verify data ada di Supabase Table Editor
- Try refresh halaman gameplay

## Migration dari localStorage
Jika sudah ada data di localStorage:
1. Buka page Question Manager 
2. Klik tombol "Import from Local Storage"
3. Data akan otomatis dipindah ke Supabase
4. Gameplay akan otomatis load dari Supabase

## Backup Strategy
- Data di Supabase = Primary storage
- localStorage = Automatic backup
- Manual export JSON masih tersedia di Question Manager
