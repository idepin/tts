'use client'
import { useAuth } from "../contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to gameplay if user is already logged in
    if (!loading && user) {
      router.push('/gameplay');
    }
    // Redirect to auth if user is not logged in
    else if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="font-sans flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render content - user will be redirected to auth or gameplay
  return null;
}
