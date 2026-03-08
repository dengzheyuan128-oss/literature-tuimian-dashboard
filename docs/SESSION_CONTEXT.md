# 会话上下文追踪

> 用途：明天继续开发时，优先阅读本文件恢复项目状态。  
> 更新时间：2026-03-09

---

## 当前一句话状态

项目已经从“浏览器直连 Supabase 导致公域卡片不可用”推进到“公域主链路可用，代理已生效，字段展示与标签筛选已显著修复，但仍需继续提升清洗质量与字段丰富度”的阶段。

## 当前分支与最新提交

- 当前分支：`main`
- 最新远端提交：`7d41606`
- 提交信息：`feat: restore usable card fields and tag filtering`

## 当前线上判断基准

如果线上已经是最新版本，右下角应至少满足：

- `Build: 7d41606`
- `Source: api`

如果不是这两个值，先不要判断功能是否已修好，先确认 Vercel 是否部署到了最新提交。

---

## 今天已经解决的根因

### 1. 大陆浏览器直连 Supabase 超时

根因已经确认：不是数据库慢，也不是 SQL 视图本身坏，而是浏览器从中国大陆直连 `*.supabase.co` 不稳定。

已落地方案：

- 前端公域读取改走 Vercel 服务端代理
- 服务端代理再访问 Supabase
- 前端不再直接把公域主读链路绑在浏览器直连 Supabase 上

关键提交：

- `b945b47` `feat: proxy public program card reads through api`

### 2. 首页统计口径误导

之前“共收录 24 所高校”只是当前页数量，不是全库数量。

已修复：

- API 返回 `totalCount`
- 首页改为“当前页 X 条，共 Y 所高校”
- 诊断框中的 `Universities` 也优先显示总数，不再把探针请求当全局统计

### 3. 详情页仍依赖旧静态 markdown

之前详情页还会读旧的 `/data/notices/{id}.md` 和 `attachments.json`，导致数据库卡片与详情页链路不一致。

已修复：

- 详情页改为直接读取数据库卡片读模型
- 详情页显示结构化字段
- 保留官方通知外链入口

### 4. 院校标签体系在新读模型中丢失

旧框架本来支持：

- `985`
- `211`
- `双一流`
- `省属重点师范`

但新数据库读模型只剩单一 `tier`，导致：

- 标签不能重合
- 筛选不准
- 字段展示看起来“不完整”

已修复：

- 旧静态院校数据只作为“标签字典”使用，不再作为公域运行时数据源
- 新读模型新增 `institutionTags[]`
- 首页与搜索都改为基于 `institutionTags[]` 筛选与匹配
- 详情页也显示多标签

关键提交：

- `7d41606` `feat: restore usable card fields and tag filtering`

### 5. 完整度判定过硬

之前 `dataStatus` 只看少数几个字段，导致大量卡片被误判为 `PARTIAL`。

已改善：

- 放宽完整度规则
- 将 `examForm`、`englishRequirement` 等字段纳入判断
- 明显减少因旧规则过硬造成的误判

### 6. 搜索体验和诊断浮层

已改善：

- 搜索支持“加载更多结果”
- 右下角诊断框可拖动，不再固定挡住翻页按钮

---

## 当前仍未完全解决的问题

### 1. 字段还不算“完整”

现在是“比之前明显好”，但还没到“字段完整可全面检索”的程度。

主要原因：

- Excel 清洗仍只结构化了部分字段
- 一些已有信息还停留在原始文本，没有被提升为稳定字段
- 详情页和卡片展示仍受当前清洗结果上限约束

### 2. 链接体验仍需继续核对

已确认一条重要事实：

- 抽样检查原始 Excel 后，`通知官网链接` 在样本中是明文 URL，不是隐藏超链接对象

所以后续若仍有链接不可点或不好用，优先排查：

1. 清洗是否保留到读表
2. 读表是否回写到卡片字段
3. 前端是否对该字段提供了明确的点击入口

### 3. 搜索与筛选还不算“充分检索”

虽然现在已经能搜索、能加载更多，也能按多标签筛选，但还没做到“字段充分结构化后的完整检索”。

后续重点应放在：

- 增强清洗映射
- 提升结构化字段覆盖
- 再决定是否把更多搜索能力下沉到数据库或服务端

---

## 当前推荐的继续顺序

明天继续时，不要再回头排查连通性问题。优先顺序应是：

1. 增强 Excel 清洗映射
2. 补齐卡片和详情页缺失字段
3. 核对链接字段在清洗、入库、展示三层是否一致
4. 继续提升搜索与筛选完整度
5. 如果需要，再把 `institutionTags[]` 正式下沉到数据库读表，而不是只在前端回接

---

## 不要再走回去的旧路

### 不要做的事

- 不要再把公域主链路改回浏览器直连 Supabase
- 不要把旧 `universities.json` 重新当运行时主数据源
- 不要看到 `Universities: 1 所` 就误判成全库只有 1 所
  - 这只是诊断探针
- 不要把“字段不完整”直接归因于 UI
  - 要先区分源数据、清洗、读模型、展示四层

### 推荐的排查顺序

遇到字段或检索问题时，统一按这四层排查：

1. 原始 Excel 有没有这个信息
2. 清洗脚本有没有保留
3. 读模型/读表有没有承接
4. 前端有没有真正展示或用于筛选

---

## 关键文件

### 当前主链路

- [api/program-cards.ts](./../api/program-cards.ts)
- [client/src/lib/programCards.ts](./../client/src/lib/programCards.ts)
- [client/src/lib/publicProgramCards.ts](./../client/src/lib/publicProgramCards.ts)
- [client/src/lib/programCardProxy.ts](./../client/src/lib/programCardProxy.ts)
- [client/src/pages/Home.tsx](./../client/src/pages/Home.tsx)
- [client/src/components/SearchCommand.tsx](./../client/src/components/SearchCommand.tsx)
- [client/src/pages/NoticeDetail.tsx](./../client/src/pages/NoticeDetail.tsx)
- [client/src/components/BuildInfo.tsx](./../client/src/components/BuildInfo.tsx)

### 今天新增/关键修复

- [client/src/lib/institutionTags.ts](./../client/src/lib/institutionTags.ts)
- [client/src/lib/institutionTags.test.ts](./../client/src/lib/institutionTags.test.ts)

---

## 已完成验证

- `pnpm check`
- `pnpm build`
- `pnpm exec vitest run client/src/lib/institutionTags.test.ts client/src/lib/programCards.test.ts client/src/lib/programCardProxy.test.ts`

说明：

- 测试在沙箱内会遇到 `esbuild spawn EPERM`
- 已在非沙箱环境复跑通过

---

## 明天如果让我继续，最短指令

你可以直接说：

- “读 `docs/SESSION_CONTEXT.md` 继续”
- “按 `SESSION_CONTEXT` 继续补字段完整性”
- “继续做清洗映射和字段展示”

这样就不需要再重复回顾今天的上下文。
