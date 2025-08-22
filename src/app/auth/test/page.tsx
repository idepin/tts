'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function TestConnection() {
    const [status, setStatus] = useState<{
        connected: boolean;
        session: any;
        error: string | null;
    }>({
        connected: false,
        session: null,
        error: null
    });

    useEffect(() => {
        const testConnection = async () => {
            try {
                // Test basic connection
                const { data, error } = await supabase.auth.getSession();

                if (error) {
                    setStatus({
                        connected: false,
                        session: null,
                        error: error.message
                    });
                } else {
                    setStatus({
                        connected: true,
                        session: data.session,
                        error: null
                    });
                }
            } catch (err: any) {
                setStatus({
                    connected: false,
                    session: null,
                    error: err.message
                });
            }
        };

        testConnection();
    }, []);

    const testGoogleAuth = async () => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/test`
                }
            });

            console.log('Google auth test:', { data, error });

            if (error) {
                alert(`Google Auth Error: ${error.message}`);
            }
        } catch (err: any) {
            console.error('Google auth test error:', err);
            alert(`Error: ${err.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Supabase Connection Test</h1>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Connection Status</h2>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${status.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span>{status.connected ? 'Connected' : 'Disconnected'}</span>
                        </div>

                        {status.error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded">
                                <p className="text-red-800 text-sm">Error: {status.error}</p>
                            </div>
                        )}

                        {status.session ? (
                            <div className="p-4 bg-green-50 border border-green-200 rounded">
                                <p className="text-green-800 text-sm">
                                    User logged in: {status.session.user.email}
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="text-yellow-800 text-sm">No active session</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>

                    <div className="space-y-2 text-sm">
                        <div>
                            <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>
                            <span className="ml-2 font-mono">{process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}</span>
                        </div>
                        <div>
                            <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>
                            <span className="ml-2 font-mono">
                                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                                    ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...`
                                    : 'Not set'
                                }
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Test Google OAuth</h2>

                    <button
                        onClick={testGoogleAuth}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Test Google Login
                    </button>

                    <p className="text-sm text-gray-600 mt-2">
                        This will attempt to initiate Google OAuth flow. Check browser console for details.
                    </p>
                </div>

                <div className="mt-8 text-center">
                    <a
                        href="/auth"
                        className="text-blue-500 hover:text-blue-600"
                    >
                        ← Back to Login
                    </a>
                </div>
            </div>
        </div>
    );
}
