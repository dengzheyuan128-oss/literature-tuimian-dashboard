import { describe, expect, it } from 'vitest';
import {
  getAuthErrorMessage,
  shouldRedirectToDashboard,
  shouldRedirectToLogin,
} from './authFlow';

describe('authFlow', () => {
  it('redirects to dashboard only after login was requested and user is ready', () => {
    expect(
      shouldRedirectToDashboard({
        user: null,
        authLoading: false,
      }),
    ).toBe(false);

    expect(
      shouldRedirectToDashboard({
        user: {} as never,
        authLoading: true,
      }),
    ).toBe(false);

    expect(
      shouldRedirectToDashboard({
        user: {} as never,
        authLoading: false,
      }),
    ).toBe(true);
  });

  it('redirects protected routes only when auth check is complete', () => {
    expect(
      shouldRedirectToLogin({
        user: null,
        authLoading: true,
        isConfigured: true,
      }),
    ).toBe(false);

    expect(
      shouldRedirectToLogin({
        user: null,
        authLoading: false,
        isConfigured: true,
      }),
    ).toBe(true);
  });

  it('maps fetch failures to a clear auth error message', () => {
    expect(getAuthErrorMessage(new Error('Failed to fetch'))).toBe(
      '认证服务暂时不可达，请检查网络连接或稍后重试。',
    );
  });
});
