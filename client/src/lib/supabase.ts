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

// ============ 用户反馈相关 ============

export type FeedbackType = 'link_invalid' | 'info_outdated' | 'info_wrong';

export interface UserFeedback {
  id: number;
  user_id: string;
  feedback_type: FeedbackType;
  university_id: number | null;
  university_name: string | null;
  description: string;
  page_url: string | null;
  status: 'pending' | 'resolved' | 'ignored';
  created_at: string;
}

export type SubmissionExtractStatus =
  | 'pending_extract'
  | 'extract_failed'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'merged';

export type SubmissionReviewStatus = 'pending_review' | 'approved' | 'rejected' | 'merged';

export interface SubmissionQueueItem {
  id: string;
  submitted_by: string | null;
  submitted_url: string;
  submission_note: string;
  extract_status: SubmissionExtractStatus;
  review_status: SubmissionReviewStatus;
  raw_content: string;
  extracted_payload: Record<string, unknown>;
  matched_program_card_id: string | null;
  reviewer_id: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionDraftInput {
  submitted_url: string;
  submission_note?: string;
  extract_status?: SubmissionExtractStatus;
  review_status?: SubmissionReviewStatus;
  raw_content?: string;
  extracted_payload?: Record<string, unknown>;
  matched_program_card_id?: string | null;
}

/**
 * 提交用户反馈
 */
export async function submitFeedback(
  userId: string,
  feedback: {
    feedback_type: FeedbackType;
    university_id?: number;
    university_name?: string;
    description: string;
    page_url?: string;
  }
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('user_feedback')
    .insert({
      user_id: userId,
      feedback_type: feedback.feedback_type,
      university_id: feedback.university_id || null,
      university_name: feedback.university_name || null,
      description: feedback.description,
      page_url: feedback.page_url || null,
    });

  if (error) {
    console.error('Error submitting feedback:', error);
    return false;
  }

  return true;
}

export async function submitLinkSubmission(
  userId: string,
  submission: SubmissionDraftInput,
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.from('submission_queue').insert({
    submitted_by: userId,
    submitted_url: submission.submitted_url,
    submission_note: submission.submission_note || '',
    extract_status: submission.extract_status || 'pending_extract',
    review_status: submission.review_status || 'pending_review',
    raw_content: submission.raw_content || '',
    extracted_payload: submission.extracted_payload || {},
    matched_program_card_id: submission.matched_program_card_id || null,
  });

  if (error) {
    console.error('Error submitting link submission:', error);
    return false;
  }

  return true;
}

export async function getOwnSubmissions(userId: string): Promise<SubmissionQueueItem[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('submission_queue')
    .select('*')
    .eq('submitted_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching own submissions:', error);
    return [];
  }

  return (data as SubmissionQueueItem[]) || [];
}

export async function listSubmissionQueue(): Promise<SubmissionQueueItem[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('submission_queue')
    .select('*')
    .in('extract_status', ['pending_extract', 'extract_failed', 'pending_review'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching submission queue:', error);
    return [];
  }

  return (data as SubmissionQueueItem[]) || [];
}

export async function updateSubmissionDraft(
  submissionId: string,
  updates: Partial<SubmissionDraftInput> & {
    reviewer_id?: string | null;
    reviewed_at?: string | null;
  },
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('submission_queue')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId);

  if (error) {
    console.error('Error updating submission draft:', error);
    return false;
  }

  return true;
}

export async function approveSubmissionNotice(
  submission: SubmissionQueueItem,
  reviewerId: string,
  approval: {
    program_card_id: string;
    notice: {
      title: string;
      notice_url: string;
      published_at_raw: string;
      stage: string;
      application_start_raw: string;
      application_end_raw: string;
      requirement_text: string;
      ranking_requirement_text: string;
      english_requirement_text: string;
      materials_text: string;
      application_method: string;
      source_channel: string;
      source_type: string;
      review_status: 'approved';
    };
  },
): Promise<boolean> {
  if (!supabase) return false;

  const { data: noticeData, error: noticeError } = await supabase
    .from('notices')
    .insert({
      program_card_id: approval.program_card_id,
      ...approval.notice,
    })
    .select('id')
    .single();

  if (noticeError || !noticeData?.id) {
    console.error('Error inserting approved notice:', noticeError);
    return false;
  }

  const { error: sourceError } = await supabase.from('notice_sources').insert({
    notice_id: noticeData.id,
    source_url: submission.submitted_url,
    raw_payload: submission.extracted_payload || {},
  });

  if (sourceError) {
    console.error('Error inserting notice source:', sourceError);
    return false;
  }

  const reviewedAt = new Date().toISOString();

  const { error: reviewError } = await supabase.from('admin_reviews').insert({
    submission_id: submission.id,
    reviewer_id: reviewerId,
    action: 'approve',
    review_note: submission.submission_note || '',
    before_payload: submission.extracted_payload || {},
    after_payload: {
      ...submission.extracted_payload,
      approved_notice_id: noticeData.id,
      matched_program_card_id: approval.program_card_id,
    },
  });

  if (reviewError) {
    console.error('Error inserting admin review log:', reviewError);
    return false;
  }

  const { error: queueError } = await supabase
    .from('submission_queue')
    .update({
      extract_status: 'approved',
      review_status: 'approved',
      matched_program_card_id: approval.program_card_id,
      reviewer_id: reviewerId,
      reviewed_at: reviewedAt,
      updated_at: reviewedAt,
    })
    .eq('id', submission.id);

  if (queueError) {
    console.error('Error updating submission queue after approval:', queueError);
    return false;
  }

  await supabase
    .from('program_cards')
    .update({
      latest_notice_id: noticeData.id,
      updated_at: reviewedAt,
    })
    .eq('id', approval.program_card_id);

  return true;
}

export async function rejectSubmissionNotice(
  submissionId: string,
  reviewerId: string,
  reviewNote = '',
  beforePayload: Record<string, unknown> = {},
): Promise<boolean> {
  if (!supabase) return false;

  const reviewedAt = new Date().toISOString();
  const { error: queueError } = await supabase
    .from('submission_queue')
    .update({
      extract_status: 'rejected',
      review_status: 'rejected',
      reviewer_id: reviewerId,
      reviewed_at: reviewedAt,
      updated_at: reviewedAt,
    })
    .eq('id', submissionId);

  if (queueError) {
    console.error('Error rejecting submission:', queueError);
    return false;
  }

  const { error: reviewError } = await supabase.from('admin_reviews').insert({
    submission_id: submissionId,
    reviewer_id: reviewerId,
    action: 'reject',
    review_note: reviewNote,
    before_payload: beforePayload,
    after_payload: {},
  });

  if (reviewError) {
    console.error('Error inserting rejection review log:', reviewError);
    return false;
  }

  return true;
}
