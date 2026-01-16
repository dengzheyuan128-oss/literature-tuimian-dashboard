# 院校名录模块渐进式重构计划（综合最优方案）

**项目名称**: 钝学推免指南 - 院校名录模块  
**制定者**: Manus AI  
**制定日期**: 2025年1月16日  
**方案版本**: v1.0（综合团队反馈 + GPT建议）  
**执行模式**: 渐进式重构（4个独立PR）

---

## 一、方案综述

### 1.1 核心决策

经过对**团队技术诊断**和**GPT渐进式方案**的深入分析，我们采用以下综合方案:

**✅ 采用渐进式重构（方案B）**
- 避免一次性全面重构的高风险
- 每个PR独立可验证、可回滚
- 适合单人团队+Manus协作模式

**✅ 前移最小正确抽象（PR-2优先级提升）**
- 在完整三层模型之前，先实现"一校多通知"结构
- 避免后续返工和数据污染
- 为未来扩展打下基础

**✅ Schema锁定优先（PR-0必须最先完成）**
- 终结当前Schema漂移问题
- 统一文档、脚本、数据三者口径
- 建立唯一真源结构

---

### 1.2 问题诊断总结

#### 核心问题1：数据结构失真
**现状**: 一校一条记录，无法承载真实推免信息  
**影响**: 同一学校的多个项目、多个通知、多个批次无法准确表达  
**解决**: PR-2实现programs和notices嵌套结构

#### 核心问题2：Schema漂移
**现状**: 数据使用`specialty/degreeType/url`，文档和脚本使用`majors/types/noticeUrl`  
**影响**: 质量检查误判、文档误导、开发方向错误  
**解决**: PR-0锁定Schema v1，统一所有口径

#### 核心问题3：数据健康度口径混乱
**现状**: 路线图显示88.7%，质量清单显示45.2%  
**影响**: 数据可信度崩塌，用户信任流失  
**解决**: PR-3统一A/B/C/D分级标准

#### 核心问题4：链接质量标准模糊
**现状**: 大量学院首页、研究生院首页、第三方平台链接  
**影响**: "看起来很全，但点进去经常没用"  
**解决**: PR-3强制链接分级和修复

---

## 二、执行路径（4个独立PR）

### PR-0: Schema锁定和统一（P0.1 - 必须最先完成）

**目标**: 终结Schema漂移，让README/脚本/数据三者一致

**执行时间**: 1-2小时

**具体动作**:

1. **在数据中显式声明Schema版本**
```json
{
  "schemaVersion": "v1",
  "lastUpdated": "2025-01-16",
  "universities": [...]
}
```

2. **明确v1使用当前实际字段**
   - `id`: 院校唯一标识
   - `name`: 院校名称
   - `tier`: 梯队分类
   - `location`: 所在地区
   - `is985`: 是否985
   - `is211`: 是否211
   - `disciplineRating`: 学科评估等级
   - `specialty`: 专业方向（数组）
   - `degreeType`: 学位类型（数组）
   - `url`: 推免通知链接
   - `applicationPeriod`: 申请时间段
   - `deadline`: 截止日期
   - `englishRequirement`: 英语要求
   - `examForm`: 考核形式

3. **同步更新文档和脚本**
   - 更新`README.md`中的字段说明和示例
   - 更新`check-data-quality.js`中的字段校验规则
   - 删除所有对`majors/types/noticeUrl`的引用

4. **验证标准**
   - ✅ 数据文件包含`schemaVersion: "v1"`
   - ✅ README示例使用正确字段
   - ✅ 检查脚本不报错
   - ✅ 所有文档口径一致

---

### PR-1: 补齐年度与来源元数据（P0.2）

**目标**: 解决"年份不清/口径混乱/链接可信度不明"的核心问题

**执行时间**: 2-3小时

**新增字段**:

| 字段 | 类型 | 含义 | 示例 | 必填 |
|------|------|------|------|------|
| `year` | number | 推免年份 | `2026` | ✅ |
| `sourceType` | string | 来源类型 | `official` / `list_page` / `homepage` / `third_party` | ✅ |
| `publisher` | string | 发布单位 | `研究生院` / `文学院` / `中文系` | ✅ |
| `lastVerifiedAt` | string | 最后核验时间 | `2025-01-16` | ✅ |

**sourceType分级标准**:

