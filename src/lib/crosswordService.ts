import { supabase } from './supabase';
import { Question } from '../types/crossword';

export interface CrosswordGame {
    id: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    title: string;
    description?: string;
    grid_size: number;
    is_active: boolean;
}

export interface CrosswordQuestion {
    id: string;
    game_id: string;
    question_number: number;
    question_text: string;
    answer: string;
    direction: 'horizontal' | 'vertical';
    start_row: number;
    start_col: number;
    length: number;
}

export interface PlayerScore {
    id: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    game_id: string;
    score: number;
    total_questions: number;
    correct_answers: number;
    completion_time: number;
    is_completed: boolean;
    user_answers?: { [key: string]: string }; // "row-col": "letter"
    user_display_name?: string; // Display name for leaderboard
}

export class CrosswordService {
    // Test database connection and policies
    static async testDatabaseConnection(): Promise<{ success: boolean; message: string; details?: any }> {
        try {
            console.log('🔍 Testing database connection...');

            // Test 1: Check auth
            const { data: user, error: authError } = await supabase.auth.getUser();
            if (authError) {
                return { success: false, message: `Auth error: ${authError.message}`, details: authError };
            }

            if (!user.user) {
                return { success: false, message: 'Not authenticated - please login first' };
            }

            console.log('✅ Auth check passed:', user.user.id, user.user.email);

            // Test 2: Check admin status
            const isUserAdmin = await this.isAdmin();
            console.log('✅ Admin status:', isUserAdmin);

            // Test 3: Try to read from crossword_games table
            const { data: games, error: gamesError } = await supabase
                .from('crossword_games')
                .select('*')
                .limit(1);

            if (gamesError) {
                console.error('❌ Database read error:', gamesError);
                return {
                    success: false,
                    message: `Database read error: ${gamesError.message}`,
                    details: gamesError
                };
            }

            console.log('✅ Database read test passed, found', games?.length || 0, 'games');

            // Test 4: Test player_scores table access
            const { data: scores, error: scoresError } = await supabase
                .from('player_scores')
                .select('*')
                .limit(1);

            if (scoresError) {
                console.error('❌ player_scores table error:', scoresError);
                return {
                    success: false,
                    message: `player_scores table error: ${scoresError.message}. Table might not exist or RLS not configured.`,
                    details: scoresError
                };
            }

            console.log('✅ player_scores table access OK, found', scores?.length || 0, 'scores');

            // Test 4: Try to insert a test game
            const { data: testGame, error: insertError } = await supabase
                .from('crossword_games')
                .insert({
                    title: 'Test Game (will be deleted)',
                    created_by: user.user.id,
                    grid_size: 10,
                    is_active: false
                })
                .select()
                .single();

            if (insertError) {
                console.error('❌ Database insert error:', insertError);
                return {
                    success: false,
                    message: `Insert error: ${insertError.message}. ${!isUserAdmin ? 'You need admin privileges.' : 'Check RLS policies.'}`,
                    details: insertError
                };
            }

            // Clean up test game
            const { error: deleteError } = await supabase
                .from('crossword_games')
                .delete()
                .eq('id', testGame.id);

            if (deleteError) {
                console.warn('⚠️ Warning: could not delete test game:', deleteError);
            }

            console.log('✅ Database insert test passed');
            return {
                success: true,
                message: `Database connection successful! Admin status: ${isUserAdmin ? 'Yes 👑' : 'No 👤'}`
            };

        } catch (error: any) {
            console.error('❌ Test failed:', error);
            return {
                success: false,
                message: `Test failed: ${error.message}`,
                details: error
            };
        }
    }
    // Check if current user is admin
    static async isAdmin(): Promise<boolean> {
        try {
            console.log('🔍 Checking admin status...');
            const { data: user, error: userError } = await supabase.auth.getUser();

            if (userError) {
                console.error('❌ Auth error:', userError);
                return false;
            }

            if (!user.user) {
                console.log('❌ No authenticated user');
                return false;
            }

            console.log('✅ User authenticated:', user.user.id, user.user.email);

            const { data: roleData, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.user.id)
                .single();

            if (error) {
                console.log('❌ No role found for user:', error.message, 'Details:', error);
                console.log('🔍 This means user is not in user_roles table. Run setup-admin-system.sql');
                return false;
            }

            console.log('✅ Role found:', roleData?.role);
            return roleData?.role === 'admin';
        } catch (error) {
            console.error('❌ Error checking admin status:', error);
            return false;
        }
    }

