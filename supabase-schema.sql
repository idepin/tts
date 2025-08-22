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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_crossword_questions_game_id ON crossword_questions(game_id);
CREATE INDEX IF NOT EXISTS idx_crossword_questions_number ON crossword_questions(game_id, question_number);
CREATE INDEX IF NOT EXISTS idx_crossword_games_created_by ON crossword_games(created_by);
CREATE INDEX IF NOT EXISTS idx_crossword_games_active ON crossword_games(is_active);

-- Enable RLS (Row Level Security)
ALTER TABLE crossword_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossword_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crossword_games
CREATE POLICY "Users can view active games" ON crossword_games
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create their own games" ON crossword_games
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own games" ON crossword_games
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own games" ON crossword_games
    FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for crossword_questions
CREATE POLICY "Users can view questions for active games" ON crossword_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM crossword_games 
            WHERE crossword_games.id = crossword_questions.game_id 
            AND crossword_games.is_active = true
        )
    );

CREATE POLICY "Users can manage questions for their own games" ON crossword_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM crossword_games 
            WHERE crossword_games.id = crossword_questions.game_id 
            AND crossword_games.created_by = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_crossword_games_updated_at 
    BEFORE UPDATE ON crossword_games 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
