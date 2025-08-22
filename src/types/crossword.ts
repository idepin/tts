export interface Question {
    id: number;
    clue: string;
    answer: string;
    direction: 'horizontal' | 'vertical';
    startRow: number;
    startCol: number;
    number: number;
}

export interface CrosswordData {
    questions: Question[];
    grid: (string | null)[][];
}

export interface GameState {
    userAnswers: { [key: string]: string };
    score: number;
    completedQuestions: number[];
    isCompleted: boolean;
}
