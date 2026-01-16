/**
 * 数据加载器
 * 支持Schema v1和v1.1结构
 */

import universitiesData from '../data/universities.json';

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

// v1 兼容类型（扁平结构）
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
}

export interface UniversitiesData {
  schemaVersion: string;
  lastUpdated: string;
  description?: string;
  universities: School[] | University[];
}

// 将v1.1结构展平为v1兼容格式
function flattenSchool(school: School): University {
  const firstProgram = school.programs[0];
  const firstNotice = firstProgram?.notices[0];
  
  return {
    id: school.id,
    name: school.name,
    tier: school.tier,
    location: school.location,
    is985: school.is985,
    is211: school.is211,
    disciplineGrade: school.disciplineGrade,
    specialty: firstProgram?.specialty || '',
    degreeType: firstProgram?.degreeTypes.join('、') || '',
    duration: firstNotice?.duration,
    examForm: firstNotice?.examForm || '',
    englishRequirement: firstNotice?.englishRequirement || '',
    applicationPeriod: firstNotice?.applicationPeriod || '',
    deadline: firstNotice?.deadline || '',
    url: firstNotice?.url || '',
  };
}

// 加载并验证数据
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
    return schools.map(flattenSchool);
  }
  
  // v1结构：直接使用
  if (data.schemaVersion === 'v1') {
    console.log(`[DataLoader] 使用v1结构`);
    return data.universities as University[];
  }
  
  throw new Error(`不支持的Schema版本: ${data.schemaVersion}`);
}

export const universities = loadUniversities();

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
