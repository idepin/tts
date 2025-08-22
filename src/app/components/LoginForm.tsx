'use client';
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: ''
    });

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

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                // Sign up with email and fullname
                const { data, error } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.fullName
                        }
                    }
                });

                if (error) throw error;

                if (data.user && !data.session) {
                    setError('Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi akun.');
                } else {
                    // Auto login successful
                    window.location.href = '/gameplay';
                }
            } else {
                // Sign in with email
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password
                });

                if (error) throw error;

                // Login successful
                window.location.href = '/gameplay';
            }
        } catch (error: any) {
            console.error('Error with email auth:', error);
            setError(error.message || 'Terjadi kesalahan saat proses autentikasi.');
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
                            <span className="px-2 bg-white text-gray-500">Atau {isSignUp ? 'daftar' : 'login'} dengan email</span>
                        </div>
                    </div>

                    {/* Custom Email Form */}
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        {isSignUp && (
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Lengkap
                                </label>
                                <input
                                    type="text"
                                    id="fullName"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Masukkan nama lengkap"
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Masukkan email"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={formData.password}
                                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Masukkan password"
                                minLength={6}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                            {isLoading ? 'Memproses...' : (isSignUp ? 'Daftar' : 'Login')}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            {isSignUp ? 'Sudah punya akun?' : 'Belum punya akun?'}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setError(null);
                                    setFormData({ email: '', password: '', fullName: '' });
                                }}
                                className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
                            >
                                {isSignUp ? 'Login di sini' : 'Daftar di sini'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