| sourceType | 等级 | 说明 | 示例 |
|------------|------|------|------|
| `official` | A | 官网具体推免通知页面 | `https://grs.pku.edu.cn/...2025推免通知.htm` |
| `list_page` | B | 官网通知列表页 | `https://grs.pku.edu.cn/tzgg/index.htm` |
| `homepage` | C | 学院/研究生院首页 | `https://chinese.pku.edu.cn/` |
| `third_party` | D | 第三方聚合/镜像平台 | `http://www.lianpp.com/...` |

**数据示例**（v1结构，仍在school层）:

```json
{
  "schemaVersion": "v1",
  "universities": [
    {
      "id": "pku",
      "name": "北京大学",
      "tier": "第一梯队",
      "location": "北京",
      "is985": true,
      "is211": true,
      "disciplineRating": "A+",
      "specialty": ["汉语言文学", "古代文学", "现当代文学"],
      "degreeType": ["学硕", "专硕", "直博"],
      "year": 2026,
      "url": "https://grs.pku.edu.cn/xxgk/tzgg/1234567.htm",
      "sourceType": "official",
      "publisher": "研究生院",
      "applicationPeriod": "2025-09-20 ~ 2025-10-05",
      "deadline": "2025-10-05",
      "englishRequirement": "六级 ≥ 425",
      "examForm": "面试",
      "lastVerifiedAt": "2025-01-16"
    }
  ]
}
```

**执行步骤**:

1. 为所有62所院校添加4个新字段
2. 根据现有URL判断sourceType（可先手动分类，后续自动化）
3. 统一设置year为2026（当前推免季）
4. 设置lastVerifiedAt为当前日期
5. 更新检查脚本，验证新字段

**验证标准**:
- ✅ 所有院校都有year、sourceType、publisher、lastVerifiedAt
- ✅ sourceType只能是4个合法值之一
- ✅ year格式为4位数字
- ✅ lastVerifiedAt格式为YYYY-MM-DD

---

### PR-2: 实现最小多通知结构（P0.5 - 优先级前移）

**目标**: 让"一校多项目/多通知"在结构上成立，避免后续返工

**执行时间**: 3-4小时

**设计原则**:
- ✅ 不引入数据库
- ✅ 不推翻前端逻辑（保持向后兼容）
- ✅ 仅做最小结构升级

**Schema v1.1（过渡结构）**:

```json
{
  "schemaVersion": "v1.1",
  "lastUpdated": "2025-01-16",
  "universities": [
    {
      "schoolId": "pku",
      "name": "北京大学",
      "tier": "第一梯队",
      "location": "北京",
      "is985": true,
      "is211": true,
      "disciplineRating": "A+",
      "website": "https://www.pku.edu.cn",
      "programs": [
        {
          "programId": "pku-chn-master",
          "degreeType": "学硕",
          "specialty": ["汉语言文学", "古代文学", "现当代文学"],
          "department": "中国语言文学系",
          "directionTags": ["古代文学", "现当代文学", "文艺学", "语言学"],
          "notices": [
            {
              "noticeId": "pku-chn-2026",
              "year": 2026,
              "url": "https://grs.pku.edu.cn/xxgk/tzgg/1234567.htm",
              "publisher": "研究生院",
              "sourceType": "official",
              "applicationPeriod": "2025-09-20 ~ 2025-10-05",
              "deadline": "2025-10-05",
              "englishRequirement": "六级 ≥ 425",
              "examForm": "面试",
              "requirements_raw": "1. 本科GPA 3.5以上；2. 英语六级425分以上；3. 有科研成果优先",
              "lastVerifiedAt": "2025-01-16"
            }
          ]
        },
        {
          "programId": "pku-chn-phd",
          "degreeType": "直博",
          "specialty": ["汉语言文学"],
          "department": "中国语言文学系",
          "directionTags": ["古代文学", "现当代文学"],
          "notices": [
            {
              "noticeId": "pku-chn-phd-2026",
              "year": 2026,
              "url": "https://grs.pku.edu.cn/xxgk/tzgg/1234568.htm",
              "publisher": "研究生院",
              "sourceType": "official",
              "applicationPeriod": "2025-09-20 ~ 2025-10-05",
              "deadline": "2025-10-05",
              "englishRequirement": "六级 ≥ 500",
              "examForm": "笔试+面试",
              "requirements_raw": "1. 本科GPA 3.7以上；2. 英语六级500分以上；3. 有高水平科研成果",
              "lastVerifiedAt": "2025-01-16"
            }
          ]
        }
      ]
    }
  ]
}
```

**数据结构说明**:

