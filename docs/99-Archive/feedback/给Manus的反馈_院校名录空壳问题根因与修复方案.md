# 给 Manus / Claude 的详细反馈：院校名录「只有名称和链接、其他信息不显示」的根因与修复方案
> 适用场景：你当前在 Vercel 上看到新补齐院校卡片“空壳”（只有校名/链接，其他字段不展示），且团队单人协作、以 GitHub 为唯一真相源。  
> 本文目标：**找出最大误区**、给出**最低成本止血**路径，并把 Claude 的实施方案里几处关键 bug / 风险点补齐，方便你直接交给新 Manus / Claude 执行。

---

## 0. 结论先行（你现在看到空壳卡片的最可能原因）
你截图里新院校“能显示校名、能点开弹窗，但字段一片空白”，这几乎可以判定为：

1) **数据层确实补齐了“学校名称 + url”，但 Program/Notice 的其余字段仍大量为空**，而 UI 没有“空字段兜底”设计，所以看起来像“坏了”。  
2) **展示层使用的是扁平 `University` 结构**，但数据源是嵌套 v1.1（School/Program/Notice）。当前的“展平/兼容”逻辑只取 `programs[0].notices[0]`，一旦 notice 里除 `url` 外为空，就会出现大面积空白。这个“结构脱节”在项目分析报告里已经指出：数据层支持“多项目多通知”，但前端只展示第一条，复杂性没有产生价值。fileciteturn19file13L48-L57

所以：**这不是“院校链接没更新”这么简单，而是“产品最小可展示单元（MVD）缺失 + 结构脱节导致的空壳体验”。**

---

## 1. Manus 当前的最大误区是什么？
### 误区：把“修复崩溃/修复界面”当成“修复产品可用性”
Manus/模型可能已经修了 `.join()` 导致白屏的崩溃（你们之前确实经历过：缺失 `degreeTypes` 时 `.join()` runtime 崩溃）。fileciteturn19file14L4-L6  
但修完崩溃后，如果不引入 **MVD 兜底展示策略**，用户看到的会从“白屏”变成“空壳卡片”，仍然会认为网站坏了。

> 换句话说：**技术稳定性 ≠ 产品可用性。**  
> 你需要强制一个“可展示标准 + UI 兜底提示”，让任何数据状态都能被解释，而不是沉默地空白。

---

## 2. 先止血：建立 MVD（最小可展示单元）+ 三态展示（complete/partial/placeholder）
你们的整合方案里，MVD 的方向是对的：必须把“空字段”变成“可解释的状态”。fileciteturn19file4L14-L37

但需要注意：你方案里的 MVD 示例是基于扁平字段 `uni.degreeType / uni.specialty / uni.url` 写的（适用于“扁平结构”）。fileciteturn19file4L14-L20  
**如果你的前端数据仍来自 v1.1 展平产物，必须确保展平产物里确实有这些字段**；否则 UI 逻辑写得再漂亮也会空。

### 2.1 建议的“最低成本”实现顺序（强烈推荐）
1. **先在 dataLoader 里统一生成 `_displayStatus`**（在一处集中计算），前端只消费状态，不要在多个组件里各算一套。  
2. Home 卡片按 `_displayStatus` 三态渲染：
   - placeholder：显示“数据补充中 / 待人工复核”提示（不要空白）
   - partial：显示已有字段，缺失字段展示“待补充”
   - complete：正常展示

这样你能在 1 次 PR 内把“空壳体验”止血，且不影响后续结构重构。

---

## 3. 你这份「实施方案-整合版」里，必须立刻修正的 3 个关键 bug / 风险点
下面这些点，如果不修，Manus 很可能“照着写”然后又引入新问题（甚至 CI 直接跑不起来）。

### 3.1 `check-data-quality.cjs` 里有确定性 bug：`notice` 未定义
在 `calculateCompleteness()` 中，你 `program.notices?.forEach(() => { ... notice.url ... })`，但回调参数没有接 `notice`，导致脚本运行必报错。fileciteturn19file0L48-L60

