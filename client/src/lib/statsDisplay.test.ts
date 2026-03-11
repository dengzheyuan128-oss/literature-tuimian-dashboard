import { describe, expect, it } from 'vitest';

import { buildEntriesLabel, buildResultsSummary } from '@/lib/statsDisplay';

describe('statsDisplay', () => {
  it('hides the global entries label when totalCount is unavailable', () => {
    expect(buildEntriesLabel(undefined)).toBeNull();
  });

  it('shows the global entries label when totalCount is reliable', () => {
    expect(buildEntriesLabel(10702)).toBe('Entries: 10702');
  });

  it('falls back to current-page wording when homepage totalCount is unavailable', () => {
    expect(buildResultsSummary({ currentCount: 24 })).toBe('当前页 24 条');
  });

  it('includes reliable total and institution count when both are available', () => {
    expect(buildResultsSummary({ currentCount: 24, totalCount: 10702, institutionCount: 62 })).toBe(
      '当前页 24 条，共 10702 个条目 · 62 所高校',
    );
  });
});
