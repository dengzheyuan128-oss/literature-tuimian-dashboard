# 数据结构规范（Schema）

**当前版本**: v1  
**最后更新**: 2026-01-16

---

## 一、数据文件结构

### 顶层结构

```json
{
  "schemaVersion": "v1",
  "lastUpdated": "2026-01-16",
  "universities": [...]
}
```

| 字段 | 类型 | 说明 | 必填 |
|------|------|------|------|
| `schemaVersion` | string | Schema版本号 | ✅ |
| `lastUpdated` | string | 最后更新日期（YYYY-MM-DD） | ✅ |
| `universities` | array | 院校列表 | ✅ |

---

## 二、University对象结构（v1）

### 字段列表

| 字段 | 类型 | 说明 | 示例 | 必填 |
|------|------|------|------|------|
| `id` | number | 院校唯一标识 | `1` | ✅ |
| `name` | string | 院校名称 | `"北京大学"` | ✅ |
| `tier` | string | 梯队分类 | `"第一梯队"` | ✅ |
| `specialty` | string | 专业方向 | `"汉语言文学、语言学等"` | ✅ |
| `degreeType` | string | 学位类型 | `"学硕、专硕、直博"` | ✅ |
| `duration` | string | 学制 | `"3年（学硕）"` | ❌ |
| `examForm` | string | 考核形式 | `"面试、笔试"` | ✅ |
| `englishRequirement` | string | 英语要求 | `"CET-6或同等"` | ✅ |
| `applicationPeriod` | string | 申请时间段 | `"9月中旬-10月中旬"` | ✅ |
| `deadline` | string | 截止日期 | `"2024年10月中旬"` | ✅ |
| `url` | string | 推免通知链接 | `"https://..."` | ✅ |
| `disciplineGrade` | string | 学科评估等级 | `"A+"` | ❌ |
| `location` | string | 所在地区 | `"北京"` | ❌ |
| `is985` | boolean | 是否985 | `true` | ❌ |
| `is211` | boolean | 是否211 | `true` | ❌ |

### 完整示例

```json
{
  "id": 1,
  "name": "北京大学",
  "tier": "第一梯队",
  "location": "北京",
  "is985": true,
  "is211": true,
  "disciplineGrade": "A+",
  "specialty": "汉语言文学、语言学及应用语言学等",
  "degreeType": "学硕、直博",
  "duration": "3年（学硕）",
  "examForm": "面试、笔试",
  "englishRequirement": "CET-6或同等",
  "applicationPeriod": "9月中旬-10月中旬",
  "deadline": "2024年10月中旬",
  "url": "https://chinese.pku.edu.cn/jyjx/zsxx/5e733db8e74e4391b4b8fd430540dea3.htm"
}
```

---

## 三、字段说明

### tier（梯队分类）

**合法值**：
- `"第一梯队"` - 全国核心型（A+双一流）
- `"第二梯队"` - 强势研究型（A/A-）
- `"第三梯队"` - 稳健学术型（B+/B）
- `"第四梯队"` - 校内优势型（B-/C+）
- `"第五梯队"` - 学校光环型（理工科985）

### disciplineGrade（学科评估等级）

**合法值**：
- `"A+"`, `"A"`, `"A-"` - A类
- `"B+"`, `"B"`, `"B-"` - B类
- `"C+"`, `"C"`, `"C-"` - C类

**来源**：教育部第四轮学科评估（中国语言文学）

### degreeType（学位类型）

**常见值**：
- `"学硕"` - 学术型硕士
- `"专硕"` - 专业型硕士
- `"直博"` - 直接攻读博士
- 多个类型用顿号分隔：`"学硕、专硕、直博"`

### url（推免通知链接）

**要求**：
- 必须是完整的URL（包含https://或http://）
- 优先使用官网具体推免通知页面
- 避免使用学院首页或研究生院首页
- 避免使用第三方平台链接

---

## 四、数据质量标准

### 必填字段完整性

所有标记为✅的字段必须存在且非空。

### 数据格式规范

- **日期格式**：统一使用"YYYY年MM月DD日"或"MM月DD日"
- **时间段格式**：使用"开始时间-结束时间"，如"9月中旬-10月中旬"
- **URL格式**：必须以`http://`或`https://`开头
- **布尔值**：使用`true`或`false`，不使用字符串

### 数据一致性

- `tier`必须是五个合法值之一
- `disciplineGrade`必须是九个合法值之一
- `is985`为true时，`is211`也应为true
- `location`应使用标准省份或直辖市名称

---

## 五、版本历史

### v1（2026-01-16）

