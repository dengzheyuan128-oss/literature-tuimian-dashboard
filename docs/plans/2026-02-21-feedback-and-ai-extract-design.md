# 用户反馈与 AI 辅助提取功能设计

**日期**: 2026-02-21
**状态**: 已批准
**作者**: Claude + 用户

---

## 概述

本文档描述两个新功能的设计：
1. **用户反馈功能** — 让用户报告链接失效、信息错误等问题
2. **AI 辅助提取功能** — 管理员工具，从 URL 自动提取院校通知信息

---

## 功能一：用户反馈

### 需求

| 项目 | 决策 |
|------|------|
| 入口位置 | 全局悬浮按钮（右下角） |
| 反馈类型 | 链接失效、信息过期、信息错误 |
| 院校关联 | 可选（下拉选择） |
| 数据存储 | Supabase `user_feedback` 表 |

### 组件结构

```
FeedbackButton (悬浮按钮组件)
  └── FeedbackDialog (弹窗表单)
        ├── 反馈类型选择 (RadioGroup)
        │   - link_invalid: 链接失效
        │   - info_outdated: 信息过期
        │   - info_wrong: 信息错误
        ├── 院校选择 (Select, 可选)
        ├── 问题描述 (Textarea)
        └── 提交按钮
```

### 数据表设计

```sql
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

-- RLS 策略
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- 用户只能插入自己的反馈
CREATE POLICY "Users can insert own feedback" ON user_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户可以查看自己的反馈
CREATE POLICY "Users can view own feedback" ON user_feedback
  FOR SELECT USING (auth.uid() = user_id);
```

### 用户流程

1. 用户点击右下角悬浮按钮（消息图标）
2. 弹出反馈表单对话框
3. 选择反馈类型（必选）
4. 可选择关联的院校
5. 填写问题描述（必填）
6. 点击提交
7. 数据存入 Supabase
8. 显示"感谢反馈"提示，对话框关闭

### 文件清单

| 文件 | 说明 |
|------|------|
| `client/src/components/FeedbackButton.tsx` | 悬浮按钮 + 弹窗组件 |
| `client/src/lib/supabase.ts` | 添加 `submitFeedback` 函数 |

---

## 功能二：AI 辅助提取

### 需求

| 项目 | 决策 |
|------|------|
| 使用者 | 仅管理员 |
| 网页获取 | Jina Reader API |
| AI 模型 | GLM-4 (智谱 AI) |
| 结果处理 | 展示预览 → 可编辑 → 合并到数据文件 |

### 页面结构

```
/admin/extract (管理员专属页面)
  ├── Header: 返回按钮 + 标题
  ├── URL 输入区
  │   ├── Input: URL 输入框
  │   └── Button: "提取"按钮
  ├── 提取结果预览区 (Card)
  │   ├── 表单字段（可编辑）
  │   │   - 院校名称
  │   │   - 专业方向
  │   │   - 学位类型
  │   │   - 申请时间
  │   │   - 截止日期
  │   │   - 考核形式
  │   │   - 英语要求
  │   │   - 通知类型
  │   └── 原始链接
  └── 操作按钮
      ├── "重置"按钮
      └── "合并到数据"按钮
```

### 技术流程

```
┌─────────────────┐
│  用户输入 URL   │
└────────┬────────┘
         ↓
┌─────────────────┐
│ 调用 Jina Reader │  GET https://r.jina.ai/{url}
└────────┬────────┘
         ↓
┌─────────────────┐
│ 获取 Markdown   │
└────────┬────────┘
         ↓
┌─────────────────┐
│ 调用 GLM-4 API  │  POST https://open.bigmodel.cn/api/paas/v4/chat/completions
└────────┬────────┘
         ↓
┌─────────────────┐
│ 解析 JSON 结果  │
└────────┬────────┘
         ↓
┌─────────────────┐
│ 前端展示预览    │  用户可编辑修正
└────────┬────────┘
         ↓
┌─────────────────┐
│ 点击"合并"     │
└────────┬────────┘
         ↓
┌─────────────────┐
│ 写入数据文件    │  更新 universities.json
└─────────────────┘
```

### GLM-4 Prompt

```
你是一个高校推免通知信息提取助手。请从以下网页内容中提取推免/夏令营相关信息。

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
{content}
---
```

### 环境变量

```bash
# .env.local
VITE_GLM_API_KEY=your-glm-api-key-here

# 管理员邮箱列表（逗号分隔）
VITE_ADMIN_EMAILS=admin@example.com,your-email@example.com
```

### 权限控制

```typescript
// 检查是否为管理员
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',');

function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}
```

### 文件清单

| 文件 | 说明 |
|------|------|
| `client/src/pages/AdminExtract.tsx` | 管理员提取页面 |
| `client/src/lib/jinaReader.ts` | Jina Reader API 封装 |
| `client/src/lib/glmApi.ts` | GLM-4 API 封装 |
| `client/src/lib/adminUtils.ts` | 管理员权限判断 |

---

## 实施优先级

1. **用户反馈功能**（优先）— 简单、用户立即可用
2. **AI 辅助提取功能** — 依赖外部 API，需要配置

---

## 风险与注意事项

1. **Jina Reader 限流** — 免费版有请求限制，需注意频率
2. **GLM-4 API 费用** — 按 token 计费，注意成本
3. **数据合并冲突** — 合并数据时需要检查是否已存在相同院校
4. **管理员权限** — 需要妥善管理管理员邮箱列表

---

## 后续扩展

- 添加反馈管理后台 `/admin/feedback`
- 添加邮件通知（新反馈时通知管理员）
- 支持批量 URL 提取
- 支持更多 AI 模型选择
