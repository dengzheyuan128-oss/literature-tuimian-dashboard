# Excel To Database Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 Excel 基础数据迁移到 Supabase 数据库，切换前台为数据库卡片模式，并建立“用户补链 -> 自动提取 -> 管理员审核 -> 正式发布”的最小工作流。

**Architecture:** 先建立数据库 schema 和 staging 导入脚本，再抽象前端数据访问层，把静态 JSON 展示切到数据库。审核流与用户补链建立在数据库之上，正式库和待审核库严格分离。旧 `universities.json` 保留备份但退出主展示链路。

**Tech Stack:** Supabase/Postgres, React 19, TypeScript, Vite 7, existing Supabase client, existing admin extract flow, Node import scripts

---

### Task 1: 建立数据库 schema 文档与 SQL 初稿

**Files:**
- Create: `docs/plans/sql/2026-03-07-excel-to-database-schema.sql`
- Modify: `docs/SUPABASE_SETUP.md`

**Step 1: 写出正式库与待审核库 SQL**

包含以下表的最小字段与索引：
- `institutions`
- `departments`
- `program_cards`
- `notices`
- `notice_sources`
- `tags`
- `program_card_tags`
- `submission_queue`
- `admin_reviews`

**Step 2: 为管理后台和公开读取写最小 RLS 方案**

至少覆盖：
- 匿名用户只读正式已发布数据
- 登录用户可插入提交记录
- 管理员可读写审核表

**Step 3: 文档化部署步骤**

在 `docs/SUPABASE_SETUP.md` 中追加新表初始化步骤和迁移说明。

**Step 4: 验证**

人工检查 SQL 结构和字段命名是否与设计文档一致。

---

### Task 2: 建立 Excel 标准化脚本

**Files:**
- Create: `scripts/import-excel-to-staging.cjs`
- Create: `reports/excel-import/README.md`

**Step 1: 写失败前的最小验证脚本**

先输出每个 Excel 的：
- 真实表头行
- 标准化后列名
- 记录数
- 缺失关键字段数

**Step 2: 实现标准化映射**

统一映射字段：
- `school_name`
- `department_name`
- `published_at_raw`
- `stage`
- `application_start_raw`
- `application_end_raw`
- `requirement_text`
- `notice_url`
- `application_method`
- `ranking_requirement_text`
- `materials_text`
- `flags_json`

**Step 3: 生成 staging JSON / CSV**

输出到：
- `reports/excel-import/staging-rows.json`
- `reports/excel-import/staging-summary.json`

**Step 4: 验证**

Run: `node scripts/import-excel-to-staging.cjs`
Expected: 输出文件存在，且 4 个 Excel 都被处理。

---

### Task 3: 建立数据库导入脚本

**Files:**
- Create: `scripts/push-staging-to-supabase.cjs`
- Modify: `.env.example`

**Step 1: 写导入脚本读取 staging 输出**

脚本职责：
- upsert 学校
- upsert 学院
- 创建或匹配 `program_cards`
- 插入正式 `notices`
- 记录 `notice_sources`

**Step 2: 加入 dry-run 模式**

支持：
- `--dry-run`
- `--limit N`

**Step 3: 环境变量说明**

补充导入脚本所需 Supabase 服务端环境变量说明。

**Step 4: 验证**

Run: `node scripts/push-staging-to-supabase.cjs --dry-run --limit 20`
Expected: 输出 upsert / insert 统计，不写入线上数据。

---

### Task 4: 抽象前端数据库数据访问层

**Files:**
- Create: `client/src/lib/programCards.ts`
- Modify: `client/src/lib/supabase.ts`
- Modify: `client/src/lib/dataLoader.ts`

**Step 1: 新建 program card 查询函数**

至少提供：
- `getProgramCards(filters)`
- `getProgramCardById(id)`
- `getFilterFacets()`

**Step 2: 保留旧 JSON fallback，但默认不走**

将旧 `universities.json` 标记为封存 fallback，只在数据库未配置时显式允许开发模式使用。

**Step 3: 验证**

Run: `pnpm check`
Expected: 类型检查通过。

---

### Task 5: 切换前台卡片列表到数据库

**Files:**
- Modify: `client/src/pages/*` 中实际使用院校列表的页面
- Modify: `client/src/components/*` 中依赖 `universities` 的卡片与筛选组件

**Step 1: 找出当前静态 JSON 入口**

替换所有主展示查询为 `programCards` 查询层。

**Step 2: 实现卡片视图模型**

卡片至少显示：
- 学校
- 学院
- 项目
- 年份
- 招生阶段
- 关键标签
- 最新公告链接

**Step 3: 隐藏旧数据主入口**

确保旧 `universities.json` 不再默认展示到用户界面。

**Step 4: 验证**

Run: `pnpm check`
Expected: 通过。

---

### Task 6: 实现混合筛选

**Files:**
- Modify: 卡片列表页筛选组件
- Possibly Create: `client/src/components/program-cards/*`

**Step 1: 实现强结构筛选**

先落：
- 年份
- 招生阶段
- 学校层级
- 地区
- 学位类型

**Step 2: 实现词条标签筛选**

先落：
- 跨专业
- 英语要求
- 排名要求
- 报名方式
- 材料要求相关标签

**Step 3: 验证**

人工验证筛选组合返回结果正确。

---

### Task 7: 建立待审核公告后台

**Files:**
- Create: `client/src/pages/AdminNoticeReview.tsx`
- Modify: `client/src/lib/adminUtils.ts`
- Modify: `client/src/lib/glmApi.ts` / `client/src/lib/jinaReader.ts` if needed

**Step 1: 从现有管理员提取能力复用自动提取结果**

把输出从“预览后合并 JSON”改为“写入 submission_queue 草稿”。

**Step 2: 建立审核列表和详情**

支持：
- 查看原链接
- 查看提取结果
- 编辑结构化字段
- 选择归属卡片
- 通过 / 驳回

**Step 3: 审核通过写入正式库**

写入：
- `notices`
- `notice_sources`
- `admin_reviews`

**Step 4: 验证**

手工跑通 1 条链接的待审到通过流程。

---

### Task 8: 开放用户补链入口

**Files:**
- Create or Modify: 用户端提交组件
- Modify: `client/src/lib/supabase.ts`

**Step 1: 提供最小提交表单**

字段：
- 公告链接
- 备注（可选）

**Step 2: 提交后写入 `submission_queue`**

初始状态：
- `pending_extract`

**Step 3: 后台拉起提取**

可以先做管理员点击触发，不必一开始就做全自动。

**Step 4: 验证**

用户可提交，后台可见。

---

### Task 9: 文档与回归验证

**Files:**
- Modify: `README.md`
- Modify: `docs/SESSION_CONTEXT.md`
- Modify: `docs/01-Project/PROJECT_STATUS.md`

**Step 1: 更新项目当前数据架构说明**

说明：
- 静态 JSON 已封存
- 新主数据源为 Supabase
- Excel 为首批导入源

**Step 2: 运行验证命令**

Run:
- `pnpm check`
- `pnpm build`

Expected:
- 检查通过
- 构建在正常本机环境通过

---

## Recommended Execution Order

1. Task 1
2. Task 2
3. Task 3
4. Task 4
5. Task 5
6. Task 6
7. Task 7
8. Task 8
9. Task 9

---

## MVP Stop Line

满足以下条件即可停：

- 4 份 Excel 可被标准化脚本读取并生成 staging 输出
- Supabase 中有正式卡片和公告表
- 前台主列表改为数据库读取
- 旧 JSON 不再默认展示
- 用户可提交链接
- 管理员可审核 1 条新公告并发布
