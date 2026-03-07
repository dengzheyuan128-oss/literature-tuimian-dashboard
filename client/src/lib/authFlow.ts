import type { User } from '@supabase/supabase-js';

interface LoginRedirectParams {
  user: User | null;
  authLoading: boolean;
}

interface ProtectedRouteRedirectParams {
  user: User | null;
  authLoading: boolean;
  isConfigured: boolean;
}

export function shouldRedirectToDashboard({
  user,
  authLoading,
}: LoginRedirectParams): boolean {
  return Boolean(user) && !authLoading;
}

export function shouldRedirectToLogin({
  user,
  authLoading,
  isConfigured,
}: ProtectedRouteRedirectParams): boolean {
  return !user && !authLoading && isConfigured;
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.trim();

    if (message === 'Failed to fetch') {
      return '认证服务暂时不可达，请检查网络连接或稍后重试。';
    }

    if (message) {
      return message;
    }
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }

  return '认证失败，请稍后重试。';
}
