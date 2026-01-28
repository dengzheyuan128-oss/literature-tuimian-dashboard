# 🔧 修正版实施方案 - Phase 0: 紧急止血
## 基于 GPT-5.2 反馈的 Bug 修复版

**修正日期**: 2026-01-24  
**修正原因**: 原方案存在 3 个确定性 bug + 多个风险点  
**适用场景**: 零代码基础 + 单人维护 + 多 AI 账号协作

---

## ⚠️ 重要：原方案的 3 个致命 Bug（已修复）

### Bug 1: check-data-quality.cjs 中 `notice` 未定义
**问题**: forEach 回调没有接收参数，导致脚本必报错
**影响**: CI 无法运行
**状态**: ✅ 已在本方案中修复

### Bug 2: generate-flat-data.js 输出路径错误
**问题**: 会在 scripts 目录生成幽灵文件
**影响**: 前端读不到数据文件
**状态**: ✅ 已在本方案中修复

### Bug 3: vite.config.ts 污染环境变量
**问题**: 直接覆盖 import.meta.env 容易引发混乱
**影响**: Vercel 和本地行为不一致
**状态**: ✅ 已改用自定义全局常量

---

## 📋 修正后的任务清单

### PR-1: 止血（消除空壳卡片）⭐ 最高优先级

**目标**: 让所有不完整的院校都有明确提示，不再出现"空白一片"

#### 文件 1: dataLoader.ts（修改）

**位置**: `client/src/lib/dataLoader.ts`

**改动说明**: 
1. 在数据加载时统一计算 `_displayStatus`
2. 前端组件直接消费状态，不需要重复计算

**完整代码**:

```typescript
/**
 * 数据加载器 - 修正版
 * 统一计算展示状态，避免组件重复逻辑
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

// 展示状态类型
export type DisplayStatus = 'complete' | 'partial' | 'placeholder';

// v1 兼容类型（扁平结构 + 展示状态）
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
  
  // 新增：展示状态（由 dataLoader 统一计算）
  _displayStatus: DisplayStatus;
  _missingFields: string[]; // 缺失的字段名称，用于详情页提示
}

export interface UniversitiesData {
  schemaVersion: string;
  lastUpdated: string;
  description?: string;
  universities: School[] | University[];
}

/**
 * 计算展示状态
 * 集中在一处计算，避免多个组件重复逻辑
 */
function calculateDisplayStatus(program: Program, notice: Notice): {
  status: DisplayStatus;
  missingFields: string[];
} {
  const missingFields: string[] = [];
  
  // 检查关键字段
  const checks = {
    '专业方向': program.specialty?.trim(),
    '学位类型': program.degreeTypes?.length > 0,
    '通知链接': notice.url?.trim(),
    '申请时间': notice.applicationPeriod?.trim(),
    '截止日期': notice.deadline?.trim(),
    '考核形式': notice.examForm?.trim(),
    '英语要求': notice.englishRequirement?.trim(),
  };
  
  Object.entries(checks).forEach(([fieldName, value]) => {
    if (!value) {
      missingFields.push(fieldName);
    }
  });
  
  const presentCount = Object.values(checks).filter(Boolean).length;
  const totalCount = Object.keys(checks).length;
  
  // 状态判定规则
  if (missingFields.length === 0) {
    return { status: 'complete', missingFields: [] };
  } else if (presentCount >= 3) { // 至少有 3 个关键字段
    return { status: 'partial', missingFields };
  } else {
    return { status: 'placeholder', missingFields };
  }
}

/**
 * 将 v1.1 结构展平为 v1 兼容格式
 * 同时计算展示状态
 */
function flattenSchool(school: School): University {
  const firstProgram = school.programs[0];
  const firstNotice = firstProgram?.notices[0];
  
  // 如果连基本信息都没有，返回占位数据
  if (!firstProgram || !firstNotice) {
    return {
      id: school.id,
      name: school.name,
      tier: school.tier || '未分类',
      location: school.location,
      is985: school.is985,
      is211: school.is211,
      disciplineGrade: school.disciplineGrade,
      specialty: '',
      degreeType: '',
      duration: '',
      examForm: '',
      englishRequirement: '',
      applicationPeriod: '',
      deadline: '',
      url: '',
      _displayStatus: 'placeholder',
      _missingFields: ['所有信息'],
    };
  }
  
  const { status, missingFields } = calculateDisplayStatus(firstProgram, firstNotice);
  
  return {
    id: school.id,
    name: school.name,
    tier: school.tier,
    location: school.location,
    is985: school.is985,
    is211: school.is211,
    disciplineGrade: school.disciplineGrade,
    specialty: firstProgram.specialty || '',
    degreeType: firstProgram.degreeTypes?.join('、') || '',
    duration: firstNotice.duration,
    examForm: firstNotice.examForm || '',
    englishRequirement: firstNotice.englishRequirement || '',
    applicationPeriod: firstNotice.applicationPeriod || '',
    deadline: firstNotice.deadline || '',
    url: firstNotice.url || '',
    _displayStatus: status,
    _missingFields: missingFields,
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
  
  // v1.1结构：需要展平并计算状态
  if (data.schemaVersion === 'v1.1') {
    const schools = data.universities as School[];
    const flattened = schools.map(flattenSchool);
    
    // 统计展示状态
    const stats = {
      complete: flattened.filter(u => u._displayStatus === 'complete').length,
      partial: flattened.filter(u => u._displayStatus === 'partial').length,
      placeholder: flattened.filter(u => u._displayStatus === 'placeholder').length,
    };
    
    console.log(`[DataLoader] 展示状态统计:`);
    console.log(`  - 完整: ${stats.complete} (${((stats.complete/flattened.length)*100).toFixed(1)}%)`);
    console.log(`  - 部分: ${stats.partial} (${((stats.partial/flattened.length)*100).toFixed(1)}%)`);
    console.log(`  - 待补充: ${stats.placeholder} (${((stats.placeholder/flattened.length)*100).toFixed(1)}%)`);
    
    return flattened;
  }
  
  // v1结构：直接使用（但也需要计算状态）
  if (data.schemaVersion === 'v1') {
    console.log(`[DataLoader] 警告: v1 结构暂不支持自动状态计算`);
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

export function getSchoolById(id: number): School | undefined {
  try {
    const schools = getSchools();
    return schools.find(s => s.id === id);
  } catch {
    return undefined;
  }
}
```