**初始版本**
- 定义基础数据结构
- 确立必填字段
- 统一字段命名规范

---

## 六、迁移指南

### 从旧版本迁移到v1

如果数据文件中使用了以下字段名，需要进行映射：

| 旧字段名 | 新字段名 | 说明 |
|---------|---------|------|
| `majors` | `specialty` | 专业方向 |
| `types` | `degreeType` | 学位类型 |
| `noticeUrl` | `url` | 推免通知链接 |
| `noticeTime` | `applicationPeriod` | 申请时间段 |
| `disciplineRating` | `disciplineGrade` | 学科评估等级 |

---

## 七、未来规划

### v1.1（计划中）

**新增字段**：
- `year` - 推免年份
- `sourceType` - 来源类型（official/list_page/homepage/third_party）
- `publisher` - 发布单位
- `lastVerifiedAt` - 最后核验时间

**结构调整**：
- 引入`programs`数组，支持一校多项目
- 引入`notices`数组，支持一项目多通知
- 实现三层嵌套结构（School / Program / Notice）

---

**维护者**: Manus AI  
**联系方式**: GitHub Issues

---

## 八、v1扩展字段（2026-01-16新增）

### 新增字段列表

| 字段 | 类型 | 说明 | 示例 | 必填 |
|------|------|------|------|------|
| `year` | number | 推免年份 | `2026` | ✅ |
| `sourceType` | string | 来源类型 | `"official_notice"` | ✅ |
| `publisher` | string | 发布单位 | `"北京大学研究生院"` | ✅ |
| `lastVerifiedAt` | string | 最后核验时间 | `"2026-01-16"` | ✅ |
| `linkGrade` | string | 链接质量等级 | `"A"` | ✅ |

### sourceType（来源类型）

**合法值**：
- `"official_notice"` - 官方推免通知页面（最佳）
- `"list_page"` - 研究生院通知列表页
- `"homepage"` - 学院首页或研究生院首页
- `"third_party"` - 第三方平台链接（需修复）
- `"unknown"` - 未知或缺失

### linkGrade（链接质量等级）

**分级标准**：
- `"A"` - 官方推免通知页面，包含推免关键词
- `"B"` - 研究生院通知列表页
- `"C"` - 学院首页或研究生院首页
- `"D"` - 第三方平台或无效链接

**数据健康度计算**：健康度 = (A级数量 + B级数量) / 总数 × 100%

**目标**：
- 整体健康度 ≥ 90%
- A级占比 ≥ 60%
- D级数量 = 0
- 第一、二梯队A级占比 = 100%


---

## 九、v1.1结构说明（2026-01-16新增）

### 结构升级

v1.1采用三层嵌套结构，支持一校多项目、一项目多通知：

```
School (院校)
  └── Program[] (项目)
        └── Notice[] (通知)
```

### School（院校层）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 院校ID |
| `name` | string | 院校名称 |
| `tier` | string | 梯队分类 |
| `location` | string | 地理位置 |
| `is985` | boolean | 是否985 |
| `is211` | boolean | 是否211 |
| `disciplineGrade` | string | 学科评估等级 |
| `programs` | Program[] | 项目列表 |

### Program（项目层）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 项目ID（格式：`{schoolId}-{序号}`） |
| `schoolId` | number | 所属院校ID |
| `programName` | string | 项目名称 |
| `department` | string | 所属院系 |
| `specialty` | string | 专业方向 |
| `degreeTypes` | string[] | 学位类型数组 |
| `notices` | Notice[] | 通知列表 |

### Notice（通知层）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 通知ID（格式：`{programId}-{序号}`） |
| `programId` | string | 所属项目ID |
| `year` | number | 推免年份 |
| `title` | string | 通知标题 |
| `url` | string | 通知链接 |
| `sourceType` | string | 来源类型 |
| `publisher` | string | 发布单位 |
| `linkGrade` | string | 链接质量等级 |
| `applicationPeriod` | string | 申请时间段 |
| `deadline` | string | 截止时间 |
| `examForm` | string | 考核形式 |
| `englishRequirement` | string | 英语要求 |
| `duration` | string | 学制 |
| `publishedAt` | string | 发布时间 |
| `lastVerifiedAt` | string | 最后核验时间 |

### 向后兼容

dataLoader.ts提供自动展平功能：
- v1.1数据自动展平为v1兼容格式
- 前端代码无需修改即可使用
- 取每个学校的第一个项目的第一条通知作为展平数据

### 迁移工具

使用`scripts/migrate-to-v1.1.js`进行数据迁移：
```bash
node scripts/migrate-to-v1.1.js
```

