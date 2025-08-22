'use client';
import React, { useState, useEffect } from 'react';
import { CrosswordData, Question } from '../../types/crossword';
import { CrosswordService } from '../../lib/crosswordService';
import { supabase } from '../../lib/supabase';

// Helper function to generate grid from questions
const generateGridFromQuestions = (questions: Question[], gridSize: { rows: number; cols: number }): (string | null)[][] => {
    // Initialize empty grid
    const grid: (string | null)[][] = Array(gridSize.rows).fill(null).map(() => Array(gridSize.cols).fill(null));

    // Fill grid with answers from questions
    questions.forEach(question => {
        for (let i = 0; i < question.answer.length; i++) {
            const row = question.direction === 'horizontal' ? question.startRow : question.startRow + i;
            const col = question.direction === 'horizontal' ? question.startCol + i : question.startCol;

            // Check bounds
            if (row >= 0 && row < gridSize.rows && col >= 0 && col < gridSize.cols) {
                grid[row][col] = question.answer[i];
            }
        }
    });

    return grid;
};

interface QuestionManagerProps {
    crosswordData: CrosswordData;
    onUpdate: (data: CrosswordData) => void;
}

export default function QuestionManager({ crosswordData, onUpdate }: QuestionManagerProps) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [newQuestion, setNewQuestion] = useState({
        clue: '',
        answer: '',
        direction: 'horizontal' as 'horizontal' | 'vertical',
        startRow: 1,
        startCol: 1
    });
    const [gridSize, setGridSize] = useState({ rows: 10, cols: 10 });
    const [isLoading, setIsLoading] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminCheckDone, setAdminCheckDone] = useState(false);

    // Check admin status on mount
    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const adminStatus = await CrosswordService.isAdmin();
                setIsAdmin(adminStatus);
                if (!adminStatus) {
                    setSaveMessage('⚠️ You need admin privileges to manage crosswords. Contact admin to get access.');
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
                setIsAdmin(false);
                setSaveMessage('❌ Error checking admin status');
            } finally {
                setAdminCheckDone(true);
            }
        };

        checkAdminStatus();
    }, []);

    // Load data from Supabase on component mount
    useEffect(() => {
        loadFromSupabase();
    }, []);

    const loadFromSupabase = async () => {
        setIsLoading(true);
        try {
            const gameData = await CrosswordService.getActiveGame();
            if (gameData && gameData.questions.length > 0) {
                const newCrosswordData = {
                    questions: gameData.questions,
                    grid: generateGridFromQuestions(gameData.questions, gridSize)
                };
                onUpdate(newCrosswordData);
                setSaveMessage('Data loaded from Supabase');
                setTimeout(() => setSaveMessage(''), 3000);
            } else {
                // Try to load from localStorage as fallback
                const localQuestions = localStorage.getItem('crosswordQuestions');
                if (localQuestions) {
                    const questions = JSON.parse(localQuestions);
                    if (questions.length > 0) {
                        setSaveMessage('Loaded from local storage - consider saving to Supabase');
                        setTimeout(() => setSaveMessage(''), 5000);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading from Supabase:', error);
            setSaveMessage('Error loading from Supabase');
            setTimeout(() => setSaveMessage(''), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const saveToSupabase = async () => {
        if (crosswordData.questions.length === 0) {
            setSaveMessage('No questions to save');
            setTimeout(() => setSaveMessage(''), 3000);
            return;
        }

        setIsLoading(true);
        try {
            const gameData = await CrosswordService.getActiveGame();
            let success = false;

            if (gameData) {
                // Update existing game
                success = await CrosswordService.updateGame(gameData.game.id, crosswordData.questions);
            } else {
                // Create new game
                const gameId = await CrosswordService.createGame('Teka-Teki Silang', crosswordData.questions);
                success = !!gameId;
            }

            if (success) {
                setSaveMessage('✅ Successfully saved to Supabase!');
                // Also save to localStorage as backup
                localStorage.setItem('crosswordQuestions', JSON.stringify(crosswordData.questions));
            } else {
                setSaveMessage('❌ Failed to save to Supabase');
            }
        } catch (error) {
            console.error('Error saving to Supabase:', error);
            setSaveMessage('❌ Error saving to Supabase');
        } finally {
            setIsLoading(false);
            setTimeout(() => setSaveMessage(''), 5000);
        }
    };

    const importFromLocalStorage = async () => {
        setIsLoading(true);
        try {
            const success = await CrosswordService.importFromLocalStorage();
            if (success) {
                setSaveMessage('✅ Successfully imported from localStorage to Supabase!');
                await loadFromSupabase(); // Reload data
            } else {
                setSaveMessage('❌ No data found in localStorage to import');
            }
        } catch (error) {
            console.error('Error importing from localStorage:', error);
            setSaveMessage('❌ Error importing from localStorage');
        } finally {
            setIsLoading(false);
            setTimeout(() => setSaveMessage(''), 5000);
        }
    };

    const testDatabaseConnection = async () => {
        setIsLoading(true);
        try {
            // Test 1: Check auth
            const { data: user } = await supabase.auth.getUser();
            if (!user.user) {
                setSaveMessage('❌ Not authenticated - please login first');
                return;
            }

            console.log('✅ Auth check passed:', user.user.id);

            // Test 2: Try to read from crossword_games table
            const { data: games, error: gamesError } = await supabase
                .from('crossword_games')
                .select('*')
                .limit(1);

            if (gamesError) {
                console.error('❌ Database read error:', gamesError);
                setSaveMessage(`❌ Database error: ${gamesError.message}. Check SUPABASE_SETUP_URGENT.md`);
                return;
            }

            console.log('✅ Database read test passed');

            // Test 3: Try to insert a test game
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
                setSaveMessage(`❌ Insert error: ${insertError.message}. Check RLS policies`);
                return;
            }

            // Clean up test game
            await supabase
                .from('crossword_games')
                .delete()
                .eq('id', testGame.id);

            console.log('✅ Database insert test passed');
            setSaveMessage('✅ Database connection test successful! You can now save to Supabase.');

        } catch (error: any) {
            console.error('❌ Test failed:', error);
            setSaveMessage(`❌ Test failed: ${error.message}`);
        } finally {
            setIsLoading(false);
            setTimeout(() => setSaveMessage(''), 8000);
        }
    };

    const handleEditQuestion = (index: number) => {
        const question = crosswordData.questions[index];
        setEditingIndex(index);
        setNewQuestion({
            clue: question.clue,
            answer: question.answer,
            direction: question.direction,
            startRow: question.startRow + 1,
            startCol: question.startCol + 1
        });
    };

    const handleSaveQuestion = () => {
        if (!newQuestion.clue.trim() || !newQuestion.answer.trim()) {
            alert('Pertanyaan dan jawaban tidak boleh kosong!');
            return;
        }

        // Validasi posisi baris dan kolom
        if (newQuestion.startRow < 1 || newQuestion.startRow > 10) {
            alert('Posisi baris harus antara 1-10!');
            return;
        }

        if (newQuestion.startCol < 1 || newQuestion.startCol > 10) {
            alert('Posisi kolom harus antara 1-10!');
            return;
        }

        // Validasi apakah jawaban muat dalam grid
        const answerLength = newQuestion.answer.trim().length;
        if (newQuestion.direction === 'horizontal') {
            if (newQuestion.startCol + answerLength - 1 > 10) {
                alert(`Jawaban terlalu panjang untuk posisi ini! Maksimal ${10 - newQuestion.startCol + 1} karakter dari kolom ${newQuestion.startCol}.`);
                return;
            }
        } else {
            if (newQuestion.startRow + answerLength - 1 > 10) {
                alert(`Jawaban terlalu panjang untuk posisi ini! Maksimal ${10 - newQuestion.startRow + 1} karakter dari baris ${newQuestion.startRow}.`);
                return;
            }
        }

        const updatedQuestions = [...crosswordData.questions];

        if (editingIndex !== null) {
            // Update existing question
            updatedQuestions[editingIndex] = {
                ...updatedQuestions[editingIndex],
                clue: newQuestion.clue.trim(),
                answer: newQuestion.answer.toUpperCase().trim(),
                direction: newQuestion.direction,
                startRow: newQuestion.startRow - 1,
                startCol: newQuestion.startCol - 1
            };
        } else {
            // Add new question
            const newId = Math.max(...crosswordData.questions.map(q => q.id)) + 1;
            updatedQuestions.push({
                id: newId,
                clue: newQuestion.clue.trim(),
                answer: newQuestion.answer.toUpperCase().trim(),
                direction: newQuestion.direction,
                startRow: newQuestion.startRow - 1,
                startCol: newQuestion.startCol - 1,
                number: newId
            });
        }

        onUpdate({
            ...crosswordData,
            questions: updatedQuestions,
            grid: generateGridFromQuestions(updatedQuestions, gridSize)
        });

        // Reset form
        setEditingIndex(null);
        setNewQuestion({
            clue: '',
            answer: '',
            direction: 'horizontal',
            startRow: 1,
            startCol: 1
        });
    };

    const handleDeleteQuestion = (index: number) => {
        if (confirm('Yakin ingin menghapus pertanyaan ini?')) {
            const updatedQuestions = crosswordData.questions.filter((_, i) => i !== index);
            onUpdate({
                ...crosswordData,
                questions: updatedQuestions,
                grid: generateGridFromQuestions(updatedQuestions, gridSize)
            });
        }
    };

    const handleCancel = () => {
        setEditingIndex(null);
        setNewQuestion({
            clue: '',
            answer: '',
            direction: 'horizontal',
            startRow: 1,
            startCol: 1
        });
    };

    return (
        <div className="space-y-6">
            {/* Supabase Operations */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-blue-900">Database Operations</h3>
                    {adminCheckDone && (
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${isAdmin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {isAdmin ? '👑 Admin' : '👤 Player'}
                        </div>
                    )}
                </div>

                {saveMessage && (
                    <div className={`mb-4 p-3 rounded ${saveMessage.includes('✅') ? 'bg-green-100 text-green-800' :
                            saveMessage.includes('❌') ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                        }`}>
                        {saveMessage}
                    </div>
                )}

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={saveToSupabase}
                        disabled={isLoading || !isAdmin}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? '⏳ Saving...' : '💾 Save to Supabase'}
                    </button>

                    <button
                        onClick={loadFromSupabase}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? '⏳ Loading...' : '📥 Load from Supabase'}
                    </button>

                    <button
                        onClick={importFromLocalStorage}
                        disabled={isLoading || !isAdmin}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? '⏳ Importing...' : '📤 Import from Local Storage'}
                    </button>

                    <button
                        onClick={testDatabaseConnection}
                        disabled={isLoading}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? '⏳ Testing...' : '🔧 Test Database'}
                    </button>
                </div>

                <p className="text-sm text-blue-700 mt-3">
                    💡 {isAdmin ? 'Admin dapat manage semua data crossword.' : 'Player hanya bisa view data.'}
                    Local storage digunakan sebagai backup.
                </p>

                <div className="text-sm text-purple-700 mt-2 p-2 bg-purple-50 rounded">
                    ⚠️ <strong>Perlu jadi admin?</strong> Jalankan file <code>setup-admin-system.sql</code> dan ganti email di dalamnya.
                </div>
            </div>
            {/* Grid Preview */}
            <div>
                <h3 className="text-lg font-semibold mb-4 text-black">Preview Grid Auto-Generated</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">
                            Grid otomatis ter-update berdasarkan pertanyaan dan posisinya.
                            Ukuran grid saat ini: {gridSize.rows}x{gridSize.cols}
                        </p>
                        <div className="flex gap-4 items-center">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-black">Baris:</label>
                                <input
                                    type="number"
                                    min="5"
                                    max="20"
                                    value={gridSize.rows}
                                    onChange={(e) => {
                                        const newSize = { ...gridSize, rows: parseInt(e.target.value) || 10 };
                                        setGridSize(newSize);
                                        onUpdate({
                                            ...crosswordData,
                                            grid: generateGridFromQuestions(crosswordData.questions, newSize)
                                        });
                                    }}
                                    className="w-16 border rounded px-2 py-1 text-black"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-black">Kolom:</label>
                                <input
                                    type="number"
                                    min="5"
                                    max="20"
                                    value={gridSize.cols}
                                    onChange={(e) => {
                                        const newSize = { ...gridSize, cols: parseInt(e.target.value) || 10 };
                                        setGridSize(newSize);
                                        onUpdate({
                                            ...crosswordData,
                                            grid: generateGridFromQuestions(crosswordData.questions, newSize)
                                        });
                                    }}
                                    className="w-16 border rounded px-2 py-1 text-black"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-px bg-gray-300 p-2 rounded w-fit mx-auto overflow-auto max-w-full"
                        style={{ gridTemplateColumns: `repeat(${gridSize.cols}, minmax(0, 1fr))` }}>
                        {generateGridFromQuestions(crosswordData.questions, gridSize).map((row, rowIndex) =>
                            row.map((cell, colIndex) => (
                                <div
                                    key={`${rowIndex}-${colIndex}`}
                                    className={`
                                        w-6 h-6 flex items-center justify-center text-xs font-bold border
                                        ${cell ? 'bg-white text-black' : 'bg-gray-800'}
                                    `}
                                >
                                    {cell || ''}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-black">
                    {editingIndex !== null ? 'Edit Pertanyaan' : 'Tambah Pertanyaan Baru'}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Posisi baris dan kolom dimulai dari 1. Grid berukuran 10x10 (1-10 untuk baris dan kolom).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-black">Arah:</label>
                        <select
                            value={newQuestion.direction}
                            onChange={(e) => setNewQuestion({
                                ...newQuestion,
                                direction: e.target.value as 'horizontal' | 'vertical'
                            })}
                            className="w-full border rounded px-3 py-2 text-black"
                        >
                            <option value="horizontal">Mendatar</option>
                            <option value="vertical">Menurun</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-black">Jawaban:</label>
                        <input
                            type="text"
                            value={newQuestion.answer}
                            onChange={(e) => setNewQuestion({
                                ...newQuestion,
                                answer: e.target.value.toUpperCase()
                            })}
                            placeholder="Masukkan jawaban..."
                            className="w-full border rounded px-3 py-2 text-black"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-black">Posisi Baris:</label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={newQuestion.startRow}
                            onChange={(e) => setNewQuestion({
                                ...newQuestion,
                                startRow: parseInt(e.target.value) || 1
                            })}
                            placeholder="1-10"
                            className="w-full border rounded px-3 py-2 text-black"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-black">Posisi Kolom:</label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={newQuestion.startCol}
                            onChange={(e) => setNewQuestion({
                                ...newQuestion,
                                startCol: parseInt(e.target.value) || 1
                            })}
                            placeholder="1-10"
                            className="w-full border rounded px-3 py-2 text-black"
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2 text-black">Pertanyaan/Petunjuk:</label>
                    <textarea
                        value={newQuestion.clue}
                        onChange={(e) => setNewQuestion({
                            ...newQuestion,
                            clue: e.target.value
                        })}
                        placeholder="Masukkan pertanyaan atau petunjuk..."
                        rows={3}
                        className="w-full border rounded px-3 py-2 resize-none text-black"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleSaveQuestion}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        {editingIndex !== null ? 'Update' : 'Tambah'}
                    </button>
                    {editingIndex !== null && (
                        <button
                            onClick={handleCancel}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                        >
                            Batal
                        </button>
                    )}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4 text-black">Daftar Pertanyaan ({crosswordData.questions.length})</h3>

                <div className="space-y-3">
                    {crosswordData.questions.map((question, index) => (
                        <div key={question.id} className="border rounded p-4 bg-white">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                                            #{index + 1}
                                        </span>
                                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                                            {question.direction === 'horizontal' ? 'Mendatar' : 'Menurun'}
                                        </span>
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-bold">
                                            {question.answer}
                                        </span>
                                    </div>
                                    <p className="text-black">{question.clue}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Posisi: Baris {question.startRow + 1}, Kolom {question.startCol + 1}
                                    </p>
                                </div>

                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handleEditQuestion(index)}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteQuestion(index)}
                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>


        </div>
    );
}