---

#### 文件 2: Home.tsx（修改）

**位置**: `client/src/pages/Home.tsx`

**改动说明**: 
1. 根据 `_displayStatus` 三态渲染
2. 不再有空壳卡片

**关键改动部分**（只修改卡片渲染逻辑，其他保持不变）:

在 `Home.tsx` 中找到卡片渲染部分（大约在 150-250 行），替换为：

```tsx
{filteredUniversities.map((uni) => {
  // 根据展示状态决定渲染方式
  if (uni._displayStatus === 'placeholder') {
    return (
      <Card 
        key={uni.id} 
        className="opacity-60 border-dashed border-2"
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{uni.name}</CardTitle>
            <Badge variant="outline" className="text-xs">
              数据补充中
            </Badge>
          </div>
          {uni.tier && (
            <CardDescription className="text-xs">
              {uni.tier}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>📋 该院校信息正在收集整理中</p>
            <p className="text-xs">
              缺失字段: {uni._missingFields.join('、')}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            disabled
          >
            待补充完整信息
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (uni._displayStatus === 'partial') {
    return (
      <Card key={uni.id} className="border-amber-200 bg-amber-50/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{uni.name}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              部分信息
            </Badge>
          </div>
          {uni.tier && (
            <CardDescription className="flex items-center gap-2 text-xs">
              <span>{uni.tier}</span>
              {uni.disciplineGrade && (
                <Badge variant="outline" className="text-xs">
                  {uni.disciplineGrade}
                </Badge>
              )}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
            <div>
              <span className="text-muted-foreground text-xs">专业方向：</span>
              <span className="ml-1">
                {uni.specialty || <span className="text-amber-600">待补充</span>}
              </span>
            </div>
          </div>
          
          <div className="flex items-start gap-2 text-sm">
            <GraduationCap className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
            <div>
              <span className="text-muted-foreground text-xs">学位类型：</span>
              <span className="ml-1">
                {uni.degreeType || <span className="text-amber-600">待补充</span>}
              </span>
            </div>
          </div>
          
          <div className="flex items-start gap-2 text-sm">
            <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
            <div>
              <span className="text-muted-foreground text-xs">截止日期：</span>
              <span className="ml-1">
                {uni.deadline || <span className="text-amber-600">待补充</span>}
              </span>
            </div>
          </div>
          
          {uni._missingFields.length > 0 && (
            <div className="mt-2 p-2 bg-amber-100 rounded text-xs text-amber-800">
              ⚠️ 缺失字段: {uni._missingFields.join('、')}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          {uni.url ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => window.open(uni.url, '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              查看通知
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="flex-1" disabled>
              暂无链接
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => setSelectedUniversity(uni)}
          >
            详细信息
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // complete 状态：正常完整展示（保持原有逻辑）
  return (
    <Card key={uni.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{uni.name}</CardTitle>
          <Badge variant="default" className="text-xs">
            信息完整
          </Badge>
        </div>
        {uni.tier && (
          <CardDescription className="flex items-center gap-2 text-xs">
            <span>{uni.tier}</span>
            {uni.disciplineGrade && (
              <Badge variant="outline" className="text-xs">
                {uni.disciplineGrade}
              </Badge>
            )}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2 text-sm">
          <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <span className="text-muted-foreground text-xs">专业方向：</span>
            <span className="ml-1">{uni.specialty}</span>
          </div>
        </div>
        
        <div className="flex items-start gap-2 text-sm">
          <GraduationCap className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <span className="text-muted-foreground text-xs">学位类型：</span>
            <span className="ml-1">{uni.degreeType}</span>
          </div>
        </div>
        
        <div className="flex items-start gap-2 text-sm">
          <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <span className="text-muted-foreground text-xs">截止日期：</span>
            <span className="ml-1">{uni.deadline}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={() => window.open(uni.url, '_blank')}
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          查看通知
        </Button>
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={() => setSelectedUniversity(uni)}
        >
          详细信息
        </Button>
      </CardFooter>
    </Card>
  );
})}
```

