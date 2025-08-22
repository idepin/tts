import { CrosswordData } from '../types/crossword';

export const dummyCrosswordData: CrosswordData = {
    questions: [
        {
            id: 1,
            clue: "Hewan berkaki empat yang suka makan rumput",
            answer: "SAPI",
            direction: "horizontal",
            startRow: 2,
            startCol: 1,
            number: 1
        },
        {
            id: 2,
            clue: "Minuman panas dari daun teh",
            answer: "TEH",
            direction: "horizontal",
            startRow: 4,
            startCol: 2,
            number: 2
        },
        {
            id: 3,
            clue: "Planet tempat kita tinggal",
            answer: "BUMI",
            direction: "vertical",
            startRow: 1,
            startCol: 3,
            number: 3
        },
        {
            id: 4,
            clue: "Bunga yang harum",
            answer: "MAWAR",
            direction: "vertical",
            startRow: 0,
            startCol: 1,
            number: 1
        },
        {
            id: 5,
            clue: "Alat untuk menulis",
            answer: "PENA",
            direction: "horizontal",
            startRow: 6,
            startCol: 0,
            number: 4
        }
    ],
    grid: [
        [null, "M", null, null, null, null, null, null, null, null],
        [null, "A", null, "B", null, null, null, null, null, null],
        [null, "S", "A", "P", "I", null, null, null, null, null],
        [null, "A", null, "U", null, null, null, null, null, null],
        [null, "R", "T", "E", "H", null, null, null, null, null],
        [null, null, null, "I", null, null, null, null, null, null],
        ["P", "E", "N", "A", null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null]
    ]
};

export const generateEmptyGrid = (rows: number = 10, cols: number = 10): (string | null)[][] => {
    return Array(rows).fill(null).map(() => Array(cols).fill(null));
};

export const calculateScore = (completedQuestions: number, totalQuestions: number): number => {
    return Math.round((completedQuestions / totalQuestions) * 1000);
};
