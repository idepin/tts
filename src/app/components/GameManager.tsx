'use client';
import React, { useState, useEffect } from 'react';
import { CrosswordService, CrosswordGame } from '../../lib/crosswordService';

interface GameManagerProps {
    onGameSelect: (gameId: string | null) => void;
    currentGameId: string | null;
}

export default function GameManager({ onGameSelect, currentGameId }: GameManagerProps) {
    const [games, setGames] = useState<CrosswordGame[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newGameData, setNewGameData] = useState({
        title: '',
        description: '',
        gridSize: 10
    });

    useEffect(() => {
        loadGames();
    }, []);

    const loadGames = async () => {
        setIsLoading(true);
        try {
            const allGames = await CrosswordService.getAllGames();
            setGames(allGames);
            setMessage('Games loaded successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error loading games:', error);
            setMessage('Error loading games');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateGame = async () => {
        if (!newGameData.title.trim()) {
            setMessage('Game title is required');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setIsLoading(true);
        try {
            // Create game with empty questions for now
            const gameId = await CrosswordService.createGame(newGameData.title.trim(), []);

            if (gameId) {
                setMessage('✅ Game created successfully!');
                setNewGameData({ title: '', description: '', gridSize: 10 });
                setShowCreateForm(false);
                await loadGames(); // Reload games list
                onGameSelect(gameId); // Select the new game
            } else {
                setMessage('❌ Failed to create game');
            }
        } catch (error) {
            console.error('Error creating game:', error);
            setMessage('❌ Error creating game');
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    const handleActivateGame = async (gameId: string) => {
        setIsLoading(true);
        try {
            // Use the improved updateGameStatus that handles deactivation automatically
            const success = await CrosswordService.updateGameStatus(gameId, true);

            if (success) {
                setMessage('✅ Game activated successfully! All other games deactivated.');
                await loadGames(); // Reload to update status
                onGameSelect(gameId);
            } else {
                setMessage('❌ Failed to activate game');
            }
        } catch (error) {
            console.error('Error activating game:', error);
            setMessage('❌ Error activating game');
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    const handleDeleteGame = async (gameId: string, gameTitle: string) => {
        if (!confirm(`Are you sure you want to delete "${gameTitle}"? This action cannot be undone.`)) {
            return;
        }

        setIsLoading(true);
        try {
            const success = await CrosswordService.deleteGame(gameId);

            if (success) {
                setMessage('✅ Game deleted successfully!');
                await loadGames(); // Reload games list
                if (currentGameId === gameId) {
                    onGameSelect(null); // Clear selection if current game was deleted
                }
            } else {
                setMessage('❌ Failed to delete game');
            }
        } catch (error) {
            console.error('Error deleting game:', error);
            setMessage('❌ Error deleting game');
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-purple-900">🎮 Game Management</h3>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
                    >
                        {showCreateForm ? '❌ Cancel' : '➕ New Game'}
                    </button>
                </div>

                {message && (
                    <div className={`mb-4 p-3 rounded ${message.includes('✅') ? 'bg-green-100 text-green-800' :
                            message.includes('❌') ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                        }`}>
                        {message}
                    </div>
                )}

                {/* Create Game Form */}
                {showCreateForm && (
                    <div className="bg-white border border-purple-200 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-purple-900 mb-3">Create New Game</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Game Title *
                                </label>
                                <input
                                    type="text"
                                    value={newGameData.title}
                                    onChange={(e) => setNewGameData({ ...newGameData, title: e.target.value })}
                                    placeholder="Enter game title..."
                                    className="w-full border rounded px-3 py-2 text-black"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={newGameData.description}
                                    onChange={(e) => setNewGameData({ ...newGameData, description: e.target.value })}
                                    placeholder="Enter game description..."
                                    rows={2}
                                    className="w-full border rounded px-3 py-2 text-black resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Grid Size
                                </label>
                                <select
                                    value={newGameData.gridSize}
                                    onChange={(e) => setNewGameData({ ...newGameData, gridSize: parseInt(e.target.value) })}
                                    className="w-full border rounded px-3 py-2 text-black"
                                >
                                    <option value={8}>8x8</option>
                                    <option value={10}>10x10</option>
                                    <option value={12}>12x12</option>
                                    <option value={15}>15x15</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCreateGame}
                                    disabled={isLoading || !newGameData.title.trim()}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? '⏳ Creating...' : '✅ Create Game'}
                                </button>
                                <button
                                    onClick={() => setShowCreateForm(false)}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Refresh Button */}
                <div className="flex gap-2">
                    <button
                        onClick={loadGames}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
                    </button>
                </div>
            </div>

            {/* Games List */}
            <div>
                <h4 className="text-lg font-semibold mb-4 text-black">
                    All Games ({games.length})
                </h4>

                {games.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                        <div className="text-gray-400 text-4xl mb-2">🎮</div>
                        <p className="text-gray-600">No games found. Create your first game!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {games.map((game) => (
                            <div
                                key={game.id}
                                className={`border rounded-lg p-4 ${game.is_active
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-white border-gray-200'
                                    } ${currentGameId === game.id
                                        ? 'ring-2 ring-blue-500'
                                        : ''
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h5 className="font-semibold text-black">{game.title}</h5>
                                            {game.is_active && (
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                                    🟢 Active
                                                </span>
                                            )}
                                            {currentGameId === game.id && (
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                                    📝 Editing
                                                </span>
                                            )}
                                        </div>
                                        {game.description && (
                                            <p className="text-sm text-gray-600 mb-2">{game.description}</p>
                                        )}
                                        <div className="text-xs text-gray-500">
                                            <p>Created: {new Date(game.created_at).toLocaleDateString()}</p>
                                            <p>Grid: {game.grid_size}x{game.grid_size}</p>
                                            <p>ID: {game.id}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 ml-4">
                                        <button
                                            onClick={() => onGameSelect(game.id)}
                                            className={`px-3 py-1 rounded text-sm ${currentGameId === game.id
                                                    ? 'bg-blue-100 text-blue-800 cursor-default'
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                }`}
                                            disabled={currentGameId === game.id}
                                        >
                                            {currentGameId === game.id ? '📝 Editing' : '✏️ Edit'}
                                        </button>

                                        {!game.is_active && (
                                            <button
                                                onClick={() => handleActivateGame(game.id)}
                                                disabled={isLoading}
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                                            >
                                                🟢 Activate
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDeleteGame(game.id, game.title)}
                                            disabled={isLoading || game.is_active}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            title={game.is_active ? "Cannot delete active game" : "Delete game"}
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                <p><strong>💡 Tips:</strong></p>
                <ul className="mt-1 space-y-1 text-xs">
                    <li>• Only one game can be active at a time</li>
                    <li>• Active games are visible to players</li>
                    <li>• Cannot delete active games - deactivate first</li>
                    <li>• Create a game first, then add questions using Question Manager below</li>
                </ul>
            </div>
        </div>
    );
}
