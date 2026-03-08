import { describe, expect, it } from 'vitest';

import { getInstitutionTags, getPrimaryInstitutionTier } from '@/lib/institutionTags';

describe('institutionTags', () => {
  it('derives overlapping tags from archived institution metadata', () => {
    const tags = getInstitutionTags('北京师范大学', {
      tier: '211',
      is985: false,
      is211: true,
    });

    expect(tags).toContain('211');
    expect(tags).toContain('双一流');
  });

  it('falls back to tier hints when an institution is not in the archived registry', () => {
    const tags = getInstitutionTags('测试院校', {
      tier: '省重点师范',
      is985: false,
      is211: false,
    });

    expect(tags).toEqual(['省属重点师范']);
    expect(getPrimaryInstitutionTier(tags, '普通')).toBe('省属重点师范');
  });
});