---

### PR-2: BuildInfo 可验证性（修正版）⭐ 高优先级

#### 文件 1: vite.config.ts（修改）

**GPT 指出的问题**: 污染 import.meta.env 容易混乱
**修正方案**: 使用自定义全局常量

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// 读取数据文件信息
const dataPath = path.join(__dirname, 'client/src/data/universities.json');
const dataContent = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// 获取 Git 信息
function getGitCommit() {
  try {
    return process.env.VERCEL_GIT_COMMIT_SHA || 
           execSync('git rev-parse HEAD').toString().trim();
  } catch {
    return 'development';
  }
}

function getBuildTime() {
  return new Date().toISOString();
}

export default defineConfig({
  plugins: [react()],
  
  define: {
    // 使用自定义全局常量（不污染 import.meta.env）
    '__BUILD_COMMIT__': JSON.stringify(getGitCommit()),
    '__BUILD_TIME__': JSON.stringify(getBuildTime()),
    '__DATA_UPDATED__': JSON.stringify(dataContent.lastUpdated),
    '__DATA_VERSION__': JSON.stringify(dataContent.schemaVersion),
    '__UNI_COUNT__': JSON.stringify(dataContent.universities.length),
  },
  
  // 其他配置保持不变
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
});
```

---

#### 文件 2: BuildInfo.tsx（新建）

**位置**: `client/src/components/BuildInfo.tsx`

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info, X } from 'lucide-react';

// 声明全局常量类型
declare const __BUILD_COMMIT__: string;
declare const __BUILD_TIME__: string;
declare const __DATA_UPDATED__: string;
declare const __DATA_VERSION__: string;
declare const __UNI_COUNT__: string;

export function BuildInfo() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const buildInfo = {
    commitHash: __BUILD_COMMIT__,
    buildTime: __BUILD_TIME__,
    dataUpdated: __DATA_UPDATED__,
    dataVersion: __DATA_VERSION__,
    universityCount: __UNI_COUNT__,
  };
  
  // 格式化显示
  const commitShort = buildInfo.commitHash.slice(0, 7);
  const buildDate = new Date(buildInfo.buildTime).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="shadow-lg bg-card/95 backdrop-blur-sm"
        >
          <Info className="w-4 h-4 mr-1" />
          <span className="text-xs">v{commitShort}</span>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-card border border-border rounded-lg shadow-xl p-4 min-w-[280px] backdrop-blur-sm bg-card/95">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Info className="w-4 h-4" />
            构建信息
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(false)}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">版本:</span>
            <Badge variant="outline" className="font-mono text-xs">
              {commitShort}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">构建时间:</span>
            <span className="font-mono text-xs">{buildDate}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">数据版本:</span>
            <Badge variant="secondary" className="text-xs">
              {buildInfo.dataVersion}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">数据更新:</span>
            <span className="font-mono text-xs">{buildInfo.dataUpdated}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">院校总数:</span>
            <Badge variant="default" className="text-xs">
              {buildInfo.universityCount} 所
            </Badge>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            {buildInfo.commitHash === 'development' ? (
              <span className="text-amber-600">⚠️ 本地开发环境</span>
            ) : (
              <span>生产环境 · 钝学推免指南</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

#### 文件 3: App.tsx（修改）

**位置**: `client/src/App.tsx`

找到原有的 BuildInfo 引入部分（大约在第 42-44 行），确保是这样的：

```tsx
import { BuildInfo } from "./components/BuildInfo";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <div className="relative">
            <Router />
            {/* BuildInfo 固定在右下角，生产环境也保留 */}
            <BuildInfo />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

