# Claude Code 本地开发「低门槛高质量」工作流（给你+Claude用）
> 目标：在本地开发时 **上下文不丢、目标一致、能用 Markdown 互相纠错、可一键续聊、能用 git 推到 GitHub**，同时把命令行难度压到最低。  
> 依据：Claude Code 官方文档对 **会话续接/上下文压缩/权限与 git/记忆文件** 的说明。citeturn2view0turn1view0turn1view1

---

## 0）先把核心事实说清楚（你会少踩很多坑）
- Claude Code **每次在某个目录启动**，默认能访问该目录及子目录中的文件；其它位置的文件需要你授权。citeturn2view0  
- Claude Code **会保存会话**，你可以用 `--continue/--resume` 续上一次对话，或 `--fork-session` 从同一历史分叉。citeturn2view0  
- 但是：Claude Code **不会像网页端那样跨会话“自动记住你的偏好”**；想跨会话稳定记住，靠 **CLAUDE.md / rules / CLAUDE.local.md** 这些“记忆文件”。citeturn2view0turn1view0  
- 上下文会自动压缩，早期对话指令可能被“挤掉”，所以**长期规则写进 CLAUDE.md**，必要时用 `/compact` 指定保留重点。citeturn2view0  

---

## 1）一次性配置（建议 15 分钟搞定）
### 1.1 在仓库根目录启动 Claude（“挂文件夹”的正确方式）
1. 打开终端（Windows 推荐用 Windows Terminal）
2. `cd` 到你的仓库根目录（能看到 package.json / client/ 等）
3. 运行：
```bash
claude
```
Claude 会把当前目录当作工作区（能读写子目录）。citeturn2view0

### 1.2 用 `/init` 生成项目级 CLAUDE.md（让它“每次都懂你”）
在 Claude Code 里输入：
```
/init
```
官方说明：`/init` 会引导创建 `CLAUDE.md`。citeturn2view0

### 1.3 建议你按“项目化记忆”拆成 3 层（官方支持）
Claude Code 支持多级记忆文件（自动加载）：citeturn1view0  
- **项目共享**：`./CLAUDE.md` 或 `./.claude/CLAUDE.md`（进 Git）
- **模块化规则**：`./.claude/rules/*.md`（进 Git）
- **你个人本地偏好**：`./CLAUDE.local.md`（自动加进 .gitignore，最适合你单人/多账号切换）citeturn1view0  

> 你想“换一个 Claude 账号/换一个聊天窗口也能快速接入”，本质就是把“该记住的”放进这三层。

---

## 2）把“MD 交流目标一致 + 互相纠错”固化成文件（强烈推荐）
你希望像以前一样用 md 对齐目标、互相纠错——最稳的做法是让仓库里固定存在 3 个文件：

### 2.1 `docs/STATE.md`（当前状态：我们在做什么）
内容建议只保留：
- 本周目标（最多 3 条）
- 当前进行到哪个 PR（PR-1/2/3）
- 现在卡点/风险点（最多 5 条）
- Definition of Done（验收标准）

### 2.2 `docs/PR_CHECKLIST.md`（每次提交前自检）
示例：
- [ ] 变更范围符合本 PR（不夹带重构）
- [ ] `pnpm test` / `pnpm run check:data`（按你项目的命令）已通过
- [ ] 生产/preview 页面验证：随机抽 10 所新增院校不卡、不卡白、字段缺失显示“待补充”
- [ ] 更新 BuildInfo（commit/hash/uni count）仍可见

### 2.3 `docs/DECISIONS.md`（决策记录，避免反复拉扯）
只记录“为什么这么做”，每条 2~5 行足够：
- 采用 MVD 三态展示，原因：止血空壳体验；数据补齐可渐进
- CI 致命错误 fail、缺失字段 warning，原因：避免补齐阶段被卡死

> 这三个文件就是你们的“纸面共识”，也是你说的“项目化协作结构”的最小实现。

---

## 3）让 Claude 每次启动都“自动读这些文件”（官方支持 @import）
在 `CLAUDE.md` 里加入 imports（官方语法 `@path`）：citeturn1view0  
```md
# Project Overview
See @README.md for overall project.

# Working Agreements
- Current status: @docs/STATE.md
- Checklist: @docs/PR_CHECKLIST.md
- Decisions: @docs/DECISIONS.md

# Compact Instructions
When context is compacted, preserve: MVD rules, PR boundaries, data-flow invariants, and git workflow.
```
这样你不需要每次口头复述一遍“我们要做什么”，Claude 启动就会自动带上这些上下文。citeturn1view0turn2view0  

