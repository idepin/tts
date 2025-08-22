-- RESET RLS POLICIES COMPLETELY
-- Jalankan ini jika ada error "policy already exists"

-- 1. Disable RLS sementara (akan drop semua policies otomatis)
ALTER TABLE crossword_games DISABLE ROW LEVEL SECURITY;
ALTER TABLE crossword_questions DISABLE ROW LEVEL SECURITY;

-- 2. Enable RLS lagi
ALTER TABLE crossword_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossword_questions ENABLE ROW LEVEL SECURITY;

-- 3. Buat policies baru dari awal
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

-- 4. Verifikasi hasil
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('crossword_games', 'crossword_questions')
ORDER BY tablename, cmd;