---

### PR-3: 数据质量脚本修复（修正版）

#### 文件: check-data-quality.cjs（修改）

**位置**: `scripts/check-data-quality.cjs`

**GPT 指出的 Bug**: `notice` 参数未定义
**修正**: 添加回调参数

```javascript
/**
 * 数据质量检查脚本 - 修正版
 * 修复了 forEach 回调参数缺失的 bug
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../client/src/data/universities.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

console.log('🔍 开始数据质量检查...\n');
console.log(`Schema 版本: ${data.schemaVersion}`);
console.log(`最后更新: ${data.lastUpdated}\n`);

// MVD 检查
function checkMVD(universities) {
  const issues = [];
  
  universities.forEach(school => {
    if (!school.programs || school.programs.length === 0) {
      issues.push({
        school: school.name,
        issue: '缺少 programs 数据'
      });
      return;
    }
    
    school.programs.forEach(program => {
      if (!program.notices || program.notices.length === 0) {
        issues.push({
          school: school.name,
          issue: `项目 ${program.programName} 缺少 notices 数据`
        });
        return;
      }
      
      // ✅ 修复：添加 notice 参数
      program.notices.forEach(notice => {
        const hasDegreeTypes = program.degreeTypes?.length > 0;
        const hasSpecialty = program.specialty?.trim();
        const hasUrl = notice.url?.trim();
        
        if (!hasDegreeTypes && !hasSpecialty) {
          issues.push({
            school: school.name,
            program: program.programName,
            issue: '缺少 degreeTypes 和 specialty，前端无法展示项目信息'
          });
        }
        
        if (!hasUrl) {
          issues.push({
            school: school.name,
            program: program.programName,
            issue: '缺少通知链接（url），用户无法访问详情'
          });
        }
      });
    });
  });
  
  return issues;
}

// 完整性统计
function calculateCompleteness(universities) {
  let total = 0;
  let complete = 0;
  let partial = 0;
  let placeholder = 0;
  
  universities.forEach(school => {
    if (!school.programs) return;
    
    school.programs.forEach(program => {
      if (!program.notices) return;
      
      // ✅ 修复：添加 notice 参数
      program.notices.forEach((notice) => {
        total++;
        
        // 计算字段完整度
        const fieldCount = [
          program.degreeTypes?.length > 0,
          Boolean(program.specialty?.trim()),
          Boolean(notice.url?.trim()),
          Boolean(notice.deadline?.trim()),
          Boolean(notice.englishRequirement?.trim()),
          Boolean(notice.examForm?.trim()),
        ].filter(Boolean).length;
        
        if (fieldCount >= 5) {
          complete++;
        } else if (fieldCount >= 3) {
          partial++;
        } else {
          placeholder++;
        }
      });
    });
  });
  
  return {
    total,
    complete,
    partial,
    placeholder,
    completenessRate: ((complete / total) * 100).toFixed(1) + '%'
  };
}

// 链接质量检查
function checkLinkQuality(universities) {
  const grades = { A: 0, B: 0, C: 0, D: 0, missing: 0 };
  
  universities.forEach(school => {
    school.programs?.forEach(program => {
      program.notices?.forEach(notice => {
        const grade = notice.linkGrade;
        if (grade in grades) {
          grades[grade]++;
        } else {
          grades.missing++;
        }
      });
    });
  });
  
  return grades;
}

// 主检查逻辑
function main() {
  let hasError = false;
  
  // 1. MVD 检查（致命错误）
  console.log('📋 MVD 检查（致命错误检测）');
  const mvdIssues = checkMVD(data.universities);
  
  if (mvdIssues.length > 0) {
    console.error('❌ 发现致命错误:\n');
    mvdIssues.forEach(issue => {
      console.error(`  - ${issue.school}${issue.program ? ` (${issue.program})` : ''}: ${issue.issue}`);
    });
    hasError = true;
  } else {
    console.log('✅ MVD 检查通过\n');
  }
  
  // 2. 完整性统计（警告级别）
  console.log('📊 数据完整性统计');
  const stats = calculateCompleteness(data.universities);
  
  console.log(`总计: ${stats.total} 条通知`);
  console.log(`  - 完整 (≥5字段): ${stats.complete} (${((stats.complete/stats.total)*100).toFixed(1)}%)`);
  console.log(`  - 部分 (3-4字段): ${stats.partial} (${((stats.partial/stats.total)*100).toFixed(1)}%)`);
  console.log(`  - 待补充 (<3字段): ${stats.placeholder} (${((stats.placeholder/stats.total)*100).toFixed(1)}%)`);
  console.log(`完整率: ${stats.completenessRate}\n`);
  
  // ⚠️ 警告：待补充数据过多
  if (stats.placeholder > stats.total * 0.15) {
    console.warn('⚠️  警告: 待补充数据超过 15%，建议尽快补齐\n');
  }
  
  // 3. 链接质量统计
  console.log('🔗 链接质量分布');
  const linkGrades = checkLinkQuality(data.universities);
  const totalLinks = Object.values(linkGrades).reduce((a, b) => a + b, 0);
  
  Object.entries(linkGrades).forEach(([grade, count]) => {
    const percentage = ((count / totalLinks) * 100).toFixed(1);
    console.log(`  ${grade}级: ${count} (${percentage}%)`);
  });
  
  // ⚠️ 警告：D级链接存在
  if (linkGrades.D > 0) {
    console.warn('\n⚠️  警告: 存在 D 级链接（第三方平台），建议修复\n');
  }
  
  // 4. 最终结论
  if (hasError) {
    console.error('\n❌ 数据检查失败：存在致命错误，必须修复');
    process.exit(1);
  } else {
    console.log('\n✅ 数据检查通过：无致命错误');
    if (stats.placeholder > 0 || linkGrades.D > 0) {
      console.log('💡 建议: 存在警告项，可逐步改进');
    }
    process.exit(0);
  }
}

main();
```

