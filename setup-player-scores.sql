-- Create player_scores table to store game scores
CREATE TABLE IF NOT EXISTS player_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id UUID REFERENCES crossword_games(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    completion_time INTEGER DEFAULT 0, -- in seconds
    is_completed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, game_id) -- One score per user per game
);

-- Enable RLS
ALTER TABLE player_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for player_scores
CREATE POLICY "Users can view their own scores" ON player_scores
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scores" ON player_scores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scores" ON player_scores
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all scores (using user_roles table)
CREATE POLICY "Admins can view all scores" ON player_scores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_player_scores_user_game ON player_scores(user_id, game_id);
CREATE INDEX IF NOT EXISTS idx_player_scores_game ON player_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_player_scores_score ON player_scores(score DESC);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_player_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_player_scores_updated_at_trigger
    BEFORE UPDATE ON player_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_player_scores_updated_at();

COMMENT ON TABLE player_scores IS 'Stores player scores and progress for each crossword game';
COMMENT ON COLUMN player_scores.score IS 'Current score points';
COMMENT ON COLUMN player_scores.total_questions IS 'Total questions in the game';
COMMENT ON COLUMN player_scores.correct_answers IS 'Number of correct answers';
COMMENT ON COLUMN player_scores.completion_time IS 'Time taken to complete in seconds';
COMMENT ON COLUMN player_scores.is_completed IS 'Whether the game is completed';
