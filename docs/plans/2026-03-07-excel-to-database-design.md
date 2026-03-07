# Excel 入库与去中心化审核数据库设计

**日期**: 2026-03-07  
**状态**: 已确认方向  
**作者**: Codex + 用户

---

## 概述

本方案将项目主数据源从静态 `universities.json` 迁移为数据库，并以“院校 / 学院 / 项目”作为前台卡片主对象。

目标不是简单把 Excel 搬进数据库，而是建立一套可持续增长的数据系统：

1. 将 `excel/` 中 4 份 Excel 作为首批基础数据导入数据库
2. 前台以卡片形式展示结构化数据，并支持“强结构 + 标签词条”的混合筛选
3. 用户可以提交新的公告链接
4. 系统复用现有链接提取能力生成结构化草稿
5. 管理员按“新公告”粒度审核，通过后写入正式库
6. 当前 `client/src/data/universities.json` 暂时封存，不再作为主展示数据源

---

## 目标与边界

### 本阶段目标

- 建立 Excel 到数据库的可重复导入路径
- 建立正式库与待审核库的分层
- 建立卡片模型与筛选模型
- 建立“用户补链 -> 自动提取 -> 管理员审核 -> 正式发布”的最小工作流

### 本阶段不做

- 不开放用户直接创建完整卡片
- 不做全自动公告归并，管理员保留最终确认权
- 不要求旧 JSON 与新数据库长期双写
- 不做复杂推荐算法

---

## 数据来源判断

`excel/` 中现有 4 份文件可分为两类：

- 2024/2025 已较完整数据：适合做首批历史基础库
- 2026 持续更新数据：适合做增量导入与审核流验证

从抽样结果看，Excel 实际核心字段较稳定，真实表头通常位于前 2-3 行之后，典型字段包括：

- 学校
- 学院
- 发布时间
- 招生阶段
- 报名开始时间
- 报名结束时间
- 申请要求 / 本科专业要求
- 通知官网链接
- 报名方式
- 成绩排名要求
- 申请材料要求
- 申请表 / 简历 / 个人陈述 / 作品要求

因此，Excel 足以作为首批导入源，但必须经过表头定位、字段归一和标签提取。

---

## 核心对象设计

### 1. 卡片主对象：Program Card

前台一张卡代表一个“院校 / 学院 / 项目”组合，而不是单条公告。

卡片包含：

- 学校名
- 学院名
- 项目名 / 专业方向
- 学位类型
- 所属地区、层级、学科等基础属性
- 若干结构化摘要字段
- 一组正式公告
- 一组标签词条

这样设计的原因：

- 多条公告可以挂在同一张卡下，避免重复卡片
- 卡片维度更适合做筛选、聚合和用户理解
- 用户补充的是“公告链接”，正式展示的是“稳定卡片”

### 2. 审核单元：New Notice

管理员审核对象不是整张卡，而是“新公告”。

流程为：

1. 用户提交链接
2. 系统提取结构化字段生成草稿
3. 管理员审核这条公告
4. 审核通过后，将该公告挂到已有卡片，或创建新卡片

第一版不追求全自动归卡，管理员可以手动确认归属卡片。

---

## 数据分层

### 正式库

前台公域只读取正式库。

内容包括：

- 已审核通过的卡片
- 已审核通过的正式公告
- 已整理好的标签与筛选字段

### 待审核库

待审核库只服务于后台管理。

内容包括：

- 用户提交的原始链接
- 自动提取结果
- 提交人、时间、状态
- 管理员修订记录和审核结论

这样可以保证：

- 公域数据质量稳定
- 用户提交可以开放
- 审核过程可追踪、可回滚

---

## 推荐数据库模型

建议基于 Supabase/Postgres，拆成以下核心表。

### 基础实体

- `institutions`
  - 学校主表
- `departments`
  - 学院主表
- `program_cards`
  - 前台卡片主表

### 正式公告

- `notices`
  - 审核通过后的正式公告
- `notice_sources`
  - 公告来源链接、抓取来源、原始文本摘要

### 标签与筛选

- `tags`
  - 标签定义表
- `program_card_tags`
  - 卡片与标签的关联表

### 提交与审核

- `submission_queue`
  - 用户提交 + 自动提取草稿
- `admin_reviews`
  - 审核日志表

### 可选扩展

- `filter_facets_cache`
  - 可选，用于缓存筛选项统计
- `card_aliases`
  - 可选，用于卡片去重与别名归并

---

## 建议字段层次

### institutions

- `id`
- `name`
- `normalized_name`
- `province`
- `city`
- `is_985`
- `is_211`
- `double_first_class`
- `discipline_grade`
- `created_at`
- `updated_at`

### departments

- `id`
- `institution_id`
- `name`
- `normalized_name`
- `created_at`
- `updated_at`

### program_cards

