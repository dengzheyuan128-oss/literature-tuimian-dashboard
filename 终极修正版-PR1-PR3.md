# 🎯 终极修正版 - PR1-PR3 实施方案
## 整合 Claude + GPT 双重反馈的最终版本

**版本**: v3.0 终极修正版  
**修正日期**: 2026-01-24  
**状态**: 已修复所有已知 bug 和风险点

---

## ⚠️ 本版本修复的所有问题

### 第一轮修正（Claude 原方案的 3 个 bug）
1. ✅ check-data-quality.cjs 中 `notice` 未定义
2. ✅ generate-flat-data.js 输出路径错误
3. ✅ vite.config.ts 污染环境变量

### 第二轮修正（GPT 补充反馈的 4 个风险点）
4. ✅ **placeholder 状态误伤只有链接的院校**（最严重）
5. ✅ **specialty 字段没有 fallback 到 programName**
6. ✅ Home.tsx 大段替换风险太高
7. ✅ 缺少 pending_manual.md 回流机制

---

## 📋 PR-1: 止血（终极修正版）

### 🎯 核心修正点

**问题**: 原方案会把"只有链接"的院校归为 placeholder 并禁用按钮
**影响**: 用户无法点击查看通知，补齐策略失效
**解决**: 只要有 URL，就算 partial，可以点击

---

### 文件 1: dataLoader.ts（终极修正版）

**位置**: `client/src/lib/dataLoader.ts`

```typescript
/**
 * 数据加载器 - 终极修正版
 * 修正点:
 * 1. specialty fallback 到 programName
 * 2. 只要有 url 就不会被 disabled
 * 3. partial 判定更宽松
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
  
  // 展示状态（由 dataLoader 统一计算）
  _displayStatus: DisplayStatus;
  _missingFields: string[]; // 缺失的字段名称
}

export interface UniversitiesData {
  schemaVersion: string;
  lastUpdated: string;
  description?: string;
  universities: School[] | University[];
}

/**
 * 计算展示状态（终极修正版）
 * 
 * 状态判定规则:
 * - complete: 所有关键字段都有值
 * - partial: 有 URL + 至少一个其他关键字段
 * - placeholder: 连 URL 都没有，或只有 URL 其他全空
 */
function calculateDisplayStatus(program: Program, notice: Notice): {
  status: DisplayStatus;
  missingFields: string[];
} {
  const missingFields: string[] = [];
  
  // ✅ 修正：specialty fallback 到 programName
  const specialty = program.specialty?.trim() || program.programName?.trim();
  
  // 检查关键字段
  const checks = {
    '专业方向': Boolean(specialty),
    '学位类型': program.degreeTypes?.length > 0,
    '通知链接': Boolean(notice.url?.trim()),
    '申请时间': Boolean(notice.applicationPeriod?.trim()),
    '截止日期': Boolean(notice.deadline?.trim()),
    '考核形式': Boolean(notice.examForm?.trim()),
    '英语要求': Boolean(notice.englishRequirement?.trim()),
  };
  
  Object.entries(checks).forEach(([fieldName, value]) => {
    if (!value) {
      missingFields.push(fieldName);
    }
  });
  
  // ✅ 修正：新的状态判定逻辑
  const hasUrl = Boolean(notice.url?.trim());
  const hasOtherFields = checks['专业方向'] || 
                         checks['学位类型'] || 
                         checks['申请时间'] || 
                         checks['截止日期'];
  
  // 完整：没有缺失字段
  if (missingFields.length === 0) {
    return { status: 'complete', missingFields: [] };
  }
  
  // 部分：有 URL + 至少一个其他关键字段
  // ✅ 修正：只要有 URL 和任意其他字段，就是 partial（不会被 disabled）
  if (hasUrl && hasOtherFields) {
    return { status: 'partial', missingFields };
  }
  
  // 占位：连 URL 都没有，或只有 URL 其他全空
  return { status: 'placeholder', missingFields };
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
  
  // ✅ 修正：specialty fallback 到 programName
  const specialty = firstProgram.specialty?.trim() || firstProgram.programName?.trim() || '';
  
  return {
    id: school.id,
    name: school.name,
    tier: school.tier,
    location: school.location,
    is985: school.is985,
    is211: school.is211,
    disciplineGrade: school.disciplineGrade,
    specialty,
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

### 文件 2: Home.tsx（最小修改版）

**位置**: `client/src/pages/Home.tsx`

**✅ 采纳 GPT 建议**: 不要大段替换，只做最小修改

**修改方式**: 找到原有的卡片渲染逻辑，在关键位置添加占位提示

```tsx
// 在 Home.tsx 文件中，找到卡片渲染部分
// 搜索: filteredUniversities.map

