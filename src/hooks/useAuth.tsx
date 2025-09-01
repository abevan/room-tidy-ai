import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// Create context with default value to prevent undefined errors
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Detect PWA/standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = 'standalone' in window.navigator && (window.navigator as any).standalone;
    const isPWAMode = isStandalone || isIOSStandalone;
    
    console.log('🔧 Auth: PWA mode detected:', isPWAMode);
    setIsPWA(isPWAMode);

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔧 Auth: State change:', event, session?.user?.id, 'PWA:', isPWAMode);
        if (mounted) {
          // For PWA mode, add extra delay to ensure proper state updates
          if (isPWAMode) {
            setTimeout(() => {
              setSession(session);
              setUser(session?.user ?? null);
              setLoading(false);
            }, 100);
          } else {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
          }
        }
      }
    );

    // Check for existing session with retry logic for PWA
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔧 Auth: Initial session check:', session?.user?.id, 'Error:', error);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('🔧 Auth: Session check failed:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // For PWA mode, add a small delay to ensure everything is initialized
    if (isPWAMode) {
      setTimeout(checkSession, 200);
    } else {
      checkSession();
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('🔧 Auth: Signing out, PWA mode:', isPWA);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
};