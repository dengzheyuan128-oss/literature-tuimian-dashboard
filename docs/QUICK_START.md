# ⚡ 快速上手指南

> **用途**: Claude启动时必读，5分钟快速恢复项目上下文
> **更新频率**: 项目状态变化时更新
> **阅读时间**: 2-3分钟

---

## 🎯 项目核心信息（5秒速览）

| 项目 | 信息 |
|------|------|
| **名称** | 钝学推免指南 (Literature Graduate Recommendation Dashboard) |
| **定位** | 中国文学专业推免信息聚合平台（62所985/211高校） |
| **当前版本** | v1.0 (Schema v1.1) |
| **目标版本** | v1.1.0 (质量达标版) |
| **项目目标** | 长期可信、低维护成本 |
| **技术栈** | React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + shadcn/ui |
| **包管理器** | pnpm（必须，不能用npm） |
| **数据源** | `client/src/data/universities.json` (Schema v1.1) |

---

## 📊 当前状态（30秒速览）

### 项目阶段
- **当前阶段**: PR-3 链接质量提升（进行中）
- **整体进度**: 60% (3/5 PR完成)
- **最后更新**: 2026-01-16

### PR执行顺序
- ✅ PR-0: Schema锁定和统一（已完成，1.5h）
- ✅ PR-1: 补齐年度与来源元数据（已完成）
- ✅ PR-2: 实现最小多通知结构（已完成，2.5h）
- ⏳ **PR-3: 链接分级与修复（进行中）** ← 当前重点
- ⏳ PR-4: 验证和文档更新（待开始）

### 质量目标（PR-3停损线）

| 指标 | 当前值 | 目标值 | 状态 |
|------|--------|--------|------|
| **D级链接** | 2所 | 0所 | ❌ 待修复 |
| **整体健康度** | 88.7% | ≥90% | ❌ 待提升 |
| **第一梯队A级占比** | 0% | 100% | ❌ 待提升 |

**达标后立即停止**，不得"顺手多修几所"。

---

## ⛔ 当前阶段禁止的操作（关键约束）

### 数据层面
- ❌ 全量B→A转换（40所院校）
- ❌ 新增任何program或notice
- ❌ 补充往年通知
- ❌ 添加导师信息、历年录取数据

### 技术层面
- ❌ 自动爬虫开发
- ❌ 数据库迁移（PostgreSQL/MySQL）
- ❌ API开发
- ❌ CI/CD配置

### 功能层面
- ❌ 数据可视化（图表、雷达图）
- ❌ UI大规模改版
- ❌ 匹配算法复杂化

### 流程约束
- ❌ 超过3个文件/300行代码的改动未经用户确认

---

## ✅ 当前阶段允许的操作（PR-3范围）

### 数据修复
- ✅ 修复2所D级链接（武汉大学、厦门大学）
- ✅ 修复6所第一梯队院校至A级（若能找到2026年通知）
- ✅ 为所有notice添加yearStatus字段

### 文档&规则
- ✅ 创建/更新NOTICE_GRADE_RULES.md
- ✅ 更新check-data-quality.js实现Year检测
- ✅ 更新README.md和SCHEMA.md
- ✅ 更新TODO.md进度

---

## 🗺️ 关键路径（快速导航）

### 数据文件路径
```
主数据: client/src/data/universities.json
备份: client/src/data/universities.v1.backup.json
Schema: docs/02-Data/SCHEMA.md
```

### 校验脚本
```bash
pnpm check:data              # 数据质量检查（提交前必须运行）
pnpm dev                     # 开发服务器
pnpm check                   # TypeScript类型检查
```

### 必读文档清单（按优先级）

| 优先级 | 文件 | 用途 | 阅读时间 |
|--------|------|------|---------|
| **P0** | `docs/SESSION_CONTEXT.md` | 上次做了什么、下次做什么 | 1分钟 |
| **P0** | `docs/METRICS_DASHBOARD.md` | 关键指标看板 | 30秒 |
| **P1** | `docs/01-Project/PROJECT_STATUS.md` | 项目当前状态 | 3分钟 |
| **P1** | `docs/01-Project/DECISIONS.md` | 不可回滚的决策 | 5分钟 |
| **P1** | `docs/03-Plans/TODO.md` | 任务清单 | 3分钟 |
| **P2** | `CLAUDE.md` | Claude开发指南 | 10分钟 |
| **P2** | `docs/02-Data/NOTICE_GRADE_RULES.md` | 链接质量分级规则 | 3分钟 |
| **P3** | `docs/BLOCKERS.md` | 当前阻塞问题 | 按需 |

### 不要加载的文档
- ❌ `docs/99-Archive/` 下的所有历史文档（除非用户明确要求）
- ❌ 中文命名的长篇报告（如项目分析报告.md）

---

## 🔑 关键决策（D-001 至 D-008）

> 详细内容见 `docs/01-Project/DECISIONS.md`