- `id`
- `institution_id`
- `department_id`
- `program_name`
- `normalized_program_name`
- `specialty_summary`
- `degree_type`
- `year`
- `primary_stage`
- `card_status` (`published`, `archived`)
- `latest_notice_id`
- `created_at`
- `updated_at`

### notices

- `id`
- `program_card_id`
- `title`
- `notice_url`
- `published_at_raw`
- `published_at`
- `stage`
- `application_start_raw`
- `application_end_raw`
- `application_start`
- `application_end`
- `requirement_text`
- `ranking_requirement_text`
- `english_requirement_text`
- `materials_text`
- `application_method`
- `source_channel`
- `source_type`
- `review_status`
- `created_at`
- `updated_at`

### submission_queue

- `id`
- `submitted_by`
- `submitted_url`
- `submission_note`
- `extract_status`
- `review_status`
- `raw_content`
- `extracted_payload`
- `matched_program_card_id`
- `reviewer_id`
- `reviewed_at`
- `created_at`
- `updated_at`

---

## 筛选模型

首页采用“强结构 + 词条标签”的混合模式。

### 强结构筛选

第一层直接给高价值、稳定字段：

- 年份
- 招生阶段
- 学校层级
- 地区
- 学位类型

### 词条标签筛选

第二层用于细筛与探索：

- 跨专业
- 英语要求
- 排名要求
- 报名方式
- 是否需要申请表
- 是否需要论文 / 作品
- 是否系统报名
- 是否公开说明材料要求

### 实现原则

- 结构字段优先落数据库列
- 不稳定、可扩展字段优先落标签
- 原始长文本始终保留，避免过早过度结构化

---

## Excel 导入策略

### 总体思路

建立一次性脚本 + 可重复增量脚本，而不是手工导表。

导入流程：

1. 读取 Excel
2. 定位真实表头
3. 将不同 Excel 的列名映射到统一字段
4. 归一化学校 / 学院 / 项目名
5. 提取结构字段
6. 写入 staging 结果
7. 批量导入数据库

### 关键挑战

- 不同 Excel 表头位置不同
- 相同概念字段命名不完全一致
- 原始文本存在大量“未提及”“空值”“换行多段”
- 学校 / 学院 / 项目去重需要规则

### 推荐做法

- 先构建标准化 CSV / JSON 中间层
- 再从中间层导入数据库

这样更利于调试，也能保留导入快照。

---

## 旧数据封存策略

当前 `client/src/data/universities.json` 暂不删除，只做封存。

策略：

- 前台主数据读取切换到数据库后，不再默认展示旧 JSON
- 旧 JSON 保留为迁移参考和历史备份
- 如需回滚，可保留只读 fallback 能力，但不作为主路径继续维护

---

## 用户补链与审核流

### 提交流程

1. 用户输入公告链接
2. 系统抓取页面内容
3. 调用现有结构化提取能力生成草稿
4. 草稿写入 `submission_queue`
5. 管理员在后台审核

### 审核动作

管理员可以：

- 确认这是一条有效公告
- 修正提取字段
- 选择挂到已有卡片
- 或创建新卡片
- 审核通过后写入正式 `notices`
- 驳回无效或重复链接

### 状态机建议

- `pending_extract`
- `extract_failed`
- `pending_review`
- `approved`
- `rejected`
- `merged`

---

## MVP 路径

建议分四步做最小可用版本。

### Phase 1: 数据底座

- 设计数据库 schema
- 跑通 Excel 到 staging
- 导入首批数据库

### Phase 2: 前台切库

- 前台卡片列表读取数据库
- 实现基础结构筛选
- 旧 JSON 不再展示

### Phase 3: 审核后台

- 新公告待审核列表
- 审核通过 / 驳回
- 人工归卡

### Phase 4: 公域开放提交

- 用户提交链接入口
- 自动提取
- 审核入库

---

## 风险与应对

### 1. Excel 脏数据导致导入不稳

应对：

- 使用 staging 中间层
- 保留导入报告
- 首先覆盖最常见字段，不追求一次全结构化

### 2. 卡片去重复杂

应对：

- 第一版允许管理员人工确认归卡
- 后续再补自动归并规则

### 3. 用户提交通道带来垃圾链接

应对：

- 提交只入待审核区
- 正式库只接收审核通过数据

### 4. 现有前端依赖静态 JSON

应对：

- 先抽象数据访问层
- 再替换页面数据源

---

## 推荐结论

本项目适合从“静态数据展示站”升级为“数据库驱动的可增长信息系统”。

推荐采用：

- Supabase/Postgres 作为主数据层
- “院校 / 学院 / 项目”作为卡片主对象
- “新公告”作为审核单元
- “强结构 + 标签词条”作为筛选模型
- “用户补链 -> 自动提取 -> 管理员审核 -> 正式发布”作为数据增长路径

这是当前项目最稳、最可执行、也最能支撑长期数据开放的方案。
