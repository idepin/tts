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

export class CrosswordService {
    // Check if current user is admin
    static async isAdmin(): Promise<boolean> {
        try {
            const { data: user } = await supabase.auth.getUser();
            if (!user.user) return false;

            const { data: roleData, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.user.id)
                .single();

            if (error) {
                console.log('No role found for user, assuming player');
                return false;
            }

            return roleData?.role === 'admin';
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
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
                    is_active: true
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
            const questionsToInsert = questions.map(q => ({
                game_id: game.id,
                question_number: q.id,
                question_text: q.clue,
                answer: q.answer,
                direction: q.direction,
                start_row: q.startRow,
                start_col: q.startCol,
                length: q.answer.length
            }));

            console.log('📋 Questions to insert:', questionsToInsert);

            const { error: questionsError } = await supabase
                .from('crossword_questions')
                .insert(questionsToInsert);

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
            // Delete existing questions
            const { error: deleteError } = await supabase
                .from('crossword_questions')
                .delete()
                .eq('game_id', gameId);

            if (deleteError) {
                console.error('Error deleting old questions:', deleteError);
                return false;
            }

            // Insert new questions
            const questionsToInsert = questions.map(q => ({
                game_id: gameId,
                question_number: q.id,
                question_text: q.clue,
                answer: q.answer,
                direction: q.direction,
                start_row: q.startRow,
                start_col: q.startCol,
                length: q.answer.length
            }));

            const { error: insertError } = await supabase
                .from('crossword_questions')
                .insert(questionsToInsert);

            if (insertError) {
                console.error('Error inserting new questions:', insertError);
                return false;
            }

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
}
