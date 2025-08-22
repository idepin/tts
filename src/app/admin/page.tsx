'use client';
import React, { useState, useEffect } from 'react';
import { CrosswordData } from '../../types/crossword';
import { dummyCrosswordData } from '../../data/simpleCrosswordData';
import { CrosswordManager } from '../../utils/CrosswordManager';
import QuestionManager from '../components/QuestionManager';
import ProtectedRoute from '../components/ProtectedRoute';
import { CrosswordService } from '../../lib/crosswordService';

export default function Admin() {
    const [crosswordData, setCrosswordData] = useState<CrosswordData>(() =>
        CrosswordManager.getInstance().getData()
    );
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminCheckLoading, setAdminCheckLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);

    // Check admin status
    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const adminStatus = await CrosswordService.isAdmin();
                setIsAdmin(adminStatus);
                if (!adminStatus) {
                    setAccessDenied(true);
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
                setIsAdmin(false);
                setAccessDenied(true);
            } finally {
                setAdminCheckLoading(false);
            }
        };

        checkAdminStatus();
    }, []);

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

    // Show loading while checking admin status
    if (adminCheckLoading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Checking admin privileges...</p>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    // Show access denied if not admin
    if (accessDenied || !isAdmin) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
                        <div className="text-red-500 text-6xl mb-4">🚫</div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
                        <p className="text-gray-600 mb-6">
                            You need admin privileges to access this page. Contact the administrator to get admin access.
                        </p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6 text-left">
                            <p className="text-sm text-yellow-800">
                                <strong>Need admin access?</strong><br />
                                Run the <code className="bg-yellow-100 px-1 rounded">setup-admin-system.sql</code> file 
                                and update the email address in the script to grant yourself admin privileges.
                            </p>
                        </div>
                        <a
                            href="/gameplay"
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors"
                        >
                            ← Back to Game
                        </a>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-100 p-4">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-3xl font-bold text-black">Admin Panel - Editor TTS</h1>
                            <div className="flex items-center gap-4">
                                <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    👑 Admin Access
                                </div>
                                <a
                                    href="/gameplay"
                                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm transition-colors"
                                >
                                    🎮 Test Game
                                </a>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-4 justify-center mb-6">
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
                        </div>

                        {/* Content */}
                        <QuestionManager
                            crosswordData={crosswordData}
                            onUpdate={(newData: CrosswordData) => {
                                setCrosswordData(newData);
                                CrosswordManager.getInstance().updateData(newData);
                            }}
                        />
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
