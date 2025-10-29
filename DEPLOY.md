# Vercel 部署指南

## 📋 前置要求

1. GitHub 账号
2. Vercel 账号（使用 GitHub 登录）
3. 将代码推送到 GitHub 仓库

## 🚀 部署步骤

### 1. 准备 GitHub 仓库

如果还没有推送代码到 GitHub：

```bash
# 初始化 git 仓库（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 创建 GitHub 仓库后，添加远程仓库
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 推送代码
git push -u origin main
```

### 2. 注册 Vercel

1. 访问 https://vercel.com
2. 点击 "Sign Up"
3. 选择 "Continue with GitHub"
4. 授权 Vercel 访问你的 GitHub

### 3. 导入项目

1. 登录 Vercel 后，点击 "Add New..." → "Project"
2. 选择你的 GitHub 仓库（kami）
3. Vercel 会自动检测到这是 Next.js 项目

### 4. 配置环境变量

在部署前，需要配置环境变量：

1. 在 "Environment Variables" 部分，添加：
   - `ADMIN_PASSWORD`: 设置管理员密码（例如：`admin123`）

2. 点击 "Deploy" 按钮

### 5. 配置 Vercel KV (Redis)

部署完成后，需要添加 Redis 数据库：

1. 在 Vercel 项目页面，点击 "Storage" 标签
2. 点击 "Create Database"
3. 选择 "KV" (Redis)
4. 输入数据库名称（例如：`kami-kv`）
5. 选择区域（推荐：Hong Kong - hkg1）
6. 点击 "Create"

**重要：** Vercel 会自动将 KV 的环境变量添加到你的项目中：
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

### 6. 重新部署

配置 KV 后，需要重新部署：

1. 在项目页面，点击 "Deployments" 标签
2. 点击最新的部署右侧的 "..." 按钮
3. 选择 "Redeploy"
4. 等待部署完成

### 7. 访问你的网站

部署成功后，Vercel 会提供一个域名，例如：
- `https://kami-xxx.vercel.app`

你可以：
- 访问首页：`https://kami-xxx.vercel.app`
- 访问管理后台：`https://kami-xxx.vercel.app/admin`

## 🌐 自定义域名（可选）

1. 在项目页面，点击 "Settings" → "Domains"
2. 输入你的域名
3. 按照提示配置 DNS 记录
4. 等待 DNS 生效（通常几分钟到几小时）

## 🔄 自动部署

配置完成后，每次推送代码到 GitHub，Vercel 会自动部署：

```bash
git add .
git commit -m "更新功能"
git push
```

## 📊 Vercel KV 免费额度

- 存储：30 MB
- 请求：100,000 次/月
- 带宽：100 MB/月

对于个人项目完全够用！

## ⚠️ 注意事项

1. **环境变量**：确保在 Vercel 中配置了 `ADMIN_PASSWORD`
2. **KV 数据库**：必须创建 KV 数据库，否则应用无法正常工作
3. **数据持久化**：所有卡密数据都存储在 Vercel KV 中，不会丢失
4. **本地开发**：本地开发时需要配置 `.env.local` 文件（参考 `.env.local.example`）

## 🛠️ 本地开发配置

如果想在本地连接 Vercel KV 进行开发：

1. 在 Vercel 项目页面，点击 "Settings" → "Environment Variables"
2. 复制 KV 相关的环境变量
3. 创建 `.env.local` 文件：

```bash
ADMIN_PASSWORD=your_password
KV_REST_API_URL=your_kv_url
KV_REST_API_TOKEN=your_kv_token
KV_REST_API_READ_ONLY_TOKEN=your_kv_read_only_token
```

4. 运行开发服务器：

```bash
npm run dev
```

## 🎉 完成！

现在你的卡密系统已经成功部署到 Vercel，可以在全球范围内访问了！

## 📞 常见问题

### Q: 部署后显示 500 错误？
A: 检查是否已创建 Vercel KV 数据库，并重新部署。

### Q: 忘记管理员密码怎么办？
A: 在 Vercel 项目设置中修改 `ADMIN_PASSWORD` 环境变量，然后重新部署。

### Q: 如何备份数据？
A: 在管理后台使用"导出CSV"功能导出所有卡密数据。

### Q: 免费额度用完了怎么办？
A: Vercel KV 免费额度对个人项目足够。如果超出，可以升级到 Pro 计划（$20/月）。

