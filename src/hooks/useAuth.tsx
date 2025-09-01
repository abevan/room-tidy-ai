import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthState = () => {
    console.log('Clearing auth state and localStorage');
    setSession(null);
    setUser(null);
    setAuthError(null);
    // Clear potentially corrupted tokens
    localStorage.removeItem('sb-fjnylpbqothaykvdqcsr-auth-token');
    localStorage.clear();
  };

  useEffect(() => {
    let loadingTimeout: NodeJS.Timeout;
    
    // Set a maximum loading time to prevent infinite loading
    loadingTimeout = setTimeout(() => {
      console.warn('Auth loading timeout reached, clearing state');
      setLoading(false);
      setAuthError('Authentication timeout. Please try refreshing the page.');
    }, 10000); // 10 second timeout

    const initializeAuth = async () => {
      try {
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email || 'no user');
            clearTimeout(loadingTimeout);
            
            // Handle different auth events
            if (event === 'SIGNED_OUT') {
              clearAuthState();
            } else if (event === 'TOKEN_REFRESHED' && !session) {
              console.log('Token refresh failed, clearing state');
              clearAuthState();
            } else {
              setSession(session);
              setUser(session?.user ?? null);
              setAuthError(null);
            }
            setLoading(false);
          }
        );

        // Check for existing session with comprehensive error handling
        const { data: { session }, error } = await supabase.auth.getSession();
        
        clearTimeout(loadingTimeout);
        
        if (error) {
          console.error('Session error:', error);
          if (error.message?.includes('refresh') || error.message?.includes('token')) {
            clearAuthState();
            setAuthError('Please sign in again.');
          } else {
            setAuthError(`Authentication error: ${error.message}`);
          }
        } else {
          console.log('Initial session:', session?.user?.email || 'no session');
          setSession(session);
          setUser(session?.user ?? null);
          setAuthError(null);
        }
        setLoading(false);

        return () => {
          clearTimeout(loadingTimeout);
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        clearTimeout(loadingTimeout);
        clearAuthState();
        setAuthError('Failed to initialize authentication. Please refresh the page.');
        setLoading(false);
      }
    };

    const cleanup = initializeAuth();
    
    return () => {
      clearTimeout(loadingTimeout);
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      clearAuthState();
    } catch (error) {
      console.error('Sign out error:', error);
      // Force clear state even if signOut fails
      clearAuthState();
    }
  };

  const clearError = () => {
    setAuthError(null);
  };

  // Provide a safe default context value even in error states
  const contextValue: AuthContextType = {
    user,
    session,
    loading,
    authError,
    signOut,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};