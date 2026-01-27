# 对《修正版实施方案-PR1-PR3》的补充反馈（可直接回传 Claude/Manus）

> 我已查收你上传的《修正版实施方案-PR1-PR3》。fileciteturn20file0  
> 下面这份是“在不推翻你现有 PR-1/2/3 设计”的前提下，我认为**必须补上的风险点与改动清单**（避免再次出现“止血成功但体验仍像坏了”的情况）。

---

## 1) 方案做对了什么（可以保留）

- ✅ 已修复 3 个致命 Bug：
  - `check-data-quality.cjs` 的 `notice` 未定义
  - `generate-flat-data.js` 输出路径幽灵文件
  - `vite.config.ts` 不再污染 `import.meta.env`
- ✅ PR-1 用 `_displayStatus` + `_missingFields` 做“三态展示”，方向正确：把“缺失”显性化，能立刻消灭“空壳一片”的负反馈。
- ✅ PR-2 用全局常量做 BuildInfo，可验证线上是否是最新构建（对你单人维护尤其关键）。

这些部分建议保持不动。

---

## 2) PR-1 仍有一个“高概率踩坑点”（必须改）

### 问题：`placeholder` 状态下你把按钮禁用了，可能会“误伤”只有链接的院校
你当前的状态判定：`presentCount >= 3` 才算 `partial`，否则就是 `placeholder`。  
这会导致一种非常常见的数据形态：

- 有 `notice.url`（你人工补的）
- 可能还有 `degreeTypes` 或 `programName`
- 但其它字段空（deadline/english/examForm…）

在这种情况下，`presentCount` 很可能只有 2，结果被归为 `placeholder`。  
然后 UI 里你把按钮 `disabled` 了 —— **用户反而无法点通知链接**，体验会变成：
> “我看到有学校，但啥也点不了”

### 建议改法（两种选一，推荐 A）

#### A（推荐）：把 `partial` 的判定改成“URL 必须存在 + 至少再有 1 个关键字段”
在 `calculateDisplayStatus()` 里改为：

- `complete`：缺失字段为 0
- `partial`：**存在 url** 且（`degreeTypes` 或 `specialty` 或 `applicationPeriod/deadline` 任意一个存在）
- `placeholder`：连 url 都没有（或除了 url 全空且你希望禁止展示）

这样可以确保：**只要有链接，就不会被禁用。**

#### B（止血版）：保留阈值，但 placeholder 卡片如果有 url 也允许“查看通知”
即：placeholder 卡片的 Footer 里，如果 `uni.url` 有值就给个可点按钮，否则禁用。

> 强烈建议至少做 B，不然你“只补链接先跑起来”的策略会被 UI 反向抵消。

---

## 3) 数据字段命名/来源仍可能导致“有信息但展示不到”

### 问题：你优先展示 `program.specialty`，但很多情况下你们可能填的是 `programName`
在你的 v1.1 类型里同时存在：
- `programName`
- `specialty`

但 `flattenSchool()` 里是：
```ts
specialty: firstProgram.specialty || ''
```
这意味着：如果你们填的是 `programName = 中国语言文学`，而 `specialty` 为空，首页会显示“待补充”。

### 建议改法（非常简单）
在 `flattenSchool()` 里改成：
```ts
const specialty = firstProgram.specialty?.trim() || firstProgram.programName?.trim() || '';
...
specialty,
```
并把 `calculateDisplayStatus()` 的“专业方向”检查也改为同样的 fallback（specialty/programName 二选一）。

---

## 4) Home.tsx 大段替换的实现风险（会让 PR-1 反复卡在编译错误）

你提供的 Home.tsx 替换片段使用了：
- `Card / CardHeader / CardContent / CardFooter`
- `Badge`, `Button`
- `BookOpen / GraduationCap / Calendar / ExternalLink`（lucide-react）

但实际仓库里这些组件/别名的 import 未必齐全，**很容易出现**：
- “找不到 Badge”
- “找不到 lucide icon”
- `@/components/ui/...` 路径与 alias 不一致

### 建议：PR-1 里先做“最小替换”，减少编辑面
- 不要整段替换整个卡片组件
- 只在“字段显示位置”加一个：
  - `placeholder/partial` 的占位文案
  - 空字段显示 `待补充`
  - Footer 里保留“查看通知”按钮逻辑

这样可以把 PR-1 的风险缩到最小（更符合“止血”的定位）。

---

## 5) PR-3 的数据质量脚本：建议补 2 个“不会卡死但能回流”的产物

你脚本现在会输出统计并 `exit(0/1)`，这很好。  
但为了配合你“找不到就交给我人工”的策略，建议额外生成两个文件（warning 级，不阻塞 CI）：

### 5.1 `pending_manual.md`
收集：
- 缺 url 的条目
- `linkGrade = D` 的条目
- `_displayStatus = placeholder` 的条目（可选）

### 5.2 `data_quality_report.json`
输出：
- `complete/partial/placeholder` 统计
- 各 tier 数量
- linkGrade 分布

这样你就能：
- 让模型停止无效搜索（省积分）
- 让你的人力补齐有清晰列表（高效率）

---

## 6) 建议的“验收标准”再补 2 条（防止回归）

在你现有 PR-1 验收清单基础上，补两条“用户视角验收”：

1. **随机抽 10 所新增院校**：
   - 卡片不允许出现“大片空白区域”
   - 若信息不全，必须出现“待补充/数据补充中”的明确提示
2. **只补了 url 的院校**：
   - **必须仍然可以点击“查看通知”**（否则你的补齐策略就失效）

---

## 7) 给 Claude 的“追加指令”（直接复制即可）

```text
请基于现有 PR-1/2/3 方案，补做以下修正：
1) 修改 calculateDisplayStatus 的判定：只要 notice.url 存在，就不要把卡片归为 placeholder 并禁用按钮；建议 partial 的条件为「url存在 + 至少再有一个关键字段」。
2) flattenSchool 的 specialty 字段增加 fallback：specialty ||= programName，避免“实际有 programName 但页面显示待补充”。
3) placeholder 卡片如果有 url，仍应提供“查看通知”按钮（至少保证只补链接的院校可用）。
4) check-data-quality 增加输出 pending_manual.md（warning级，不阻塞CI），列出缺 url / D级链接 / placeholder 条目，便于人工回流补齐。
验收：随机抽10所新增院校，卡片/弹窗不得出现空白；只补url的院校必须能点击查看通知。
```
