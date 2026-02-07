# 📋 链接质量检验标准操作流程 (SOP v1.0)

> **版本**: v1.0 (Link Quality Verification SOP)
> **生效日期**: 2026-02-06
> **适用范围**: 钝学推免指南 - 62所院校推免通知链接质检
> **基于**: Kimi SOP 4.0（时效性强制核查版）适配

---

## 📌 核心原则

> "链接质量不仅在于可访问性，更在于内容的**时效性、准确性和类型匹配性**。"

### 四大强制条款

1. **【时效性强制核查】** 所有标记为2026年的链接必须人工访问确认标题含"2026"或发布时间为2025年
2. **【Year保护规则】** 未核验年份的链接（`yearStatus: unverified`）不得评为A级
3. **【梯队差异化标准】** 第一、二梯队必须100%核验，第四、五梯队B级可接受
4. **【域名合法性检查】** 建立62所院校域名白名单，跨校链接自动拦截

---

## 🎯 链接分级标准（A/B/C/D）

### A级 - 具体通知页（官方推免通知正文）

**判定标准**（同时满足）：
```
1. URL特征（满足任一）：
   - /info/\d+/\d+\.htm         # 常见CMS系统
   - c[a-z0-9]+/page\.htm        # 部分院校系统
   - (node|article)/\d+          # NodeJS系统
   - [a-f0-9]{16,}               # 唯一文章ID

2. 内容要求：
   - 标题含"推免"/"免试"/"保研"关键词
   - 针对2026届（或明确标注年份）
   - 包含申请时间、要求、流程等具体信息

3. yearStatus要求：✅ 必须为 "verified"
   - 人工访问确认标题含"2026"或发布时间为2025年
   - 记录lastVerifiedAt时间戳
```

**示例**：
```
✅ 好例子：
https://chinese.pku.edu.cn/info/1041/3456.htm
- 标题：北京大学中文系2026年推荐免试研究生接收办法
- 发布：2025年8月
- yearStatus: verified

❌ 反例：
https://chinese.pku.edu.cn/info/1041/3123.htm
- 标题：北京大学中文系2025年推荐免试研究生接收办法
- 发布：2024年8月
- yearStatus: mismatch（年份不匹配，必须替换）
```

---

### B级 - 学校总章/研究生院通知列表页

**判定标准**：
```
1. 域名要求：
   - yjsy.*.edu.cn（研究生院）
   - yjszs.*.edu.cn（研究生招生）
   - gs.*.edu.cn（研究生院）
   - graduate.*.edu.cn

2. 内容要求：
   - 学校统一发布的2026年推免生接收办法（总章）
   - 或研究生院通知列表页（可找到推免相关通知）

3. yearStatus要求：
   - ✅ verified: 访问确认为2026届版本（推荐）
   - ⚠️ unverified: 暂未确认（可接受，但第一梯队需升级）
   - ❌ mismatch: 不得使用
```

**示例**：
```
✅ 好例子（B级-verified）：
https://yjsy.pku.edu.cn/tzgg/
- 研究生院通知公告列表页
- 访问确认：首页显示2026年推免相关通知
- yearStatus: verified

⚠️ 可接受（B级-unverified，第四五梯队）：
https://yjsy.某211.edu.cn/zsxx/
- 研究生院招生信息列表页
- 暂未人工确认年份
- yearStatus: unverified
```

---

### C级 - 院系列表页/模糊链接

**判定标准**：
```
1. URL特征：
   - 含list.htm、tzgg/、ggtz/等列表页特征
   - 以/结尾且长度30-50字符
   - 学院/系所主页

2. 使用场景：
   - 无法找到具体通知页时的fallback选项
   - 第四五梯队院校可接受
   - 第一二梯队需攻坚升级

3. yearStatus：通常为unverified（可接受）
```

---

### D级 - 第三方平台/无效链接（必须清零）

**判定标准**：
```
1. 致命特征（必须替换）：
   - 第三方聚合平台（lianpp.com、考研帮、保研论坛等）
   - 短主页（URL以/结尾、长度<30字符）
   - 404或无法访问
   - 完全无关内容

2. 处理要求：
   - D级链接必须在PR-3阶段清零
   - 优先替换为A级，其次B级
   - 实在找不到可降为C级，但需标注原因
```

