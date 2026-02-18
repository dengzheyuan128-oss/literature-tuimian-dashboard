/**
 * 安全工具模块
 * 提供输入验证和加密功能
 */

import DOMPurify from 'dompurify';

// ============ 输入验证 ============

/**
 * 验证 GPA（0-4.0）
 */
export function validateGPA(gpa: number): { valid: boolean; message?: string } {
  if (isNaN(gpa)) {
    return { valid: false, message: 'GPA 必须是数字' };
  }
  if (gpa < 0 || gpa > 4.0) {
    return { valid: false, message: 'GPA 必须在 0-4.0 之间' };
  }
  return { valid: true };
}

/**
 * 验证排名百分比（0-100）
 */
export function validateRankingPercentile(percent: number): { valid: boolean; message?: string } {
  if (isNaN(percent)) {
    return { valid: false, message: '排名百分比必须是数字' };
  }
  if (percent < 0 || percent > 100) {
    return { valid: false, message: '排名百分比必须在 0-100 之间' };
  }
  return { valid: true };
}

/**
 * 验证英语成绩范围
 */
export function validateEnglishScore(
  type: 'CET4' | 'CET6' | 'IELTS' | 'TOEFL',
  score: number
): { valid: boolean; message?: string } {
  if (isNaN(score)) {
    return { valid: false, message: '成绩必须是数字' };
  }

  const ranges = {
    CET4: { min: 0, max: 710, name: '四级' },
    CET6: { min: 0, max: 710, name: '六级' },
    IELTS: { min: 0, max: 9, name: '雅思' },
    TOEFL: { min: 0, max: 120, name: '托福' },
  };

  const range = ranges[type];
  if (score < range.min || score > range.max) {
    return { valid: false, message: `${range.name}成绩必须在 ${range.min}-${range.max} 之间` };
  }

  return { valid: true };
}

/**
 * 验证非空字符串
 */
export function validateNonEmpty(value: string, fieldName: string): { valid: boolean; message?: string } {
  if (!value || value.trim() === '') {
    return { valid: false, message: `${fieldName}不能为空` };
  }
  return { valid: true };
}

/**
 * 验证 URL 格式
 */
export function validateURL(url: string): { valid: boolean; message?: string } {
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, message: 'URL 格式无效' };
  }
}

// ============ XSS 防护 ============

/**
 * 清理 HTML 内容，防止 XSS 攻击
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [], // 不允许任何 HTML 标签
    ALLOWED_ATTR: [], // 不允许任何属性
  });
}

/**
 * 清理纯文本内容
 */
export function sanitizeText(text: string): string {
  // 移除潜在的 HTML/JS 代码
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\\/g, '&#x2F;');
}

/**
 * 验证并清理用户输入
 */
export function cleanUserInput(input: string, allowHTML: boolean = false): string {
  if (allowHTML) {
    return sanitizeHTML(input);
  }
  return sanitizeText(input);
}

// ============ 密码强度验证 ============

export interface PasswordStrength {
  score: number; // 0-4
  message: string;
  color: string;
}

/**
 * 验证密码强度
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  let score = 0;

  if (!password) {
    return { score: 0, message: '请输入密码', color: 'bg-gray-300' };
  }

  // 长度检查
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // 复杂度检查
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  // 评分（0-4）
  const finalScore = Math.min(Math.floor(score / 1.5), 4);

  const strengthLevels = [
    { message: '非常弱', color: 'bg-red-500' },
    { message: '弱', color: 'bg-orange-500' },
    { message: '中等', color: 'bg-yellow-500' },
    { message: '强', color: 'bg-blue-500' },
    { message: '非常强', color: 'bg-green-500' },
  ];

  return {
    score: finalScore,
    message: strengthLevels[finalScore].message,
    color: strengthLevels[finalScore].color,
  };
}

// ============ 内容安全策略 (CSP) ============

/**
 * 生成 CSP meta 标签
 */
export function generateCSPMeta(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  return `<meta http-equiv="Content-Security-Policy" content="${directives}">`;
}
