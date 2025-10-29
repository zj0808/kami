# Vercel 部署指南

## 🚨 重要：您的网站无法访问的原因

您的网站在本地可以运行，但在 Vercel 上无法访问，主要原因是：

### ❌ 缺少 Vercel KV 数据库配置

您的应用使用了 `@vercel/kv` 来存储卡密数据，但 **Vercel 上还没有创建和连接 KV 数据库**！

---

## ✅ 解决方案：配置 Vercel KV 数据库

### 步骤 1️⃣：创建 Vercel KV 数据库

1. **登录 Vercel Dashboard**
   - 访问：https://vercel.com/dashboard

2. **进入 Storage 页面**
   - 点击顶部导航栏的 **"Storage"** 标签
   - 或直接访问：https://vercel.com/dashboard/stores

3. **创建 KV 数据库**
   - 点击 **"Create Database"** 按钮
   - 选择 **"KV"** (Key-Value Store)
   - 输入数据库名称，例如：`kami-kv`
   - 选择区域：**Hong Kong (hkg1)** （与您的项目区域一致）
   - 点击 **"Create"** 创建数据库

---

### 步骤 2️⃣：连接 KV 数据库到项目

1. **在 KV 数据库页面**
   - 创建完成后，会看到数据库详情页面
   - 点击 **"Connect Project"** 按钮

2. **选择项目**
   - 在弹出的对话框中，选择您的项目：**`kami`**
   - 点击 **"Connect"** 连接

3. **自动配置环境变量**
   - Vercel 会自动为您的项目添加以下环境变量：
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
     - `KV_REST_API_READ_ONLY_TOKEN`
     - `KV_URL`

---

### 步骤 3️⃣：配置管理员密码

1. **进入项目设置**
   - 访问：https://vercel.com/kami-rosy-ten/settings
   - 或在项目页面点击 **"Settings"** 标签

2. **添加环境变量**
   - 点击左侧菜单的 **"Environment Variables"**
   - 点击 **"Add New"** 按钮
   - 添加以下变量：
     ```
     Name: ADMIN_PASSWORD
     Value: admin123  （或您想要的密码）
     Environment: Production, Preview, Development （全选）
     ```
   - 点击 **"Save"** 保存

---

### 步骤 4️⃣：重新部署

1. **触发重新部署**
   - 方法 1：在项目页面点击 **"Deployments"** 标签
   - 找到最新的部署，点击右侧的 **"..."** 菜单
   - 选择 **"Redeploy"**
   - 勾选 **"Use existing Build Cache"** 可以加快部署速度
   - 点击 **"Redeploy"** 确认

   - 方法 2：推送新的代码到 GitHub
     ```bash
     git add .
     git commit -m "Fix Vercel deployment configuration"
     git push
     ```

2. **等待部署完成**
   - 等待 1-2 分钟，直到部署状态变为 **"Ready"**

3. **访问网站**
   - 访问：https://kami-rosy-ten.vercel.app/
   - 应该可以正常打开了！🎉

---

## 🔍 验证部署是否成功

### 1. 检查环境变量
- 进入项目设置 → Environment Variables
- 确保有以下变量：
  - ✅ `ADMIN_PASSWORD`
  - ✅ `KV_REST_API_URL`
  - ✅ `KV_REST_API_TOKEN`
  - ✅ `KV_REST_API_READ_ONLY_TOKEN`
  - ✅ `KV_URL`

### 2. 检查 KV 数据库连接
- 进入 Storage → 您的 KV 数据库
- 在 **"Connected Projects"** 中应该看到您的项目

### 3. 测试网站功能
- 访问首页：https://kami-rosy-ten.vercel.app/
- 访问管理员页面：https://kami-rosy-ten.vercel.app/?admin_zj=true
- 登录管理员账号（密码：您设置的 `ADMIN_PASSWORD`）
- 创建测试卡密
- 在首页验证卡密是否可用

---

## 🐛 常见问题

### Q1: 部署成功但网站还是打不开？
**A:** 清除浏览器缓存，或使用无痕模式访问

### Q2: API 返回 500 错误？
**A:** 检查 Vercel KV 数据库是否正确连接，环境变量是否配置

### Q3: 管理员登录失败？
**A:** 检查 `ADMIN_PASSWORD` 环境变量是否正确设置

### Q4: 卡密验证失败？
**A:** 
- 确保 KV 数据库已连接
- 在管理员页面创建测试卡密
- 检查 Vercel 日志是否有错误信息

---

## 📊 查看日志

如果遇到问题，可以查看 Vercel 日志：

1. **实时日志**
   - 项目页面 → **"Logs"** 标签
   - 可以看到所有 API 请求和错误信息

2. **构建日志**
   - 项目页面 → **"Deployments"** 标签
   - 点击某个部署 → **"Build Logs"**
   - 查看构建过程中的错误

---

## 🎯 下一步

配置完成后，您的网站应该可以正常访问了！

如果还有问题，请：
1. 截图 Vercel 的错误信息
2. 检查 Vercel Logs 中的错误日志
3. 确认 KV 数据库和环境变量都已正确配置

---

## 📝 技术说明

### 为什么本地可以运行？
- 本地使用的是 `.env.local` 文件
- Next.js 在本地开发时会自动加载环境变量
- 但 Vercel 部署时需要在 Vercel Dashboard 中配置

### 为什么需要 KV 数据库？
- 您的应用使用 `@vercel/kv` 存储卡密数据
- 这是一个 Redis 兼容的 Key-Value 数据库
- 必须在 Vercel 上创建并连接才能使用

### 配置文件说明
- `vercel.json`: Vercel 部署配置
- `next.config.ts`: Next.js 配置
- `.env.local`: 本地环境变量（不会上传到 Vercel）
- Vercel Environment Variables: 生产环境变量

---

**祝您部署成功！** 🚀