```
University (学校层 - 稳定信息)
├── schoolId: 学校唯一标识
├── name: 学校名称
├── tier: 梯队分类
├── location: 所在地区
├── is985/is211: 院校层级
├── disciplineRating: 学科评估等级
├── website: 学校官网
└── programs[] (项目层 - 中频变化)
    ├── programId: 项目唯一标识
    ├── degreeType: 学位类型（学硕/专硕/直博）
    ├── specialty[]: 专业方向
    ├── department: 所属学院
    ├── directionTags[]: 研究方向标签
    └── notices[] (通知层 - 高频变化)
        ├── noticeId: 通知唯一标识
        ├── year: 推免年份
        ├── url: 通知链接
        ├── publisher: 发布单位
        ├── sourceType: 来源类型
        ├── applicationPeriod: 申请时间段
        ├── deadline: 截止日期
        ├── englishRequirement: 英语要求
        ├── examForm: 考核形式
        ├── requirements_raw: 原文要点（证据）
        └── lastVerifiedAt: 最后核验时间
```

**迁移规则**（自动化脚本）:

1. 原`id` → `schoolId`
2. 原`url/deadline/applicationPeriod/englishRequirement/examForm` → 默认program下的第一个notice
3. 原`degreeType/specialty` → program层
4. 原`year/sourceType/publisher/lastVerifiedAt` → notice层
5. 为每个学校创建默认program（如果只有一个学位类型）
6. 为每个program创建默认notice（2026年）

**前端兼容性处理**:

```typescript
// 提供向后兼容的数据访问函数
function getUniversityNoticeUrl(university: University): string {
  // 优先返回第一个program的第一个notice的url
  return university.programs[0]?.notices[0]?.url || '';
}

function getUniversityDeadline(university: University): string {
  return university.programs[0]?.notices[0]?.deadline || '';
}

// 前端组件可以继续使用原有逻辑，通过辅助函数访问数据
```

**执行步骤**:

1. 编写自动迁移脚本`scripts/migrate-to-v1.1.js`
2. 运行迁移脚本，生成新结构数据
3. 手动检查10-15所院校的迁移结果
4. 更新前端代码，添加兼容性辅助函数
5. 更新检查脚本，支持新结构验证
6. 更新README文档

**验证标准**:
- ✅ 所有院校都有programs数组
- ✅ 每个program都有至少一个notice
- ✅ notice包含所有必需字段
- ✅ 前端页面显示正常
- ✅ 匹配功能正常工作

---

### PR-3: 链接分级与修复（P0.3）

**目标**: 统一链接质量标准，修复所有C级和D级链接

**执行时间**: 8-12小时（根据需要修复的数量）

**链接分级规则**（已在PR-1定义）:

| sourceType | 等级 | 健康度统计 | 修复优先级 |
|------------|------|-----------|-----------|
| `official` | A | ✅ 计入 | - |
| `list_page` | B | ✅ 计入 | 低 |
| `homepage` | C | ❌ 不计入 | 高 |
| `third_party` | D | ❌ 不计入 | 最高 |

**自动识别规则**:

```javascript
function detectSourceType(url) {
  // D级：第三方平台
  const thirdPartyDomains = ['lianpp.com', 'kaoyan.com', 'yz.chsi.com.cn'];
  if (thirdPartyDomains.some(domain => url.includes(domain))) {
    return 'third_party';
  }
  
  // C级：学院/研究生院首页
  if (url.endsWith('/') || url.endsWith('/index.htm') || url.endsWith('/index.html')) {
    return 'homepage';
  }
  
  // B级：通知列表页
  if (url.includes('/tzgg/') || url.includes('/notice/') || url.includes('/news/')) {
    if (!url.match(/\d{6,}/)) { // 没有具体通知ID
      return 'list_page';
    }
  }
  
  // A级：具体通知页面
  return 'official';
}
```

**修复策略**:

**第一轮：修复D级链接（第三方平台）**
- 优先级：最高
- 数量：2所（武汉大学、厦门大学）
- 方法：搜索官网找到对应的官方通知

**第二轮：修复C级链接（学院首页）**
- 优先级：高
- 数量：按梯队分批
  - 第一梯队：5所（除北大外）
  - 第二梯队：8所
  - 第三梯队：11所
- 方法：访问学院官网，找到研究生招生-推免通知

**第三轮：优化B级链接（通知列表页）**
- 优先级：中
- 方法：尽可能找到具体通知页面链接

**修复工作流**:

