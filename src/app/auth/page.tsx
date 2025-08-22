'use client';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoginForm from '../components/LoginForm';

export default function Auth() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Redirect to gameplay if user is logged in
        if (!loading && user) {
            router.push('/gameplay');
        }
    }, [user, loading, router]);

    // Show loading while checking auth status
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // If user is logged in, show loading while redirecting
    if (user) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Redirecting to game...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <LoginForm />
        </div>
    );
}