**正确写法：**
```js
program.notices?.forEach((notice) => {
  total++;
  const fieldCount = [
    program.degreeTypes?.length > 0,
    Boolean(program.specialty?.trim()),
    Boolean(notice.url?.trim()),
    Boolean(notice.deadline?.trim()),
    Boolean(notice.englishRequirement?.trim()),
    Boolean(notice.examForm?.trim()),
  ].filter(Boolean).length;
  ...
});
```

### 3.2 `generate-flat-data.js` 输出路径写错（会在 scripts 目录下生成“幽灵文件”）
你写的是：
```js
const outputPath = path.join(__dirname, './client/src/data/universities.flat.json');
```
如果脚本位于 `scripts/`，这会变成 `scripts/client/src/...`，而不是仓库根目录下的 `client/src/...`。fileciteturn19file3L82-L85

**正确写法：**
```js
const outputPath = path.join(__dirname, '../client/src/data/universities.flat.json');
```

### 3.3 `vite.config.ts` 里直接 define `import.meta.env.*` 风险偏高
你方案建议在 `vite.config.ts` 的 `define` 中直接覆盖 `import.meta.env.VITE_*`。fileciteturn19file5L28-L41  
这在 Vite 里容易引发“环境变量体系混乱”（尤其是 Vercel/本地 dev/preview 行为不同）。

更稳的方式是：用 **自定义全局常量**（如 `__BUILD_COMMIT__`），你们的“数据加载机制排查报告”已经给了更稳的模板：fileciteturn19file1L13-L21  
- 不污染 env
- 无需依赖 `.env` 注入
- 部署时更可控

**推荐：**
- `vite.config.ts` define `__BUILD_COMMIT__`, `__BUILD_TIME__`, `__DATA_UPDATED__`, `__UNI_COUNT__`
- BuildInfo 组件读这些常量

---

## 4. 为什么“新补齐院校只有名称和链接”？（根据你截图 + 现有文档的推断）
你们阶段 A 的补齐策略明确：为了省积分，批量推断研究生院/招生首页 URL，其他字段不补，`tier` 也保持 null。fileciteturn19file9L39-L50  
这会直接导致：
- `deadline / englishRequirement / examForm / applicationPeriod` 等字段为空  
- UI 如果没有 placeholder/partial 提示，就会呈现“空壳”

因此：**这不是“数据没写进去”，而是“数据只写了一小部分，而 UI 没告诉用户这是正常状态”。**  
你现在要做的是把“缺失”显性化，而不是逼 Manus 去“补猜字段”（那会制造更大坑）。

---

## 5. 推荐你采纳 Claude 的方案，但要做 2 个关键改造
Claude 的大方向（MVD + BuildInfo + CI）是对的。fileciteturn19file2L8-L28  
但为了更贴合你“单人 + 多账号 Manus + 节省积分”的现实，我建议做两个改造：

### 5.1 CI 不要“一刀切卡死”，改成“失败只拦截致命错误、缺失只报警告”
- **致命错误（必须 fail）**：JSON schema 错 / 字段类型错 / 关键路径缺失 / 运行会崩溃的空数组 join 等  
- **非致命缺失（warning）**：deadline/英语要求/考核方式为空

否则你补齐院校阶段会频繁被 CI 卡死，反而拖慢推进。

### 5.2 引入 `pending_manual.md` 的“可回流闭环”
你已经表达过：Manus 找不到时要反馈你人工补。  
建议把它固化成文件：每次 CI 发现缺失字段（或 linkGrade 低），就自动把条目写入 `pending_manual.md`（或生成 report），形成 **人机协作闭环**。  
这样你不需要让模型反复上网搜（省积分），也不会丢任务。

---

