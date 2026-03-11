import { describe, expect, it } from 'vitest';

import { HOME_HERO_CONTENT } from '@/lib/homeHeroContent';

describe('homeHeroContent', () => {
  it('uses a task-oriented headline', () => {
    expect(HOME_HERO_CONTENT.title).toContain('\u627e');
  });

  it('keeps exactly one primary call to action', () => {
    expect(HOME_HERO_CONTENT.primaryCta).toBeTruthy();
  });

  it('keeps at most two secondary actions', () => {
    expect(HOME_HERO_CONTENT.secondaryCtas.length).toBeLessThanOrEqual(2);
  });

  it('avoids overclaiming with a workbench-oriented subtitle', () => {
    expect(HOME_HERO_CONTENT.description).toContain('\u7b5b\u9009');
    expect(HOME_HERO_CONTENT.description).toContain('\u539f\u6587');
  });
});
