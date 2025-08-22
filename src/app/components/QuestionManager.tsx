'use client';
import React, { useState } from 'react';
import { CrosswordData, Question } from '../../types/crossword';

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
