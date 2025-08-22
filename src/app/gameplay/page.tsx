'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import WordBox from '../components/WordBox';
import ClueList from '../components/ClueList';
import ScoreManager, { ScoreManagerRef } from '../components/ScoreManager';
import AutoSaveIndicator from '../components/AutoSaveIndicator';
import ProtectedRoute from '../components/ProtectedRoute';
import { Question, GameState } from '../../types/crossword';
import { calculateScore } from '../../data/simpleCrosswordData';
import { CrosswordManager } from '../../utils/CrosswordManager';
import { CrosswordService } from '../../lib/crosswordService';
import { useAuth } from '../../contexts/AuthContext';

export default function Gameplay() {
    const { user, signOut } = useAuth();
    const scoreManagerRef = useRef<ScoreManagerRef>(null);
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
    const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminCheckLoading, setAdminCheckLoading] = useState(true);
    const [currentGameId, setCurrentGameId] = useState<string | null>(null);
    const [gameInfo, setGameInfo] = useState<{ title: string; description?: string } | null>(null);
    const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
    const [isAutoSaving, setIsAutoSaving] = useState(false);

    // Check admin status
    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const adminStatus = await CrosswordService.isAdmin();
                setIsAdmin(adminStatus);
            } catch (error) {
                console.error('Error checking admin status:', error);
                setIsAdmin(false);
            } finally {
                setAdminCheckLoading(false);
            }
        };

        checkAdminStatus();
    }, []);

    // Load latest data when component mounts and on window focus
    useEffect(() => {
        const generateGridFromQuestions = (questions: Question[]): (string | null)[][] => {
            const gridSize = 10;
            const grid: (string | null)[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));

            questions.forEach(question => {
                for (let i = 0; i < question.answer.length; i++) {
                    const row = question.direction === 'horizontal' ? question.startRow : question.startRow + i;
                    const col = question.direction === 'horizontal' ? question.startCol + i : question.startCol;

                    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
                        grid[row][col] = question.answer[i];
                    }
                }
            });

            return grid;
        };

        const loadData = async () => {
            try {
                // First try to load from Supabase
                const gameData = await CrosswordService.getActiveGame();
                if (gameData && gameData.questions.length > 0) {
                    // Set current game ID for score tracking
                    setCurrentGameId(gameData.game.id);

                    // Set game info for display
                    setGameInfo({
                        title: gameData.game.title,
                        description: gameData.game.description
                    });

                    // Update CrosswordManager with Supabase data
                    const manager = CrosswordManager.getInstance();
                    manager.updateData({
                        questions: gameData.questions,
                        grid: generateGridFromQuestions(gameData.questions)
                    });
                    setCrosswordData(manager.getData());
                    console.log('Loaded crossword data from Supabase, Game ID:', gameData.game.id);

                    // Load saved user answers for this game
                    const savedAnswers = await CrosswordService.loadUserAnswers(gameData.game.id);
                    if (savedAnswers && Object.keys(savedAnswers).length > 0) {
                        console.log('✅ Loaded saved user answers:', Object.keys(savedAnswers).length, 'answers');
                        setGameState(prev => ({
                            ...prev,
                            userAnswers: savedAnswers
                        }));
                    } else {
                        // No saved answers, ensure state is clean
                        setGameState(prev => ({
                            ...prev,
                            userAnswers: {},
                            completedQuestions: [],
                            score: 0,
                            isCompleted: false
                        }));
                    }
                } else {
                    // Fallback to localStorage/default data
                    setCurrentGameId(null); // No active game for score tracking
                    setGameInfo(null); // No game info
                    setCrosswordData(CrosswordManager.getInstance().getData());
                    console.log('Loaded crossword data from local storage');
                }
            } catch (error) {
                console.error('Error loading crossword data:', error);
                // Fallback to localStorage/default data
                setCurrentGameId(null);
                setGameInfo(null);
                setCrosswordData(CrosswordManager.getInstance().getData());
            }
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
                const userAnswer = gameState.userAnswers[cellKey];
                const correctAnswer = question.answer[i];

                if (!userAnswer || userAnswer.toUpperCase() !== correctAnswer.toUpperCase()) {
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
    }, [crosswordData.questions, gameState.userAnswers]);

    // Simple useEffect for checking completion on userAnswers change
    useEffect(() => {
        if (crosswordData.questions.length > 0) {
            checkCompletion();
        }
    }, [gameState.userAnswers, checkCompletion]);

    const handleCellClick = (row: number, col: number) => {
        if (crosswordData.grid[row][col] === null) return;

        // Don't allow clicking on cells that are already correct
        if (isCellCorrect(row, col)) return;

        // Set focused cell
        setFocusedCell({ row, col });

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

    const handleKeyDown = (row: number, col: number, e: React.KeyboardEvent) => {
        if (!activeQuestion) return;

        let nextRow = row;
        let nextCol = col;

        switch (e.key) {
            case 'Backspace':
                if (!gameState.userAnswers[`${row}-${col}`]) {
                    // If current cell is empty, move to previous cell
                    if (activeQuestion.direction === 'horizontal') {
                        nextCol = col - 1;
                        if (nextCol >= activeQuestion.startCol &&
                            crosswordData.grid[nextRow][nextCol] !== null) {
                            setFocusedCell({ row: nextRow, col: nextCol });
                        }
                    } else {
                        nextRow = row - 1;
                        if (nextRow >= activeQuestion.startRow &&
                            crosswordData.grid[nextRow][nextCol] !== null) {
                            setFocusedCell({ row: nextRow, col: nextCol });
                        }
                    }
                }
                break;
        }
    };

    const handleInputChange = (row: number, col: number, value: string) => {
        const cellKey = `${row}-${col}`;
        const newUserAnswers = {
            ...gameState.userAnswers,
            [cellKey]: value
        };

        // Update state with new answers
        setGameState(prev => ({
            ...prev,
            userAnswers: newUserAnswers
        }));

        // Auto-save dengan debouncing 2 detik setelah selesai ngisi
        if (currentGameId) {
            // Clear previous timer
            if (autoSaveTimer) {
                clearTimeout(autoSaveTimer);
            }

            // Show saving indicator
            setIsAutoSaving(true);

            // Set new timer untuk auto-save setelah 2 detik
            const newTimer = setTimeout(async () => {
                try {
                    // 1. Save user answers first
                    await CrosswordService.autoSaveUserAnswers(currentGameId, newUserAnswers);
                    console.log('💾 Step 1: Saved user answers');

                    // 2. Calculate fresh score from newUserAnswers (don't use gameState as it might be stale)
                    const completedQuestions: number[] = [];
                    crosswordData.questions.forEach(question => {
                        let isComplete = true;
                        for (let i = 0; i < question.answer.length; i++) {
                            const cellRow = question.direction === 'horizontal' ? question.startRow : question.startRow + i;
                            const cellCol = question.direction === 'horizontal' ? question.startCol + i : question.startCol;
                            const cellKey = `${cellRow}-${cellCol}`;
                            const userAnswer = newUserAnswers[cellKey];
                            const correctAnswer = question.answer[i];

                            if (!userAnswer || userAnswer.toUpperCase() !== correctAnswer.toUpperCase()) {
                                isComplete = false;
                                break;
                            }
                        }
                        if (isComplete) {
                            completedQuestions.push(question.id);
                        }
                    });

                    const freshScore = calculateScore(completedQuestions.length, crosswordData.questions.length);

                    // 3. Save score using fresh calculated values
                    if (scoreManagerRef.current) {
                        const success = await scoreManagerRef.current.updateScore(
                            freshScore,
                            completedQuestions.length,
                            newUserAnswers
                        );
                        if (success) {
                            console.log('💾 Step 2: Saved fresh score:', freshScore, 'completed:', completedQuestions.length);
                        }
                    }

                    console.log('✅ Auto-save completed: answers → score');
                } catch (error) {
                    console.error('❌ Auto-save error:', error);
                }
                setIsAutoSaving(false);
            }, 2000);

            setAutoSaveTimer(newTimer);
        }

        // Auto-advance to next cell if value is entered and there's an active question
        if (value && activeQuestion) {
            let nextRow = row;
            let nextCol = col;

            if (activeQuestion.direction === 'horizontal') {
                // Find the next available (not correct) cell
                for (let i = col + 1; i < activeQuestion.startCol + activeQuestion.answer.length; i++) {
                    if (i < crosswordData.grid[0].length &&
                        crosswordData.grid[nextRow][i] !== null &&
                        !isCellCorrect(nextRow, i)) {
                        nextCol = i;
                        break;
                    }
                }

                if (nextCol !== col &&
                    nextCol < activeQuestion.startCol + activeQuestion.answer.length &&
                    nextCol < crosswordData.grid[0].length &&
                    crosswordData.grid[nextRow][nextCol] !== null) {
                    // Small delay to ensure state update is complete
                    setTimeout(() => {
                        setFocusedCell({ row: nextRow, col: nextCol });
                    }, 10);
                }
            } else {
                // Find the next available (not correct) cell
                for (let i = row + 1; i < activeQuestion.startRow + activeQuestion.answer.length; i++) {
                    if (i < crosswordData.grid.length &&
                        crosswordData.grid[i][nextCol] !== null &&
                        !isCellCorrect(i, nextCol)) {
                        nextRow = i;
                        break;
                    }
                }

                if (nextRow !== row &&
                    nextRow < activeQuestion.startRow + activeQuestion.answer.length &&
                    nextRow < crosswordData.grid.length &&
                    crosswordData.grid[nextRow][nextCol] !== null) {
                    // Small delay to ensure state update is complete
                    setTimeout(() => {
                        setFocusedCell({ row: nextRow, col: nextCol });
                    }, 10);
                }
            }
        } else if (!value) {
            // If value is empty (backspace), keep focus on current cell
            setFocusedCell({ row, col });
        }
    };

    const handleQuestionClick = (question: Question) => {
        setActiveQuestion(question);

        // Find the first cell in this question that is not correct yet
        let targetRow = question.startRow;
        let targetCol = question.startCol;

        for (let i = 0; i < question.answer.length; i++) {
            const row = question.direction === 'horizontal' ? question.startRow : question.startRow + i;
            const col = question.direction === 'horizontal' ? question.startCol + i : question.startCol;

            if (!isCellCorrect(row, col)) {
                targetRow = row;
                targetCol = col;
                break;
            }
        }

        setFocusedCell({ row: targetRow, col: targetCol });
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

    const isCellCorrect = (row: number, col: number): boolean => {
        const cellKey = `${row}-${col}`;
        const userAnswer = gameState.userAnswers[cellKey];

        if (!userAnswer) return false;

        // Check if this cell has the correct answer in any question
        return crosswordData.questions.some(question => {
            if (question.direction === 'horizontal') {
                if (row === question.startRow &&
                    col >= question.startCol &&
                    col < question.startCol + question.answer.length) {
                    const answerIndex = col - question.startCol;
                    return userAnswer.toUpperCase() === question.answer[answerIndex].toUpperCase();
                }
            } else {
                if (col === question.startCol &&
                    row >= question.startRow &&
                    row < question.startRow + question.answer.length) {
                    const answerIndex = row - question.startRow;
                    return userAnswer.toUpperCase() === question.answer[answerIndex].toUpperCase();
                }
            }
            return false;
        });
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-100 p-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header with user info */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold text-black">Teka-Teki Silang</h1>
                            {/* Auto-save indicator */}
                            <AutoSaveIndicator
                                isActive={isAutoSaving && currentGameId !== null}
                                className="hidden md:flex"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-600">
                                {user ? (
                                    `Welcome, ${user.user_metadata?.full_name || user.email || 'Player'}`
                                ) : (
                                    'Not authenticated'
                                )}
                            </div>
                            {user && (
                                <button
                                    onClick={signOut}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm transition-colors"
                                >
                                    Logout
                                </button>
                            )}
                            <a
                                href="/leaderboard"
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm transition-colors"
                            >
                                🏆 Leaderboard
                            </a>
                            {isAdmin && (
                                <a
                                    href="/admin"
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors"
                                >
                                    Admin
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Crossword Grid */}
                        <div className="lg:col-span-2 flex flex-col items-center">
                            {/* Game Title and Description */}
                            {gameInfo && (
                                <div className="mb-4 text-center">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                        {gameInfo.title}
                                    </h2>
                                    {gameInfo.description && (
                                        <p className="text-gray-600 text-sm max-w-lg mx-auto">
                                            {gameInfo.description}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="bg-white p-4 rounded-lg shadow-lg">
                                <div className="grid grid-cols-10 gap-px w-fit mx-auto">
                                    {crosswordData.grid.map((row, rowIndex) =>
                                        row.map((cell, colIndex) => {
                                            const cellKey = `${rowIndex}-${colIndex}`;
                                            const { isNumbered, number } = isNumberedCell(rowIndex, colIndex);
                                            const isActive = isCellInActiveQuestion(rowIndex, colIndex);
                                            const isFocused = focusedCell?.row === rowIndex && focusedCell?.col === colIndex;
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
                                            const cellIsCorrect = isCellCorrect(rowIndex, colIndex);

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
                                                    onKeyDown={(e) => handleKeyDown(rowIndex, colIndex, e)}
                                                    readOnly={cellIsCorrect}
                                                    focused={isFocused}
                                                />
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Side Panel */}
                        <div className="space-y-4">
                            {/* Score Manager for auto-save to database */}
                            {currentGameId && (
                                <ScoreManager
                                    ref={scoreManagerRef}
                                    gameId={currentGameId}
                                    currentScore={gameState.score}
                                    completedQuestions={gameState.completedQuestions.length}
                                    totalQuestions={crosswordData.questions.length}
                                    isCompleted={gameState.completedQuestions.length === crosswordData.questions.length}
                                    onScoreUpdate={(score) => {
                                        console.log('Score updated in database:', score);
                                    }}
                                />
                            )}

                            {/* Auto-save indicator for mobile */}
                            <div className="md:hidden">
                                <AutoSaveIndicator
                                    isActive={isAutoSaving && currentGameId !== null}
                                    className="justify-center"
                                />
                            </div>

                            <ClueList
                                questions={crosswordData.questions}
                                completedQuestions={gameState.completedQuestions}
                                onQuestionClick={handleQuestionClick}
                                activeQuestionId={activeQuestion?.id}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
