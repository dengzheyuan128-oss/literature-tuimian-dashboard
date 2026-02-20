/**
 * Supabase 客户端配置
 * 提供数据库、认证、存储等功能
 */

import { createClient } from '@supabase/supabase-js';

// 从环境变量获取配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 检查配置是否存在
const isConfigured = supabaseUrl && supabaseAnonKey;

// 创建 Supabase 客户端（如果配置存在）
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// 导出配置状态，供其他组件检查
export const isSupabaseConfigured = isConfigured;

// ============ 类型定义 ============

export interface UserProfile {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
  university: string | null;
  major: string | null;
  grade: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserFavorite {
  id: number;
  user_id: string;
  university_id: number;
  university_name: string;
  created_at: string;
}

export interface UserReminder {
  id: number;
  user_id: string;
  university_id: number;
  university_name: string;
  deadline: string;
  reminder_days: number;
  is_active: boolean;
  notified: boolean;
  created_at: string;
}

export interface UserCompareList {
  id: number;
  user_id: string;
  university_ids: number[];
  updated_at: string;
}

// ============ 数据库操作函数 ============

/**
 * 获取用户 Profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

/**
 * 更新用户 Profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'created_at'>>
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user profile:', error);
    return false;
  }

  return true;
}

// ============ 收藏相关 ============

/**
 * 获取用户收藏列表
 */
export async function getUserFavorites(userId: string): Promise<UserFavorite[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('user_favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }

  return data || [];
}

/**
 * 添加收藏
 */
export async function addFavorite(
  userId: string,
  universityId: number,
  universityName: string
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('user_favorites')
    .insert({ user_id: userId, university_id: universityId, university_name: universityName });

  if (error) {
    console.error('Error adding favorite:', error);
    return false;
  }

  return true;
}

/**
 * 删除收藏
 */
export async function removeFavorite(userId: string, universityId: number): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('university_id', universityId);

  if (error) {
    console.error('Error removing favorite:', error);
    return false;
  }

  return true;
}

// ============ 提醒相关 ============

/**
 * 获取用户提醒列表
 */
export async function getUserReminders(userId: string): Promise<UserReminder[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('user_reminders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reminders:', error);
    return [];
  }

  return data || [];
}

/**
 * 添加提醒
 */
export async function addReminder(
  userId: string,
  reminder: Omit<UserReminder, 'id' | 'user_id' | 'notified' | 'created_at'>
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('user_reminders')
    .insert({ user_id: userId, ...reminder });

  if (error) {
    console.error('Error adding reminder:', error);
    return false;
  }

  return true;
}

/**
 * 删除提醒
 */
export async function removeReminder(userId: string, reminderId: number): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('user_reminders')
    .delete()
    .eq('user_id', userId)
    .eq('id', reminderId);

  if (error) {
    console.error('Error removing reminder:', error);
    return false;
  }

  return true;
}

/**
 * 切换提醒状态
 */
export async function toggleReminder(userId: string, reminderId: number, isActive: boolean): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('user_reminders')
    .update({ is_active: isActive })
    .eq('user_id', userId)
    .eq('id', reminderId);

  if (error) {
    console.error('Error toggling reminder:', error);
    return false;
  }

  return true;
}

// ============ 对比列表相关 ============

/**
 * 获取用户对比列表
 */
export async function getUserCompareList(userId: string): Promise<number[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('user_compare_lists')
    .select('university_ids')
    .eq('user_id', userId)
    .single();

  if (error) {
    // 如果没有记录，返回空数组
    if (error.code === 'PGRST116') return [];
    console.error('Error fetching compare list:', error);
    return [];
  }

  return data?.university_ids || [];
}

/**
 * 更新对比列表
 */
export async function updateCompareList(userId: string, universityIds: number[]): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('user_compare_lists')
    .upsert(
      { user_id: userId, university_ids: universityIds, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('Error updating compare list:', error);
    return false;
  }

  return true;
}
