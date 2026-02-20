/**
 * Tier工具函数
 * 将14+种tier值简化为5种分类，并提供颜色映射
 */

// 简化后的5种分类
export type SimplifiedTier = '985' | '211' | '双一流' | '四非' | '省属重点师范' | '其他';

// 分类配置
export interface TierConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

// 5种分类的配置
export const TIER_CONFIGS: Record<SimplifiedTier, TierConfig> = {
  '985': {
    label: '985',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/40',
    borderColor: 'border-red-300 dark:border-red-700',
    description: '985工程高校',
  },
  '211': {
    label: '211',
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/40',
    borderColor: 'border-orange-300 dark:border-orange-700',
    description: '211工程高校',
  },
  '双一流': {
    label: '双一流',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/40',
    borderColor: 'border-blue-300 dark:border-blue-700',
    description: '双一流建设高校',
  },
  '四非': {
    label: '四非',
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/40',
    borderColor: 'border-purple-300 dark:border-purple-700',
    description: '四非高校（有学科优势）',
  },
  '省属重点师范': {
    label: '省属重点师范',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/40',
    borderColor: 'border-green-300 dark:border-green-700',
    description: '省属重点师范院校',
  },
  '其他': {
    label: '其他',
    color: 'text-gray-700 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/40',
    borderColor: 'border-gray-300 dark:border-gray-700',
    description: '其他院校',
  },
};

/**
 * 将原始tier值映射到简化分类
 * @param rawTier 原始tier值（如"211（B+学科）"）
 * @returns 简化后的分类（如"211"）
 */
export function getSimplifiedTier(rawTier: string): SimplifiedTier {
  if (!rawTier) return '其他';

  const tier = rawTier.trim();

  // 985
  if (tier === '985' || tier.startsWith('985')) {
    return '985';
  }

  // 211及其变体（211、211（A-学科）、211（B+学科）等）
  if (tier === '211' || tier.startsWith('211')) {
    return '211';
  }

  // 双一流及其变体
  if (tier === '双一流' || tier.startsWith('双一流')) {
    return '双一流';
  }

  // 四非及其变体
  if (tier === '四非' || tier.startsWith('四非')) {
    return '四非';
  }

  // 省重点师范
  if (tier === '省重点师范' || tier === '省属重点师范' || tier.includes('师范')) {
    return '省属重点师范';
  }

  return '其他';
}

/**
 * 获取tier的显示配置
 */
export function getTierConfig(rawTier: string): TierConfig {
  const simplified = getSimplifiedTier(rawTier);
  return TIER_CONFIGS[simplified];
}

/**
 * 获取tier的CSS类名
 */
export function getTierClassName(rawTier: string): string {
  const config = getTierConfig(rawTier);
  return `${config.bgColor} ${config.color} ${config.borderColor}`;
}

/**
 * 获取tier的Badge样式类名（用于小标签）
 */
export function getTierBadgeClassName(rawTier: string): string {
  const config = getTierConfig(rawTier);
  return `${config.bgColor} ${config.color} border-0`;
}

/**
 * 简化分类列表（用于筛选按钮）
 */
export const SIMPLIFIED_TIERS: SimplifiedTier[] = [
  '985',
  '211',
  '双一流',
  '四非',
  '省属重点师范',
];

/**
 * 检查原始tier是否属于某个简化分类
 */
export function tierBelongsTo(rawTier: string, simplifiedTier: SimplifiedTier): boolean {
  return getSimplifiedTier(rawTier) === simplifiedTier;
}

/**
 * 获取简化分类的显示标签
 */
export function getSimplifiedTierLabel(tier: SimplifiedTier): string {
  return TIER_CONFIGS[tier].label;
}
