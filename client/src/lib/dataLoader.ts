/**
 * 数据加载器
 * 支持Schema v1和v1.1结构
 * 包含数据完整性检测和兜底处理
 */

import universitiesData from '../data/universities.json';

// ============ 类型定义 ============

// 数据完整性状态
export type DataStatus = 'COMPLETE' | 'PARTIAL' | 'PENDING_MANUAL';

// v1.1 结构类型定义
export interface Notice {
  id: string;
  programId: string;
  year: number;
  title: string;
  url: string;
  sourceType: string;
  publisher: string;
  linkGrade: string;
  applicationPeriod: string;
  deadline: string;
  examForm: string;
  englishRequirement: string;
  duration?: string;
  publishedAt: string;
  lastVerifiedAt: string;
}

export interface Program {
  id: string;
  schoolId: number;
  programName: string;
  department: string;
  specialty: string;
  degreeTypes: string[];
  notices: Notice[];
}

export interface School {
  id: number;
  name: string;
  tier: string;
  location?: string;
  is985?: boolean;
  is211?: boolean;
  disciplineGrade?: string;
  programs: Program[];
}

// v1 兼容类型（扁平结构）+ dataStatus
export interface University {
  id: number;
  name: string;
  tier: string;
  location?: string;
  is985?: boolean;
  is211?: boolean;
  disciplineGrade?: string;
  specialty: string;
  degreeType: string;
  duration?: string;
  examForm: string;
  englishRequirement: string;
  applicationPeriod: string;
  deadline: string;
  url: string;
  dataStatus: DataStatus;
}

export interface UniversitiesData {
  schemaVersion: string;
  lastUpdated: string;
  description?: string;
  universities: School[] | University[];
}

// 覆盖率统计
export interface CoverageStats {
  total: number;
  complete: number;
  partial: number;
  pendingManual: number;
  completeRate: number;
}

// ============ 工具函数 ============

// 兜底占位符
const PLACEHOLDER = '待补充';

/**
 * 判断值是否为空：覆盖 null / undefined / "" / 空数组
 */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

/**
 * 安全获取字符串值，空值返回占位符
 */
function safeString(value: unknown, fallback: string = PLACEHOLDER): string {
  if (isEmpty(value)) return fallback;
  return String(value);
}

/**
 * 安全获取数组并转字符串
 */
function safeArrayJoin(arr: unknown, separator: string = '、'): string {
  if (!Array.isArray(arr) || arr.length === 0) return PLACEHOLDER;
  const filtered = arr.filter(item => !isEmpty(item));
  if (filtered.length === 0) return PLACEHOLDER;
  return filtered.join(separator);
}

// ============ 数据完整性检测 ============

/**
 * 计算数据完整性状态
 */
function computeDataStatus(school: School): DataStatus {
  const programs = school.programs;
  const hasPrograms = Array.isArray(programs) && programs.length > 0;

  if (!hasPrograms) {
    return 'PENDING_MANUAL';
  }

  const firstProgram = programs[0];
  const notices = firstProgram?.notices;
  const hasNotices = Array.isArray(notices) && notices.length > 0;

  const hasTier = !isEmpty(school.tier);
  const hasGrade = !isEmpty(school.disciplineGrade);
  const hasProgramName = !isEmpty(firstProgram?.programName);
  const hasDegreeTypes = Array.isArray(firstProgram?.degreeTypes) && firstProgram.degreeTypes.length > 0;
  const hasSpecialty = !isEmpty(firstProgram?.specialty);

  // 检查 notice 字段
  const firstNotice = notices?.[0];
  const hasUrl = !isEmpty(firstNotice?.url);
  const hasDeadline = !isEmpty(firstNotice?.deadline);

  // COMPLETE: 所有核心字段都有值
  if (hasPrograms && hasNotices && hasTier && hasGrade &&
      hasProgramName && hasDegreeTypes && hasSpecialty && hasUrl && hasDeadline) {
    return 'COMPLETE';
  }

  // PARTIAL: 有部分数据但不完整
  if (hasTier || hasGrade || hasPrograms) {
    return 'PARTIAL';
  }

  // PENDING_MANUAL: 基本无数据
  return 'PENDING_MANUAL';
}

/**
 * 获取 PARTIAL 状态学校的缺失字段列表
 */
export function getMissingFields(school: School): string[] {
  const missing: string[] = [];

  if (isEmpty(school.tier)) missing.push('tier');
  if (isEmpty(school.disciplineGrade)) missing.push('disciplineGrade');

  const programs = school.programs;
  if (!Array.isArray(programs) || programs.length === 0) {
    missing.push('programs');
    return missing;
  }

  const firstProgram = programs[0];
  if (isEmpty(firstProgram?.programName)) missing.push('programName');
  if (isEmpty(firstProgram?.specialty)) missing.push('specialty');
  if (!Array.isArray(firstProgram?.degreeTypes) || firstProgram.degreeTypes.length === 0) {
    missing.push('degreeTypes');
  }

  const notices = firstProgram?.notices;
  if (!Array.isArray(notices) || notices.length === 0) {
    missing.push('notices');
    return missing;
  }

  const firstNotice = notices[0];
  if (isEmpty(firstNotice?.url)) missing.push('url');
  if (isEmpty(firstNotice?.deadline)) missing.push('deadline');
  if (isEmpty(firstNotice?.examForm)) missing.push('examForm');
  if (isEmpty(firstNotice?.englishRequirement)) missing.push('englishRequirement');
  if (isEmpty(firstNotice?.applicationPeriod)) missing.push('applicationPeriod');

  return missing;
}

