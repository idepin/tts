'use client';
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { CrosswordService, PlayerScore } from '../../lib/crosswordService';

interface ScoreManagerProps {
    gameId: string | null;
    onScoreUpdate?: (score: PlayerScore) => void;
    // Add props to sync with ScoreBoard values
    currentScore?: number;
    completedQuestions?: number;
    totalQuestions?: number;
    isCompleted?: boolean;
}

export interface ScoreManagerRef {
    incrementScore: (points?: number) => Promise<boolean>;
    markCompleted: (completionTime: number) => Promise<boolean>;
    updateScore: (score: number, completedQuestions: number, userAnswers: any) => Promise<boolean>;
    playerScore: PlayerScore | null;
}

const ScoreManager = forwardRef<ScoreManagerRef, ScoreManagerProps>(({
    gameId,
    onScoreUpdate,
    currentScore,
    completedQuestions,
    totalQuestions,
    isCompleted
}, ref) => {
    const [playerScore, setPlayerScore] = useState<PlayerScore | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (gameId) {
            initializeScore();
        }
    }, [gameId]);

    const initializeScore = async () => {
        if (!gameId) return;

        setIsLoading(true);
        try {
            const score = await CrosswordService.getOrCreatePlayerScore(gameId);
            if (score) {
                setPlayerScore(score);
                if (onScoreUpdate) {
                    onScoreUpdate(score);
                }
                console.log('✅ Player score initialized:', score);
            }
        } catch (error) {
            console.error('❌ Error initializing score:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to be called when player answers correctly
    const incrementScore = async (points: number = 10) => {
        if (!gameId) return false;

        try {
            const success = await CrosswordService.incrementScore(gameId, points);
            if (success && playerScore) {
                // Update local state
                const newScore = {
                    ...playerScore,
                    score: playerScore.score + points,
                    correct_answers: playerScore.correct_answers + 1
                };
                setPlayerScore(newScore);
                if (onScoreUpdate) {
                    onScoreUpdate(newScore);
                }
                console.log(`✅ Score incremented by ${points}`);
            }
            return success;
        } catch (error) {
            console.error('❌ Error incrementing score:', error);
            return false;
        }
    };

    // Function to update score during auto-save
    const updateScore = async (score: number, completedQuestions: number, userAnswers: any) => {
        if (!gameId) return false;

        try {
            // Update score and completed questions
            const scoreSuccess = await CrosswordService.updatePlayerScore(gameId, {
                score: score,
                correct_answers: completedQuestions
            });

            // Save user answers separately
            const answersSuccess = await CrosswordService.saveUserAnswers(gameId, userAnswers);

            if (scoreSuccess && answersSuccess && playerScore) {
                // Update local state
                const newScore = {
                    ...playerScore,
                    score: score,
                    correct_answers: completedQuestions,
                    user_answers: userAnswers
                };
                setPlayerScore(newScore);
                if (onScoreUpdate) {
                    onScoreUpdate(newScore);
                }
                console.log(`✅ Score updated via auto-save: ${score} points, ${completedQuestions} completed`);
            }
            return scoreSuccess && answersSuccess;
        } catch (error) {
            console.error('❌ Error updating score:', error);
            return false;
        }
    };

    // Function to update completion status
    const markCompleted = async (completionTime: number) => {
        if (!gameId || !playerScore) return false;

        try {
            const success = await CrosswordService.updatePlayerScore(gameId, {
                completion_time: completionTime,
                is_completed: true
            });

            if (success) {
                const newScore = {
                    ...playerScore,
                    completion_time: completionTime,
                    is_completed: true
                };
                setPlayerScore(newScore);
                if (onScoreUpdate) {
                    onScoreUpdate(newScore);
                }
                console.log('✅ Game marked as completed');
            }
            return success;
        } catch (error) {
            console.error('❌ Error marking game as completed:', error);
            return false;
        }
    };

    // Expose methods for parent component to use
    useImperativeHandle(ref, () => ({
        incrementScore,
        markCompleted,
        updateScore,
        playerScore
    }));

    if (!gameId) {
        return null;
    }

    // Use props values for display if provided, otherwise fall back to database values
    const displayScore = currentScore !== undefined ? currentScore : (playerScore?.score || 0);
    const displayCompleted = completedQuestions !== undefined ? completedQuestions : (playerScore?.correct_answers || 0);
    const displayTotal = totalQuestions !== undefined ? totalQuestions : (playerScore?.total_questions || 0);
    const displayIsCompleted = isCompleted !== undefined ? isCompleted : (playerScore?.is_completed || false);

    return (
        <div className="score-display bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {isLoading ? '...' : displayScore}
                        </div>
                        <div className="text-xs text-gray-500">Score</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">
                            {isLoading ? '...' : displayCompleted}
                        </div>
                        <div className="text-xs text-gray-500">Progres</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-semibold text-gray-600">
                            {isLoading ? '...' : displayTotal}
                        </div>
                        <div className="text-xs text-gray-500">Total</div>
                    </div>
                </div>

                {displayIsCompleted && (
                    <div className="flex items-center gap-2 text-green-600">
                        <span className="text-xl">🎉</span>
                        <span className="text-sm font-medium">Completed!</span>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            {displayTotal > 0 && (
                <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progres</span>
                        <span>{Math.round((displayCompleted / displayTotal) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{
                                width: `${(displayCompleted / displayTotal) * 100}%`
                            }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    );
});

ScoreManager.displayName = 'ScoreManager';

export default ScoreManager;
