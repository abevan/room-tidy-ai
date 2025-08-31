import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '@/components/AuthForm';
import { supabase } from '@/integrations/supabase/client';
import { InteractiveBackground } from '@/components/InteractiveBackground';

export default function Auth() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          navigate('/');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuthSuccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      <InteractiveBackground />
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <AuthForm onSuccess={handleAuthSuccess} />
      </div>
    </div>
  );
}