# 文档索引

> 钝学推免指南 - 文档中心
> 最后更新: 2026-01-27

---

## 快速导航

| 我想要... | 去哪里 |
|-----------|--------|
| 了解项目状态 | [01-Project/PROJECT_STATUS.md](01-Project/PROJECT_STATUS.md) |
| 查看架构决策 | [01-Project/DECISIONS.md](01-Project/DECISIONS.md) |
| 查看待办事项 | [03-Plans/TODO.md](03-Plans/TODO.md) |
| 理解数据结构 | [02-Data/SCHEMA.md](02-Data/SCHEMA.md) |
| 链接质量规则 | [02-Data/NOTICE_GRADE_RULES.md](02-Data/NOTICE_GRADE_RULES.md) |

---

## 目录结构

```
docs/
├── 00-INDEX.md              # 本文件 - 文档入口
├── 01-Project/              # 项目管理
│   ├── PROJECT_STATUS.md    # 项目状态
│   ├── DECISIONS.md         # 架构决策记录
│   └── DEVELOPMENT_ROADMAP.md # 开发路线图
├── 02-Data/                 # 数据相关
│   ├── SCHEMA.md            # 数据结构定义
│   ├── NOTICE_GRADE_RULES.md # 链接质量分级规则
│   ├── DATA_QUALITY_ISSUES.md # 数据质量问题
│   └── LINK_UPDATE_WORKORDER.md # 链接更新工单
├── 03-Plans/                # 计划与待办
│   ├── TODO.md              # 当前待办
│   ├── REFACTORING_PLAN.md  # 重构计划
│   └── VERCEL_DEPLOYMENT_GUIDE.md # 部署指南
└── 99-Archive/              # 归档文档
    ├── PR3_*.md             # PR3 相关历史文档
    ├── 修正版实施方案-*.md   # 实施方案历史版本
    └── ...                  # 其他历史文档
```

---

## 01-Project: 项目管理

| 文档 | 说明 |
|------|------|
| [PROJECT_STATUS.md](01-Project/PROJECT_STATUS.md) | 项目整体状态、进度追踪 |
| [DECISIONS.md](01-Project/DECISIONS.md) | 重要架构决策及其理由 |
| [DEVELOPMENT_ROADMAP.md](01-Project/DEVELOPMENT_ROADMAP.md) | 开发路线图和里程碑 |

---

## 02-Data: 数据相关

| 文档 | 说明 |
|------|------|
| [SCHEMA.md](02-Data/SCHEMA.md) | universities.json 数据结构定义 (v1.1) |
| [NOTICE_GRADE_RULES.md](02-Data/NOTICE_GRADE_RULES.md) | 链接质量 A/B/C/D 分级规则 |
| [DATA_QUALITY_ISSUES.md](02-Data/DATA_QUALITY_ISSUES.md) | 已知数据质量问题及处理状态 |
| [LINK_UPDATE_WORKORDER.md](02-Data/LINK_UPDATE_WORKORDER.md) | 链接批量更新工单记录 |

---

## 03-Plans: 计划与待办

| 文档 | 说明 |
|------|------|
| [TODO.md](03-Plans/TODO.md) | 当前待办事项清单 |
| [REFACTORING_PLAN.md](03-Plans/REFACTORING_PLAN.md) | 代码重构计划 |
| [VERCEL_DEPLOYMENT_GUIDE.md](03-Plans/VERCEL_DEPLOYMENT_GUIDE.md) | Vercel 部署指南 |

---

## 99-Archive: 归档文档

历史文档存档，通常不需要查阅：

- PR 实施方案历史版本
- 已完成的重构评估报告
- 历史工作流文档
- 中文命名的历史文档

---

## 其他资源

| 位置 | 说明 |
|------|------|
| `tuimian-project-spec/` | Manus 协作规范（保持独立） |
| `reports/` | Excel 填充报告（保持独立） |
| `CLAUDE.md` | Claude Code 工作指南（根目录） |
| `README.md` | 项目自述文件（根目录） |
