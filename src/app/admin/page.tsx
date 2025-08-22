'use client';
import React, { useState } from 'react';
import { CrosswordData } from '../../types/crossword';
import { dummyCrosswordData } from '../../data/simpleCrosswordData';
import { CrosswordManager } from '../../utils/CrosswordManager';
import GridEditor from '../components/GridEditor';
import QuestionManager from '../components/QuestionManager';

export default function Admin() {
    const [crosswordData, setCrosswordData] = useState<CrosswordData>(() =>
        CrosswordManager.getInstance().getData()
    );
    const [activeTab, setActiveTab] = useState<'grid' | 'questions'>('questions');

    const handleSave = () => {
        // Save to localStorage
        const manager = CrosswordManager.getInstance();
        manager.updateData(crosswordData);
        alert('Data berhasil disimpan!');
    };

    const handleLoad = () => {
        const manager = CrosswordManager.getInstance();
        setCrosswordData(manager.getData());
        alert('Data berhasil dimuat!');
    };

    const handleReset = () => {
        if (confirm('Yakin ingin reset ke data default?')) {
            const manager = CrosswordManager.getInstance();
            manager.resetToDefault();
            setCrosswordData(manager.getData());
        }
    };

    const handleExport = () => {
        const manager = CrosswordManager.getInstance();
        const dataStr = manager.exportData();
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'crossword-data.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                const manager = CrosswordManager.getInstance();
                if (manager.importData(content)) {
                    setCrosswordData(manager.getData());
                    alert('Data berhasil diimpor!');
                } else {
                    alert('Error: Format file tidak valid!');
                }
            };
            reader.readAsText(file);
        }
        // Reset input
        event.target.value = '';
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h1 className="text-3xl font-bold text-center mb-6 text-black">Admin Panel - Editor TTS</h1>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4 justify-center mb-6">
                        <button
                            onClick={handleSave}
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded transition-colors"
                        >
                            💾 Simpan Data
                        </button>
                        <button
                            onClick={handleLoad}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors"
                        >
                            📂 Muat Data
                        </button>
                        <button
                            onClick={handleExport}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded transition-colors"
                        >
                            📤 Export JSON
                        </button>
                        <label className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded transition-colors cursor-pointer">
                            📥 Import JSON
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                className="hidden"
                            />
                        </label>
                        <button
                            onClick={handleReset}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded transition-colors"
                        >
                            🔄 Reset Default
                        </button>
                        <a
                            href="/gameplay"
                            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded transition-colors"
                        >
                            🎮 Test Game
                        </a>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b mb-6">
                        <button
                            onClick={() => setActiveTab('questions')}
                            className={`px-6 py-3 font-semibold ${activeTab === 'questions'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-black hover:text-gray-800'
                                }`}
                        >
                            📝 Kelola Pertanyaan
                        </button>
                        <button
                            onClick={() => setActiveTab('grid')}
                            className={`px-6 py-3 font-semibold ${activeTab === 'grid'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-black hover:text-gray-800'
                                }`}
                        >
                            🎯 Editor Grid
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'questions' && (
                        <QuestionManager
                            crosswordData={crosswordData}
                            onUpdate={(newData: CrosswordData) => {
                                setCrosswordData(newData);
                                CrosswordManager.getInstance().updateData(newData);
                            }}
                        />
                    )}

                    {activeTab === 'grid' && (
                        <GridEditor
                            crosswordData={crosswordData}
                            onUpdate={(newData: CrosswordData) => {
                                setCrosswordData(newData);
                                CrosswordManager.getInstance().updateData(newData);
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
