'use client';
import React, { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../lib/supabase';

export default function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const signInWithGoogle = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/gameplay`
                }
            });

            if (error) {
                throw error;
            }

            console.log('Google sign-in initiated:', data);
        } catch (error: any) {
            console.error('Error signing in with Google:', error);
            setError(error.message || 'Gagal login dengan Google. Pastikan konfigurasi Google OAuth sudah benar di Supabase.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Teka-Teki Silang
                        </h1>
                        <p className="text-gray-600">
                            Silakan login untuk bermain
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-800">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Google Sign In Button */}
                    <button
                        onClick={signInWithGoogle}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        {isLoading ? 'Signing in...' : 'Continue with Google'}
                    </button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Atau login dengan email</span>
                        </div>
                    </div>

                    {/* Supabase Auth Component */}
                    <Auth
                        supabaseClient={supabase}
                        appearance={{
                            theme: ThemeSupa,
                            variables: {
                                default: {
                                    colors: {
                                        brand: '#3b82f6',
                                        brandAccent: '#2563eb',
                                    },
                                },
                            },
                        }}
                        providers={[]}
                        redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/gameplay`}
                        onlyThirdPartyProviders={false}
                        magicLink={false}
                        view="sign_in"
                    />

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600 mb-4">
                            Belum punya akun? Daftar akan otomatis dibuat saat login pertama kali.
                        </p>

                        {/* Development bypass button */}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="border-t pt-4">
                                <p className="text-xs text-gray-500 mb-2">Development Mode</p>
                                <button
                                    onClick={async () => {
                                        try {
                                            // Create a test session for development
                                            const { data, error } = await supabase.auth.signInWithPassword({
                                                email: 'dev@test.com',
                                                password: 'dev123456'
                                            });
                                            
                                            if (error) {
                                                // If user doesn't exist, create it
                                                const { error: signUpError } = await supabase.auth.signUp({
                                                    email: 'dev@test.com',
                                                    password: 'dev123456'
                                                });
                                                
                                                if (!signUpError) {
                                                    alert('Dev account created! Please check email to confirm, or try login again.');
                                                } else {
                                                    console.error('Dev bypass error:', signUpError);
                                                }
                                            }
                                        } catch (err) {
                                            console.error('Dev bypass error:', err);
                                        }
                                    }}
                                    className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded"
                                >
                                    Dev Login (dev@test.com)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