---

## 🔍 三级验证流程（SOP核心）

### Level 1: 技术验证（自动化）

**由 `check-data-quality.cjs` 执行**：

```javascript
// 1. 链接可访问性（HTTP状态）
✅ HTTP 200 OK
❌ HTTP 404/500/503

// 2. URL格式符合A/B/C/D级标准
✅ A级：/info/\d+/\d+\.htm
⚠️ B级：yjsy.*.edu.cn
⚠️ C级：list.htm
❌ D级：URL长度<30字符

// 3. 域名匹配学校白名单
✅ 北京大学 → pku.edu.cn
❌ 北京大学 → fudan.edu.cn（跨校链接警告）

// 4. yearStatus字段完整性
✅ yearStatus存在且值为verified/unverified/mismatch
❌ yearStatus缺失（报错）
```

**自动推断逻辑**（减少人工负担）：
```javascript
// 如果URL含年份标识，自动推断yearStatus
if (url.includes('2026') || url.includes('2025')) {
  suggestedStatus = 'verified' // 需人工确认
} else if (url.includes('2024') || url.includes('2023')) {
  suggestedStatus = 'mismatch' // 历史数据警告
} else {
  suggestedStatus = 'unverified' // 需人工验证
}
```

---

### Level 2: 时效性验证（半自动化 + 人工）

**人工访问链接并核对**：

#### Step 1: 访问链接
```
工具：浏览器 + 录屏/截图工具
要求：访问URL，加载完整页面（不能只看搜索引擎摘要）
```

#### Step 2: 核对年份特征
```
检查项：
1. 页面标题是否含"2026"或"2025年X月发布"
2. 正文是否明确说明"2026届"/"2026年接收"
3. 发布时间是否为2025年（针对2026届招生）

判定规则：
✅ verified: 标题含2026或发布时间为2025年
⚠️ unverified: 无明确年份标识（需进一步核对正文）
❌ mismatch: 明确为2025届或更早（必须替换）
```

#### Step 3: 记录验证结果
```json
{
  "yearStatus": "verified",
  "lastVerifiedAt": "2026-02-06",
  "verifier": "人工",
  "evidence": "标题含'2026年推免生接收办法'，发布时间2025-08-15"
}
```

---

### Level 3: 内容质量验证（人工抽检）

**抽检比例**：
- 第一梯队（6所）：100%必检
- 第二梯队（8所）：100%必检
- 第三梯队（11所）：50%抽检
- 第四五梯队（37所）：20%抽检

**检查内容**：
```
1. 链接类型是否正确（推免 vs 夏令营 vs 统考）
2. 关键信息是否完整（申请时间、要求、流程）
3. 联系方式是否有效
4. 页面是否可正常跳转（无重定向到首页）
```

---

## 📊 域名白名单（62所院校）

### 第一梯队（6所）- 100%强制核验

| 学校 | 官方域名 | 研究生院域名 | 备注 |
|------|---------|-------------|------|
| 北京大学 | pku.edu.cn | yjsy.pku.edu.cn, grs.pku.edu.cn | 中文系: chinese.pku.edu.cn |
| 北京师范大学 | bnu.edu.cn | yz.bnu.edu.cn | 文学院: chinese.bnu.edu.cn |
| 复旦大学 | fudan.edu.cn | gsao.fudan.edu.cn | 中文系: chinese.fudan.edu.cn |
| 南京大学 | nju.edu.cn | grawww.nju.edu.cn | 文学院: cll.nju.edu.cn |
| 四川大学 | scu.edu.cn | gs.scu.edu.cn | 文学院: wxy.scu.edu.cn |
| 中国人民大学 | ruc.edu.cn | grs.ruc.edu.cn | 文学院: art.ruc.edu.cn |

### 第二梯队（8所）- 100%强制核验

