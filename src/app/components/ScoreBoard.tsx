'use client';
import React from 'react';

interface ScoreBoardProps {
    score: number;
    completedQuestions: number;
    totalQuestions: number;
    onReset: () => void;
}

export default function ScoreBoard({
    score,
    completedQuestions,
    totalQuestions,
    onReset
}: ScoreBoardProps) {
    const progress = (completedQuestions / totalQuestions) * 100;

    return (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
            <h2 className="text-xl font-bold mb-4 text-center text-black">Score & Progres</h2>

            <div className="text-center mb-4">
                <div className="text-3xl font-bold text-blue-600 mb-2">{score}</div>
                <div className="text-sm text-gray-600">Score</div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progres</span>
                    <span>{completedQuestions}/{totalQuestions}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="text-center text-sm text-gray-600 mt-1">
                    {Math.round(progress)}% Selesai
                </div>
            </div>

            {completedQuestions === totalQuestions && (
                <div className="text-center mb-4">
                    <div className="text-green-600 font-bold text-lg">🎉 Selamat!</div>
                    <div className="text-sm text-gray-600">Anda telah menyelesaikan semua soal!</div>
                </div>
            )}

            <button
                onClick={onReset}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition-colors"
            >
                Reset Game
            </button>
        </div>
    );
}
