import { describe, expect, it } from 'vitest';

import { getQueryCountStrategy, resolveTotalCount, shouldFetchInstitutionCount } from '../../../api/program-cards';

describe('program-cards api query strategy', () => {
  it('skips exact count for browse requests so list queries stay lightweight', () => {
    expect(getQueryCountStrategy({ limit: 24, offset: 0 })).toBeUndefined();
  });

  it('skips exact count for search requests so keyword queries do not block on totals', () => {
    expect(getQueryCountStrategy({ search: '北京', limit: 20, offset: 0 })).toBeUndefined();
  });

  it('does not request institution count for list requests', () => {
    expect(shouldFetchInstitutionCount({ limit: 24, offset: 0 })).toBe(false);
  });

  it('only resolves totalCount from exact count or id lookups', () => {
    expect(resolveTotalCount({ limit: 24, offset: 0 }, 25, undefined)).toBeUndefined();
    expect(resolveTotalCount({ id: 'card-1', limit: 1, offset: 0 }, 1, undefined)).toBe(1);
    expect(resolveTotalCount({ limit: 24, offset: 0 }, 25, 321)).toBe(321);
  });
});
