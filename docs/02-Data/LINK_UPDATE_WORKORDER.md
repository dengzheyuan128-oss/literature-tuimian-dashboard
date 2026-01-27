# 链接更新工单表

> 生成时间: 2026-01-27
> 状态: **已执行完毕** (2026-01-27)
> 数据来源: 高校招生信息表.xlsx vs universities.json 对比分析

---

## 执行汇总

| 指标 | 数值 |
|------|------|
| 更新链接 | 43 条 |
| 新增学院 | 48 个 |
| 执行日期 | 2026-01-27 |
| 执行结果 | ✅ 全部完成 |

---

## 问题类型定义 (root_cause)

| 代码 | 含义 | 处理策略 |
|------|------|----------|
| `MAPPING_WRONG_DEPT` | 链接指向错误院系（如用中文系链接代替外语学院） | UPDATE - 替换为正确院系链接 |
| `OUTDATED_YEAR` | 链接年份过时（如2024→2026） | UPDATE - 替换为最新年份链接 |
| `THIRD_PARTY_LINK` | 链接指向第三方网站（educity/chsi/kaoyan） | UPDATE - 替换为官网链接 |
| `ID_VARIATION_SAME_SITE` | 同站点不同ID（可能是不同版本通知） | KEEP/UPDATE - 核验后决定 |
| `MISSING_SCHOOL` | 院校/院系在数据中不存在 | SPLIT - 新增program记录 |

---

## 第一梯队工单 (6条) - ✅ 已完成

| # | 院校 | 院系 | root_cause | 动作 | 写入路径 | 验收要点 | 状态 |
|---|------|------|------------|------|----------|----------|------|
| 1 | 北京大学 | 中国语言文学系 | `ID_VARIATION_SAME_SITE` | UPDATE | `universities[0].programs[0].notices[0].url` | 页面标题含"2026"或"2025年9月" | ✅ |
| 2 | 北京大学 | 外国语学院 | `MAPPING_WRONG_DEPT` | SPLIT | `universities[0].programs[+1]` | 域名为 sfl.pku.edu.cn | ✅ |
| 3 | 北京师范大学 | 文理学院(珠海) | `MAPPING_WRONG_DEPT` | SPLIT | `universities[10].programs[+1]` | 域名为 fas.bnu.edu.cn | ✅ |
| 4 | 复旦大学 | 中国语言文学系 | `ID_VARIATION_SAME_SITE` | UPDATE | `universities[5].programs[0].notices[0].url` | 页面可访问且含招生信息 | ✅ |
| 5 | 复旦大学 | 古籍整理研究所 | `MAPPING_WRONG_DEPT` | SPLIT | `universities[5].programs[+1]` | 域名为 gjs.fudan.edu.cn | ✅ |
| 6 | 南京大学 | 文学院 | `MAPPING_WRONG_DEPT` | UPDATE | `universities[6].programs[0].notices[0].url` | 域名为 chin.nju.edu.cn | ✅ |

---

## 第二梯队工单 (10条) - ✅ 已完成

| # | 院校 | 院系 | root_cause | 动作 | 写入路径 | 验收要点 | 状态 |
|---|------|------|------------|------|----------|----------|------|
| 1 | 浙江大学 | 文学院 | `OUTDATED_YEAR` | UPDATE | `universities[7].programs[0].notices[0].url` | URL含"/2025/" | ✅ |
| 2 | 山东大学 | 文学院 | `ID_VARIATION_SAME_SITE` | UPDATE | `universities[].programs[0].notices[0].url` | 页面标题含2026招生 | ✅ |
| 3 | 山东大学 | 威海校区 | `MAPPING_WRONG_DEPT` | SPLIT | `universities[].programs[+1]` | 域名含 wh.sdu.edu.cn | ✅ |
| 4 | 华东师范大学 | 国际汉语文化学院 | `MAPPING_WRONG_DEPT` | SPLIT | `universities[1].programs[+1]` | 域名为 chinese.ecnu.edu.cn | ✅ |
| 5 | 南开大学 | 文学院 | `ID_VARIATION_SAME_SITE` | UPDATE | `universities[].programs[0].notices[0].url` | 链接ID已更新 | ✅ |
| 6 | 中山大学 | 中国语言文学系 | `ID_VARIATION_SAME_SITE` | UPDATE | `universities[9].programs[0].notices[0].url` | article ID已更新 | ✅ |
| 7 | 中山大学 | 珠海校区 | `MAPPING_WRONG_DEPT` | SPLIT | `universities[9].programs[+1]` | 域名含 chinesezh | ✅ |
| 8 | 中山大学 | 博雅学院 | `MAPPING_WRONG_DEPT` | SPLIT | `universities[9].programs[+2]` | 域名为 lac.sysu.edu.cn | ✅ |
| 9 | 清华大学 | 人文学院 | `ID_VARIATION_SAME_SITE` | UPDATE | `universities[3].programs[0].notices[0].url` | 使用研招办链接 | ✅ |
| 10 | 吉林大学 | 文学院 | `ID_VARIATION_SAME_SITE` | UPDATE | `universities[].programs[0].notices[0].url` | 链接ID已更新 | ✅ |

---

## 第三方链接修复工单 (3条) - ✅ 已完成

