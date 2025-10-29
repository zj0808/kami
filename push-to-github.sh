#!/bin/bash

# 推送代码到 GitHub 的快速脚本

echo "🚀 准备推送代码到 GitHub..."

# 检查是否已经初始化 git
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 仓库..."
    git init
fi

# 添加所有文件
echo "📝 添加文件..."
git add .

# 提交
echo "💾 提交代码..."
git commit -m "卡密管理系统 - 准备部署到 Vercel"

# 提示用户输入 GitHub 仓库地址
echo ""
echo "📌 请先在 GitHub 创建仓库："
echo "   访问: https://github.com/new"
echo "   仓库名: kami"
echo ""
read -p "请输入 GitHub 仓库地址 (例如: https://github.com/username/kami.git): " repo_url

# 添加远程仓库
echo "🔗 添加远程仓库..."
git remote add origin "$repo_url" 2>/dev/null || git remote set-url origin "$repo_url"

# 推送
echo "⬆️  推送代码..."
git branch -M main
git push -u origin main

echo ""
echo "✅ 代码已推送到 GitHub！"
echo ""
echo "📋 下一步："
echo "1. 访问 https://vercel.com"
echo "2. 用 GitHub 账号登录"
echo "3. 导入 kami 项目"
echo "4. 配置环境变量 ADMIN_PASSWORD=admin123"
echo "5. 点击 Deploy"
echo ""
echo "详细步骤请查看: 部署步骤.md"

