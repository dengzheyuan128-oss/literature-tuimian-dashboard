/**
 * 数据加载器
 * 支持Schema v1结构
 */

import universitiesData from '../data/universities.json';

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
  universities: University[];
}

// 加载并验证数据
function loadUniversities(): University[] {
  const data = universitiesData as any;
  
  // 支持v1结构
  if (data.schemaVersion && data.universities) {
    console.log(`[DataLoader] Schema版本: ${data.schemaVersion}`);
    console.log(`[DataLoader] 最后更新: ${data.lastUpdated}`);
    return data.universities;
  }
  
  // 向后兼容旧结构
  if (Array.isArray(data)) {
    console.warn('[DataLoader] 使用旧数据结构，建议升级到v1');
    return data;
  }
  
  throw new Error('无效的数据格式');
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
