-- FIX RLS POLICY ERROR
-- Jalankan ini di Supabase SQL Editor jika dapat error "new row violates row-level security policy"

-- 1. Drop SEMUA policy lama yang mungkin ada (comprehensive cleanup)
DROP POLICY IF EXISTS "Users manage their own games" ON crossword_games;
DROP POLICY IF EXISTS "Users manage their own questions" ON crossword_questions;
DROP POLICY IF EXISTS "Users can insert their own games" ON crossword_games;
DROP POLICY IF EXISTS "Users can select their own games" ON crossword_games;
DROP POLICY IF EXISTS "Users can update their own games" ON crossword_games;
DROP POLICY IF EXISTS "Users can delete their own games" ON crossword_games;
DROP POLICY IF EXISTS "Users can insert questions for their games" ON crossword_questions;
DROP POLICY IF EXISTS "Users can select questions for their games" ON crossword_questions;
DROP POLICY IF EXISTS "Users can update questions for their games" ON crossword_questions;
DROP POLICY IF EXISTS "Users can delete questions for their games" ON crossword_questions;

-- 2. Buat policy baru yang benar (pisah setiap operasi)
-- Policies untuk crossword_games
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

-- 3. Verifikasi policies
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('crossword_games', 'crossword_questions')
ORDER BY tablename, cmd;

-- Hasil yang benar harus menampilkan 8 policies:
-- crossword_games | Users can delete their own games | DELETE
-- crossword_games | Users can insert their own games | INSERT  
-- crossword_games | Users can select their own games | SELECT
-- crossword_games | Users can update their own games | UPDATE
-- crossword_questions | Users can delete questions for their games | DELETE
-- crossword_questions | Users can insert questions for their games | INSERT
-- crossword_questions | Users can select questions for their games | SELECT
-- crossword_questions | Users can update questions for their games | UPDATE
