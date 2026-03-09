import type { PublicProgramCard } from '@/types/publicProgramCard';

export type DeadlineTone = 'urgent' | 'warning' | 'normal' | 'muted';

export interface DeadlinePresentation {
  label: string;
  tone: DeadlineTone;
}

export function getDeadlinePresentation(deadline: string, now: Date = new Date()): DeadlinePresentation {
  const parsed = parseSupportedDate(deadline);
  if (!parsed) {
    return { label: '截止待确认', tone: 'muted' };
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const diffDays = Math.floor((target.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) {
    return { label: '历史通知', tone: 'muted' };
  }

  if (diffDays <= 3) {
    return { label: `${diffDays + 1}天内截止`, tone: 'urgent' };
  }

  if (diffDays <= 7) {
    return { label: '7天内截止', tone: 'warning' };
  }

  return { label: '仍可准备', tone: 'normal' };
}

export function getNextActionLabel(card: Pick<PublicProgramCard, 'deadline' | 'url'>, now: Date = new Date()): string {
  if (!card.url) return '等待补充官方来源';

  const deadline = getDeadlinePresentation(card.deadline, now);
  if (deadline.tone === 'urgent') return '立即查看原文并设置提醒';
  if (deadline.tone === 'warning') return '优先核对条件并先收藏';
  if (deadline.tone === 'muted') return '先查看原文确认时间';
  return '先查看原文再决定是否行动';
}

function parseSupportedDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const chinese = trimmed.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (chinese) {
    return new Date(Number(chinese[1]), Number(chinese[2]) - 1, Number(chinese[3]));
  }

  const iso = trimmed.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }

  return null;
}
