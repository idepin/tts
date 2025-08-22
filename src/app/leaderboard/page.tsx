'use client';
import React, { useState, useEffect } from 'react';
import { CrosswordService, PlayerScore, CrosswordGame } from '../../lib/crosswordService';
import ProtectedRoute from '../components/ProtectedRoute';

interface LeaderboardEntry extends PlayerScore {
    user_email?: string;
    game_title?: string;
}

export default function Leaderboard() {
    const [scores, setScores] = useState<LeaderboardEntry[]>([]);
    const [games, setGames] = useState<CrosswordGame[]>([]);
    const [selectedGameId, setSelectedGameId] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadGames();
    }, []);

    useEffect(() => {
        if (selectedGameId) {
            loadScores();
        }
    }, [selectedGameId]);

    const loadGames = async () => {
        try {
            const allGames = await CrosswordService.getAllGames();
            setGames(allGames);
            console.log('✅ Loaded games for leaderboard');
        } catch (error) {
            console.error('❌ Error loading games:', error);
            setError('Failed to load games');
        }
    };

    const loadScores = async () => {
        setIsLoading(true);
        setError(null);

        try {
            let allScores: PlayerScore[] = [];

            if (selectedGameId === 'all') {
                // Load scores from all games
                for (const game of games) {
                    const gameScores = await CrosswordService.getGameLeaderboard(game.id, 50);
                    // Add game title to each score
                    const scoresWithGameTitle = gameScores.map(score => ({
                        ...score,
                        game_title: game.title
                    }));
                    allScores = [...allScores, ...scoresWithGameTitle];
                }
                // Sort by score descending
                allScores.sort((a, b) => b.score - a.score);
            } else {
                // Load scores for specific game
                allScores = await CrosswordService.getGameLeaderboard(selectedGameId, 50);
                const selectedGame = games.find(g => g.id === selectedGameId);
                allScores = allScores.map(score => ({
                    ...score,
                    game_title: selectedGame?.title || 'Unknown Game'
                }));
            }

            setScores(allScores);
            console.log('✅ Loaded scores:', allScores.length);
        } catch (error) {
            console.error('❌ Error loading scores:', error);
            setError('Failed to load scores');
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds: number): string => {
        if (seconds === 0) return 'Not completed';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const getCompletionPercentage = (score: PlayerScore): number => {
        if (score.total_questions === 0) return 0;
        return Math.round((score.correct_answers / score.total_questions) * 100);
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-100 p-4">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-3xl font-bold text-black">🏆 Leaderboard</h1>
                            <div className="flex items-center gap-4">
                                <a
                                    href="/gameplay"
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                                >
                                    🎮 Play Game
                                </a>
                                <a
                                    href="/admin"
                                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded transition-colors"
                                >
                                    ⚙️ Admin
                                </a>
                            </div>
                        </div>

                        {/* Game Filter */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Game:
                            </label>
                            <select
                                value={selectedGameId}
                                onChange={(e) => setSelectedGameId(e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 text-black bg-white"
                            >
                                <option value="all">All Games</option>
                                {games.map(game => (
                                    <option key={game.id} value={game.id}>
                                        {game.title} {game.is_active && '(Active)'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-800">{error}</p>
                                <button
                                    onClick={loadScores}
                                    className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
                                >
                                    🔄 Retry
                                </button>
                            </div>
                        )}

                        {/* Loading */}
                        {isLoading && (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                                <p className="ml-4 text-gray-600">Loading scores...</p>
                            </div>
                        )}

                        {/* Scores Table */}
                        {!isLoading && scores.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-200">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-800">Rank</th>
                                            <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-800">Player</th>
                                            {selectedGameId === 'all' && (
                                                <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-800">Game</th>
                                            )}
                                            <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-800">Score</th>
                                            <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-800">Progress</th>
                                            <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-800">Completion</th>
                                            <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-800">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {scores.map((score, index) => (
                                            <tr key={`${score.user_id}-${score.game_id}`} className={index < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                                                <td className="border border-gray-200 px-4 py-3">
                                                    <div className="flex items-center">
                                                        {index === 0 && '🥇'}
                                                        {index === 1 && '🥈'}
                                                        {index === 2 && '🥉'}
                                                        {index > 2 && <span className="text-gray-600">#{index + 1}</span>}
                                                    </div>
                                                </td>
                                                <td className="border border-gray-200 px-4 py-3">
                                                    <div className="font-medium text-gray-900">
                                                        {score.user_email || `User ${score.user_id.slice(0, 8)}...`}
                                                    </div>
                                                </td>
                                                {selectedGameId === 'all' && (
                                                    <td className="border border-gray-200 px-4 py-3">
                                                        <div className="text-sm text-gray-600">
                                                            {score.game_title}
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="border border-gray-200 px-4 py-3 text-center">
                                                    <div className="text-xl font-bold text-blue-600">
                                                        {score.score}
                                                    </div>
                                                </td>
                                                <td className="border border-gray-200 px-4 py-3 text-center">
                                                    <div className="text-sm">
                                                        {score.correct_answers}/{score.total_questions}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {getCompletionPercentage(score)}%
                                                    </div>
                                                </td>
                                                <td className="border border-gray-200 px-4 py-3 text-center">
                                                    {score.is_completed ? (
                                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                                            ✅ Complete
                                                        </span>
                                                    ) : (
                                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                                                            ⏳ In Progress
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="border border-gray-200 px-4 py-3 text-center text-sm text-gray-600">
                                                    {formatTime(score.completion_time)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* No Scores */}
                        {!isLoading && scores.length === 0 && !error && (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-6xl mb-4">🏆</div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Scores Yet</h3>
                                <p className="text-gray-600 mb-4">
                                    Be the first to play and set a score!
                                </p>
                                <a
                                    href="/gameplay"
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors"
                                >
                                    🎮 Start Playing
                                </a>
                            </div>
                        )}

                        {/* Stats Summary */}
                        {scores.length > 0 && (
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600">{scores.length}</div>
                                    <div className="text-sm text-blue-800">Total Players</div>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {scores.filter(s => s.is_completed).length}
                                    </div>
                                    <div className="text-sm text-green-800">Completed</div>
                                </div>
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-yellow-600">
                                        {scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0}
                                    </div>
                                    <div className="text-sm text-yellow-800">Highest Score</div>
                                </div>
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {scores.length > 0 ? Math.round(scores.reduce((acc, s) => acc + s.score, 0) / scores.length) : 0}
                                    </div>
                                    <div className="text-sm text-purple-800">Average Score</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
