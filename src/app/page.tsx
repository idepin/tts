'use client'
import { useAuth } from "../contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Handle OAuth callback if there are hash fragments in URL
    const handleOAuthCallback = async () => {
      if (window.location.hash) {
        console.log('OAuth callback detected, processing...');
        // Let Supabase handle the OAuth callback
        // The auth state change will be triggered automatically
      }
    };

    handleOAuthCallback();

    // Redirect to gameplay if user is already logged in
    if (!loading && user) {
      router.push('/gameplay');
    }
    // Redirect to auth if user is not logged in and no OAuth callback
    else if (!loading && !user && !window.location.hash) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    const isOAuthCallback = typeof window !== 'undefined' && window.location.hash;
    return (
      <div className="font-sans flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>{isOAuthCallback ? 'Processing login...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // Don't render content - user will be redirected to auth or gameplay
  return null;
}