| 学校 | 官方域名 | 备注 |
|------|---------|------|
| 华东师范大学 | ecnu.edu.cn | yjszs.ecnu.edu.cn |
| 浙江大学 | zju.edu.cn | grs.zju.edu.cn |
| 山东大学 | sdu.edu.cn | yz.sdu.edu.cn |
| 中山大学 | sysu.edu.cn | graduate.sysu.edu.cn |
| 吉林大学 | jlu.edu.cn | yjsy.jlu.edu.cn |
| 南开大学 | nankai.edu.cn | yzb.nankai.edu.cn |
| 清华大学 | tsinghua.edu.cn | yz.tsinghua.edu.cn |
| 武汉大学 | whu.edu.cn | gs.whu.edu.cn |

### 第三、四、五梯队（48所）

> 完整白名单见附录A（待补充）

**跨校链接检测**：
```javascript
// check-data-quality.cjs
function checkDomainMatch(school, url) {
  const whitelist = DOMAIN_WHITELIST[school];
  if (!whitelist.some(domain => url.includes(domain))) {
    console.warn(`⚠️ 跨校链接风险：${school} 使用了非本校域名 ${url}`);
    return false;
  }
  return true;
}
```

---

## 🔄 标准操作流程（Workflow）

### Phase 1: 数据录入前（15分钟）

#### Step 1: 运行技术验证脚本
```bash
cd "C:\Users\86191\Documents\GitHub\literature-tuimian-dashboard"
pnpm check:data
```

**预期输出**：
```
✅ 格式检查：62所院校字段完整
⚠️ 时效性预警：3所yearStatus=unverified（第一梯队）
❌ D级链接：2所（武汉大学、厦门大学）- 必须修复
✅ 域名合法性：62所全部匹配白名单
```

#### Step 2: 生成优先队列
```
T0队列（P0 - 必须立即处理）：
- D级链接（2所）
- 第一梯队yearStatus=mismatch（0所）

T1队列（P1 - 本周处理）：
- 第一梯队yearStatus=unverified（6所）
- 第二梯队yearStatus=mismatch（0所）

T2队列（P2 - 本月处理）：
- 第二梯队yearStatus=unverified（5所）
- 第三梯队C级链接（1所）
```

---

### Phase 2: 数据录入中（按优先队列执行）

#### Step 3: 修复D级链接（T0队列）

**操作流程**：
1. 访问学校官网（研究生院/文学院）
2. 搜索关键词："2026 推免" "免试研究生"
3. 找到官方通知（优先A级，其次B级）
4. 人工访问确认年份
5. 更新universities.json:
   ```json
   {
     "url": "https://gs.whu.edu.cn/info/1234/5678.htm",
     "linkGrade": "A",
     "yearStatus": "verified",
     "lastVerifiedAt": "2026-02-06"
   }
   ```

#### Step 4: 修复yearStatus=unverified（T1队列）

**对于第一梯队院校**：
1. 访问现有链接
2. 核对标题/发布时间
3. 更新yearStatus:
   - 确认为2026届 → `verified`
   - 确认为2025届或更早 → `mismatch`（搜索新链接）
   - 无法确认 → `unverified`（暂时保持，但需标注原因）

---

### Phase 3: 数据保存前（10分钟）

#### Step 5: 运行质量检查
```bash
pnpm check:data
```

**必须达标的指标**：
```
✅ D级链接 = 0所
✅ 第一梯队A级占比 ≥ 80%
✅ 第一梯队yearStatus=verified占比 = 100%
✅ 整体健康度 ≥ 90%
```

#### Step 6: 人工抽检
```
第一梯队：100%访问（6所）
第二梯队：100%访问（8所）
第三梯队：50%抽检（6/11所）
第四五梯队：20%抽检（8/37所）

总计：约28所人工访问，预计1-2小时
```

---

### Phase 4: 版本发布前（5分钟）

#### Step 7: 生成质量报告
```bash
node scripts/generate-quality-report.js
```

**报告内容**：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
钝学推免指南 - 链接质量报告 v1.1.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 整体健康度：91.9% (✅ 达标)

🔗 链接质量分布：
- A级：18所 (29.0%)  +3
- B级：40所 (64.5%)  ±0
- C级：4所 (6.5%)    -1
- D级：0所 (0%)      -2  ✅ 已清零

