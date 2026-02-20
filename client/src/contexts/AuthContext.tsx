/**
 * 认证上下文
 * 管理用户登录状态和认证操作
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, getUserProfile, UserProfile } from '@/lib/supabase';

interface AuthContextType {
  // 状态
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;

  // 认证方法
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithOAuth: (provider: 'github' | 'google' | 'wechat') => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;

  // 工具方法
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // 加载用户 Profile
  const loadProfile = async (userId: string) => {
    const userProfile = await getUserProfile(userId);
    setProfile(userProfile);
  };

  // 刷新 Profile
  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  // 初始化：检查现有会话
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // 获取初始会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
      setLoading(false);
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 邮箱登录
  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) return { error: '认证服务未配置' };

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error?.message || null };
  };

  // 邮箱注册
  const signUpWithEmail = async (email: string, password: string) => {
    if (!supabase) return { error: '认证服务未配置' };

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    return { error: error?.message || null };
  };

  // OAuth 登录
  const signInWithOAuth = async (provider: 'github' | 'google' | 'wechat') => {
    if (!supabase) return { error: '认证服务未配置' };

    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: window.location.origin,
      },
    });

    return { error: error?.message || null };
  };

  // 退出登录
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
