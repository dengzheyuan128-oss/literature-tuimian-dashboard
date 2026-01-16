# 钝学推免指南

> 汇集全国顶尖高校文学院/中文系推免硕士考核通知，助您在学术之路上，寻得理想归处。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dengzheyuan128-oss/literature-tuimian-dashboard)

## 📖 项目简介

**钝学推免指南**是一个专注于985/211高校文学类专业推免硕士研究生信息的综合平台。我们收录了全国62所顶尖高校的推免招生信息，并基于教育部学科评估结果进行科学分类，为推免学生提供全面、准确的信息参考。

### 核心功能

- 📊 **院校信息浏览** - 62所985/211高校文学类专业推免信息
- 🎯 **智能匹配评估** - 根据个人条件智能推荐适合的院校
- 🏆 **梯队分类** - 基于学科评估的五级梯队分类系统
- 🔍 **搜索筛选** - 快速查找目标院校和专业
- 📱 **响应式设计** - 完美适配桌面和移动设备

## 🎓 院校梯队分类

基于教育部第四轮学科评估结果和中文学科学术实力，我们将院校分为五个梯队：

### 🟥 第一梯队（6所）- 全国核心型
**定义**：中文学科在全国处于话语中枢，多个方向具备"不可绕过性"

- 北京大学（A+）
- 北京师范大学（A+）
- 复旦大学（A+）
- 南京大学（A+）
- 四川大学（A+）
- 中国人民大学（A+）

### 🟧 第二梯队（8所）- 强势研究型
**定义**：至少1-2个方向全国领先，博士毕业生能稳定进入好学校

- 华东师范大学（A）
- 浙江大学（A-）
- 山东大学（A-）
- 武汉大学（A-）
- 中山大学（A-）
- 吉林大学（A-）
- 南开大学（A）
- 清华大学（A-）

### 🟨 第三梯队（11所）- 稳健学术型
**定义**：学术产出稳定，某些方向在全国中上，性价比高

- 南京师范大学、陕西师范大学、东北师范大学、华中师范大学、苏州大学、兰州大学、暨南大学、中央民族大学、云南大学、西北大学、安徽大学

### 🟩 第四梯队（18所）- 校内优势型
**定义**：在本校人文学科中强势，放到全国只能算中游

- 厦门大学、湖南师范大学、华南师范大学、西南大学、郑州大学、上海大学、辽宁大学等

### 🟦 第五梯队（19所）- 学校光环型
**定义**：学校层级高，但中文系学术存在感弱

- 上海交通大学、华中科技大学、同济大学、天津大学、东南大学、西安交通大学等理工科985

## 🚀 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite 7
- **样式方案**: Tailwind CSS 4
- **UI组件**: shadcn/ui + Radix UI
- **路由**: Wouter
- **图表**: Recharts
- **表单**: React Hook Form + Zod

## 📦 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
pnpm build
```

### 预览生产版本

```bash
pnpm preview
```

## 🔍 数据质量检查

为确保数据的完整性和准确性，我们提供了自动化的数据质量检查系统。

### 运行数据检查

```bash
node scripts/check-data-quality.js
```

### 检查项目

✅ **必填字段完整性**
- id, name, tier, types, majors, noticeTime, noticeUrl

✅ **推免通知链接准确性**
- 必须是具体的推免招生通知页面
- 不能是学院首页或研究生院首页
- 应包含推免、保研、接收、报名等关键词

✅ **梯队分类有效性**
- 必须是第一至第五梯队之一

✅ **日期格式规范性**
- 支持格式：2024年10月15日、2024年10月初、另行通知、待定

✅ **数据唯一性**
- 检查ID是否重复

### 数据质量标准

#### ❌ 错误示例（官网链接）
```json
{
  "name": "北京大学",
  "noticeUrl": "https://chinese.pku.edu.cn/"  // ❌ 这是学院首页
}
```

#### ✅ 正确示例（推免通知链接）
```json
{
  "name": "北京大学",
  "noticeUrl": "https://chinese.pku.edu.cn/tzgg/2024tuimian.htm"  // ✅ 这是具体的推免通知
}
```

### 推免通知链接获取指南

1. **访问研究生院官网**
   - 通常为：`https://grs.xxx.edu.cn` 或 `https://yjsy.xxx.edu.cn`

