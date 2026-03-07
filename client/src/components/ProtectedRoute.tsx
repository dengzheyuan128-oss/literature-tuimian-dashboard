/**
 * 路由保护组件
 * 未登录用户会被重定向到登录页面
 */

import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { shouldRedirectToLogin } from '@/lib/authFlow';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isConfigured } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (
      shouldRedirectToLogin({
        user,
        authLoading: loading,
        isConfigured,
      })
    ) {
      setLocation('/login');
    }
  }, [user, loading, isConfigured, setLocation]);

  // 正在加载认证状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Supabase 未配置时，允许访客模式（本地存储）
  if (!isConfigured) {
    return <>{children}</>;
  }

  // 已登录，显示内容
  if (user) {
    return <>{children}</>;
  }

  // 未登录，显示加载状态（等待重定向）
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
