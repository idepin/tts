'use client';
import React, { useState, useEffect } from 'react';
import { CrosswordData } from '../../types/crossword';
import { CrosswordService, CrosswordGame } from '../../lib/crosswordService';
import { CrosswordManager } from '../../utils/CrosswordManager';
import QuestionManager from './QuestionManager';

interface EditGameModalProps {
    gameId: string | null;
    onClose: () => void;
    onGameUpdated?: () => void;
}

export default function EditGameModal({ gameId, onClose, onGameUpdated }: EditGameModalProps) {
    const [crosswordData, setCrosswordData] = useState<CrosswordData>({ questions: [], grid: [] });
    const [gameInfo, setGameInfo] = useState<CrosswordGame | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [isSavingTitle, setIsSavingTitle] = useState(false);

    useEffect(() => {
        if (gameId) {
            loadGameData();
        }
    }, [gameId]);

    const loadGameData = async () => {
        if (!gameId) return;

        setIsLoading(true);
        setError(null);

        try {
            console.log('🔍 Loading data for game:', gameId);
            const gameData = await CrosswordService.getGameById(gameId);

            if (gameData) {
                console.log('✅ Loaded game:', gameData.game.title, 'with', gameData.questions.length, 'questions');
                setGameInfo(gameData.game);

                const newCrosswordData = {
                    questions: gameData.questions,
                    grid: generateGridFromQuestions(gameData.questions, { rows: gameData.game.grid_size, cols: gameData.game.grid_size })
                };
                setCrosswordData(newCrosswordData);
            } else {
                console.log('❌ Failed to load game data');
                setError('Failed to load game data');
            }
        } catch (error) {
            console.error('❌ Error loading game data:', error);
            setError('Error loading game data');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to generate grid from questions
    const generateGridFromQuestions = (questions: any[], gridSize: { rows: number; cols: number }) => {
        const grid = Array(gridSize.rows).fill(null).map(() => Array(gridSize.cols).fill(null));
        questions.forEach(question => {
            for (let i = 0; i < question.answer.length; i++) {
                const row = question.direction === 'horizontal' ? question.startRow : question.startRow + i;
                const col = question.direction === 'horizontal' ? question.startCol + i : question.startCol;
                if (row >= 0 && row < gridSize.rows && col >= 0 && col < gridSize.cols) {
                    grid[row][col] = question.answer[i];
                }
            }
        });
        return grid;
    };

    const handleDataUpdate = (newData: CrosswordData) => {
        setCrosswordData(newData);
        CrosswordManager.getInstance().updateData(newData);
        if (onGameUpdated) {
            onGameUpdated();
        }
    };

    const handleCloseModal = () => {
        onClose();
    };

    const handleExport = () => {
        const manager = CrosswordManager.getInstance();
        const dataStr = manager.exportData();
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `crossword-${gameInfo?.title || 'game'}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                const manager = CrosswordManager.getInstance();
                if (manager.importData(content)) {
                    const newData = manager.getData();
                    setCrosswordData(newData);
                    alert('Data berhasil diimpor!');
                    if (onGameUpdated) {
                        onGameUpdated();
                    }
                } else {
                    alert('Error: Format file tidak valid!');
                }
            };
            reader.readAsText(file);
        }
        // Reset input
        event.target.value = '';
    };

    const handleReset = () => {
        if (confirm(`Yakin ingin reset game "${gameInfo?.title}" ke data default?`)) {
            const manager = CrosswordManager.getInstance();
            manager.resetToDefault();
            const newData = manager.getData();
            setCrosswordData(newData);
            if (onGameUpdated) {
                onGameUpdated();
            }
        }
    };

    const handleEditTitle = () => {
        setEditedTitle(gameInfo?.title || '');
        setIsEditingTitle(true);
    };

    const handleSaveTitle = async () => {
        if (!gameId || !editedTitle.trim()) {
            alert('Game title cannot be empty');
            return;
        }

        setIsSavingTitle(true);
        try {
            // Update game title in database
            const success = await CrosswordService.updateGameTitle(gameId, editedTitle.trim());

            if (success) {
                // Update local state
                if (gameInfo) {
                    setGameInfo({ ...gameInfo, title: editedTitle.trim() });
                }
                setIsEditingTitle(false);
                if (onGameUpdated) {
                    onGameUpdated();
                }
                console.log('✅ Game title updated successfully');
            } else {
                alert('Failed to update game title');
            }
        } catch (error) {
            console.error('❌ Error updating game title:', error);
            alert('Error updating game title');
        } finally {
            setIsSavingTitle(false);
        }
    };

    const handleCancelEditTitle = () => {
        setIsEditingTitle(false);
        setEditedTitle('');
    };

    if (!gameId) return null;

    return (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
                {/* Modal Header */}
                <div className="bg-purple-600 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="bg-purple-500 rounded-full p-2">
                            ✏️
                        </div>
                        <div className="flex-1">
                            {isEditingTitle ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={editedTitle}
                                        onChange={(e) => setEditedTitle(e.target.value)}
                                        className="bg-white/20 border border-white/30 rounded px-3 py-1 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 flex-1"
                                        placeholder="Enter game title..."
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSaveTitle();
                                            } else if (e.key === 'Escape') {
                                                handleCancelEditTitle();
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={handleSaveTitle}
                                        disabled={isSavingTitle || !editedTitle.trim()}
                                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSavingTitle ? '⏳' : '✅'}
                                    </button>
                                    <button
                                        onClick={handleCancelEditTitle}
                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                    >
                                        ❌
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold">
                                        {gameInfo ? `Edit Game: ${gameInfo.title}` : 'Edit Game'}
                                    </h2>
                                    {gameInfo && (
                                        <button
                                            onClick={handleEditTitle}
                                            className="text-purple-200 hover:text-white text-sm bg-purple-500/50 hover:bg-purple-500 px-2 py-1 rounded transition-colors"
                                            title="Edit game title"
                                        >
                                            ✏️
                                        </button>
                                    )}
                                </div>
                            )}
                            {gameInfo && !isEditingTitle && (
                                <p className="text-purple-200 text-sm">
                                    Grid: {gameInfo.grid_size}x{gameInfo.grid_size} •
                                    Created: {new Date(gameInfo.created_at).toLocaleDateString()}
                                    {gameInfo.is_active && <span className="ml-2 bg-green-500 px-2 py-1 rounded text-xs">🟢 Active</span>}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleCloseModal}
                        className="text-purple-200 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-purple-500 transition-colors ml-4"
                    >
                        ×
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading game data...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="text-red-500 text-6xl mb-4">❌</div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Game</h3>
                                <p className="text-gray-600 mb-4">{error}</p>
                                <button
                                    onClick={loadGameData}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                                >
                                    🔄 Retry
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h3 className="text-lg font-semibold text-blue-900 mb-2">📝 Question Manager</h3>
                                <p className="text-blue-700 text-sm">
                                    Add, edit, or remove questions for this crossword game.
                                    Changes are automatically saved to the database.
                                </p>
                                {crosswordData.questions.length > 0 && (
                                    <p className="text-blue-600 text-sm mt-2">
                                        Current questions: <strong>{crosswordData.questions.length}</strong>
                                    </p>
                                )}

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-blue-200">
                                    <button
                                        onClick={handleExport}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm transition-colors"
                                    >
                                        📤 Export JSON
                                    </button>
                                    <label className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded text-sm transition-colors cursor-pointer">
                                        📥 Import JSON
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={handleImport}
                                            className="hidden"
                                        />
                                    </label>
                                    <button
                                        onClick={handleReset}
                                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm transition-colors"
                                    >
                                        🔄 Reset Default
                                    </button>
                                </div>
                            </div>

                            <QuestionManager
                                crosswordData={crosswordData}
                                currentGameId={gameId}
                                onUpdate={handleDataUpdate}
                            />
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                    <div className="text-sm text-gray-600">
                        💡 <strong>Tip:</strong> All changes are automatically saved to the database
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleCloseModal}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded transition-colors"
                        >
                            ✅ Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
