import { CrosswordData, Question } from '../types/crossword';

// Fungsi untuk mendeteksi posisi awal kata di grid
const findWordPosition = (grid: (string | null)[][], answer: string, direction: 'horizontal' | 'vertical'): { startRow: number; startCol: number } | null => {
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            if (canPlaceWord(grid, answer, row, col, direction)) {
                return { startRow: row, startCol: col };
            }
        }
    }
    return null;
};

// Fungsi untuk mengecek apakah kata bisa ditempatkan di posisi tertentu
const canPlaceWord = (grid: (string | null)[][], word: string, startRow: number, startCol: number, direction: 'horizontal' | 'vertical'): boolean => {
    for (let i = 0; i < word.length; i++) {
        const row = direction === 'horizontal' ? startRow : startRow + i;
        const col = direction === 'horizontal' ? startCol + i : startCol;

        if (row >= grid.length || col >= grid[0].length) return false;
        if (grid[row][col] !== word[i]) return false;
    }
    return true;
};

// Fungsi untuk mendeteksi nomor berdasarkan posisi awal kata
const detectNumbers = (grid: (string | null)[][], questions: Omit<Question, 'startRow' | 'startCol' | 'number'>[]): Question[] => {
    const numberedPositions: { [key: string]: number } = {};
    let currentNumber = 1;

    return questions.map(q => {
        const position = findWordPosition(grid, q.answer, q.direction);
        if (!position) throw new Error(`Cannot find position for word: ${q.answer}`);

        const posKey = `${position.startRow}-${position.startCol}`;

        if (!numberedPositions[posKey]) {
            numberedPositions[posKey] = currentNumber++;
        }

        return {
            ...q,
            startRow: position.startRow,
            startCol: position.startCol,
            number: numberedPositions[posKey]
        };
    });
};

// Grid yang sudah lengkap
const crosswordGrid = [
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
];

// Pertanyaan tanpa koordinat (akan di-generate otomatis)
const baseQuestions = [
    {
        id: 1,
        clue: "Hewan berkaki empat yang suka makan rumput",
        answer: "SAPI",
        direction: "horizontal" as const
    },
    {
        id: 2,
        clue: "Minuman panas dari daun teh",
        answer: "TEH",
        direction: "horizontal" as const
    },
    {
        id: 3,
        clue: "Planet tempat kita tinggal",
        answer: "BUMI",
        direction: "vertical" as const
    },
    {
        id: 4,
        clue: "Bunga yang harum",
        answer: "MAWAR",
        direction: "vertical" as const
    },
    {
        id: 5,
        clue: "Alat untuk menulis",
        answer: "PENA",
        direction: "horizontal" as const
    }
];

export const dummyCrosswordData: CrosswordData = {
    questions: detectNumbers(crosswordGrid, baseQuestions),
    grid: crosswordGrid
};

export const generateEmptyGrid = (rows: number = 10, cols: number = 10): (string | null)[][] => {
    return Array(rows).fill(null).map(() => Array(cols).fill(null));
};

export const calculateScore = (completedQuestions: number, totalQuestions: number): number => {
    return Math.round((completedQuestions / totalQuestions) * 1000);
};