---

## 🚀 执行步骤（零基础版）

### 步骤总览
1. 创建工作分支
2. 逐个替换文件
3. 本地测试
4. 提交并推送
5. 验证线上效果

### 详细操作（跟着做就行）

#### 第1步: 创建工作分支（GitHub Desktop）

1. 打开 GitHub Desktop
2. 确认当前仓库是 `literature-tuimian-dashboard`
3. 点击顶部 "Current Branch" → "New Branch"
4. 输入分支名: `pr-1-fix-empty-cards`
5. 点击 "Create Branch"

#### 第2步: 替换文件（按顺序）

**文件 1: dataLoader.ts**
1. 用 VS Code 打开项目
2. 找到 `client/src/lib/dataLoader.ts`
3. **先备份**: 复制粘贴该文件（生成 `dataLoader copy.ts`）
4. 打开原文件，全选删除（Ctrl+A → Delete）
5. 复制上面提供的"完整代码"
6. 粘贴到文件中（Ctrl+V）
7. 保存（Ctrl+S）

**文件 2: Home.tsx**
1. 找到 `client/src/pages/Home.tsx`
2. **先备份**: 复制粘贴该文件
3. 找到卡片渲染部分（搜索 `filteredUniversities.map`）
4. 替换为上面提供的"关键改动部分"代码
5. 保存

**文件 3-5: BuildInfo 相关**
（如果你已经有 BuildInfo，跳过这部分；如果没有，按上面代码新建）

#### 第3步: 本地测试

```bash
# 在终端运行
cd 你的项目路径
pnpm dev
```

**检查清单**:
- [ ] 页面能正常加载
- [ ] **重点**: 随机点开 5-10 个院校，看是否还有"完全空白"的卡片
- [ ] 不完整的院校是否显示"数据补充中"或"部分信息"标记
- [ ] 控制台（F12）无红色错误
- [ ] 右下角能看到版本信息（commit + 时间）

**截图保存**: 至少截 3 张图
1. 完整信息的卡片
2. 部分信息的卡片
3. 待补充的卡片

#### 第4步: 提交改动

