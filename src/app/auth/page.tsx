'use client';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from '../components/LoginForm';

export default function Auth() {
    const { user, loading } = useAuth();

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

    // If user is logged in, show loading while middleware redirects
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

            {/* Debug Link - hanya untuk development */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-4 right-4">
                    <a
                        href="/auth/test"
                        className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-lg"
                    >
                        🔧 Test Connection
                    </a>
                </div>
            )}
        </div>
    );
}
