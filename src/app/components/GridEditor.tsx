'use client';
import React, { useState } from 'react';
import { CrosswordData } from '../../types/crossword';

interface GridEditorProps {
    crosswordData: CrosswordData;
    onUpdate: (data: CrosswordData) => void;
}

export default function GridEditor({ crosswordData, onUpdate }: GridEditorProps) {
    const [gridSize, setGridSize] = useState({ rows: 10, cols: 10 });
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

    const handleCellClick = (row: number, col: number) => {
        setSelectedCell({ row, col });
    };

    const handleCellChange = (row: number, col: number, value: string) => {
        const newGrid = crosswordData.grid.map((gridRow, r) =>
            gridRow.map((cell, c) => {
                if (r === row && c === col) {
                    return value.toUpperCase() || null;
                }
                return cell;
            })
        );

        onUpdate({
            ...crosswordData,
            grid: newGrid
        });
    };

    const handleClearGrid = () => {
        if (confirm('Yakin ingin mengosongkan semua grid?')) {
            const emptyGrid = Array(gridSize.rows).fill(null).map(() =>
                Array(gridSize.cols).fill(null)
            );

            onUpdate({
                ...crosswordData,
                grid: emptyGrid
            });
        }
    };

    const handleResizeGrid = () => {
        if (confirm(`Yakin ingin mengubah ukuran grid menjadi ${gridSize.rows}x${gridSize.cols}? Data yang ada mungkin hilang.`)) {
            const newGrid = Array(gridSize.rows).fill(null).map((_, r) =>
                Array(gridSize.cols).fill(null).map((_, c) => {
                    if (r < crosswordData.grid.length && c < crosswordData.grid[0].length) {
                        return crosswordData.grid[r][c];
                    }
                    return null;
                })
            );

            onUpdate({
                ...crosswordData,
                grid: newGrid
            });
        }
    };

    const fillWordInGrid = (word: string, startRow: number, startCol: number, direction: 'horizontal' | 'vertical') => {
        const newGrid = crosswordData.grid.map(row => [...row]);

        for (let i = 0; i < word.length; i++) {
            const row = direction === 'horizontal' ? startRow : startRow + i;
            const col = direction === 'horizontal' ? startCol + i : startCol;

            if (row < newGrid.length && col < newGrid[0].length) {
                newGrid[row][col] = word[i];
            }
        }

        onUpdate({
            ...crosswordData,
            grid: newGrid
        });
    };

    return (
        <div className="space-y-6">
            {/* Grid Controls */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-black">Kontrol Grid</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-black">Baris:</label>
                        <input
                            type="number"
                            value={gridSize.rows}
                            onChange={(e) => setGridSize({
                                ...gridSize,
                                rows: Math.max(1, Math.min(20, parseInt(e.target.value) || 10))
                            })}
                            min="1"
                            max="20"
                            className="w-full border rounded px-3 py-2 text-black"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-black">Kolom:</label>
                        <input
                            type="number"
                            value={gridSize.cols}
                            onChange={(e) => setGridSize({
                                ...gridSize,
                                cols: Math.max(1, Math.min(20, parseInt(e.target.value) || 10))
                            })}
                            min="1"
                            max="20"
                            className="w-full border rounded px-3 py-2 text-black"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={handleResizeGrid}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full"
                        >
                            Ubah Ukuran
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleClearGrid}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                    >
                        Kosongkan Grid
                    </button>
                </div>
            </div>

            {/* Quick Fill */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-black">Quick Fill Kata</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {crosswordData.questions.map((question) => (
                        <div key={question.id} className="flex items-center gap-2">
                            <span className="text-sm font-medium w-16 text-black">{question.answer}</span>
                            <button
                                onClick={() => fillWordInGrid(
                                    question.answer,
                                    question.startRow,
                                    question.startCol,
                                    question.direction
                                )}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                            >
                                Fill ({question.direction === 'horizontal' ? 'H' : 'V'})
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Grid Editor */}
            <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4 text-black">Editor Grid</h3>

                {selectedCell && (
                    <div className="mb-4 p-3 bg-blue-50 rounded">
                        <p className="text-sm text-blue-800">
                            Selected: Baris {selectedCell.row + 1}, Kolom {selectedCell.col + 1}
                        </p>
                    </div>
                )}

                <div className="grid gap-px bg-gray-300 p-2 rounded w-fit mx-auto"
                    style={{ gridTemplateColumns: `repeat(${crosswordData.grid[0]?.length || 10}, minmax(0, 1fr))` }}>
                    {crosswordData.grid.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`
                                    w-8 h-8 bg-white border flex items-center justify-center cursor-pointer text-xs font-bold
                                    ${selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                                        ? 'bg-blue-200 border-blue-500'
                                        : cell ? 'bg-white' : 'bg-gray-800'
                                    }
                                    hover:bg-gray-100
                                `}
                                onClick={() => handleCellClick(rowIndex, colIndex)}
                            >
                                {cell && (
                                    <input
                                        type="text"
                                        value={cell || ''}
                                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                        className="w-full h-full text-center bg-transparent border-none outline-none font-bold text-xs text-black"
                                        maxLength={1}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                )}
                                {!cell && (
                                    <input
                                        type="text"
                                        value=""
                                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                        className="w-full h-full text-center bg-transparent border-none outline-none font-bold text-xs text-white"
                                        maxLength={1}
                                        placeholder="+"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-4 text-center text-sm text-black">
                    <p>Klik pada kotak untuk memilih, kemudian ketik huruf untuk mengisi.</p>
                    <p>Kotak hitam = tidak digunakan, kotak putih = digunakan untuk kata.</p>
                </div>
            </div>
        </div>
    );
}
