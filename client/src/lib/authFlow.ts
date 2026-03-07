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

interface AuthErrorOptions {
  supabaseUrl?: string;
}

interface AuthHealthCheckOptions {
  supabaseUrl: string;
  supabaseAnonKey: string;
  timeoutMs?: number;
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

export function getAuthErrorMessage(error: unknown, options: AuthErrorOptions = {}): string {
  const rawMessage = extractErrorMessage(error);

  if (!rawMessage) {
    return '认证失败，请稍后重试。';
  }

  if (isConnectivityError(rawMessage)) {
    return buildConnectivityMessage(options.supabaseUrl);
  }

  return rawMessage;
}

export async function checkAuthServiceHealth({
  supabaseUrl,
  supabaseAnonKey,
  timeoutMs = 8000,
}: AuthHealthCheckOptions): Promise<{ ok: boolean; message: string | null }> {
  const origin = getSupabaseOrigin(supabaseUrl);
  if (!origin || !supabaseAnonKey.trim()) {
    return {
      ok: false,
      message: 'Supabase 认证配置不完整，请检查 URL 和匿名 Key。',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${origin}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        apikey: supabaseAnonKey,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `认证服务返回 ${response.status}，请检查 Supabase 项目状态、URL 或匿名 Key。`,
      };
    }

    return { ok: true, message: null };
  } catch (error) {
    return {
      ok: false,
      message: getAuthErrorMessage(error, { supabaseUrl }),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export function buildConnectivityMessage(supabaseUrl?: string): string {
  const origin = getSupabaseOrigin(supabaseUrl);
  return origin
    ? `无法连接认证服务（${origin}）。请检查 Supabase URL、项目状态、当前网络，或 TLS / 代理设置。`
    : '无法连接认证服务。请检查 Supabase URL、项目状态、当前网络，或 TLS / 代理设置。';
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.trim();
  }

  if (typeof error === 'string') {
    return error.trim();
  }

  return '';
}

function isConnectivityError(message: string): boolean {
  const normalized = message.toLowerCase();
  return [
    'failed to fetch',
    'fetch failed',
    'networkerror',
    'load failed',
    'typeerror: failed to fetch',
    'the network connection was lost',
    'ssl',
    'tls',
  ].some((marker) => normalized.includes(marker));
}

function getSupabaseOrigin(value?: string): string | null {
  if (!value?.trim()) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}
