/**
 * 管理员工具函数
 */

// 管理员邮箱列表（从环境变量读取）
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map((e: string) => e.trim()).filter(Boolean);

/**
 * 检查是否为管理员
 */
export function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}