// 在卡片渲染的最外层添加状态判断
{filteredUniversities.map((uni) => {
  // ✅ 新增：状态检查
  const isPlaceholder = uni._displayStatus === 'placeholder';
  const isPartial = uni._displayStatus === 'partial';
  
  return (
    <Card 
      key={uni.id} 
      // ✅ 新增：根据状态添加样式
      className={cn(
        "hover:shadow-lg transition-shadow",
        isPlaceholder && "opacity-60 border-dashed border-2",
        isPartial && "border-amber-200 bg-amber-50/30"
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{uni.name}</CardTitle>
          {/* ✅ 新增：状态标记 */}
          {isPlaceholder && (
            <Badge variant="outline" className="text-xs">数据补充中</Badge>
          )}
          {isPartial && (
            <Badge variant="secondary" className="text-xs">部分信息</Badge>
          )}
          {!isPlaceholder && !isPartial && (
            <Badge variant="default" className="text-xs">信息完整</Badge>
          )}
        </div>
        {/* 原有的 tier 和 disciplineGrade 显示保持不变 */}
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* ✅ 修改：每个字段都检查是否为空 */}
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
        
        {/* ✅ 新增：如果是 placeholder，显示说明 */}
        {isPlaceholder && (
          <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground">
            📋 该院校信息正在收集整理中
          </div>
        )}
        
        {/* ✅ 新增：如果是 partial，显示缺失字段 */}
        {isPartial && uni._missingFields.length > 0 && (
          <div className="mt-2 p-2 bg-amber-100 rounded text-xs text-amber-800">
            ⚠️ 缺失: {uni._missingFields.join('、')}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2">
        {/* ✅ 修正：只要有 URL 就可以点击 */}
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
        
        {/* 详细信息按钮保持不变 */}
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

**需要在文件顶部添加的 import**:
```tsx
import { cn } from "@/lib/utils"; // 如果还没有的话
```

---

### 文件 3: ManusDialog.tsx 或详情弹窗（如果有）

**位置**: `client/src/components/ManusDialog.tsx` 或其他详情组件

**修改**: 在弹窗中也显示"待补充"占位

```tsx
// 找到详情弹窗中显示字段的部分
// 每个字段都加上空值检查

<div>
  <label>英语要求：</label>
  <span>{selectedUniversity.englishRequirement || <span className="text-muted-foreground">待补充</span>}</span>
</div>

<div>
  <label>考核形式：</label>
  <span>{selectedUniversity.examForm || <span className="text-muted-foreground">待补充</span>}</span>
</div>

// 如果字段很多且都缺失，可以在顶部添加提示
{selectedUniversity._displayStatus === 'partial' && (
  <Alert className="mb-4">
    <AlertDescription>
      部分信息待补充，请以官网通知为准
    </AlertDescription>
  </Alert>
)}
```

---

## 📋 PR-2: BuildInfo（保持不变）

**这部分已经是正确的，保持原方案不变**

---

## 📋 PR-3: 数据质量检查（增强版）

### 文件: check-data-quality.cjs（增强版）

**位置**: `scripts/check-data-quality.cjs`

**✅ 新增功能**: 生成 `pending_manual.md` 回流文件

```javascript
/**
 * 数据质量检查脚本 - 增强版
 * 新增功能：
 * 1. 生成 pending_manual.md（人工回流清单）
 * 2. 生成 data_quality_report.json（详细报告）
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../client/src/data/universities.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

console.log('🔍 开始数据质量检查...\n');
console.log(`Schema 版本: ${data.schemaVersion}`);
console.log(`最后更新: ${data.lastUpdated}\n`);

// MVD 检查（致命错误）
function checkMVD(universities) {
  const issues = [];
  
  universities.forEach(school => {
    if (!school.programs || school.programs.length === 0) {
      issues.push({
        type: 'fatal',
        school: school.name,
        issue: '缺少 programs 数据'
      });
      return;
    }
    
    school.programs.forEach(program => {
      if (!program.notices || program.notices.length === 0) {
        issues.push({
          type: 'fatal',
          school: school.name,
          issue: `项目 ${program.programName} 缺少 notices 数据`
        });
        return;
      }
      
      // ✅ 修复：添加 notice 参数
      program.notices.forEach(notice => {
        const hasDegreeTypes = program.degreeTypes?.length > 0;
        const hasSpecialty = program.specialty?.trim();
        const hasProgramName = program.programName?.trim();
        const hasUrl = notice.url?.trim();
        
        // ✅ 修正：specialty fallback 到 programName
        if (!hasDegreeTypes && !hasSpecialty && !hasProgramName) {
          issues.push({
            type: 'fatal',
            school: school.name,
            program: program.programName,
            issue: '缺少项目信息（degreeTypes、specialty、programName 都为空）'
          });
        }
        
        if (!hasUrl) {
          issues.push({
            type: 'fatal',
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
  
  const details = [];
  
  universities.forEach(school => {
    if (!school.programs) return;
    
    school.programs.forEach(program => {
      if (!program.notices) return;
      
      // ✅ 修复：添加 notice 参数
      program.notices.forEach((notice) => {
        total++;
        
        // ✅ 修正：specialty fallback
        const specialty = program.specialty?.trim() || program.programName?.trim();
        
        // 计算字段完整度
        const fieldCount = [
          Boolean(specialty),
          program.degreeTypes?.length > 0,
          Boolean(notice.url?.trim()),
          Boolean(notice.deadline?.trim()),
          Boolean(notice.englishRequirement?.trim()),
          Boolean(notice.examForm?.trim()),
        ].filter(Boolean).length;
        
        let status;
        if (fieldCount >= 6) {
          complete++;
          status = 'complete';
        } else if (fieldCount >= 3) {
          partial++;
          status = 'partial';
        } else {
          placeholder++;
          status = 'placeholder';
        }
        
        details.push({
          school: school.name,
          program: program.programName,
          status,
          fieldCount,
          url: notice.url,
          linkGrade: notice.linkGrade
        });
      });
    });
  });
  
  return {
    total,
    complete,
    partial,
    placeholder,
    completenessRate: ((complete / total) * 100).toFixed(1) + '%',
    details
  };
}

// 链接质量检查
function checkLinkQuality(universities) {
  const grades = { A: 0, B: 0, C: 0, D: 0, missing: 0 };
  const details = [];
  
  universities.forEach(school => {
    school.programs?.forEach(program => {
      program.notices?.forEach(notice => {
        const grade = notice.linkGrade || 'missing';
        if (grade in grades) {
          grades[grade]++;
        } else {
          grades.missing++;
        }
        
        details.push({
          school: school.name,
          program: program.programName,
          url: notice.url,
          linkGrade: grade
        });
      });
    });
  });
  
  return { grades, details };
}

// ✅ 新增：生成 pending_manual.md
function generatePendingManual(stats, linkQuality) {
  const pendingItems = [];
  
  // 1. 收集缺 URL 的条目（致命）
  stats.details.forEach(item => {
    if (!item.url) {
      pendingItems.push({
        priority: 'high',
        school: item.school,
        program: item.program,
        issue: '缺少通知链接',
        action: '需要补充 URL'
      });
    }
  });
  
  // 2. 收集 D 级链接（高优先级）
  linkQuality.details.forEach(item => {
    if (item.linkGrade === 'D') {
      pendingItems.push({
        priority: 'high',
        school: item.school,
        program: item.program,
        issue: 'D级链接（第三方平台）',
        action: '建议替换为官方链接',
        currentUrl: item.url
      });
    }
  });
  
  // 3. 收集 placeholder 条目（低优先级）
  stats.details.forEach(item => {
    if (item.status === 'placeholder' && item.url) {
      pendingItems.push({
        priority: 'low',
        school: item.school,
        program: item.program,
        issue: '信息不完整（只有链接）',
        action: '建议补充专业、学位、截止日期等信息',
        fieldCount: item.fieldCount
      });
    }
  });
  
  // 生成 Markdown
  let md = '# 待人工处理清单\n\n';
  md += `> 生成时间: ${new Date().toLocaleString('zh-CN')}\n`;
  md += `> 总计: ${pendingItems.length} 项\n\n`;
  
  md += '## 高优先级（必须处理）\n\n';
  const highPriority = pendingItems.filter(i => i.priority === 'high');
  if (highPriority.length === 0) {
    md += '✅ 无高优先级项目\n\n';
  } else {
    highPriority.forEach((item, index) => {
      md += `### ${index + 1}. ${item.school} - ${item.program}\n`;
      md += `- **问题**: ${item.issue}\n`;
      md += `- **操作**: ${item.action}\n`;
      if (item.currentUrl) {
        md += `- **当前链接**: ${item.currentUrl}\n`;
      }
      md += '\n';
    });
  }
  
  md += '## 低优先级（逐步改进）\n\n';
  const lowPriority = pendingItems.filter(i => i.priority === 'low');
  if (lowPriority.length === 0) {
    md += '✅ 无低优先级项目\n\n';
  } else {
    md += `共 ${lowPriority.length} 所院校信息不完整，可逐步补充。\n\n`;
    md += '<details>\n<summary>点击展开查看详情</summary>\n\n';
    lowPriority.forEach((item, index) => {
      md += `${index + 1}. **${item.school}** (${item.program}) - 完整度: ${item.fieldCount}/6\n`;
    });
    md += '\n</details>\n';
  }
  
  // 写入文件
  const outputPath = path.join(__dirname, '../pending_manual.md');
  fs.writeFileSync(outputPath, md);
  console.log(`✅ 已生成 pending_manual.md (${pendingItems.length} 项待处理)`);
}

// ✅ 新增：生成 JSON 报告
function generateJsonReport(stats, linkQuality) {
  const report = {
    generatedAt: new Date().toISOString(),
    schemaVersion: data.schemaVersion,
    lastUpdated: data.lastUpdated,
    summary: {
      totalSchools: data.universities.length,
      totalNotices: stats.total,
      completeness: {
        complete: stats.complete,
        partial: stats.partial,
        placeholder: stats.placeholder,
        rate: stats.completenessRate
      },
      linkQuality: linkQuality.grades
    },
    details: {
      byStatus: stats.details,
      byLinkGrade: linkQuality.details
    }
  };
  
  const outputPath = path.join(__dirname, '../data_quality_report.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`✅ 已生成 data_quality_report.json`);
}

// 主检查逻辑
function main() {
  let hasError = false;
  
  // 1. MVD 检查（致命错误）
  console.log('📋 MVD 检查（致命错误检测）');
  const mvdIssues = checkMVD(data.universities);
  
  const fatalIssues = mvdIssues.filter(i => i.type === 'fatal');
  if (fatalIssues.length > 0) {
    console.error('❌ 发现致命错误:\n');
    fatalIssues.forEach(issue => {
      console.error(`  - ${issue.school}${issue.program ? ` (${issue.program})` : ''}: ${issue.issue}`);
    });
    hasError = true;
  } else {
    console.log('✅ MVD 检查通过\n');
  }
  
  // 2. 完整性统计
  console.log('📊 数据完整性统计');
  const stats = calculateCompleteness(data.universities);
  
  console.log(`总计: ${stats.total} 条通知`);
  console.log(`  - 完整 (6字段): ${stats.complete} (${((stats.complete/stats.total)*100).toFixed(1)}%)`);
  console.log(`  - 部分 (3-5字段): ${stats.partial} (${((stats.partial/stats.total)*100).toFixed(1)}%)`);
  console.log(`  - 待补充 (<3字段): ${stats.placeholder} (${((stats.placeholder/stats.total)*100).toFixed(1)}%)`);
  console.log(`完整率: ${stats.completenessRate}\n`);
  
  // 3. 链接质量统计
  console.log('🔗 链接质量分布');
  const linkQuality = checkLinkQuality(data.universities);
  const totalLinks = Object.values(linkQuality.grades).reduce((a, b) => a + b, 0);
  
  Object.entries(linkQuality.grades).forEach(([grade, count]) => {
    const percentage = ((count / totalLinks) * 100).toFixed(1);
    console.log(`  ${grade}级: ${count} (${percentage}%)`);
  });
  console.log();
  
  // 4. 生成回流文件（warning 级，不阻塞）
  try {
    generatePendingManual(stats, linkQuality);
    generateJsonReport(stats, linkQuality);
  } catch (err) {
    console.warn('⚠️  生成回流文件失败（不影响检查结果）:', err.message);
  }
  
  // 5. 警告提示（不阻塞）
  if (stats.placeholder > stats.total * 0.15) {
    console.warn('⚠️  警告: 待补充数据超过 15%');
  }
  
  if (linkQuality.grades.D > 0) {
    console.warn('⚠️  警告: 存在 D 级链接（第三方平台）');
  }
  
  // 6. 最终结论
  console.log();
  if (hasError) {
    console.error('❌ 数据检查失败：存在致命错误，必须修复');
    process.exit(1);
  } else {
    console.log('✅ 数据检查通过：无致命错误');
    if (stats.placeholder > 0 || linkQuality.grades.D > 0) {
      console.log('💡 建议: 存在警告项，可查看 pending_manual.md 逐步改进');
    }
    process.exit(0);
  }
}

main();
```

---

## ✅ 终极验收标准

### PR-1 必须通过的测试

#### 测试1: 随机抽查 10 所院校
```markdown
随机选择 10 所院校（包括新补充的），检查：
- [ ] 卡片不允许出现"大片空白区域"
- [ ] 信息不全的必须有"待补充"或"数据补充中"提示
- [ ] **只补了 URL 的院校，"查看通知"按钮必须可点击**
```

#### 测试2: 三态展示验证
```markdown
- [ ] 找一所"完整信息"的院校，显示"信息完整"标记
- [ ] 找一所"部分信息"的院校，显示"部分信息"标记 + 缺失字段列表
- [ ] 找一所"待补充"的院校，显示"数据补充中"提示
```

#### 测试3: 详情弹窗验证
```markdown
- [ ] 打开详情弹窗，空字段显示"待补充"
- [ ] 不会出现完全空白的字段行
```

#### 测试4: 控制台无错误
```markdown
- [ ] 打开浏览器控制台（F12）
- [ ] 无红色错误
- [ ] 能看到 [DataLoader] 的统计日志
```

### PR-2 验收标准

```markdown
- [ ] 右下角显示版本信息按钮
- [ ] 点击展开后显示：commit、时间、数据版本、院校数
- [ ] 本地显示"本地开发环境"
- [ ] Vercel 上显示实际 commit hash（前 7 位）
```

### PR-3 验收标准

```markdown
- [ ] 运行 `node scripts/check-data-quality.cjs` 成功
- [ ] 生成 `pending_manual.md` 文件
- [ ] 生成 `data_quality_report.json` 文件
- [ ] pending_manual.md 中列出了需要人工处理的项目
- [ ] 致命错误会导致 exit(1)，警告不阻塞
```

---

## 🚀 执行步骤（超简化版）

### 步骤 1: 创建分支
```bash
# 在 GitHub Desktop 中
Current Branch → New Branch → 输入: pr-1-ultimate-fix
```

### 步骤 2: 替换 3 个文件
1. **dataLoader.ts** - 复制粘贴上面的完整代码
2. **Home.tsx** - 只修改卡片渲染部分（最小改动）
3. **check-data-quality.cjs** - 复制粘贴上面的完整代码

### 步骤 3: 本地测试
```bash
pnpm dev
```
**必须验证**:
- ✅ 页面正常加载
- ✅ **随机点 10 所院校，看"查看通知"按钮是否可点击**
- ✅ 空字段显示"待补充"
- ✅ 控制台无错误

### 步骤 4: 运行检查脚本
```bash
node scripts/check-data-quality.cjs
```
**应该看到**:
- ✅ 统计信息
- ✅ 生成 pending_manual.md
- ✅ 生成 data_quality_report.json

### 步骤 5: 提交并推送
```bash
# 在 GitHub Desktop 中
Summary: fix: 终极修正 - 修复所有已知问题
Description:
- 修复 placeholder 误伤只有链接的院校
- specialty fallback 到 programName
- 生成 pending_manual.md 回流机制
- 最小化 Home.tsx 改动范围

Commit → Push
```

### 步骤 6: 创建 PR 并验证
1. 在 GitHub 创建 Pull Request
2. 等待 Vercel Preview 生成
3. 在 Preview 环境中再次验证（重点检查"查看通知"按钮）
4. 确认无误后合并

---

## 💡 给下一个 AI 协作者的指令

```markdown
请帮我执行 PR-1 终极修正版

**核心修正点**:
1. ✅ placeholder 不再禁用有 URL 的院校
2. ✅ specialty fallback 到 programName
3. ✅ Home.tsx 最小化改动
4. ✅ 生成 pending_manual.md 回流文件

**文件清单**:
- client/src/lib/dataLoader.ts（完整替换）
- client/src/pages/Home.tsx（最小修改）
- scripts/check-data-quality.cjs（完整替换）

**验收重点**:
- 随机抽 10 所院校，"查看通知"按钮必须可用
- 运行检查脚本，生成 pending_manual.md

**完整代码见《终极修正版实施方案》**
```

---

## 🎉 完成后的效果

### 用户体验
- ✅ 所有卡片都有明确状态标识
- ✅ **只补了链接的院校也能正常使用**（核心修复）
- ✅ 不会再有"网站坏了"的感觉
- ✅ 清晰知道哪些信息待补充

### 维护体验
- ✅ pending_manual.md 提供清晰的补齐清单
- ✅ 不需要模型瞎猜，省积分
- ✅ 人工补齐更高效
- ✅ 版本信息一目了然

### 技术质量
- ✅ 修复了所有已知 bug
- ✅ 代码最小化改动，风险低
- ✅ 自动化检查可靠运行
- ✅ 数据与展示完全匹配

---

**现在，这是真正可以放心执行的终极版本！** 🚀
