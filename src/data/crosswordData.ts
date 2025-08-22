import { CrosswordData } from '../types/crossword';

export const dummyCrosswordData: CrosswordData = {
    questions: [
        {
            id: 1,
            clue: "Hewan berkaki empat yang suka makan rumput",
            answer: "SAPI",
            direction: "horizontal",
            startRow: 1,
            startCol: 1,
            number: 1
        },
        {
            id: 2,
            clue: "Planet tempat kita tinggal",
            answer: "BUMI",
            direction: "vertical",
            startRow: 1,
            startCol: 1,
            number: 1
        },
        {
            id: 3,
            clue: "Alat untuk menulis",
            answer: "PENA",
            direction: "horizontal",
            startRow: 3,
            startCol: 2,
            number: 2
        },
        {
            id: 4,
            clue: "Buah yang berwarna kuning",
            answer: "PISANG",
            direction: "vertical",
            startRow: 0,
            startCol: 4,
            number: 3
        },
        {
            id: 5,
            clue: "Ibu kota Indonesia",
            answer: "JAKARTA",
            direction: "horizontal",
            startRow: 5,
            startCol: 0,
            number: 4
        },
        {
            id: 6,
            clue: "Minuman panas dari daun teh",
            answer: "TEH",
            direction: "vertical",
            startRow: 3,
            startCol: 4,
            number: 5
        }
    ],
    grid: [
        [null, null, null, null, "P", null, null, null, null, null],
        ["S", "A", "P", "I", "I", null, null, null, null, null],
        [null, null, null, null, "S", null, null, null, null, null],
        [null, "P", "E", "N", "A", null, null, null, null, null],
        [null, null, null, null, "N", null, null, null, null, null],
        ["J", "A", "K", "A", "R", "T", "A", null, null, null],
        [null, null, null, null, "G", null, null, null, null, null],
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
