'use client';
import React from 'react';
import { Question } from '../../types/crossword';

interface ClueListProps {
    questions: Question[];
    completedQuestions: number[];
    onQuestionClick: (question: Question) => void;
    activeQuestionId?: number;
}

export default function ClueList({
    questions,
    completedQuestions,
    onQuestionClick,
    activeQuestionId
}: ClueListProps) {
    const horizontalQuestions = questions.filter(q => q.direction === 'horizontal');
    const verticalQuestions = questions.filter(q => q.direction === 'vertical');

    const renderQuestion = (question: Question) => {
        const isCompleted = completedQuestions.includes(question.id);
        const isActive = activeQuestionId === question.id;

        // Find the global index of this question in the full questions array
        const globalIndex = questions.findIndex(q => q.id === question.id);

        return (
            <li
                key={question.id}
                className={`
          p-2 cursor-pointer rounded mb-1 transition-colors
          ${isActive ? 'bg-blue-200 border-l-4 border-blue-500 text-black' : 'text-gray-400'}
          ${isCompleted ? 'bg-green-100 text-green-800' : 'hover:bg-gray-100'}
        `}
                onClick={() => onQuestionClick(question)}
            >
                <span className="font-bold">{globalIndex + 1}.</span> {question.clue}
                {isCompleted && <span className="ml-2 text-green-600">✓</span>}
            </li>
        );
    };

    return (
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-bold mb-4 text-center text-black">Petunjuk</h2>

            <div className="mb-4">
                <h3 className="font-semibold mb-2 text-gray-700">Mendatar</h3>
                <ul className="space-y-1">
                    {horizontalQuestions.map(renderQuestion)}
                </ul>
            </div>

            <div>
                <h3 className="font-semibold mb-2 text-gray-700">Menurun</h3>
                <ul className="space-y-1">
                    {verticalQuestions.map(renderQuestion)}
                </ul>
            </div>
        </div>
    );
}
