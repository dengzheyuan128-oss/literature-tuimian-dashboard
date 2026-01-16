# Vercel 部署指南 - 钝学推免指南

## 📦 部署步骤

### 方法一：通过Vercel网站部署（推荐）

#### 1. 准备工作
确保您的代码已经推送到GitHub仓库：
- 仓库地址：https://github.com/dengzheyuan128-oss/literature-tuimian-dashboard

#### 2. 登录Vercel
1. 访问 [Vercel官网](https://vercel.com)
2. 点击右上角 "Sign Up" 或 "Log In"
3. 选择 "Continue with GitHub" 使用GitHub账号登录

#### 3. 导入项目
1. 登录后，点击 "Add New..." → "Project"
2. 在 "Import Git Repository" 页面，找到 `dengzheyuan128-oss/literature-tuimian-dashboard`
3. 点击 "Import" 按钮

#### 4. 配置项目
在配置页面，Vercel会自动检测到这是一个Vite项目，您需要确认以下配置：

**Framework Preset**: Vite

**Build and Output Settings**:
- Build Command: `pnpm build`
- Output Directory: `dist/public`
- Install Command: `pnpm install`

**Root Directory**: `./` (保持默认)

#### 5. 部署
1. 确认配置无误后，点击 "Deploy" 按钮
2. 等待部署完成（通常需要1-3分钟）
3. 部署成功后，Vercel会提供一个访问链接，格式如：`https://literature-tuimian-dashboard.vercel.app`

#### 6. 自动部署
配置完成后，每次您向GitHub仓库的main分支推送代码，Vercel都会自动重新部署。

---

### 方法二：通过Vercel CLI部署

#### 1. 安装Vercel CLI
```bash
npm install -g vercel
```

#### 2. 登录Vercel
```bash
vercel login
```

#### 3. 部署项目
在项目根目录执行：
```bash
cd /home/ubuntu/literature-tuimian-dashboard
vercel
```

首次部署时，Vercel CLI会询问一些问题：
- Set up and deploy? → **Y**
- Which scope? → 选择您的账号
- Link to existing project? → **N**
- What's your project's name? → `literature-tuimian-dashboard` (或自定义)
- In which directory is your code located? → `./` (直接回车)

#### 4. 生产环境部署
```bash
vercel --prod
```

---

## 🔧 配置文件说明

### vercel.json
项目已包含 `vercel.json` 配置文件，内容如下：

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist/public",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**配置说明**：
- `buildCommand`: 构建命令
- `outputDirectory`: 构建输出目录
- `rewrites`: 路由重写规则，确保SPA路由正常工作

---

## 🌐 自定义域名（可选）

### 1. 在Vercel添加自定义域名
1. 进入项目的 Settings → Domains
2. 输入您的域名（如 `tuimian.example.com`）
3. 点击 "Add"

### 2. 配置DNS
根据Vercel提供的DNS记录，在您的域名服务商处添加：
- **A记录** 或 **CNAME记录**

### 3. 等待DNS生效
通常需要几分钟到几小时，Vercel会自动配置SSL证书。

---

## 🔍 常见问题

### Q1: 部署后页面空白
**解决方案**：
1. 检查浏览器控制台是否有错误
2. 确认 `vercel.json` 中的 `outputDirectory` 设置正确
3. 检查 `package.json` 中的 `build` 脚本是否正确

### Q2: 路由404错误
**解决方案**：
- 确保 `vercel.json` 中包含 `rewrites` 配置
- 这会将所有路由请求重定向到 `index.html`，让前端路由接管

### Q3: 构建失败
**解决方案**：
1. 检查 Vercel 构建日志
2. 确认所有依赖都在 `package.json` 中
3. 本地运行 `pnpm build` 测试是否能成功构建

### Q4: 环境变量配置
如果需要环境变量：
1. 进入 Vercel 项目的 Settings → Environment Variables
2. 添加需要的环境变量
3. 重新部署项目

---

## 📊 部署后的网站信息

- **项目名称**: 钝学推免指南
- **院校数量**: 62所
- **功能特性**:
  - 院校信息浏览
  - 智能匹配评估
  - 梯队筛选
  - 搜索功能

---

## 🚀 性能优化建议

### 1. 启用Vercel Analytics（可选）
```bash
npm install @vercel/analytics
```

在 `client/src/main.tsx` 中添加：
```typescript
import { inject } from '@vercel/analytics';
inject();
```

### 2. 启用Vercel Speed Insights（可选）
```bash
npm install @vercel/speed-insights
```

### 3. 图片优化
考虑使用 Vercel 的图片优化服务，将图片URL改为：
```
https://your-domain.vercel.app/_vercel/image?url=/path/to/image.jpg&w=800&q=75
```

---

## 📞 技术支持

如果遇到部署问题：
1. 查看 [Vercel官方文档](https://vercel.com/docs)
2. 访问 [Vercel社区](https://github.com/vercel/vercel/discussions)
3. 查看项目的GitHub Issues

---

## ✅ 部署检查清单

部署前请确认：
- [ ] 代码已推送到GitHub
- [ ] `vercel.json` 配置文件已创建
- [ ] 本地运行 `pnpm build` 成功
- [ ] 本地运行 `pnpm preview` 可以正常访问
- [ ] 已注册Vercel账号并连接GitHub

部署后请检查：
- [ ] 网站可以正常访问
- [ ] 所有页面路由正常
- [ ] 院校数据正常显示
- [ ] 搜索功能正常
- [ ] 匹配功能正常

---

## 🎉 预期结果

部署成功后，您将获得：
- ✅ 一个公开访问的网站URL（如 `https://literature-tuimian-dashboard.vercel.app`）
- ✅ 自动SSL证书（HTTPS）
- ✅ 全球CDN加速
- ✅ 自动部署（每次push到GitHub）
- ✅ 免费托管（Vercel免费套餐）

---

**祝您部署顺利！** 🚀
