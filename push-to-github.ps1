# 推送代码到 GitHub 的快速脚本 (PowerShell)

Write-Host "🚀 准备推送代码到 GitHub..." -ForegroundColor Green

# 检查是否已经初始化 git
if (-not (Test-Path ".git")) {
    Write-Host "📦 初始化 Git 仓库..." -ForegroundColor Yellow
    git init
}

# 添加所有文件
Write-Host "📝 添加文件..." -ForegroundColor Yellow
git add .

# 提交
Write-Host "💾 提交代码..." -ForegroundColor Yellow
git commit -m "卡密管理系统 - 准备部署到 Vercel"

# 提示用户输入 GitHub 仓库地址
Write-Host ""
Write-Host "📌 请先在 GitHub 创建仓库：" -ForegroundColor Cyan
Write-Host "   访问: https://github.com/new" -ForegroundColor White
Write-Host "   仓库名: kami" -ForegroundColor White
Write-Host ""

# 打开 GitHub 创建仓库页面
Start-Process "https://github.com/new"

$repoUrl = Read-Host "请输入 GitHub 仓库地址 (例如: https://github.com/username/kami.git)"

# 添加远程仓库
Write-Host "🔗 添加远程仓库..." -ForegroundColor Yellow
git remote add origin $repoUrl 2>$null
if ($LASTEXITCODE -ne 0) {
    git remote set-url origin $repoUrl
}

# 推送
Write-Host "⬆️  推送代码..." -ForegroundColor Yellow
git branch -M main
git push -u origin main

Write-Host ""
Write-Host "✅ 代码已推送到 GitHub！" -ForegroundColor Green
Write-Host ""
Write-Host "📋 下一步：" -ForegroundColor Cyan
Write-Host "1. 访问 https://vercel.com" -ForegroundColor White
Write-Host "2. 用 GitHub 账号登录" -ForegroundColor White
Write-Host "3. 导入 kami 项目" -ForegroundColor White
Write-Host "4. 配置环境变量 ADMIN_PASSWORD=admin123" -ForegroundColor White
Write-Host "5. 点击 Deploy" -ForegroundColor White
Write-Host ""
Write-Host "详细步骤请查看: 部署步骤.md" -ForegroundColor Yellow

# 打开 Vercel 网站
Write-Host ""
$openVercel = Read-Host "是否现在打开 Vercel 网站？(Y/N)"
if ($openVercel -eq "Y" -or $openVercel -eq "y") {
    Start-Process "https://vercel.com"
}