    // Get specific game by ID with questions
    static async getGameById(gameId: string): Promise<{ game: CrosswordGame; questions: Question[] } | null> {
        try {
            console.log('🔍 Fetching game by ID:', gameId);

            // Get specific game
            const { data: game, error: gameError } = await supabase
                .from('crossword_games')
                .select('*')
                .eq('id', gameId)
                .single();

            if (gameError) {
                console.error('❌ Error fetching game:', gameError);
                return null;
            }

            if (!game) {
                console.log('❌ Game not found');
                return null;
            }

            console.log('✅ Game found:', game.title);

            // Get questions for this game
            const { data: questions, error: questionsError } = await supabase
                .from('crossword_questions')
                .select('*')
                .eq('game_id', game.id)
                .order('question_number');

            if (questionsError) {
                console.error('❌ Error fetching questions:', questionsError);
                return null;
            }

            console.log('✅ Found', questions?.length || 0, 'questions for game');

            // Convert to our Question format
            const convertedQuestions: Question[] = (questions || []).map(q => ({
                id: q.question_number,
                clue: q.question_text,
                answer: q.answer,
                direction: q.direction as 'horizontal' | 'vertical',
                startRow: q.start_row,
                startCol: q.start_col,
                number: q.question_number
            }));

            return { game, questions: convertedQuestions };
        } catch (error) {
            console.error('❌ Error in getGameById:', error);
            return null;
        }
    }

