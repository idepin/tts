-- SETUP ADMIN-ONLY CROSSWORD SYSTEM
-- Jalankan ini di Supabase SQL Editor untuk sistem admin-only

-- 1. Reset RLS policies dulu
ALTER TABLE crossword_games DISABLE ROW LEVEL SECURITY;
ALTER TABLE crossword_questions DISABLE ROW LEVEL SECURITY;

-- 2. Buat table untuk admin roles
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('admin', 'player')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS lagi
ALTER TABLE crossword_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossword_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies yang lebih sederhana - ADMIN ONLY untuk manage, ALL untuk read
-- crossword_games policies
CREATE POLICY "Everyone can view active games" ON crossword_games 
    FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can insert games" ON crossword_games 
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
    );

CREATE POLICY "Only admins can update games" ON crossword_games 
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
    );

CREATE POLICY "Only admins can delete games" ON crossword_games 
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
    );

-- crossword_questions policies  
CREATE POLICY "Everyone can view questions for active games" ON crossword_questions 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM crossword_games WHERE crossword_games.id = crossword_questions.game_id AND crossword_games.is_active = true)
    );

CREATE POLICY "Only admins can insert questions" ON crossword_questions 
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
    );

CREATE POLICY "Only admins can update questions" ON crossword_questions 
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
    );

CREATE POLICY "Only admins can delete questions" ON crossword_questions 
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
    );

-- user_roles policies (allow initial setup)
CREATE POLICY "Users can view their own role" ON user_roles 
    FOR SELECT USING (user_id = auth.uid());

-- Allow first admin to be created without circular dependency
CREATE POLICY "Allow initial admin setup" ON user_roles 
    FOR INSERT WITH CHECK (true);  -- Initially allow all inserts

CREATE POLICY "Only admins can update roles" ON user_roles 
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
    );

CREATE POLICY "Only admins can delete roles" ON user_roles 
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
    );

-- 5. Buat fungsi helper untuk cek admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = user_uuid AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Set user pertama sebagai admin (ganti dengan email Anda!)
-- PENTING: Ganti 'your-email@example.com' dengan email yang Anda gunakan login!
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'your-email@example.com'  -- GANTI INI!
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- 7. Setelah admin pertama dibuat, amankan policy INSERT untuk user_roles
DROP POLICY IF EXISTS "Allow initial admin setup" ON user_roles;
CREATE POLICY "Only admins can insert roles" ON user_roles 
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
    );

-- 8. Verifikasi setup
SELECT 
    u.email,
    ur.role,
    ur.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY ur.created_at DESC;
