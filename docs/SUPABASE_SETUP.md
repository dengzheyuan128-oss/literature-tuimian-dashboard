# Supabase 配置指南

## 1. 创建 Supabase 项目

1. 访问 https://supabase.com 并注册账号
2. 点击 "New Project" 创建新项目
3. 设置：
   - Project name: `tuimian-dashboard`
   - Database Password: 设置一个强密码（保存好）
   - Region: 选择 `Southeast Asia (Singapore)` 或 `Northeast Asia (Tokyo)` - 离中国最近
4. 等待项目创建完成（约2分钟）

## 2. 获取 API 密钥

创建完成后，进入项目设置：
1. 点击左侧 Settings → API
2. 复制以下信息：
   - Project URL: `https://xxxxx.supabase.co`
   - anon/public key: `eyJhbGciOiJIUzI1NiIsInR5cCI6...`

## 3. 创建数据库表

进入 SQL Editor，执行以下SQL：

```sql
-- 用户扩展信息表
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nickname TEXT,
  avatar_url TEXT,
  university TEXT,
  major TEXT,
  grade TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户收藏表
CREATE TABLE user_favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  university_id INTEGER NOT NULL,
  university_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, university_id)
);

-- 用户提醒表
CREATE TABLE user_reminders (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  university_id INTEGER NOT NULL,
  university_name TEXT NOT NULL,
  deadline TEXT NOT NULL,
  reminder_days INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT TRUE,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户对比列表表
CREATE TABLE user_compare_lists (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  university_ids INTEGER[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 启用 RLS (行级安全)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_compare_lists ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能访问自己的数据
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites" ON user_favorites
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own reminders" ON user_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reminders" ON user_reminders
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own compare list" ON user_compare_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own compare list" ON user_compare_lists
  FOR ALL USING (auth.uid() = user_id);

-- 自动创建用户 profile 的触发器
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 4. 配置认证方式

进入 Authentication → Providers：

### 邮箱登录（默认启用）
- 已默认启用

### 手机号登录（可选）
- 需要配置短信服务商（如阿里云短信）

### 微信登录（推荐）
1. 在微信开放平台创建网站应用
2. 获取 AppID 和 AppSecret
3. 在 Supabase 中配置 WeChat Provider

## 5. 环境变量配置

在项目根目录创建 `.env.local` 文件：

```env
VITE_SUPABASE_URL=你的项目URL
VITE_SUPABASE_ANON_KEY=你的anon key
```

注意：`.env.local` 已在 `.gitignore` 中，不会被提交到 Git。

## 6. Excel 入库数据库初始化（草案）

如果要把 `excel/` 中的基础数据迁移进数据库，并支持“用户补链 + 管理员审核”，先执行以下 schema 草案：

- `docs/plans/sql/2026-03-07-excel-to-database-schema.sql`

该草案包含：

- 正式展示数据：
  - `institutions`
  - `departments`
  - `program_cards`
  - `notices`
  - `notice_sources`
  - `tags`
  - `program_card_tags`
- 待审核数据：
  - `submission_queue`
  - `admin_reviews`

建议顺序：

1. 在 Supabase SQL Editor 执行 schema 草案
2. 先跑本地 Excel 清洗脚本，生成 staging 数据
3. 再做 staging 到 Supabase 的 dry-run 导入

当前已落地的清洗入口：

```bash
pnpm exec tsx scripts/import-excel-to-staging.ts
```

输出文件：

- `reports/excel-import/staging-rows.json`
- `reports/excel-import/staging-summary.json`