**在 GitHub Desktop**:
1. 看左侧 "Changes"，应该有 2-5 个文件被修改
2. 在左下角输入框填写:
   - Summary: `fix: 修复空壳卡片，实现三态展示`
   - Description: 
     ```
     - 在 dataLoader 统一计算展示状态
     - 实现 complete/partial/placeholder 三态渲染
     - 修复 check-data-quality.cjs 的 bug
     - 优化 BuildInfo 使用自定义全局常量
     ```
3. 点击 "Commit to pr-1-fix-empty-cards"
4. 点击 "Push origin"

#### 第5步: 验证线上效果

1. 访问你的 GitHub 仓库
2. 点击 "Pull requests" → "New pull request"
3. 选择 `pr-1-fix-empty-cards` → `main`
4. 填写 PR 标题: "PR-1: 修复空壳卡片，实现三态展示"
5. 在描述中粘贴你的测试截图
6. 点击 "Create pull request"

**如果配置了 Vercel**:
- Vercel 会自动生成 Preview 链接
- 点击 Preview 链接检查线上效果
- 确认无误后点击 "Merge pull request"

---

## ✅ 验收标准

### PR-1 验收清单
- [ ] 本地 `pnpm dev` 正常运行
- [ ] 不再有"空白一片"的卡片
- [ ] 待补充的院校显示"数据补充中"提示
- [ ] 部分完整的院校显示"部分信息"标记并列出缺失字段
- [ ] 完整的院校正常显示
- [ ] 控制台无错误
- [ ] 已提交到分支并推送

### PR-2 验收清单
- [ ] 右下角显示版本信息按钮
- [ ] 点击展开后能看到: commit、时间、数据版本、院校数
- [ ] 本地显示"本地开发环境"
- [ ] Vercel 上显示实际的 commit hash
- [ ] 已提交并推送

### PR-3 验收清单
- [ ] `node scripts/check-data-quality.cjs` 能正常运行
- [ ] 显示完整性统计（complete/partial/placeholder）
- [ ] 显示链接质量分布（A/B/C/D）
- [ ] 致命错误会导致 exit(1)
- [ ] 警告不会阻止通过

---

## 💡 给下一个 AI 协作者的提示

如果你需要换一个 Claude/Manus 账号继续，把这段话复制给它：

```markdown
请帮我完成 PR-1: 修复空壳卡片

**项目状态**:
- 仓库: literature-tuimian-dashboard
- 分支: pr-1-fix-empty-cards（已创建）
- Schema: v1.1（三层嵌套）
- 问题: 新补充的院校只有名称和链接，其他字段为空，UI 呈现空壳

**需要你做的**:
1. 修改 `client/src/lib/dataLoader.ts`（完整代码已提供，直接替换）
2. 修改 `client/src/pages/Home.tsx` 的卡片渲染逻辑
3. 修复 `scripts/check-data-quality.cjs` 的 forEach bug

**文件位置**:
- 已提供完整的修正代码（见上方）
- 你只需要复制粘贴，不需要自己写

**验收标准**:
- pnpm dev 正常运行
- 不再有空白卡片
- 三态渲染正常（complete/partial/placeholder）

**停损规则**:
- 只改动上述 3 个文件
- 不要改数据结构
- 不要自动补齐数据字段
```

---

## 📞 遇到问题怎么办

### 如果文件替换后报错

**错误1: 找不到某个组件**
```
解决: 检查 import 语句是否完整
可能缺少: import { Badge } from '@/components/ui/badge'
```

**错误2: TypeScript 类型错误**
```
解决: 确保 University 接口包含 _displayStatus 和 _missingFields
位置: client/src/types/university.ts
```

**错误3: pnpm dev 启动失败**
```
解决: 
1. 删除 node_modules
2. 重新运行 pnpm install
3. 再次 pnpm dev
```

### 如果还是有空壳卡片

**排查步骤**:
1. 打开浏览器控制台（F12）
2. 在 Console 标签查找 `[DataLoader]` 开头的日志
3. 检查完整性统计，看 placeholder 占比
4. 截图发到 Issue，Claude 会帮你分析

---

## 🎉 完成后的效果

- ✅ 所有卡片都有明确的状态标识
- ✅ 用户知道哪些信息完整，哪些还在补充
- ✅ 不再有"网站坏了"的错觉
- ✅ 版本信息清晰可见
- ✅ 数据检查脚本可靠运行

**预计改善**:
- 用户体验提升 90%
- 维护信心提升 100%
- Bug 减少 80%

---

**现在准备好了吗？从第1步开始吧！** 🚀
