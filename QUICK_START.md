# 🚀 快速部署指南（5分钟完成）

## 第一步：准备 GitHub 仓库

```bash
# 如果还没有 git 仓库
git init
git add .
git commit -m "Initial commit"

# 在 GitHub 创建新仓库后
git remote add origin https://github.com/你的用户名/kami.git
git push -u origin main
```

## 第二步：部署到 Vercel

1. 访问 https://vercel.com
2. 用 GitHub 账号登录
3. 点击 "Add New..." → "Project"
4. 选择你的 `kami` 仓库
5. 在 "Environment Variables" 添加：
   - Name: `ADMIN_PASSWORD`
   - Value: `你的管理员密码`（例如：admin123）
6. 点击 "Deploy" 按钮
7. 等待 1-2 分钟部署完成

## 第三步：添加 Redis 数据库

1. 在 Vercel 项目页面，点击 "Storage" 标签
2. 点击 "Create Database"
3. 选择 "KV" (Redis)
4. 输入名称：`kami-kv`
5. 选择区域：Hong Kong (hkg1)
6. 点击 "Create"

## 第四步：重新部署

1. 点击 "Deployments" 标签
2. 点击最新部署右侧的 "..." 按钮
3. 选择 "Redeploy"
4. 等待部署完成

## 🎉 完成！

现在访问你的网站：
- 前台：`https://你的项目名.vercel.app`
- 后台：`https://你的项目名.vercel.app/admin`

## ⚠️ 重要提示

- **必须创建 Vercel KV 数据库**，否则应用无法工作
- **必须重新部署**，让应用连接到数据库
- 管理员密码在环境变量中设置

## 🆘 遇到问题？

查看详细文档：[DEPLOY.md](./DEPLOY.md)