// ============ 数据转换 ============

/**
 * 将v1.1结构展平为v1兼容格式，带兜底处理
 */
function flattenSchool(school: School): University {
  const programs = school.programs;
  const firstProgram = Array.isArray(programs) && programs.length > 0 ? programs[0] : null;
  const notices = firstProgram?.notices;
  const firstNotice = Array.isArray(notices) && notices.length > 0 ? notices[0] : null;

  const dataStatus = computeDataStatus(school);

  return {
    id: school.id,
    name: school.name,
    tier: safeString(school.tier),
    location: school.location,
    is985: school.is985,
    is211: school.is211,
    disciplineGrade: school.disciplineGrade, // 可选字段，不做兜底
    specialty: safeString(firstProgram?.specialty),
    degreeType: safeArrayJoin(firstProgram?.degreeTypes),
    duration: firstNotice?.duration,
    examForm: safeString(firstNotice?.examForm),
    englishRequirement: safeString(firstNotice?.englishRequirement),
    applicationPeriod: safeString(firstNotice?.applicationPeriod),
    deadline: safeString(firstNotice?.deadline),
    url: firstNotice?.url || '', // URL 不做占位符，保持空字符串
    dataStatus,
  };
}

// ============ 数据加载 ============

/**
 * 加载并验证数据
 */
function loadUniversities(): University[] {
  const data = universitiesData as any;

  if (!data.schemaVersion || !data.universities) {
    throw new Error('无效的数据格式：缺少schemaVersion或universities字段');
  }

  console.log(`[DataLoader] Schema版本: ${data.schemaVersion}`);
  console.log(`[DataLoader] 最后更新: ${data.lastUpdated}`);
  if (data.description) {
    console.log(`[DataLoader] 描述: ${data.description}`);
  }

  // v1.1结构：需要展平
  if (data.schemaVersion === 'v1.1') {
    const schools = data.universities as School[];
    console.log(`[DataLoader] 检测到v1.1结构，展平为兼容格式`);
    console.log(`[DataLoader] 院校: ${schools.length}所`);
    const result = schools.map(flattenSchool);

    // 输出覆盖率统计
    const stats = getCoverageStats(result);
    console.log(`[DataLoader] 数据覆盖率: 完整${stats.complete} / 部分${stats.partial} / 待补${stats.pendingManual} (${stats.completeRate}%)`);

    return result;
  }

  // v1结构：直接使用（添加默认dataStatus）
  if (data.schemaVersion === 'v1') {
    console.log(`[DataLoader] 使用v1结构`);
    return (data.universities as any[]).map(u => ({
      ...u,
      dataStatus: 'COMPLETE' as DataStatus,
    }));
  }

  throw new Error(`不支持的Schema版本: ${data.schemaVersion}`);
}

// ============ 导出 ============

export const universities = loadUniversities();

/**
 * 获取覆盖率统计
 */
export function getCoverageStats(unis: University[] = universities): CoverageStats {
  const total = unis.length;
  const complete = unis.filter(u => u.dataStatus === 'COMPLETE').length;
  const partial = unis.filter(u => u.dataStatus === 'PARTIAL').length;
  const pendingManual = unis.filter(u => u.dataStatus === 'PENDING_MANUAL').length;

  return {
    total,
    complete,
    partial,
    pendingManual,
    completeRate: total > 0 ? Math.round((complete / total) * 100) : 0,
  };
}

export function getUniversityById(id: number): University | undefined {
  return universities.find(u => u.id === id);
}

export function getUniversitiesByTier(tier: string): University[] {
  return universities.filter(u => u.tier === tier);
}

export function searchUniversities(query: string): University[] {
  const lowerQuery = query.toLowerCase();
  return universities.filter(u =>
    u.name.toLowerCase().includes(lowerQuery) ||
    u.specialty.toLowerCase().includes(lowerQuery)
  );
}

// v1.1专用：获取原始School数据
export function getSchools(): School[] {
  const data = universitiesData as any;
  if (data.schemaVersion === 'v1.1') {
    return data.universities as School[];
  }
  throw new Error('getSchools() 仅支持v1.1结构');
}

// v1.1专用：根据ID获取School
export function getSchoolById(id: number): School | undefined {
  try {
    const schools = getSchools();
    return schools.find(s => s.id === id);
  } catch {
    return undefined;
  }
}
