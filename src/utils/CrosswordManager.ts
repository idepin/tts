import { CrosswordData } from '../types/crossword';
import { dummyCrosswordData } from '../data/simpleCrosswordData';

export class CrosswordManager {
    private static instance: CrosswordManager;
    private data: CrosswordData;

    private constructor() {
        this.data = this.loadData();
    }

    public static getInstance(): CrosswordManager {
        if (!CrosswordManager.instance) {
            CrosswordManager.instance = new CrosswordManager();
        }
        return CrosswordManager.instance;
    }

    private loadData(): CrosswordData {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('customCrossword');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (error) {
                    console.error('Error loading saved crossword data:', error);
                }
            }
        }
        return dummyCrosswordData;
    }

    public getData(): CrosswordData {
        return this.data;
    }

    public updateData(newData: CrosswordData): void {
        this.data = newData;
        this.saveData();
    }

    private saveData(): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('customCrossword', JSON.stringify(this.data));
        }
    }

    public resetToDefault(): void {
        this.data = dummyCrosswordData;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('customCrossword');
        }
    }

    public exportData(): string {
        return JSON.stringify(this.data, null, 2);
    }

    public importData(jsonData: string): boolean {
        try {
            const data = JSON.parse(jsonData);
            // Basic validation
            if (data.questions && data.grid && Array.isArray(data.questions) && Array.isArray(data.grid)) {
                this.updateData(data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}
