# 用户反馈与 AI 辅助提取 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现用户反馈悬浮按钮和管理员 AI 辅助提取页面

**Architecture:**
- 用户反馈：前端组件 + Supabase 表存储
- AI 提取：前端页面调用 Jina Reader API 获取内容，调用 GLM-4 API 提取结构化数据

**Tech Stack:** React, TypeScript, Supabase, Jina Reader API, GLM-4 API

---

## 功能一：用户反馈

### Task 1: 创建 Supabase 数据表

**Files:**
- 无代码文件，在 Supabase Dashboard 执行 SQL

**Step 1: 在 Supabase 执行 SQL 创建表**

打开 https://supabase.com/dashboard/project/tqilsdblmwwweacprilb/sql/new

执行以下 SQL：

```sql
-- 创建用户反馈表
CREATE TABLE user_feedback (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('link_invalid', 'info_outdated', 'info_wrong')),
  university_id INTEGER,
  university_name TEXT,
  description TEXT NOT NULL,
  page_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- 用户可以插入自己的反馈
CREATE POLICY "Users can insert own feedback" ON user_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户可以查看自己的反馈
CREATE POLICY "Users can view own feedback" ON user_feedback
  FOR SELECT USING (auth.uid() = user_id);
```

**Step 2: 验证表创建成功**

在 Supabase Dashboard → Table Editor 中确认 `user_feedback` 表存在

---

### Task 2: 添加 Supabase 反馈提交函数

**Files:**
- Modify: `client/src/lib/supabase.ts`

**Step 1: 添加类型定义和函数**

在 `client/src/lib/supabase.ts` 文件末尾添加：

```typescript
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
```

**Step 2: 运行类型检查**

Run: `pnpm check`
Expected: 无错误

**Step 3: 提交**

```bash
git add client/src/lib/supabase.ts
git commit -m "feat: add submitFeedback function to supabase lib"
```

---

### Task 3: 创建 FeedbackButton 组件

**Files:**
- Create: `client/src/components/FeedbackButton.tsx`

**Step 1: 创建组件文件**

```typescript
/**
 * 用户反馈悬浮按钮组件
 * 点击后弹出反馈表单
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { submitFeedback, FeedbackType } from '@/lib/supabase';
import { universities } from '@/lib/dataLoader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquarePlus, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const FEEDBACK_TYPES: { value: FeedbackType; label: string; description: string }[] = [
  { value: 'link_invalid', label: '链接失效', description: '链接无法打开或404' },
  { value: 'info_outdated', label: '信息过期', description: '信息已不是最新的' },
  { value: 'info_wrong', label: '信息错误', description: '信息内容有误' },
];

export default function FeedbackButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // 表单状态
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('link_invalid');
  const [universityId, setUniversityId] = useState<string>('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setFeedbackType('link_invalid');
    setUniversityId('');
    setDescription('');
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (!user || !description.trim()) return;

    setIsSubmitting(true);

    const selectedUniversity = universityId
      ? universities.find((u) => u.id === parseInt(universityId))
      : null;

    const success = await submitFeedback(user.id, {
      feedback_type: feedbackType,
      university_id: selectedUniversity?.id,
      university_name: selectedUniversity?.name,
      description: description.trim(),
      page_url: window.location.href,
    });

    setIsSubmitting(false);

    if (success) {
      setSubmitted(true);
      toast.success('感谢您的反馈！');
      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 1500);
    } else {
      toast.error('提交失败，请重试');
    }
  };

  // 未登录不显示
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-20 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
        >
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>反馈问题</DialogTitle>
          <DialogDescription>
            发现数据问题？请告诉我们，帮助我们改进。
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center py-8 gap-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">感谢您的反馈！</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* 反馈类型 */}
            <div className="space-y-2">
              <Label>问题类型</Label>
              <RadioGroup
                value={feedbackType}
                onValueChange={(v) => setFeedbackType(v as FeedbackType)}
              >
                {FEEDBACK_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={type.value} id={type.value} />
                    <Label htmlFor={type.value} className="flex-1 cursor-pointer">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-muted-foreground text-sm ml-2">
                        {type.description}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* 院校选择（可选） */}
            <div className="space-y-2">
              <Label>相关院校（可选）</Label>
              <Select value={universityId} onValueChange={setUniversityId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择院校..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="">不选择</SelectItem>
                  {universities.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 问题描述 */}
            <div className="space-y-2">
              <Label>问题描述</Label>
              <Textarea
                placeholder="请详细描述您发现的问题..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            {/* 提交按钮 */}
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting || !description.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  提交中...
                </>
              ) : (
                '提交反馈'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: 运行类型检查**

Run: `pnpm check`
Expected: 无错误

**Step 3: 提交**

```bash
git add client/src/components/FeedbackButton.tsx
git commit -m "feat: create FeedbackButton component"
```

---

### Task 4: 集成 FeedbackButton 到 App

**Files:**
- Modify: `client/src/App.tsx`

**Step 1: 导入组件**

在 `client/src/App.tsx` 的 import 区域添加：

```typescript
import FeedbackButton from "./components/FeedbackButton";
```

**Step 2: 添加到渲染**

在 `<BaiduAnalytics />` 下方添加：

```typescript
<FeedbackButton />
```

**Step 3: 运行类型检查**

Run: `pnpm check`
Expected: 无错误

**Step 4: 本地测试**

Run: `pnpm dev`
Expected: 右下角出现反馈按钮，点击可以打开表单

**Step 5: 提交**

```bash
git add client/src/App.tsx
git commit -m "feat: integrate FeedbackButton into App"
```

---

## 功能二：AI 辅助提取

### Task 5: 创建管理员工具函数

**Files:**
- Create: `client/src/lib/adminUtils.ts`

**Step 1: 创建文件**

```typescript
/**
 * 管理员工具函数
 */

