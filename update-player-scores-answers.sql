-- Add user_answers column to player_scores table to save progress
ALTER TABLE player_scores 
ADD COLUMN IF NOT EXISTS user_answers JSONB DEFAULT '{}';

-- Add index for better performance on user_answers queries
CREATE INDEX IF NOT EXISTS idx_player_scores_user_answers ON player_scores USING GIN (user_answers);

-- Update the comment
COMMENT ON COLUMN player_scores.user_answers IS 'JSON object storing user answers for each cell (key: "row-col", value: "letter")';
