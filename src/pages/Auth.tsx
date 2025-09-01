import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/AuthForm';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isPWA, setIsPWA] = useState(false);

  // Detect PWA mode
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = 'standalone' in window.navigator && (window.navigator as any).standalone;
    const isPWAMode = isStandalone || isIOSStandalone;
    
    console.log('🔧 Auth: PWA mode detected:', isPWAMode);
    setIsPWA(isPWAMode);
  }, []);

  // Only redirect if user is authenticated and not loading
  useEffect(() => {
    if (user && !loading) {
      console.log('🔧 Auth: Redirecting to home, PWA mode:', isPWA);
      // For PWA mode, add a small delay to ensure proper navigation
      if (isPWA) {
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 100);
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, loading, navigate, isPWA]);

  const handleAuthSuccess = () => {
    console.log('🔧 Auth: Auth success, PWA mode:', isPWA);
    // For PWA mode, add a small delay to ensure proper navigation
    if (isPWA) {
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    } else {
      navigate('/', { replace: true });
    }
  };

  // Show loading while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">
            {isPWA ? 'Initializing PWA...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return <AuthForm onSuccess={handleAuthSuccess} />;
}