---

## 4）如何“续上之前的对话”（你要的第 3 点）
Claude Code 支持会话续接：citeturn2view0  
- 续上上一次会话：
```bash
claude --continue
```
- 或者显式选择并续上：
```bash
claude --resume
```
- 如果你想从同一历史出发开一条新支线（避免一堆消息交织）：
```bash
claude --continue --fork-session
```

> 你最省力的日常动作：进仓库 → `claude --continue`。

---

## 5）如何让 Claude 在本地用 git 推送到 GitHub（你要的第 4 点）
Claude Code 可以运行你能运行的命令，包括 git，并且能看到 git 状态。citeturn2view0  
同时，它有权限模式：默认会询问；你也可以配置允许的命令。citeturn2view0  

### 5.1 你只需要会 5 个命令（其余交给 Claude）
```bash
git status
git diff
git add -A
git commit -m "chore: PR-1 MVD 三态展示（止血空壳）"
git push
```
你可以直接对 Claude 说：
> “请先 `git status` 和 `git diff` 给我看变更摘要；commit message 用 Conventional Commits；再 push 到 origin 当前分支。”

### 5.2 降低误操作：建议让 Claude “先计划后执行”
- 在 Claude Code 里按 `Shift+Tab` 切到 **Plan mode**（只读+出计划），确认计划没问题再执行。citeturn2view0  

### 5.3 进一步省心：把常用安全命令加入允许列表（可选）
官方文档提到可以在 `.claude/settings.json` 允许特定命令，减少每次确认。citeturn2view0  
建议只允许这些无副作用命令：
- `git status`, `git diff`, `pnpm test`, `pnpm run check:data`  
对 `git push` 保留确认（因为是外部副作用）。

---

## 6）“本地开发但上下文一致”的最短日常流程（你按这个做就行）
### 每次开工 60 秒流程
1) `cd` 到仓库根目录  
2) `claude --continue`  
3) 发一句固定开场：
> “先读 CLAUDE.md 和 docs/STATE.md。告诉我：今天的目标、这次 PR 的边界、你准备怎么验证成功。先出 plan，再动手。”

### 每次收工 60 秒流程
让 Claude 做两件事：
1) 更新 `docs/STATE.md`（完成了什么/剩什么）
2) 生成 commit message + 执行 git 提交（push 前让你确认）

---

## 7）给你一份“极简可复制”的 CLAUDE.local.md（只放你个人偏好）
> 这个文件不会进 Git（官方建议，它会自动加入 .gitignore）。citeturn1view0  

```md
# My Local Preferences
- Always work in small PRs (PR-1/2/3). No extra refactors.
- Always update docs/STATE.md after finishing a task.
- Before any git push: show me git diff summary and proposed commit message.
- Prefer minimal terminal commands; explain each command in one line.
```

---

## 8）你现在遇到的 5 个问题，一一对应的“最短解法”
1) **本地开发如何挂文件夹/保持上下文一致？**  
   → 在仓库根目录运行 claude；把长期规则写 CLAUDE.md/rules/CLAUDE.local.md，并用 @import 自动加载 docs。citeturn2view0turn1view0

2) **如何继续用 md 对齐目标、互相纠错？**  
   → 固定 3 个文件：STATE / PR_CHECKLIST / DECISIONS，并写入 CLAUDE.md imports。citeturn1view0

3) **每次开启 Claude 不费力延续对话？**  
   → `claude --continue`；需要分叉就 `--fork-session`。citeturn2view0

4) **Claude 在本地用 git 推到 GitHub？**  
   → 让 Claude 按“status→diff→add→commit→push”执行；push 前让你确认；必要时用 Plan mode。citeturn2view0

5) **我不太会命令行，希望降低难度但保证质量？**  
   → 你只学 5 个 git 命令；其余让 Claude 做；用 PR_CHECKLIST 做质量门槛；用 BuildInfo/测试命令做验证闭环。citeturn1view2turn2view0  

---

## 9）建议你下一步立刻做的 3 件事（不需要你懂命令行）
- [ ] 运行 `claude` → `/init` 生成 CLAUDE.md（第一次）citeturn2view0  
- [ ] 在仓库新建 `docs/STATE.md / docs/PR_CHECKLIST.md / docs/DECISIONS.md`  
- [ ] 把这 3 个文件用 `@docs/...` 写进 CLAUDE.md imports citeturn1view0  

做完这三步，你的“续聊”“对齐目标”“互相纠错”“低门槛推进”就基本成型了。
