'use client';
import React, { useState, useEffect } from 'react';
import { CrosswordData } from '../../types/crossword';
import { dummyCrosswordData } from '../../data/simpleCrosswordData';
import { CrosswordManager } from '../../utils/CrosswordManager';
import GameManager from '../components/GameManager';
import EditGameModal from '../components/EditGameModal';
import ScoreViewer from '../components/ScoreViewer';
import ProtectedRoute from '../components/ProtectedRoute';
import { CrosswordService } from '../../lib/crosswordService';

export default function Admin() {
    const [crosswordData, setCrosswordData] = useState<CrosswordData>(() =>
        CrosswordManager.getInstance().getData()
    );
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminCheckLoading, setAdminCheckLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);
    const [currentGameId, setCurrentGameId] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'games' | 'scores'>('games');

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

    // Handle game selection for editing
    const handleGameSelect = (gameId: string | null) => {
        setCurrentGameId(gameId);
        if (gameId) {
            setShowEditModal(true);
        }
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

                        {/* Tab Navigation */}
                        <div className="flex border-b border-gray-200 mb-6">
                            <button
                                onClick={() => setActiveTab('games')}
                                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'games'
                                        ? 'border-purple-500 text-purple-600 bg-purple-50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                🎮 Game Management
                            </button>
                            <button
                                onClick={() => setActiveTab('scores')}
                                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'scores'
                                        ? 'border-purple-500 text-purple-600 bg-purple-50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                📊 Player Scores
                            </button>
                            <button
                                onClick={() => window.open('/leaderboard', '_blank')}
                                className="px-6 py-3 font-medium text-sm text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                🏆 Public Leaderboard ↗
                            </button>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'games' ? (
                            <>
                                {/* Game Management */}
                                <GameManager
                                    onGameSelect={handleGameSelect}
                                    currentGameId={currentGameId}
                                />

                                {/* Help Text for Games */}
                                <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
                                    <div className="text-blue-400 text-4xl mb-2">🎮</div>
                                    <h4 className="text-lg font-semibold text-blue-900 mb-2">Game Management Made Easy</h4>
                                    <p className="text-blue-700">
                                        Create new crossword games or select an existing game to edit its questions.
                                        Click <strong>"✏️ Edit"</strong> on any game to open the question editor in a clean popup window.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Score Viewer */}
                                <ScoreViewer isAdmin={isAdmin} />
                            </>
                        )}

                        {/* Edit Game Modal - Always available */}
                        {showEditModal && currentGameId && (
                            <EditGameModal
                                gameId={currentGameId}
                                onClose={() => {
                                    setShowEditModal(false);
                                    setCurrentGameId(null);
                                }}
                                onGameUpdated={() => {
                                    // Optional: refresh games list or show success message
                                    console.log('Game updated successfully');
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