2. **查找招生信息栏目**
   - 通知公告、招生信息、推免招生等栏目

3. **搜索关键词**
   - "推免"、"保研"、"接收推荐免试"、"硕士研究生"、"2024年"、"2025年"

4. **确认链接有效性**
   - 链接应直接指向具体的招生通知文件或页面
   - 通知应包含报名时间、材料要求、考核方式等详细信息

5. **更新数据文件**
   - 编辑 `client/src/data/universities.json`
   - 更新对应院校的 `noticeUrl` 字段

## 📝 数据维护指南

### 添加新院校

1. 编辑 `client/src/data/universities.json`
2. 按照以下格式添加院校信息：

```json
{
  "id": 63,
  "name": "新院校名称",
  "tier": "第三梯队",
  "types": "学硕、专硕",
  "majors": "汉语言文学、语言学等",
  "noticeTime": "2024年10月初",
  "noticeUrl": "https://example.edu.cn/notice/2024tuimian.html",
  "description": "院校简介",
  "requirements": {
    "gpa": "3.0以上",
    "rank": "前30%",
    "english": "CET-6 450分以上",
    "research": "一定科研经历"
  }
}
```

3. 运行数据检查：`node scripts/check-data-quality.js`
4. 确认无误后提交代码

### 更新院校信息

1. 定期检查各院校推免通知更新情况（建议每年9-10月）
2. 更新 `noticeUrl` 为最新年份的推免通知
3. 更新 `noticeTime` 为最新的报名时间
4. 运行数据检查确保更新正确

### 数据审核流程

```
修改数据 → 运行检查脚本 → 修复问题 → 本地测试 → 提交PR → 代码审查 → 合并部署
```

## 🛠️ 开发指南

### 项目结构

```
literature-tuimian-dashboard/
├── client/                 # 前端代码
│   ├── public/            # 静态资源
│   └── src/
│       ├── components/    # UI组件
│       ├── contexts/      # React上下文
│       ├── data/          # 数据文件
│       ├── hooks/         # 自定义Hooks
│       ├── lib/           # 工具函数
│       ├── pages/         # 页面组件
│       ├── App.tsx        # 应用入口
│       └── index.css      # 全局样式
├── scripts/               # 脚本工具
│   └── check-data-quality.js  # 数据质量检查
├── server/                # 服务端代码（静态托管）
└── package.json           # 项目配置
```

### 代码规范

- 使用 TypeScript 进行类型检查
- 使用 Prettier 进行代码格式化
- 遵循 React Hooks 最佳实践
- 组件采用函数式组件 + Hooks

### 提交规范

```
feat: 添加新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具链相关
```

## 🚀 部署指南

### Vercel部署（推荐）

1. Fork本仓库到您的GitHub账号
2. 访问 [Vercel](https://vercel.com)
3. 导入您的GitHub仓库
4. 确认配置（Vercel会自动检测）
5. 点击Deploy

详细部署指南请查看：[VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)

### 其他部署方式

- **Netlify**: 支持
- **GitHub Pages**: 支持
- **自建服务器**: 支持

## 📊 数据来源

1. 教育部第四轮学科评估（2017年）
2. 第五轮学科评估部分院校自行披露数据（2023-2024年）
3. 双一流学科建设名单（2022年第二轮）
4. 各高校文学院/中文系官网公开信息
5. 软科中国最好学科排名

## 🤝 贡献指南

我们欢迎任何形式的贡献！

### 如何贡献

1. **Fork本仓库**
2. **创建特性分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **运行数据检查** (`node scripts/check-data-quality.js`)
5. **推送到分支** (`git push origin feature/AmazingFeature`)
6. **提交Pull Request**

### 贡献内容

- 🐛 报告和修复bug
- 📝 更新和补充院校信息
- ✨ 提出新功能建议
- 📖 改进文档
- 🎨 优化UI/UX设计

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

## 📮 联系方式

- **GitHub Issues**: [提交问题](https://github.com/dengzheyuan128-oss/literature-tuimian-dashboard/issues)
- **Pull Requests**: [贡献代码](https://github.com/dengzheyuan128-oss/literature-tuimian-dashboard/pulls)

## 🙏 致谢

感谢所有为本项目做出贡献的开发者和用户！

---

**祝所有推免学生申请顺利，金榜题名！** 🎓✨