```
对于每所院校：
1. 访问学校研究生院官网
2. 查找"推免招生"或"接收推免生"通知
3. 优先选择文学院/中文系的具体通知
4. 如果没有，选择研究生院的统一通知
5. 记录URL、发布单位、发布日期
6. 提取requirements_raw（原文要点）
7. 更新sourceType和lastVerifiedAt
```

**执行步骤**:

1. 运行检查脚本，生成按sourceType分类的修复清单
2. 按优先级修复D级链接（2所）
3. 分批修复C级链接：
   - 第一批：第一梯队（5所）
   - 第二批：第二梯队（8所）
   - 第三批：第三梯队（11所）
4. 每修复10所院校，运行一次检查脚本验证
5. 更新数据健康度统计
6. 生成修复报告

**验证标准**:
- ✅ D级链接数量 = 0
- ✅ C级链接数量 < 5（仅保留确实无法找到通知的）
- ✅ A级+B级链接占比 ≥ 90%
- ✅ 第一、二梯队A级链接占比 = 100%
- ✅ 所有链接都能正常访问（HTTP 200）

---

### PR-4: 验证和文档更新（最终阶段）

**目标**: 全面验证重构成果，更新所有文档

**执行时间**: 2-3小时

**验证清单**:

1. **数据质量验证**
   - ✅ 运行`pnpm check:data`，无错误
   - ✅ 数据健康度 ≥ 90%
   - ✅ Schema版本正确（v1.1）
   - ✅ 所有必填字段完整

2. **功能验证**
   - ✅ 主页院校列表显示正常
   - ✅ 梯队筛选功能正常
   - ✅ 搜索功能正常
   - ✅ 匹配评估功能正常
   - ✅ 院校详情页显示正常

3. **文档更新**
   - ✅ 更新`README.md`（新Schema说明、数据维护指南）
   - ✅ 更新`DEVELOPMENT_ROADMAP.md`（标记已完成项）
   - ✅ 更新`DATA_QUALITY_ISSUES.md`（新的健康度统计）
   - ✅ 创建`CHANGELOG.md`（记录重构历史）

4. **CI/CD配置**
   - ✅ 添加GitHub Actions自动检查
   - ✅ 配置定期健康度报告

**文档更新内容**:

**README.md更新**:
```markdown
## 数据结构说明

### Schema版本：v1.1

当前数据采用三层嵌套结构：

- **University（学校层）**：稳定信息，多年不变
- **Program（项目层）**：学位类型、专业方向
- **Notice（通知层）**：年度推免通知事件

### 数据质量标准

链接分级：
- A级（official）：官网具体推免通知页面 ✅
- B级（list_page）：官网通知列表页 ✅
- C级（homepage）：学院/研究生院首页 ❌
- D级（third_party）：第三方平台 ❌

数据健康度 = (A级 + B级) / 总数

当前健康度：92.3%（57/62）
```

**CHANGELOG.md创建**:
```markdown
# 更新日志

## [v1.1.0] - 2025-01-16

### 重大变更
- 🔄 数据结构重构为三层模型（School / Program / Notice）
- 📊 统一数据健康度统计口径（A/B/C/D分级）
- 🔗 修复所有C级和D级链接
- 📝 添加年度、来源、核验时间等元数据

### 新增
- ✨ 支持一校多项目、一项目多通知
- ✨ 链接来源类型标注
- ✨ 原文要点记录（requirements_raw）
- ✨ 数据质量自动检查

### 改进
- 🎯 数据健康度从45.2%提升至92.3%
- 🎯 第一、二梯队链接质量100%
- 🎯 Schema版本化管理

### 修复
- 🐛 修复Schema漂移问题
- 🐛 修复2所第三方平台链接
- 🐛 修复32所学院首页链接
```

---

## 三、风险控制与回滚方案

### 3.1 风险识别

| 风险类型 | 风险描述 | 概率 | 影响 | 应对措施 |
|---------|---------|------|------|---------|
| 数据迁移错误 | 自动迁移脚本出错导致数据丢失 | 中 | 高 | 迁移前备份，手动验证样本 |
| 前端兼容性 | 新结构导致前端显示异常 | 低 | 中 | 提供兼容性辅助函数 |
| 链接失效 | 修复后的链接在推免季变化 | 高 | 中 | 添加lastVerifiedAt，定期检查 |
| 性能下降 | 嵌套结构导致查询变慢 | 低 | 低 | JSON文件规模小，影响可忽略 |

### 3.2 回滚方案

**每个PR都独立可回滚**:

```bash
# 回滚到PR之前的状态
git revert <commit-hash>

# 或者使用GitHub的Revert PR功能
```

