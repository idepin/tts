'use client';
import React, { useState, useEffect, useCallback } from 'react';
import WordBox from '../components/WordBox';
import ClueList from '../components/ClueList';
import ScoreBoard from '../components/ScoreBoard';
import QuestionEditor from '../components/QuestionEditor';
import { Question, GameState } from '../../types/crossword';
import { calculateScore } from '../../data/simpleCrosswordData';
import { CrosswordManager } from '../../utils/CrosswordManager';

export default function Gameplay() {
    const [crosswordData, setCrosswordData] = useState(() =>
        CrosswordManager.getInstance().getData()
    );
    const [gameState, setGameState] = useState<GameState>({
        userAnswers: {},
        score: 0,
        completedQuestions: [],
        isCompleted: false
    });
    const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);

    // Load latest data when component mounts and on window focus
    useEffect(() => {
        const loadData = () => {
            setCrosswordData(CrosswordManager.getInstance().getData());
        };

        loadData();
        window.addEventListener('focus', loadData);
        return () => window.removeEventListener('focus', loadData);
    }, []);

    const checkCompletion = useCallback(() => {
        const completedQuestions: number[] = [];

        crosswordData.questions.forEach(question => {
            let isComplete = true;
            for (let i = 0; i < question.answer.length; i++) {
                const row = question.direction === 'horizontal' ? question.startRow : question.startRow + i;
                const col = question.direction === 'horizontal' ? question.startCol + i : question.startCol;
                const cellKey = `${row}-${col}`;

                if (gameState.userAnswers[cellKey] !== question.answer[i]) {
                    isComplete = false;
                    break;
                }
            }

            if (isComplete) {
                completedQuestions.push(question.id);
            }
        });

        const score = calculateScore(completedQuestions.length, crosswordData.questions.length);
        const isCompleted = completedQuestions.length === crosswordData.questions.length;

        setGameState(prev => ({
            ...prev,
            completedQuestions,
            score,
            isCompleted
        }));
    }, [gameState.userAnswers, crosswordData.questions]);

    useEffect(() => {
        checkCompletion();
    }, [checkCompletion]);

    const handleCellClick = (row: number, col: number) => {
        if (crosswordData.grid[row][col] === null) return;

        // Find questions that intersect with this cell
        const intersectingQuestions = crosswordData.questions.filter(question => {
            if (question.direction === 'horizontal') {
                return row === question.startRow &&
                    col >= question.startCol &&
                    col < question.startCol + question.answer.length;
            } else {
                return col === question.startCol &&
                    row >= question.startRow &&
                    row < question.startRow + question.answer.length;
            }
        });

        if (intersectingQuestions.length > 0) {
            setActiveQuestion(intersectingQuestions[0]);
        }
    };

    const handleInputChange = (row: number, col: number, value: string) => {
        const cellKey = `${row}-${col}`;
        setGameState(prev => ({
            ...prev,
            userAnswers: {
                ...prev.userAnswers,
                [cellKey]: value
            }
        }));
    };

    const handleQuestionClick = (question: Question) => {
        setActiveQuestion(question);
    };

    const handleReset = () => {
        setGameState({
            userAnswers: {},
            score: 0,
            completedQuestions: [],
            isCompleted: false
        });
        setActiveQuestion(null);
    };

    const handleUpdateQuestions = (newQuestions: Question[]) => {
        const updatedData = {
            ...crosswordData,
            questions: newQuestions
        };
        setCrosswordData(updatedData);
        CrosswordManager.getInstance().updateData(updatedData);
        handleReset(); // Reset game when questions are updated
    };

    const isNumberedCell = (row: number, col: number): { isNumbered: boolean; number?: number } => {
        // Find questions that start at this position
        const questionsAtPosition = crosswordData.questions.filter(q =>
            q.startRow === row && q.startCol === col
        );

        if (questionsAtPosition.length === 0) {
            return { isNumbered: false };
        }

        // Get the first question at this position and calculate its global display number
        const question = questionsAtPosition[0];
        const globalIndex = crosswordData.questions.findIndex(q => q.id === question.id);

        return {
            isNumbered: true,
            number: globalIndex + 1
        };
    };

    const isCellInActiveQuestion = (row: number, col: number): boolean => {
        if (!activeQuestion) return false;

        if (activeQuestion.direction === 'horizontal') {
            return row === activeQuestion.startRow &&
                col >= activeQuestion.startCol &&
                col < activeQuestion.startCol + activeQuestion.answer.length;
        } else {
            return col === activeQuestion.startCol &&
                row >= activeQuestion.startRow &&
                row < activeQuestion.startRow + activeQuestion.answer.length;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-6 text-black">Teka-Teki Silang</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Crossword Grid */}
                    <div className="lg:col-span-2 flex justify-center">
                        <div className="bg-white p-4 rounded-lg shadow-lg">
                            <div className="grid grid-cols-10 gap-px w-fit mx-auto">
                                {crosswordData.grid.map((row, rowIndex) =>
                                    row.map((cell, colIndex) => {
                                        const cellKey = `${rowIndex}-${colIndex}`;
                                        const { isNumbered, number } = isNumberedCell(rowIndex, colIndex);
                                        const isActive = isCellInActiveQuestion(rowIndex, colIndex);
                                        const isCorrect = gameState.completedQuestions.some(qId => {
                                            const question = crosswordData.questions.find(q => q.id === qId);
                                            if (!question) return false;

                                            if (question.direction === 'horizontal') {
                                                return rowIndex === question.startRow &&
                                                    colIndex >= question.startCol &&
                                                    colIndex < question.startCol + question.answer.length;
                                            } else {
                                                return colIndex === question.startCol &&
                                                    rowIndex >= question.startRow &&
                                                    rowIndex < question.startRow + question.answer.length;
                                            }
                                        });

                                        return (
                                            <WordBox
                                                key={cellKey}
                                                letter={cell}
                                                isActive={isActive}
                                                isCorrect={isCorrect}
                                                isNumbered={isNumbered}
                                                number={number}
                                                value={gameState.userAnswers[cellKey] || ''}
                                                onClick={() => handleCellClick(rowIndex, colIndex)}
                                                onInputChange={(value) => handleInputChange(rowIndex, colIndex, value)}
                                                readOnly={false}
                                            />
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Side Panel */}
                    <div className="space-y-4">
                        <ScoreBoard
                            score={gameState.score}
                            completedQuestions={gameState.completedQuestions.length}
                            totalQuestions={crosswordData.questions.length}
                            onReset={handleReset}
                        />

                        <ClueList
                            questions={crosswordData.questions}
                            completedQuestions={gameState.completedQuestions}
                            onQuestionClick={handleQuestionClick}
                            activeQuestionId={activeQuestion?.id}
                        />

                        <QuestionEditor
                            questions={crosswordData.questions}
                            onUpdateQuestions={handleUpdateQuestions}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