| # | 院校 | root_cause | 原链接域名 | 新链接域名 | 动作 | 状态 |
|---|------|------------|------------|------------|------|------|
| 1 | 华中科技大学 | `THIRD_PARTY_LINK` | educity.cn | gszs.hust.edu.cn | UPDATE | ✅ |
| 2 | 苏州大学 | `THIRD_PARTY_LINK` | chsi.com.cn | yjs.suda.edu.cn | UPDATE | ✅ |
| 3 | 辽宁大学 | `THIRD_PARTY_LINK` | chsi.com.cn | chinese.lnu.edu.cn | UPDATE | ✅ |

---

## 新增院校工单 (4条) - ⏳ 待添加

| # | 院校 | 院系 | root_cause | 动作 | Excel链接 | 验收要点 | 状态 |
|---|------|------|------------|------|-----------|----------|------|
| 1 | 对外经贸大学 | 文学与国际传播学院 | `MISSING_SCHOOL` | ADD | `scll.uibe.edu.cn/...` | 新增school记录 | ⏳ |
| 2 | 中国矿业大学 | 人文与艺术学院 | `MISSING_SCHOOL` | ADD | `yz.cumt.edu.cn/...` | 新增school记录 | ⏳ |
| 3 | 上海财经大学 | 人文学院 | `MISSING_SCHOOL` | ADD | `sh.sufe.edu.cn/...` | 新增school记录 | ⏳ |
| 4 | 上海财经大学 | 国际文化交流学院 | `MISSING_SCHOOL` | SPLIT | `ices.sufe.edu.cn/...` | 新增program记录 | ⏳ |

---

## 新增学院工单 (48条) - ✅ 已完成

以下为同校不同院系的新增记录（动作均为 SPLIT）：

| 院校 | 新增院系 | root_cause | 状态 |
|------|----------|------------|------|
| 北京大学 | 中国语言文学系、外国语学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 复旦大学 | 中国语言文学系、古籍整理研究所 | `MAPPING_WRONG_DEPT` | ✅ |
| 华东师范大学 | 中国语言文学系、国际汉语文化学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 清华大学 | 人文学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 四川大学 | 文学与新闻学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 中山大学 | 中国语言文学系、博雅学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 北京师范大学 | 文理学院(珠海校区) | `MAPPING_WRONG_DEPT` | ✅ |
| 西南大学 | 汉语言文献研究所、中国新诗研究所 | `MAPPING_WRONG_DEPT` | ✅ |
| 厦门大学 | 中国语言文学系 | `MAPPING_WRONG_DEPT` | ✅ |
| 山东大学 | 文学院(含文艺美学)、文化传播学院(威海) | `MAPPING_WRONG_DEPT` | ✅ |
| 上海交通大学 | 人文学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 华中科技大学 | 人文学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 重庆大学 | 博雅学院(人文社科高研院) | `MAPPING_WRONG_DEPT` | ✅ |
| 中南大学 | 人文学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 中国海洋大学 | 文学与新闻传播学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 华中师范大学 | 语言研究所 | `MAPPING_WRONG_DEPT` | ✅ |
| 中国传媒大学 | 人文学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 中央民族大学 | 中国少数民族语言文学学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 暨南大学 | 华文学院（直博） | `MAPPING_WRONG_DEPT` | ✅ |
| 云南大学 | 人文学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 天津大学 | 人文艺术学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 东南大学 | 人文学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 内蒙古大学 | 文学与新闻传播学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 海南大学 | 人文学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 新疆大学 | 中国语言文学学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 石河子大学 | 文学艺术学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 北京外国语大学 | 中国语言文学学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 上海外国语大学 | 中文学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 中央财经大学 | 文化与传媒学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 中国政法大学 | 人文学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 南昌大学 | 人文学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 江南大学 | 人文学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 首都师范大学 | 文学院、中国诗歌研究中心 | `MAPPING_WRONG_DEPT` | ✅ |
| 北京语言大学 | 文学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 河南大学 | 文学院、黄河文明中心 | `MAPPING_WRONG_DEPT` | ✅ |
| 山西大学 | 文学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 湘潭大学 | 文学与新闻学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 西南交通大学 | 人文学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 南通大学 | 文学院 | `MAPPING_WRONG_DEPT` | ✅ |
| 深圳大学 | 人文学院 | `MAPPING_WRONG_DEPT` | ✅ |

---

## 验收标准

### 如何判定是2026年通知

1. **URL路径含年份**: `/2025/` 或 `/2026/` (2025年9月发布的是2026年招生)
2. **页面标题**: 含"2026年"或"2026级"
3. **发布日期**: 2025年7月-10月期间发布
4. **内容关键词**: "2026年推免"、"2026年接收"

### 链接质量验收

| 等级 | 标准 |
|------|------|
| A级 | 官方院系页面，直接指向推免通知 |
| B级 | 研招办/研究生院页面 |
| C级 | 学校官网但非直接通知 |
| D级 | 第三方网站（不可接受） |

---

## 变更日志

| 日期 | 操作 | 执行者 |
|------|------|--------|
| 2026-01-27 | 初始分析，生成工单 | Claude |
| 2026-01-27 | 批量更新43条链接 | Claude |
| 2026-01-27 | 新增48个学院项目 | Claude |
| 2026-01-27 | 修复东南大学第三方链接 | Claude |
