import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { checkAuthServiceHealth, getAuthErrorMessage } from '@/lib/authFlow';
import { getUserProfile, isSupabaseConfigured, supabase, type UserProfile } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  authIssue: string | null;
  authReachable: boolean | null;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithOAuth: (provider: 'github' | 'google' | 'wechat') => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authIssue, setAuthIssue] = useState<string | null>(null);
  const [authReachable, setAuthReachable] = useState<boolean | null>(null);

  const loadProfile = async (userId: string) => {
    const userProfile = await getUserProfile(userId);
    setProfile(userProfile);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setAuthReachable(false);
      setAuthIssue('认证服务未配置，请检查 Supabase 环境变量。');
      setLoading(false);
      return;
    }

    let cancelled = false;

    void checkAuthServiceHealth({
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
    }).then((result) => {
      if (cancelled) return;
      setAuthReachable(result.ok);
      setAuthIssue(result.message);
    });

    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        setLoading(false);
      }
    }, 10000);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          void loadProfile(session.user.id);
        }
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        setAuthIssue(getAuthErrorMessage(error, { supabaseUrl: SUPABASE_URL }));
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) return { error: '认证服务未配置。' };
    if (authReachable === false && authIssue) return { error: authIssue };

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return {
        error: error ? getAuthErrorMessage(error.message, { supabaseUrl: SUPABASE_URL }) : null,
      };
    } catch (error) {
      return {
        error: getAuthErrorMessage(error, { supabaseUrl: SUPABASE_URL }),
      };
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!supabase) return { error: '认证服务未配置。' };
    if (authReachable === false && authIssue) return { error: authIssue };

    try {
      const { error } = await supabase.auth.signUp({ email, password });
      return {
        error: error ? getAuthErrorMessage(error.message, { supabaseUrl: SUPABASE_URL }) : null,
      };
    } catch (error) {
      return {
        error: getAuthErrorMessage(error, { supabaseUrl: SUPABASE_URL }),
      };
    }
  };

  const signInWithOAuth = async (provider: 'github' | 'google' | 'wechat') => {
    if (!supabase) return { error: '认证服务未配置。' };
    if (authReachable === false && authIssue) return { error: authIssue };

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as never,
        options: {
          redirectTo: window.location.origin,
        },
      });

      return {
        error: error ? getAuthErrorMessage(error.message, { supabaseUrl: SUPABASE_URL }) : null,
      };
    } catch (error) {
      return {
        error: getAuthErrorMessage(error, { supabaseUrl: SUPABASE_URL }),
      };
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        authIssue,
        authReachable,
        signInWithEmail,
        signUpWithEmail,
        signInWithOAuth,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
