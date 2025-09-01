import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/AuthForm';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  console.log('🔧 Auth Page: Loading state:', loading, 'User:', !!user);

  // Only redirect if user is authenticated and not loading
  useEffect(() => {
    if (user && !loading) {
      console.log('🔧 Auth: Redirecting to home');
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleAuthSuccess = () => {
    console.log('🔧 Auth: Auth success, redirecting to home');
    navigate('/', { replace: true });
  };

  // Show loading while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <AuthForm onSuccess={handleAuthSuccess} />;
}