⏱️ 时效性统计：
- verified: 22所 (35.5%)     +22
- unverified: 38所 (61.3%)   -20
- mismatch: 2所 (3.2%)       -2  ⚠️ 需处理

🎯 梯队达标情况：
- 第一梯队A级占比：83.3% (5/6)  ✅
- 第二梯队A级占比：37.5% (3/8)  ⚠️
- 第一梯队verified占比：100% (6/6)  ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Step 8: 更新文档
```
必须更新：
✅ docs/METRICS_DASHBOARD.md（更新链接质量分布）
✅ docs/SESSION_CONTEXT.md（记录本次修复内容）
✅ docs/02-Data/DATA_QUALITY_ISSUES.md（更新问题清单）
```

---

## ✅ 每日作业Checklist

### 【数据录入前】
- [ ] 运行 `pnpm check:data` 技术验证
- [ ] 生成T0/T1/T2优先队列
- [ ] 确认域名白名单最新版

### 【数据录入中】
- [ ] 按T0→T1→T2顺序处理
- [ ] 人工访问链接并核对年份
- [ ] 更新yearStatus和lastVerifiedAt
- [ ] 标注验证证据（标题/发布时间）

### 【数据保存前】
- [ ] 运行 `pnpm check:data` 质量检查
- [ ] D级链接 = 0（强制）
- [ ] 第一梯队yearStatus=verified占比 = 100%（强制）
- [ ] 人工抽检（第一二梯队100%，其他按比例）

### 【版本发布前】
- [ ] 生成链接质量报告
- [ ] 更新METRICS_DASHBOARD.md
- [ ] 更新SESSION_CONTEXT.md
- [ ] Git提交并推送

---

## 🔧 工具脚本增强（TODO）

### 1. check-data-quality.cjs 增强

**新增功能**：
```javascript
// 1. yearStatus字段验证
function validateYearStatus(notice) {
  if (!notice.yearStatus) {
    errors.push(`缺少yearStatus字段`);
  }

  if (notice.linkGrade === 'A' && notice.yearStatus !== 'verified') {
    errors.push(`A级链接必须yearStatus=verified`);
  }

  if (notice.yearStatus === 'mismatch') {
    errors.push(`yearStatus=mismatch，必须替换链接`);
  }
}

// 2. 域名白名单检查
function validateDomain(school, url) {
  const whitelist = DOMAIN_WHITELIST[school.name];
  if (!whitelist || !whitelist.some(d => url.includes(d))) {
    warnings.push(`跨校链接风险：${school.name} → ${url}`);
  }
}

// 3. 自动推断yearStatus
function inferYearStatus(url, title) {
  if (url.includes('2026') || title?.includes('2026')) {
    return 'verified'; // 建议，需人工确认
  }
  if (url.includes('2024') || url.includes('2023')) {
    return 'mismatch'; // 历史数据
  }
  return 'unverified'; // 需人工验证
}
```

### 2. 新增脚本：generate-quality-report.js

**功能**：
- 统计A/B/C/D分布
- 统计yearStatus分布
- 按梯队生成达标报告
- 生成T0/T1/T2优先队列

---

## 📚 参考文档

### 项目内部文档
- [NOTICE_GRADE_RULES.md](./NOTICE_GRADE_RULES.md) - 链接质量分级规则
- [DECISIONS.md](../01-Project/DECISIONS.md) - D-003: Year保护机制
- [SCHEMA.md](./SCHEMA.md) - yearStatus字段定义

### 外部参考
- Kimi SOP 4.0（时效性强制核查版）- 核心理念来源

---

## 🔄 版本历史

| 版本 | 日期 | 变更内容 | 变更原因 |
|------|------|---------|---------|
| v1.0 | 2026-02-06 | 初始版本，建立三级验证流程 | 基于Kimi SOP 4.0适配 |

---

**制定者**: Claude Code + 用户
**审核者**: 用户
**最后更新**: 2026-02-06

---

## 附录A: 完整域名白名单（待补充）

> 将在PR-3阶段补充完整的62所院校域名白名单
