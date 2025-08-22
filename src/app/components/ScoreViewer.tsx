'use client';
import React, { useState, useEffect } from 'react';
import { CrosswordService, PlayerScore, CrosswordGame } from '../../lib/crosswordService';

interface ScoreViewerProps {
    isAdmin: boolean;
}

interface ScoreWithDetails extends PlayerScore {
    user_email?: string;
    game_title?: string;
}

export default function ScoreViewer({ isAdmin }: ScoreViewerProps) {
    const [scores, setScores] = useState<ScoreWithDetails[]>([]);
    const [games, setGames] = useState<CrosswordGame[]>([]);
    const [selectedGameId, setSelectedGameId] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'score' | 'date' | 'completion'>('score');

    useEffect(() => {
        if (isAdmin) {
            loadGames();
        }
    }, [isAdmin]);

    useEffect(() => {
        if (isAdmin && games.length > 0) {
            loadScores();
        }
    }, [isAdmin, games, selectedGameId, sortBy]);

    const loadGames = async () => {
        try {
            const allGames = await CrosswordService.getAllGames();
            setGames(allGames);
        } catch (error) {
            console.error('❌ Error loading games:', error);
            setError('Failed to load games');
        }
    };

    const loadScores = async () => {
        setIsLoading(true);
        setError(null);

        try {
            let allScores: ScoreWithDetails[] = [];

            if (selectedGameId === 'all') {
                // Load scores from all games
                for (const game of games) {
                    const gameScores = await CrosswordService.getGameLeaderboard(game.id, 100);
                    const scoresWithDetails = gameScores.map(score => ({
                        ...score,
                        game_title: game.title
                    }));
                    allScores = [...allScores, ...scoresWithDetails];
                }
            } else {
                // Load scores for specific game
                const gameScores = await CrosswordService.getGameLeaderboard(selectedGameId, 100);
                const selectedGame = games.find(g => g.id === selectedGameId);
                allScores = gameScores.map(score => ({
                    ...score,
                    game_title: selectedGame?.title || 'Unknown Game'
                }));
            }

            // Sort scores based on selected criteria
            allScores.sort((a, b) => {
                switch (sortBy) {
                    case 'score':
                        return b.score - a.score;
                    case 'date':
                        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
                    case 'completion':
                        if (a.is_completed && !b.is_completed) return -1;
                        if (!a.is_completed && b.is_completed) return 1;
                        return b.score - a.score;
                    default:
                        return b.score - a.score;
                }
            });

            setScores(allScores);
            console.log('✅ Admin loaded scores:', allScores.length);
        } catch (error) {
            console.error('❌ Error loading scores:', error);
            setError('Failed to load scores');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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

    const exportScores = () => {
        const csvData = [
            ['Player ID', 'Game', 'Score', 'Correct Answers', 'Total Questions', 'Completion %', 'Completed', 'Time (seconds)', 'Created', 'Updated'],
            ...scores.map(score => [
                score.user_id,
                score.game_title || 'Unknown',
                score.score,
                score.correct_answers,
                score.total_questions,
                getCompletionPercentage(score),
                score.is_completed ? 'Yes' : 'No',
                score.completion_time,
                formatDate(score.created_at),
                formatDate(score.updated_at)
            ])
        ];

        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `crossword-scores-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (!isAdmin) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                    👑 Admin access required to view all player scores
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-green-900">📊 Player Scores Dashboard</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={exportScores}
                            disabled={scores.length === 0}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            📥 Export CSV
                        </button>
                        <button
                            onClick={loadScores}
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                        >
                            {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-green-700 mb-1">
                            Filter by Game:
                        </label>
                        <select
                            value={selectedGameId}
                            onChange={(e) => setSelectedGameId(e.target.value)}
                            className="w-full border border-green-300 rounded px-3 py-2 text-black bg-white"
                        >
                            <option value="all">All Games</option>
                            {games.map(game => (
                                <option key={game.id} value={game.id}>
                                    {game.title} {game.is_active && '(Active)'}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-green-700 mb-1">
                            Sort by:
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'score' | 'date' | 'completion')}
                            className="w-full border border-green-300 rounded px-3 py-2 text-black bg-white"
                        >
                            <option value="score">Highest Score</option>
                            <option value="date">Most Recent</option>
                            <option value="completion">Completion Status</option>
                        </select>
                    </div>
                </div>

                {/* Stats Overview */}
                {scores.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-white rounded p-3 text-center">
                            <div className="text-lg font-bold text-blue-600">{scores.length}</div>
                            <div className="text-xs text-gray-600">Total Players</div>
                        </div>
                        <div className="bg-white rounded p-3 text-center">
                            <div className="text-lg font-bold text-green-600">
                                {scores.filter(s => s.is_completed).length}
                            </div>
                            <div className="text-xs text-gray-600">Completed</div>
                        </div>
                        <div className="bg-white rounded p-3 text-center">
                            <div className="text-lg font-bold text-yellow-600">
                                {scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0}
                            </div>
                            <div className="text-xs text-gray-600">Top Score</div>
                        </div>
                        <div className="bg-white rounded p-3 text-center">
                            <div className="text-lg font-bold text-purple-600">
                                {scores.length > 0 ? Math.round(scores.reduce((acc, s) => acc + getCompletionPercentage(s), 0) / scores.length) : 0}%
                            </div>
                            <div className="text-xs text-gray-600">Avg Progress</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    <p className="ml-3 text-gray-600">Loading player scores...</p>
                </div>
            )}

            {/* Scores Table */}
            {!isLoading && scores.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Player</th>
                                    {selectedGameId === 'all' && (
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Game</th>
                                    )}
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Progress</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Time</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Last Updated</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {scores.map((score, index) => (
                                    <tr key={`${score.user_id}-${score.game_id}`} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900">
                                                    {score.user_email || `User ${score.user_id.slice(0, 8)}...`}
                                                </div>
                                                <div className="text-gray-500 text-xs">
                                                    ID: {score.user_id.slice(0, 12)}...
                                                </div>
                                            </div>
                                        </td>
                                        {selectedGameId === 'all' && (
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-gray-900">{score.game_title}</div>
                                            </td>
                                        )}
                                        <td className="px-4 py-3 text-center">
                                            <div className="text-lg font-semibold text-blue-600">{score.score}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="text-sm">
                                                {score.correct_answers}/{score.total_questions}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {getCompletionPercentage(score)}%
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {score.is_completed ? (
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                    Complete
                                                </span>
                                            ) : (
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                    In Progress
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-600">
                                            {formatTime(score.completion_time)}
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-600">
                                            {formatDate(score.updated_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* No Scores */}
            {!isLoading && scores.length === 0 && !error && (
                <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">📊</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No Scores Found</h3>
                    <p className="text-gray-600">
                        {selectedGameId === 'all'
                            ? 'No player scores recorded yet.'
                            : 'No scores found for the selected game.'
                        }
                    </p>
                </div>
            )}
        </div>
    );
}