**数据备份策略**:
- 每次PR前创建数据快照：`universities.v1.backup.json`
- 保留最近3个版本的备份
- 重大变更前创建Git tag

---

## 四、执行时间表

### 4.1 总体时间估算

| PR | 任务 | 预计时间 | 累计时间 |
|----|------|---------|---------|
| PR-0 | Schema锁定和统一 | 1-2小时 | 1-2小时 |
| PR-1 | 补齐元数据 | 2-3小时 | 3-5小时 |
| PR-2 | 多通知结构 | 3-4小时 | 6-9小时 |
| PR-3 | 链接分级与修复 | 8-12小时 | 14-21小时 |
| PR-4 | 验证和文档 | 2-3小时 | 16-24小时 |

**总计**: 16-24小时（2-3个工作日）

### 4.2 建议执行节奏

**方案A：集中完成（2-3天）**
- 适合：有连续时间，希望快速完成
- 风险：疲劳导致错误增加

**方案B：分散完成（1-2周）**
- 适合：时间碎片化，稳妥推进
- 优势：每个PR充分验证，风险更低

**推荐：方案B**
- 第1-2天：PR-0 + PR-1
- 第3-4天：PR-2
- 第5-7天：PR-3（分批修复）
- 第8天：PR-4

---

## 五、成功标准

### 5.1 技术指标

- ✅ Schema版本：v1.1
- ✅ 数据健康度：≥ 90%
- ✅ A级链接占比：≥ 60%
- ✅ D级链接数量：0
- ✅ 第一、二梯队A级占比：100%
- ✅ 所有必填字段完整率：100%

### 5.2 功能指标

- ✅ 前端所有页面正常显示
- ✅ 匹配功能正常工作
- ✅ 筛选功能正常工作
- ✅ 数据检查脚本无错误

### 5.3 文档指标

- ✅ README完整更新
- ✅ CHANGELOG记录详细
- ✅ 数据维护指南清晰
- ✅ Schema文档准确

---

## 六、后续优化方向

### 6.1 短期（1个月内）

1. **添加自动化检查**
   - GitHub Actions定期检查链接有效性
   - 自动生成健康度报告

2. **补充历史数据**
   - 收集2025年推免通知
   - 为重点院校添加2024年数据

3. **优化匹配算法**
   - 基于directionTags实现方向匹配
   - 添加地域偏好

### 6.2 中期（2-3个月）

1. **升级到数据库**
   - 使用webdev_add_feature升级到web-db-user
   - 迁移JSON数据到PostgreSQL
   - 实现完整的CRUD API

2. **用户系统**
   - 用户注册登录
   - 收藏院校
   - 匹配历史

3. **数据可视化**
   - 院校分布地图
   - 梯队分布图表
   - 个人能力雷达图

### 6.3 长期（3-6个月）

1. **众包与协作**
   - 用户提交院校信息
   - 审核机制
   - 贡献者排行

2. **智能化**
   - 爬虫自动收集通知
   - AI提取requirements
   - 智能推荐

3. **生态扩展**
   - 移动端应用
   - 微信小程序
   - API开放平台

---

## 七、决策确认清单

在开始执行前，请确认以下问题：

- [ ] **是否认同渐进式重构方案？**
- [ ] **是否同意PR-0~PR-3的优先级排序？**
- [ ] **预计投入的时间和资源是否充足？**（16-24小时）
- [ ] **是否接受数据结构的重大变更？**（v1 → v1.1）
- [ ] **是否同意链接质量标准？**（A/B/C/D分级）
- [ ] **执行节奏选择？**（集中完成 vs 分散完成）
- [ ] **是否需要调整任何细节？**

---

## 八、总结

本重构计划综合了**团队技术诊断**和**GPT渐进式方案**的优点：

**采纳团队建议**:
- ✅ 三层数据模型的核心思想
- ✅ 数据健康度统一口径
- ✅ 链接分级标准
- ✅ Schema锁定的紧迫性

**采纳GPT建议**:
- ✅ 渐进式重构路径
- ✅ 4个独立PR的执行方式
- ✅ 最小多通知结构（v1.1）
- ✅ 向后兼容的迁移策略

**Manus的优化**:
- ✅ 详细的执行步骤和验证标准
- ✅ 完整的风险控制和回滚方案
- ✅ 清晰的时间表和成功标准
- ✅ 后续优化方向的规划

这是一个**可执行、可验证、可回滚**的完整方案，适合单人团队+Manus协作模式。

**请确认是否开始执行，或者需要调整任何细节。**