| ID | 决策 | 状态 |
|----|------|------|
| **D-001** | 三层嵌套结构（School/Program/Notice） | ✅ 已实施 |
| **D-002** | A/B/C/D链接质量分级 | ✅ 已实施 |
| **D-003** | Year保护机制（yearStatus字段） | ✅ 已实施 |
| **D-004** | 停损线原则（达标即停） | ✅ 严格执行 |
| **D-005** | v1.1阶段不引入自动爬虫 | ✅ 确认 |
| **D-006** | B级在非头部学校可接受 | ✅ 确认 |
| **D-007** | 项目目标：长期可信、低维护 | ✅ 长期坚持 |
| **D-008** | 先写计划→审核→再执行 | ✅ 严格执行 |

---

## 📐 数据结构速览

### Schema版本
- **v1** (扁平): `University[]` 单层数组
- **v1.1** (嵌套): `School → Program[] → Notice[]` 三层结构

### dataLoader.ts自动兼容
- 自动检测v1/v1.1
- 自动将v1.1展平为v1格式供前端使用
- 确保向后兼容

### 五梯队分类（基于教育部第四轮学科评估）
1. **第一梯队** (6所) - A+院校（北大、北师等）
2. **第二梯队** (8所) - A/A-强势研究型
3. **第三梯队** (11所) - B+扎实学术型
4. **第四梯队** (18所) - 学校优势型
5. **第五梯队** (19所) - 声誉导向型（理工科985）

### 链接质量分级（A/B/C/D）
- **A级**: 官方推免通知页（含"推免"关键词）
- **B级**: 研究生院通知列表页
- **C级**: 学院/研究生院首页
- **D级**: 第三方平台/失效链接（必须清零）

---

## 🚀 标准会话启动流程

### 第1步：加载核心上下文（1分钟）
```
1. 读取 docs/SESSION_CONTEXT.md      # 了解上次做了什么
2. 读取 docs/METRICS_DASHBOARD.md    # 查看当前指标
3. 读取 docs/BLOCKERS.md             # 检查是否有阻塞问题
```

### 第2步：确认当前任务（30秒）
```
根据SESSION_CONTEXT.md的"下次行动"部分，确认本次会话要做什么
```

### 第3步：执行工作（主要时间）
```
按照TODO.md中的任务清单执行
遇到问题及时更新BLOCKERS.md
```

### 第4步：会话结束前更新（2分钟）
```
1. 更新 SESSION_CONTEXT.md（记录本次做了什么、下次做什么）
2. 更新 METRICS_DASHBOARD.md（如果完成了PR或修复了数据）
3. 更新 BLOCKERS.md（如果遇到新问题）
```

---

## 🛠️ 常用命令速查

### 开发命令
```bash
cd "C:\Users\86191\Documents\GitHub\literature-tuimian-dashboard"
pnpm install              # 安装依赖（必须用pnpm）
pnpm dev                  # 启动开发服务器（端口3000）
pnpm check               # TypeScript类型检查
pnpm build               # 生产构建
pnpm check:data          # 数据质量检查（提交前必须）
```

### Git操作
```bash
git status               # 查看状态
git add <files>          # 暂存文件
git commit -m "message"  # 提交
git push origin main     # 推送到远程
```

### 数据验证
```bash
node scripts/check-data-quality.cjs       # 主要验证脚本
node scripts/grade-link-quality.js        # 链接质量评分
```

---

## 📞 问题排查速查

### 问题1: 数据检查失败
```bash
# 运行详细检查
node scripts/check-data-quality.cjs

# 查看错误输出，通常是：
# - 缺少必填字段
# - URL格式错误
# - tier值不在允许范围
# - linkGrade不是A/B/C/D
```

### 问题2: TypeScript报错
```bash
# 运行类型检查
pnpm check

# 常见问题：
# - 导入路径错误（使用@/而非相对路径）
# - 类型定义不匹配（检查types/university.ts）
```

### 问题3: 前端渲染问题
```bash
# 检查dataLoader.ts是否正确加载数据
# 检查Home.tsx中的数据过滤逻辑
# 检查浏览器控制台错误
```

---

## 📝 会话记录模板

每次会话结束时，更新 `docs/SESSION_CONTEXT.md`:

```markdown
## 最近会话

### 会话 #X (YYYY-MM-DD)
**做了什么**:
- 完成了XX任务
- 修复了XX问题

**遇到的问题**:
- 问题描述

**下次应该做什么**:
1. 继续XX任务
2. 解决XX问题
```

---

## 🎓 核心原则（时刻牢记）

1. **停损线原则**: 达标即停，不追求完美
2. **先计划后执行**: 超过3文件/300行必须先写计划
3. **数据质量优先**: 提交前必须运行 `pnpm check:data`
4. **向后兼容**: v1.1必须自动展平为v1
5. **聚焦头部院校**: 第一梯队质量是核心价值
6. **长期可信**: 宁可保守，不可失信

---

**维护者**: Claude Code + 用户
**最后更新**: 2026-02-06
**版本**: v1.0
