import { describe, expect, it } from 'vitest';

import { getDeadlinePresentation, getNextActionLabel } from '@/lib/publicCardPresentation';

describe('publicCardPresentation', () => {
  it('marks near deadlines as urgent', () => {
    expect(getDeadlinePresentation('2026年3月11日', new Date('2026-03-09T08:00:00Z'))).toEqual({
      label: '3天内截止',
      tone: 'urgent',
    });
  });

  it('marks missing or past deadlines conservatively', () => {
    expect(getDeadlinePresentation('', new Date('2026-03-09T08:00:00Z'))).toEqual({
      label: '截止待确认',
      tone: 'muted',
    });

    expect(getDeadlinePresentation('2026年3月1日', new Date('2026-03-09T08:00:00Z'))).toEqual({
      label: '历史通知',
      tone: 'muted',
    });
  });

  it('suggests the next action from source availability and deadline pressure', () => {
    expect(
      getNextActionLabel(
        { deadline: '2026年3月11日', url: 'https://example.com' },
        new Date('2026-03-09T08:00:00Z'),
      ),
    ).toBe('立即查看原文并设置提醒');

    expect(getNextActionLabel({ deadline: '', url: '' }, new Date('2026-03-09T08:00:00Z'))).toBe(
      '等待补充官方来源',
    );
  });
});