## 6. 给 Manus/Claude 的“最小可执行任务清单”（按提交拆分）
> 目标：每个 PR 都能独立验收；任何账号接手都能继续推进。

### PR-1：止血（强制三态展示 + 不再出现空壳）
- [ ] 在 dataLoader 统一计算 `_displayStatus`（complete/partial/placeholder）
- [ ] Home 卡片按状态渲染：placeholder 必须有“数据补充中”提示
- [ ] 详情弹窗字段为空时显示“待补充”（禁止留空）
- [ ] 本地 `pnpm dev` / `pnpm preview` 验证随机 10 所新院校不会空白

### PR-2：BuildInfo 可验证性（让你一眼看出线上版本是不是最新）
- [ ] `vite.config.ts` define `__BUILD_COMMIT__`、`__BUILD_TIME__`
- [ ] BuildInfo 显示：commit、build time、院校总数、lastUpdated（数据字段）fileciteturn19file6L23-L26
- [ ] 将 BuildInfo 固定放在右下角（生产也保留）

### PR-3：数据质量脚本修复 + CI 初版
- [ ] 修复 `calculateCompleteness` 的 `notice` 未定义 bug fileciteturn19file0L48-L60
- [ ] CI 规则：致命错误 fail；缺失字段 warning
- [ ] PR 评论输出完整率统计（可选）

### PR-4：展示数据与源数据解耦（可选，但长期收益大）
- [ ] 修复 `generate-flat-data.js` 输出路径 fileciteturn19file3L82-L85
- [ ] `prebuild` 自动生成 `universities.flat.json`
- [ ] 前端改读 flat 数据（删除/简化 runtime flatten）
- [ ] 抽查 5 所院校展示一致

---

## 7. 给 Manus/Claude 的“单条指令模板”（省积分版）
> 你可以把下面整段贴给新 Manus 账号（尽量一次性描述清楚，减少往返）。

```text
请你接管仓库并按“PR-1 止血”执行：
1) 在 dataLoader 内计算每条展示记录的 _displayStatus（complete/partial/placeholder）。
2) Home 卡片与详情弹窗：任何缺失字段必须显示“待补充”，禁止空白。
3) 完成后提交 PR 到 main，并在 PR 描述里附上：本地验证截图 + 随机抽查 10 所院校状态。
停损：本次只改动 dataLoader + Home/Modal 两处；不要引入新的数据结构重构。
```
（执行完 PR-1 后，再按 PR-2/PR-3 继续。）

---

## 8. 附：对“结构重构”路线的补充建议（你用 Claude 开发时更稳）
你们项目分析报告认为“向后兼容是伪需求”，建议彻底改结构。fileciteturn19file11L48-L74  
我赞同“最终要解耦展示层与源数据”，但在你当前目标（尽快上线可用）下，推荐：

- **短期**：保留 v1.1 作为“源数据”，用脚本生成 flat 作为“展示数据”（Phase 2 的思路是对的）fileciteturn19file3L52-L65  
- **中期**：再考虑把源数据也扁平化（当你确认“多通知展示”真的要做时）
- **永远不要做**：运行时在前端写复杂 flatten 逻辑（会反复出 bug、难验证、难协作）

---

## 9. 你现在就能立刻验证的一件事（不写代码也能排查）
在生产页面右下角你已经看到 build 信息块（commit/hash/time/Universities=118）。  
如果你 GitHub 新提交后，Vercel 页面 build hash 没变，说明 **新 commit 没触发生产部署**（或你看的是旧 Production）。  
这条逻辑在“数据加载机制排查报告”里已经讲清楚：数据是 build-time 打包，改 JSON 必须重新构建部署。fileciteturn19file10L36-L56

---

# 最终一句话（方便你给 Manus 提醒）
**不要再把精力花在“补猜字段”上了：先让 UI 对缺失负责（可解释、可验证、可回流），再谈自动化补齐。**  
这样才能同时满足你：推进速度快、积分消耗少、协作可接力。
