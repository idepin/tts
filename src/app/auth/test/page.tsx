'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { CrosswordService } from '../../../lib/crosswordService';

export default function TestConnection() {
    const [result, setResult] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        checkCurrentUser();
    }, []);

    const checkCurrentUser = async () => {
        try {
            const { data: user } = await supabase.auth.getUser();
            const isAdmin = await CrosswordService.isAdmin();

            setCurrentUser({
                authenticated: !!user.user,
                userId: user.user?.id,
                email: user.user?.email,
                isAdmin: isAdmin,
                userMetadata: user.user?.user_metadata
            });
        } catch (error) {
            console.error('Error checking user:', error);
        }
    };

    const testConnection = async () => {
        setLoading(true);
        try {
            const result = await CrosswordService.testDatabaseConnection();
            setResult(JSON.stringify(result, null, 2));
        } catch (error) {
            setResult(`Error: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const createTestUser = async () => {
        setLoading(true);
        try {
            // Try to sign in anonymously for testing
            const { data, error } = await supabase.auth.signInAnonymously();
            if (error) {
                setResult(`Anonymous signin error: ${error.message}`);
            } else {
                setResult(`✅ Test user created! ID: ${data.user?.id}`);

                // Update current user display
                await checkCurrentUser();

                // Wait a bit then test connection
                setTimeout(async () => {
                    const testResult = await CrosswordService.testDatabaseConnection();
                    setResult(prev => prev + '\n\n🔍 Connection Test:\n' + JSON.stringify(testResult, null, 2));
                }, 1000);
            }
        } catch (error) {
            setResult(`Error creating test user: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const testGoogleAuth = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/admin`
                }
            });

            if (error) {
                setResult(`Google Auth Error: ${error.message}`);
            } else {
                setResult('✅ Google OAuth initiated - check for redirect...');
            }
        } catch (err: any) {
            setResult(`Google auth error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        setLoading(true);
        try {
            await supabase.auth.signOut();
            setResult('✅ Signed out successfully');
            await checkCurrentUser();
        } catch (error) {
            setResult(`Error signing out: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h1 className="text-2xl font-bold mb-6 text-black">🔧 Development Test & Debug Center</h1>

                    {/* Current User Status */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
                        <h3 className="font-semibold mb-2 text-black">Current User Status:</h3>
                        <div className="text-sm">
                            <div className={`inline-block px-2 py-1 rounded text-xs ${currentUser?.authenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {currentUser?.authenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
                            </div>
                            {currentUser?.authenticated && (
                                <>
                                    <div className={`inline-block ml-2 px-2 py-1 rounded text-xs ${currentUser?.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {currentUser?.isAdmin ? '👑 Admin' : '👤 Regular User'}
                                    </div>
                                    <div className="mt-1 text-gray-600">
                                        User ID: {currentUser?.userId}<br />
                                        Email: {currentUser?.email || 'Anonymous'}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <button
                            onClick={checkCurrentUser}
                            disabled={loading}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : '🔍 Refresh User Status'}
                        </button>

                        <button
                            onClick={createTestUser}
                            disabled={loading}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : '🧪 Create Test User (Anonymous)'}
                        </button>

                        <button
                            onClick={testGoogleAuth}
                            disabled={loading}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : '🔐 Test Google Login'}
                        </button>

                        <button
                            onClick={testConnection}
                            disabled={loading}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : '🗄️ Test Database Connection'}
                        </button>

                        <button
                            onClick={signOut}
                            disabled={loading}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-50 col-span-2"
                        >
                            {loading ? 'Loading...' : '🚪 Sign Out'}
                        </button>
                    </div>

                    {/* Instructions */}
                    <div className="border-t pt-4 mb-4">
                        <h3 className="font-semibold mb-2 text-black">Quick Fix for Save Issues:</h3>
                        <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                            <li><strong>If not authenticated:</strong> Click "Create Test User" for quick testing, or use "Test Google Login" for proper auth</li>
                            <li><strong>Test the connection:</strong> Click "Test Database Connection" to verify everything works</li>
                            <li><strong>Try saving:</strong> Go to <a href="/admin" className="text-blue-500 underline">/admin</a> and try saving questions</li>
                            <li><strong>If save still fails:</strong> Check the console logs in your browser's developer tools</li>
                        </ol>
                    </div>

                    {/* Test Result */}
                    <div className="border border-gray-200 rounded p-4 bg-gray-50">
                        <h3 className="font-semibold mb-2 text-black">Test Result:</h3>
                        <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-auto max-h-96">
                            {result || 'Click a button above to run tests...'}
                        </pre>
                    </div>

                    {/* Navigation */}
                    <div className="mt-6 flex justify-center space-x-4">
                        <a
                            href="/admin"
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded"
                        >
                            🏠 Go to Admin Panel
                        </a>
                        <a
                            href="/gameplay"
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded"
                        >
                            🎮 Test Game
                        </a>
                        <a
                            href="/auth"
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
                        >
                            🔐 Login Page
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
