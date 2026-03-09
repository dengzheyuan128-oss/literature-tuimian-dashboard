import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
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
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signInWithOAuth: (provider: 'github' | 'google' | 'wechat') => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const AUTH_NOT_CONFIGURED_MESSAGE = '认证服务未配置，请检查 Supabase 环境变量。';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authIssue, setAuthIssue] = useState<string | null>(null);
  const [authReachable, setAuthReachable] = useState<boolean | null>(null);
  const lastProfileUserIdRef = useRef<string | null>(null);

  const loadProfile = async (userId: string, options?: { force?: boolean }) => {
    if (!options?.force && lastProfileUserIdRef.current === userId) {
      return;
    }

    lastProfileUserIdRef.current = userId;
    const userProfile = await getUserProfile(userId);
    setProfile(userProfile);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id, { force: true });
    }
  };

  useEffect(() => {
    if (!supabase) {
      setAuthReachable(false);
      setAuthIssue(AUTH_NOT_CONFIGURED_MESSAGE);
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
      .then(({ data: { session: nextSession } }) => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        if (nextSession?.user) {
          void loadProfile(nextSession.user.id);
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
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'INITIAL_SESSION') {
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        void loadProfile(nextSession.user.id);
      } else {
        lastProfileUserIdRef.current = null;
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
    if (!supabase) return { error: AUTH_NOT_CONFIGURED_MESSAGE };
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
    if (!supabase) return { error: AUTH_NOT_CONFIGURED_MESSAGE };
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

  const resetPassword = async (email: string) => {
    if (!supabase) return { error: AUTH_NOT_CONFIGURED_MESSAGE };
    if (authReachable === false && authIssue) return { error: authIssue };

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
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

  const signInWithOAuth = async (provider: 'github' | 'google' | 'wechat') => {
    if (!supabase) return { error: AUTH_NOT_CONFIGURED_MESSAGE };
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
    lastProfileUserIdRef.current = null;
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
        resetPassword,
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
