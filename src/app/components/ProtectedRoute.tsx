'use client';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [devBypass, setDevBypass] = useState(false);

    useEffect(() => {
        // Check for development bypass
        if (process.env.NODE_ENV === 'development') {
            const bypass = localStorage.getItem('dev-bypass-auth') === 'true';
            setDevBypass(bypass);
        }
    }, []);

    useEffect(() => {
        if (!loading && !user && !devBypass) {
            router.push('/auth');
        }
    }, [user, loading, router, devBypass]);

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Show nothing if not authenticated and no dev bypass (will redirect)
    if (!user && !devBypass) {
        return null;
    }

    // Show protected content if authenticated or dev bypass
    return <>{children}</>;
}