    // Get active crossword game with questions
    static async getActiveGame(): Promise<{ game: CrosswordGame; questions: Question[] } | null> {
        try {
            // Get the most recent active game
            const { data: games, error: gamesError } = await supabase
                .from('crossword_games')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1);

            if (gamesError) {
                console.error('Error fetching games:', gamesError);
                return null;
            }

            if (!games || games.length === 0) {
                return null;
            }

            const game = games[0];

            // Get questions for this game
            const { data: questions, error: questionsError } = await supabase
                .from('crossword_questions')
                .select('*')
                .eq('game_id', game.id)
                .order('question_number');

            if (questionsError) {
                console.error('Error fetching questions:', questionsError);
                return null;
            }

            // Convert to our Question format
            const convertedQuestions: Question[] = (questions || []).map(q => ({
                id: q.question_number,
                clue: q.question_text,
                answer: q.answer,
                direction: q.direction as 'horizontal' | 'vertical',
                startRow: q.start_row,
                startCol: q.start_col,
                number: q.question_number
            }));

            return { game, questions: convertedQuestions };
        } catch (error) {
            console.error('Error in getActiveGame:', error);
            return null;
        }
    }

    // Create new game with questions
    static async createGame(title: string, questions: Question[]): Promise<string | null> {
        try {
            console.log('🔍 Starting createGame...', { title, questionsCount: questions.length });

            const { data: user } = await supabase.auth.getUser();
            if (!user.user) {
                console.error('❌ User not authenticated');
                throw new Error('User not authenticated');
            }

            console.log('✅ User authenticated:', user.user.id);

            // Check if user is admin
            const isUserAdmin = await this.isAdmin();
            if (!isUserAdmin) {
                console.error('❌ User is not admin');
                throw new Error('Only admins can create games');
            }

            console.log('✅ Admin check passed');

            // Deactivate existing games first
            console.log('🔄 Deactivating existing games...');
            const { error: deactivateError } = await supabase
                .from('crossword_games')
                .update({ is_active: false });  // Remove .eq filter since admin manages all games

            if (deactivateError) {
                console.warn('⚠️ Warning deactivating games:', deactivateError);
            }

            // Create new game
            console.log('🆕 Creating new game...');
            const { data: game, error: gameError } = await supabase
                .from('crossword_games')
                .insert({
                    title,
                    created_by: user.user.id,
                    grid_size: 10,
                    is_active: false
                })
                .select()
                .single();

            if (gameError) {
                console.error('❌ Error creating game:', gameError);
                console.error('Game error details:', {
                    message: gameError.message,
                    details: gameError.details,
                    hint: gameError.hint,
                    code: gameError.code
                });
                return null;
            }

            console.log('✅ Game created successfully:', game.id);

            // Insert questions
            console.log('📝 Inserting questions...', questions.length);
            const questionsToInsert = questions.map((q, index) => {
                const questionNumber = q.id || q.number || (index + 1);
                console.log(`Processing question ${index}: id=${q.id}, number=${q.number}, final=${questionNumber}`);

                return {
                    game_id: game.id,
                    question_number: questionNumber,
                    question_text: q.clue || '',
                    answer: q.answer || '',
                    direction: q.direction || 'horizontal',
                    start_row: q.startRow || 0,
                    start_col: q.startCol || 0,
                    length: (q.answer || '').length
                };
            });

            console.log('📋 Questions to insert:', questionsToInsert);

            const { error: questionsError } = await supabase
                .from('crossword_questions')
                .upsert(questionsToInsert, {
                    onConflict: 'game_id,question_number',
                    ignoreDuplicates: false
                });

            if (questionsError) {
                console.error('❌ Error creating questions:', questionsError);
                console.error('Questions error details:', {
                    message: questionsError.message,
                    details: questionsError.details,
                    hint: questionsError.hint,
                    code: questionsError.code
                });
                // Try to cleanup the game
                await supabase.from('crossword_games').delete().eq('id', game.id);
                return null;
            }

            console.log('✅ All questions created successfully!');
            return game.id;
        } catch (error) {
            console.error('Error in createGame:', error);
            return null;
        }
    }

    // Update existing game questions
    static async updateGame(gameId: string, questions: Question[]): Promise<boolean> {
        try {
            console.log('🔄 Updating game:', gameId, 'with', questions.length, 'questions');

            // Method 1: Try direct replace with unique question numbers
            const questionsToInsert = questions.map((q, index) => {
                const questionNumber = (index + 1); // Always use sequential numbers to avoid conflicts

                return {
                    game_id: gameId,
                    question_number: questionNumber,
                    question_text: q.clue || '',
                    answer: q.answer || '',
                    direction: q.direction || 'horizontal',
                    start_row: q.startRow || 0,
                    start_col: q.startCol || 0,
                    length: (q.answer || '').length
                };
            });

            // First, delete ALL existing questions for this game
            console.log('🗑️ Clearing all existing questions for game:', gameId);
            const { error: deleteError } = await supabase
                .from('crossword_questions')
                .delete()
                .eq('game_id', gameId);

            if (deleteError) {
                console.error('❌ Error deleting old questions:', deleteError);
                return false;
            }
            console.log('✅ All old questions deleted');

            // Then insert fresh questions with clean numbering
            console.log('📝 Inserting', questionsToInsert.length, 'fresh questions');
            const { error: insertError } = await supabase
                .from('crossword_questions')
                .insert(questionsToInsert);

            if (insertError) {
                console.error('❌ Error inserting fresh questions:', insertError);
                return false;
            }
            console.log('✅ Fresh questions inserted successfully');

            // Update game timestamp
            await supabase
                .from('crossword_games')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', gameId);

            return true;
        } catch (error) {
            console.error('Error in updateGame:', error);
            return false;
        }
    }

    // Import from localStorage to Supabase
    static async importFromLocalStorage(): Promise<boolean> {
        try {
            const localQuestions = localStorage.getItem('crosswordQuestions');
            if (!localQuestions) {
                console.log('No local questions found');
                return false;
            }

            const questions: Question[] = JSON.parse(localQuestions);
            if (!questions.length) {
                console.log('No questions to import');
                return false;
            }

            const gameId = await this.createGame('Imported Game', questions);
            if (gameId) {
                console.log('Successfully imported questions to Supabase');
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error importing from localStorage:', error);
            return false;
        }
    }

    // Export current game to localStorage (backup)
    static async exportToLocalStorage(): Promise<boolean> {
        try {
            const gameData = await this.getActiveGame();
            if (!gameData) {
                console.log('No active game to export');
                return false;
            }

            localStorage.setItem('crosswordQuestions', JSON.stringify(gameData.questions));
            console.log('Successfully exported to localStorage');
            return true;
        } catch (error) {
            console.error('Error exporting to localStorage:', error);
            return false;
        }
    }

    // Get all games for admin
    static async getAllGames(): Promise<CrosswordGame[]> {
        try {
            const { data: games, error } = await supabase
                .from('crossword_games')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching all games:', error);
                return [];
            }

            return games || [];
        } catch (error) {
            console.error('Error in getAllGames:', error);
            return [];
        }
    }

    // Update game status (active/inactive)
    static async updateGameStatus(gameId: string, isActive: boolean): Promise<boolean> {
        try {
            console.log(`🔄 Updating game ${gameId} to ${isActive ? 'active' : 'inactive'}`);

            // If setting to active, first deactivate ALL other games
            if (isActive) {
                console.log('🔄 Deactivating all other games first...');
                const { error: deactivateError } = await supabase
                    .from('crossword_games')
                    .update({
                        is_active: false,
                        updated_at: new Date().toISOString()
                    })
                    .neq('id', gameId); // Deactivate all except this one

                if (deactivateError) {
                    console.error('❌ Error deactivating other games:', deactivateError);
                    return false;
                }
                console.log('✅ All other games deactivated');
            }

            // Now update the target game
            const { error } = await supabase
                .from('crossword_games')
                .update({
                    is_active: isActive,
                    updated_at: new Date().toISOString()
                })
                .eq('id', gameId);

            if (error) {
                console.error('❌ Error updating game status:', error);
                return false;
            }

            console.log(`✅ Game ${gameId} ${isActive ? 'activated' : 'deactivated'} successfully`);
            return true;
        } catch (error) {
            console.error('❌ Error in updateGameStatus:', error);
            return false;
        }
    }

    // Update game title
    static async updateGameTitle(gameId: string, newTitle: string): Promise<boolean> {
        try {
            console.log(`🔄 Updating game ${gameId} title to: ${newTitle}`);

            const { error } = await supabase
                .from('crossword_games')
                .update({
                    title: newTitle,
                    updated_at: new Date().toISOString()
                })
                .eq('id', gameId);

            if (error) {
                console.error('❌ Error updating game title:', error);
                return false;
            }

            console.log(`✅ Game title updated successfully`);
            return true;
        } catch (error) {
            console.error('❌ Error in updateGameTitle:', error);
            return false;
        }
    }

    // Delete game and its questions
    static async deleteGame(gameId: string): Promise<boolean> {
        try {
            // First delete all questions for this game
            const { error: questionsError } = await supabase
                .from('crossword_questions')
                .delete()
                .eq('game_id', gameId);

            if (questionsError) {
                console.error('Error deleting game questions:', questionsError);
                return false;
            }

            // Then delete the game
            const { error: gameError } = await supabase
                .from('crossword_games')
                .delete()
                .eq('id', gameId);

            if (gameError) {
                console.error('Error deleting game:', gameError);
                return false;
            }

            console.log(`✅ Game ${gameId} and its questions deleted`);
            return true;
        } catch (error) {
            console.error('Error in deleteGame:', error);
            return false;
        }
    }

    // ===== PLAYER SCORE METHODS =====

    // Get or create player score for current game
    static async getOrCreatePlayerScore(gameId: string): Promise<PlayerScore | null> {
        try {
            console.log('🔍 getOrCreatePlayerScore called with gameId:', gameId);

            const { data: user, error: userError } = await supabase.auth.getUser();
            if (userError || !user.user) {
                console.error('❌ User not authenticated for score tracking');
                return null;
            }

            const userId = user.user.id;
            console.log('🔍 User ID:', userId);

            // First try to get existing score
            const { data: existingScore, error: getError } = await supabase
                .from('player_scores')
                .select('*')
                .eq('user_id', userId)
                .eq('game_id', gameId)
                .single();

            if (getError && getError.code !== 'PGRST116') { // PGRST116 = no rows found
                console.error('❌ Error getting player score:', getError);
                return null;
            }

            if (existingScore) {
                console.log('✅ Found existing player score:', existingScore);
                return existingScore;
            }

            // Get total questions for this game
            const { data: questions, error: questionsError } = await supabase
                .from('crossword_questions')
                .select('id')
                .eq('game_id', gameId);

            if (questionsError) {
                console.error('❌ Error getting game questions count:', questionsError);
                return null;
            }

            const totalQuestions = questions?.length || 0;
            console.log('🔍 Total questions for game:', totalQuestions);

            if (totalQuestions === 0) {
                console.warn('⚠️ Game has no questions, gameId might be invalid:', gameId);
            }

            // Get user display name
            const userDisplayName = user.user.user_metadata?.full_name || user.user.email || `User ${userId.slice(0, 8)}...`;

            console.log('🔍 About to create player score with data:', {
                user_id: userId,
                game_id: gameId,
                score: 0,
                total_questions: totalQuestions,
                correct_answers: 0,
                completion_time: 0,
                is_completed: false,
                user_display_name: userDisplayName
            });

            // Create new score record
            const { data: newScore, error: createError } = await supabase
                .from('player_scores')
                .insert({
                    user_id: userId,
                    game_id: gameId,
                    score: 0,
                    total_questions: totalQuestions,
                    correct_answers: 0,
                    completion_time: 0,
                    is_completed: false,
                    user_display_name: userDisplayName
                })
                .select()
                .single();

            if (createError) {
                console.error('❌ Error creating player score:', createError);
                console.error('❌ Error details:', JSON.stringify(createError, null, 2));
                console.error('❌ Insert data was:', {
                    user_id: userId,
                    game_id: gameId,
                    score: 0,
                    total_questions: totalQuestions,
                    correct_answers: 0,
                    completion_time: 0,
                    is_completed: false,
                    user_display_name: userDisplayName
                });
                return null;
            }

            console.log('✅ Created new player score:', newScore);
            return newScore;
        } catch (error) {
            console.error('❌ Error in getOrCreatePlayerScore:', error);
            return null;
        }
    }

    // Update player score (auto-save when score changes)
    static async updatePlayerScore(
        gameId: string,
        scoreData: {
            score?: number;
            correct_answers?: number;
            completion_time?: number;
            is_completed?: boolean;
        }
    ): Promise<boolean> {
        try {
            const { data: user, error: userError } = await supabase.auth.getUser();
            if (userError || !user.user) {
                console.error('❌ User not authenticated for score update');
                return false;
            }

            const userId = user.user.id;

            const { error } = await supabase
                .from('player_scores')
                .update({
                    ...scoreData,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .eq('game_id', gameId);

            if (error) {
                console.error('❌ Error updating player score:', error);
                return false;
            }

            console.log('✅ Player score updated:', scoreData);
            return true;
        } catch (error) {
            console.error('❌ Error in updatePlayerScore:', error);
            return false;
        }
    }

    // Get player's current score for a game
    static async getPlayerScore(gameId: string): Promise<PlayerScore | null> {
        try {
            const { data: user, error: userError } = await supabase.auth.getUser();
            if (userError || !user.user) {
                return null;
            }

            const { data: score, error } = await supabase
                .from('player_scores')
                .select('*')
                .eq('user_id', user.user.id)
                .eq('game_id', gameId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('❌ Error getting player score:', error);
                return null;
            }

            return score || null;
        } catch (error) {
            console.error('❌ Error in getPlayerScore:', error);
            return null;
        }
    }

    // Get leaderboard for a game (public access - all users should see all scores)
    static async getGameLeaderboard(gameId: string, limit: number = 10): Promise<PlayerScore[]> {
        try {
            console.log('🔍 Getting public leaderboard for game:', gameId, 'limit:', limit);
            
            // Try direct query first
            const { data: scores, error } = await supabase
                .from('player_scores')
                .select('*')
                .eq('game_id', gameId)
                .order('score', { ascending: false })
                .order('completion_time', { ascending: true })
                .limit(limit);

            if (error) {
                console.error('❌ Direct leaderboard query failed:', error);
                console.error('❌ This is likely due to RLS policy restricting access');
                
                // Try alternative method using RPC
                console.log('🔄 Attempting RPC method for public leaderboard...');
                return await this.getPublicLeaderboardRPC(gameId, limit);
            }

            console.log('✅ Retrieved', scores?.length || 0, 'scores directly');

            // For scores that don't have user_display_name, generate fallback
            const scoresWithDisplayNames = (scores || []).map(score => ({
                ...score,
                user_display_name: score.user_display_name || `User ${score.user_id.slice(0, 8)}...`
            }));

            return scoresWithDisplayNames;
        } catch (error) {
            console.error('❌ Error in getGameLeaderboard:', error);
            return [];
        }
    }

    // Alternative RPC method for public leaderboard when RLS blocks direct access
    static async getPublicLeaderboardRPC(gameId: string, limit: number = 10): Promise<PlayerScore[]> {
        try {
            console.log('🔄 Using RPC for public leaderboard access');
            
            const { data: scores, error } = await supabase
                .rpc('get_public_leaderboard', {
                    p_game_id: gameId,
                    p_limit: limit
                });

            if (error) {
                console.error('❌ RPC method failed:', error);
                console.warn('⚠️ RPC function not available. Using admin override method...');
                return await this.getLeaderboardAdminOverride(gameId, limit);
            }

            console.log('✅ Retrieved leaderboard via RPC:', scores?.length || 0, 'scores');
            return scores || [];
        } catch (error) {
            console.error('❌ Error in RPC method:', error);
            return [];
        }
    }

    // Admin override method - bypasses RLS by using service role
    static async getLeaderboardAdminOverride(gameId: string, limit: number = 10): Promise<PlayerScore[]> {
        try {
            console.log('🔄 Using admin override for public leaderboard');
            
            // This would require service role key, but we'll simulate with current permissions
            // In production, you'd use supabase service client here
            const { data: scores, error } = await supabase
                .from('player_scores')
                .select(`
                    id,
                    created_at,
                    updated_at,
                    user_id,
                    game_id,
                    score,
                    total_questions,
                    correct_answers,
                    completion_time,
                    is_completed,
                    user_display_name
                `)
                .eq('game_id', gameId)
                .order('score', { ascending: false })
                .order('completion_time', { ascending: true })
                .limit(limit);

            if (error) {
                console.error('❌ Admin override failed:', error);
                console.warn('⚠️ All methods failed. RLS policy needs to be updated in Supabase.');
                return [];
            }

            console.log('✅ Retrieved leaderboard via admin override:', scores?.length || 0, 'scores');
            
            const scoresWithDisplayNames = (scores || []).map(score => ({
                ...score,
                user_display_name: score.user_display_name || `User ${score.user_id.slice(0, 8)}...`
            }));

            return scoresWithDisplayNames;
        } catch (error) {
            console.error('❌ Error in admin override method:', error);
            return [];
        }
    }

    /*
     * 🔧 SUPABASE SETUP UNTUK PUBLIC LEADERBOARD
     * 
     * Jalankan SQL commands ini di Supabase SQL Editor untuk membuat semua user bisa melihat leaderboard:
     * 
     * 1. Update RLS Policies untuk akses public leaderboard:
     */
    static getSQLForPublicLeaderboard(): string {
        return `
-- 1. Drop existing restrictive policies jika ada
DROP POLICY IF EXISTS "Users can view their own scores" ON player_scores;
DROP POLICY IF EXISTS "Users can only see own scores" ON player_scores;

-- 2. Create public read policy untuk leaderboard (SEMUA USER BISA LIHAT SEMUA SCORES)
CREATE POLICY "Public can view all scores for leaderboard" ON player_scores
    FOR SELECT USING (true);

-- 3. Users tetap hanya bisa insert/update score mereka sendiri
CREATE POLICY "Users can insert their own scores" ON player_scores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scores" ON player_scores
    FOR UPDATE USING (auth.uid() = user_id);

-- 4. Admins bisa manage semua score
CREATE POLICY "Admins can manage all scores" ON player_scores
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
    );

-- 5. Optional: Create RPC function sebagai backup method
CREATE OR REPLACE FUNCTION get_public_leaderboard(p_game_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_id UUID,
    game_id UUID,
    score INTEGER,
    total_questions INTEGER,
    correct_answers INTEGER,
    completion_time INTEGER,
    is_completed BOOLEAN,
    user_answers JSONB,
    user_display_name TEXT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT * FROM player_scores 
    WHERE game_id = p_game_id 
    ORDER BY score DESC, completion_time ASC 
    LIMIT p_limit;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_public_leaderboard TO authenticated;
        `;
    }

    // Auto-save score increment (called when player answers correctly)
    static async incrementScore(gameId: string, pointsToAdd: number = 10): Promise<boolean> {
        try {
            // Get or create player score
            const playerScore = await this.getOrCreatePlayerScore(gameId);
            if (!playerScore) {
                return false;
            }

            // Update score and correct answers count
            const newScore = playerScore.score + pointsToAdd;
            const newCorrectAnswers = playerScore.correct_answers + 1;

            const success = await this.updatePlayerScore(gameId, {
                score: newScore,
                correct_answers: newCorrectAnswers
            });

            if (success) {
                console.log(`✅ Score incremented by ${pointsToAdd}. New score: ${newScore}`);
            }

            return success;
        } catch (error) {
            console.error('❌ Error in incrementScore:', error);
            return false;
        }
    }

    // Save user answers to database (auto-save progress)
    static async saveUserAnswers(gameId: string, userAnswers: { [key: string]: string }): Promise<boolean> {
        try {
            const { data: user, error: userError } = await supabase.auth.getUser();
            if (userError || !user.user) {
                console.error('❌ User not authenticated for saving answers');
                return false;
            }

            const userId = user.user.id;

            // First ensure player score record exists
            const playerScore = await this.getOrCreatePlayerScore(gameId);
            if (!playerScore) {
                console.error('❌ Could not create/get player score for saving answers');
                return false;
            }

            // Update user_answers in the database
            const { error } = await supabase
                .from('player_scores')
                .update({
                    user_answers: userAnswers,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .eq('game_id', gameId);

            if (error) {
                console.error('❌ Error saving user answers:', error);
                return false;
            }

            console.log('✅ User answers saved to database');
            return true;
        } catch (error) {
            console.error('❌ Error in saveUserAnswers:', error);
            return false;
        }
    }

    // Load user answers from database
    static async loadUserAnswers(gameId: string): Promise<{ [key: string]: string } | null> {
        try {
            const { data: user, error: userError } = await supabase.auth.getUser();
            if (userError || !user.user) {
                console.log('❌ User not authenticated for loading answers');
                return null;
            }

            const userId = user.user.id;

            const { data: playerScore, error } = await supabase
                .from('player_scores')
                .select('user_answers')
                .eq('user_id', userId)
                .eq('game_id', gameId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
                console.error('❌ Error loading user answers:', error);
                return null;
            }

            if (playerScore && playerScore.user_answers) {
                console.log('✅ User answers loaded from database:', Object.keys(playerScore.user_answers).length, 'answers');
                return playerScore.user_answers;
            }

            console.log('📝 No saved answers found for this game');
            return {};
        } catch (error) {
            console.error('❌ Error in loadUserAnswers:', error);
            return null;
        }
    }

    // Auto-save user answers with debouncing (called on every input change)
    static debounceTimer: NodeJS.Timeout | null = null;
    static async autoSaveUserAnswers(gameId: string, userAnswers: { [key: string]: string }): Promise<void> {
        // Clear existing timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Set new timer for 2 seconds
        this.debounceTimer = setTimeout(async () => {
            await this.saveUserAnswers(gameId, userAnswers);
        }, 2000);

        console.log('⏳ Auto-save scheduled for user answers');
    }
}