// 管理员邮箱列表（从环境变量读取）
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

/**
 * 检查是否为管理员
 */
export function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}
```

**Step 2: 更新 .env.example**

在 `.env.example` 添加：

```bash
# 管理员邮箱列表（逗号分隔）
VITE_ADMIN_EMAILS=admin@example.com
```

**Step 3: 提交**

```bash
git add client/src/lib/adminUtils.ts .env.example
git commit -m "feat: add admin utils with isAdmin function"
```

---

### Task 6: 创建 Jina Reader API 封装

**Files:**
- Create: `client/src/lib/jinaReader.ts`

**Step 1: 创建文件**

```typescript
/**
 * Jina Reader API 封装
 * 将 URL 转换为 Markdown 格式
 */

const JINA_READER_BASE = 'https://r.jina.ai/';

export interface JinaReaderResult {
  success: boolean;
  content: string;
  error?: string;
}

/**
 * 使用 Jina Reader 获取 URL 的 Markdown 内容
 */
export async function fetchUrlAsMarkdown(url: string): Promise<JinaReaderResult> {
  try {
    const response = await fetch(`${JINA_READER_BASE}${encodeURIComponent(url)}`, {
      headers: {
        'Accept': 'text/plain',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        content: '',
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const content = await response.text();
    return {
      success: true,
      content,
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : '网络请求失败',
    };
  }
}
```

**Step 2: 提交**

```bash
git add client/src/lib/jinaReader.ts
git commit -m "feat: add Jina Reader API wrapper"
```

---

### Task 7: 创建 GLM-4 API 封装

**Files:**
- Create: `client/src/lib/glmApi.ts`

**Step 1: 创建文件**

```typescript
/**
 * GLM-4 API 封装
 * 智谱 AI 大模型接口
 */

const GLM_API_BASE = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const GLM_API_KEY = import.meta.env.VITE_GLM_API_KEY || '';

export interface ExtractedNotice {
  name: string;
  specialty: string;
  degreeType: string;
  applicationPeriod: string;
  deadline: string;
  examForm: string;
  englishRequirement: string;
  noticeType: string;
}

const EXTRACTION_PROMPT = `你是一个高校推免通知信息提取助手。请从以下网页内容中提取推免/夏令营相关信息。

请提取以下字段（JSON 格式）：
{
  "name": "院校名称",
  "specialty": "专业方向（如：中国语言文学）",
  "degreeType": "学硕 或 专硕",
  "applicationPeriod": "申请时间段",
  "deadline": "截止日期",
  "examForm": "考核形式（如：笔试+面试）",
  "englishRequirement": "英语要求（如：六级425分）",
  "noticeType": "夏令营 或 预推免"
}

规则：
1. 未找到的字段填写 "未注明"
2. 日期格式统一为 "YYYY年MM月DD日"
3. 只输出 JSON，不要其他文字

网页内容：
---
`;

export interface GlmResult {
  success: boolean;
  data: ExtractedNotice | null;
  error?: string;
}

/**
 * 调用 GLM-4 提取通知信息
 */
export async function extractNoticeInfo(markdownContent: string): Promise<GlmResult> {
  if (!GLM_API_KEY) {
    return {
      success: false,
      data: null,
      error: 'GLM API Key 未配置',
    };
  }

  try {
    const response = await fetch(GLM_API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4',
        messages: [
          {
            role: 'user',
            content: EXTRACTION_PROMPT + markdownContent.slice(0, 8000) + '\n---',
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        data: null,
        error: `GLM API 错误: ${response.status} - ${errorText}`,
      };
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';

    // 尝试解析 JSON
    try {
      // 提取 JSON 部分（可能包含 markdown 代码块）
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          success: false,
          data: null,
          error: '无法从响应中提取 JSON',
        };
      }

      const data = JSON.parse(jsonMatch[0]) as ExtractedNotice;
      return {
        success: true,
        data,
      };
    } catch (parseError) {
      return {
        success: false,
        data: null,
        error: `JSON 解析失败: ${content.slice(0, 200)}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : '网络请求失败',
    };
  }
}

/**
 * 检查 GLM API 是否已配置
 */
export function isGlmConfigured(): boolean {
  return Boolean(GLM_API_KEY);
}
```

**Step 2: 更新 .env.example**

在 `.env.example` 添加：

```bash
# GLM-4 API Key (智谱 AI)
# 从 https://open.bigmodel.cn 获取
VITE_GLM_API_KEY=your-glm-api-key-here
```

**Step 3: 提交**

```bash
git add client/src/lib/glmApi.ts .env.example
git commit -m "feat: add GLM-4 API wrapper for notice extraction"
```

---

### Task 8: 创建管理员提取页面

**Files:**
- Create: `client/src/pages/AdminExtract.tsx`

**Step 1: 创建页面组件**

```typescript
/**
 * 管理员 AI 提取页面
 * 从 URL 自动提取院校通知信息
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/adminUtils';
import { fetchUrlAsMarkdown } from '@/lib/jinaReader';
import { extractNoticeInfo, ExtractedNotice, isGlmConfigured } from '@/lib/glmApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminExtract() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [url, setUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractedNotice | null>(null);

  // 权限检查
  if (!user || !isAdmin(user.email)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>无权限访问</CardTitle>
            <CardDescription>此页面仅限管理员使用</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/dashboard')}>返回首页</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleExtract = async () => {
    if (!url.trim()) return;

    setIsExtracting(true);
    setError(null);
    setResult(null);

    // Step 1: 获取网页内容
    toast.info('正在获取网页内容...');
    const jinaResult = await fetchUrlAsMarkdown(url);

    if (!jinaResult.success) {
      setError(`获取网页失败: ${jinaResult.error}`);
      setIsExtracting(false);
      return;
    }

    // Step 2: 调用 GLM 提取
    toast.info('正在 AI 提取信息...');
    const glmResult = await extractNoticeInfo(jinaResult.content);

    if (!glmResult.success || !glmResult.data) {
      setError(`AI 提取失败: ${glmResult.error}`);
      setIsExtracting(false);
      return;
    }

    setResult(glmResult.data);
    setIsExtracting(false);
    toast.success('提取成功！');
  };

  const handleCopyJson = () => {
    if (!result) return;

    const json = JSON.stringify(
      {
        ...result,
        url: url,
        linkGrade: 'A',
        yearStatus: 'verified',
        year: new Date().getFullYear(),
      },
      null,
      2
    );

    navigator.clipboard.writeText(json);
    toast.success('JSON 已复制到剪贴板');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <span className="font-medium">AI 通知提取</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            管理员工具
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* API 配置检查 */}
        {!isGlmConfigured() && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              GLM API Key 未配置。请在环境变量中设置 VITE_GLM_API_KEY
            </AlertDescription>
          </Alert>
        )}

        {/* URL 输入 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              输入通知 URL
            </CardTitle>
            <CardDescription>
              输入高校推免通知页面的 URL，AI 将自动提取结构化信息
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="https://example.edu.cn/notice/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isExtracting}
              />
              <Button
                onClick={handleExtract}
                disabled={isExtracting || !url.trim() || !isGlmConfigured()}
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    提取中
                  </>
                ) : (
                  '提取'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 错误提示 */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 提取结果 */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                提取结果
              </CardTitle>
              <CardDescription>
                请核对以下信息，如有错误可手动修改后复制
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>院校名称</Label>
                  <Input value={result.name} readOnly />
                </div>
                <div>
                  <Label>专业方向</Label>
                  <Input value={result.specialty} readOnly />
                </div>
                <div>
                  <Label>学位类型</Label>
                  <Input value={result.degreeType} readOnly />
                </div>
                <div>
                  <Label>通知类型</Label>
                  <Input value={result.noticeType} readOnly />
                </div>
                <div>
                  <Label>申请时间</Label>
                  <Input value={result.applicationPeriod} readOnly />
                </div>
                <div>
                  <Label>截止日期</Label>
                  <Input value={result.deadline} readOnly />
                </div>
                <div>
                  <Label>考核形式</Label>
                  <Input value={result.examForm} readOnly />
                </div>
                <div>
                  <Label>英语要求</Label>
                  <Input value={result.englishRequirement} readOnly />
                </div>
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button onClick={handleCopyJson} className="gap-2">
                  <Copy className="w-4 h-4" />
                  复制 JSON
                </Button>
                <Button variant="outline" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    查看原始链接
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
```

**Step 2: 运行类型检查**

Run: `pnpm check`
Expected: 无错误

**Step 3: 提交**

```bash
git add client/src/pages/AdminExtract.tsx
git commit -m "feat: create AdminExtract page for AI-powered notice extraction"
```

---

### Task 9: 添加管理员页面路由

**Files:**
- Modify: `client/src/App.tsx`

**Step 1: 导入页面**

添加 import：

```typescript
import AdminExtract from "./pages/AdminExtract";
```

**Step 2: 添加路由**

在 `<Route path={"/analytics"}>` 下方添加：

```typescript
<Route path={"/admin/extract"}>
  <ProtectedRoute><AdminExtract /></ProtectedRoute>
</Route>
```

**Step 3: 运行类型检查**

Run: `pnpm check`
Expected: 无错误

**Step 4: 提交**

```bash
git add client/src/App.tsx
git commit -m "feat: add /admin/extract route"
```

---

### Task 10: 构建并测试

**Step 1: 运行完整构建**

Run: `pnpm build`
Expected: 构建成功

**Step 2: 本地测试**

Run: `pnpm dev`
Expected:
- 右下角出现反馈悬浮按钮
- 点击按钮弹出反馈表单
- 管理员访问 /admin/extract 可以看到提取页面

**Step 3: 推送到 GitHub**

```bash
git push origin main
```

---

## 环境变量配置

部署前需要在 Vercel 添加：

| 变量名 | 说明 |
|--------|------|
| `VITE_GLM_API_KEY` | 智谱 AI API Key |
| `VITE_ADMIN_EMAILS` | 管理员邮箱列表（逗号分隔） |

---

## 完成标准

- [ ] 用户反馈表已在 Supabase 创建
- [ ] 反馈悬浮按钮显示正常
- [ ] 反馈提交后数据存入 Supabase
- [ ] 管理员可访问 /admin/extract
- [ ] AI 提取功能正常（需配置 GLM API Key）
- [ ] 所有代码已提交并推送
