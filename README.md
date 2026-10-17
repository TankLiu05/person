# 刘子鋆｜系统运维工程师个人主页

纯 HTML、CSS 和 JavaScript 构建的静态个人网站。发布目录为 `dist/`。

## GitHub Pages 自动部署

仓库包含 `.github/workflows/deploy-pages.yml`。每次向 `main` 分支推送代码时，GitHub Actions 会：

1. 检查 `dist/` 中的核心静态文件；
2. 检查 JavaScript 语法；
3. 将 `dist/` 打包为 GitHub Pages 构建产物；
4. 自动部署到 GitHub Pages。

也可以进入仓库的 **Actions** 页面，选择 **Deploy static site to GitHub Pages**，手动运行部署。

## 第一次推送

在 GitHub 创建一个空仓库后，在本项目目录运行：

```bash
git add .
git commit -m "feat: add personal portfolio and GitHub Pages deployment"
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

然后进入 GitHub 仓库：

1. 打开 **Settings → Pages**；
2. 在 **Build and deployment** 中选择 **GitHub Actions**；
3. 打开 **Actions** 查看部署进度；
4. 部署成功后，地址通常为 `https://你的用户名.github.io/你的仓库名/`。

后续更新网站只需要提交并推送：

```bash
git add .
git commit -m "update: refresh portfolio content"
git push
```
