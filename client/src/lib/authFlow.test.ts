import { describe, expect, it } from 'vitest';

import {
  buildConnectivityMessage,
  getAuthErrorMessage,
  shouldRedirectToDashboard,
  shouldRedirectToLogin,
} from './authFlow';

describe('authFlow', () => {
  it('redirects to dashboard only after auth is ready', () => {
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

  it('maps fetch failures to a connectivity message with Supabase origin', () => {
    expect(
      getAuthErrorMessage(new Error('Failed to fetch'), {
        supabaseUrl: 'https://example.supabase.co',
      }),
    ).toBe(buildConnectivityMessage('https://example.supabase.co'));
  });

  it('passes through non-connectivity auth errors', () => {
    expect(getAuthErrorMessage('Invalid login credentials')).toBe('Invalid login credentials');
  });
});
