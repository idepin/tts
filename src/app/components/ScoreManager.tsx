'use client';
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { CrosswordService, PlayerScore } from '../../lib/crosswordService';

interface ScoreManagerProps {
    gameId: string | null;
    onScoreUpdate?: (score: PlayerScore) => void;
}

export interface ScoreManagerRef {
    incrementScore: (points?: number) => Promise<boolean>;
    markCompleted: (completionTime: number) => Promise<boolean>;
    playerScore: PlayerScore | null;
}

const ScoreManager = forwardRef<ScoreManagerRef, ScoreManagerProps>(({ gameId, onScoreUpdate }, ref) => {
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
        playerScore
    }));

    if (!gameId) {
        return null;
    }

    return (
        <div className="score-display bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {isLoading ? '...' : playerScore?.score || 0}
                        </div>
                        <div className="text-xs text-gray-500">Score</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">
                            {isLoading ? '...' : playerScore?.correct_answers || 0}
                        </div>
                        <div className="text-xs text-gray-500">Correct</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-semibold text-gray-600">
                            {isLoading ? '...' : playerScore?.total_questions || 0}
                        </div>
                        <div className="text-xs text-gray-500">Total</div>
                    </div>
                </div>

                {playerScore?.is_completed && (
                    <div className="flex items-center gap-2 text-green-600">
                        <span className="text-xl">🎉</span>
                        <span className="text-sm font-medium">Completed!</span>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            {playerScore && playerScore.total_questions > 0 && (
                <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{Math.round((playerScore.correct_answers / playerScore.total_questions) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{
                                width: `${(playerScore.correct_answers / playerScore.total_questions) * 100}%`
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
