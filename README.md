# 绿茶字幕组站点 (Green Tea Subs Site)

基于 Astro + Svelte + Tailwind CSS 构建的字幕组官方网站。

## 功能特性

- 作品发布系统（文章 + 下载）
- 季度展示板（自动 RSS 解析进度）
- 多语言支持（中/日/英）
- 亮/暗双模式二次元主题
- Decap CMS 内容管理
- Pagefind 搜索
- Giscus 评论
- Umami 统计
- RSS 输出

## 技术栈

- [Astro](https://astro.build/) - 静态站点生成器
- [Svelte](https://svelte.dev/) - 交互组件
- [Tailwind CSS](https://tailwindcss.com/) - 样式
- [Decap CMS](https://decapcms.org/) - 内容管理
- [Pagefind](https://pagefind.app/) - 搜索
- [Giscus](https://giscus.app/) - 评论

---

## 前置准备

### 1. 环境要求

- **Node.js**: >= 22.12.0
- **Git**: 任意版本
- **npm**: >= 10.x

### 2. 你需要准备的东西

部署前，请确保你已准备好以下信息：

| 项目 | 说明 | 获取方式 |
|------|------|---------|
| GitHub 账号 | 用于托管代码和 Decap CMS 认证 | [github.com](https://github.com) |
| 站点仓库 | 存放本项目的 GitHub 仓库 | 新建或 Fork |
| 字幕仓库 (可选) | 存放字幕文件的独立仓库 | 新建 |
| Giscus 配置 | 评论系统 | 见下方配置 |
| Umami 地址 (可选) | 访问统计 | 自建或官方 |
| RSS 源地址 | 展示板自动解析用 | 第三方站点 |

---

## 快速开始（本地开发）

### 1. 克隆项目

```bash
git clone https://github.com/你的用户名/你的仓库名.git
cd 你的仓库名
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制示例配置文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的配置：

```env
# Umami 统计（可选）
UMAMI_WEBSITE_ID=your-website-id
UMAMI_SCRIPT_URL=https://your-umami-domain.com/script.js

# Giscus 评论（必需）
GISCUS_REPO=你的用户名/你的仓库名
GISCUS_REPO_ID=从 Giscus 获取
GISCUS_CATEGORY_ID=从 Giscus 获取

# 字幕仓库（可选）
SUBTITLE_REPO=你的用户名/字幕仓库名
SUBTITLE_REPO_BRANCH=main

# RSS 解析（展示板用）
RSS_FEED_URL=https://api.animes.garden/feed.xml
GROUP_NAME=你的字幕组名
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:4321 查看站点。

---

## 部署方式一：Vercel（推荐）

Vercel 是部署 Astro 站点的最佳平台，支持自动构建和全球 CDN。

### 步骤 1：准备 GitHub 仓库

1. 在 GitHub 上创建一个新仓库（如 `green-tea-subs-site`）
2. 将本地代码推送到仓库：

```bash
git init
git add .
git commit -m "init: 初始化字幕组站点"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

### 步骤 2：连接 Vercel

1. 访问 [vercel.com](https://vercel.com) 并登录（建议用 GitHub 账号登录）
2. 点击 "Add New Project"
3. 选择你的 GitHub 仓库
4. Vercel 会自动识别 Astro 项目，保持默认配置即可：
   - **Framework Preset**: Astro
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 点击 "Deploy"

### 步骤 3：配置环境变量

1. 在 Vercel Dashboard 进入项目设置
2. 选择 "Environment Variables"
3. 添加以下变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `GISCUS_REPO` | 你的用户名/仓库名 | Production |
| `GISCUS_REPO_ID` | 从 Giscus 获取 | Production |
| `GISCUS_CATEGORY_ID` | 从 Giscus 获取 | Production |
| `RSS_FEED_URL` | RSS 源地址 | Production |
| `GROUP_NAME` | 字幕组名 | Production |

### 步骤 4：配置域名（可选）

1. 在 Vercel Dashboard 进入 "Domains"
2. 添加你的自定义域名
3. 按提示配置 DNS 记录

### 步骤 5：配置 Decap CMS

Decap CMS 需要 Git Gateway 后端支持。推荐使用 **Netlify Identity**（免费）：

1. 访问 [netlify.com](https://netlify.com) 并用 GitHub 登录
2. 导入同一个 GitHub 仓库
3. 部署后，进入 Site settings -> Identity
4. 启用 Identity 服务
5. 设置 Git Gateway（在 Services 中）
6. 复制 Netlify 站点的 API URL
7. 修改 `public/admin/config.yml`：

```yaml
backend:
  name: git-gateway
  branch: main
  repo: 你的用户名/你的仓库名
```

8. 提交修改并推送到 GitHub（Vercel 会自动重新部署）

### Vercel 部署完成！

每次你推送代码到 GitHub，Vercel 会自动重新构建和部署。

---

## 部署方式二：本地部署（自建服务器）

如果你想在自己的服务器上运行，使用 Node.js 部署。

### 步骤 1：服务器准备

确保服务器已安装：
- Node.js >= 22.12.0
- npm >= 10.x
- Git
- Nginx（可选，用于反向代理）

### 步骤 2：克隆代码

```bash
cd /var/www
git clone https://github.com/你的用户名/你的仓库名.git
cd 你的仓库名
```

### 步骤 3：安装依赖并构建

```bash
npm install
npm run build
```

构建完成后，会生成 `dist` 目录，其中包含：
- `dist/server/entry.mjs` - Node.js 服务器入口
- `dist/client/` - 静态资源

### 步骤 4：配置环境变量

```bash
cp .env.example .env
nano .env
```

填入你的配置（同上方环境变量表格）。

### 步骤 5：启动服务

#### 方式 A：直接运行（测试用）

```bash
node dist/server/entry.mjs
```

默认监听 http://localhost:4321

#### 方式 B：使用 PM2 守护进程（生产推荐）

安装 PM2：
```bash
npm install -g pm2
```

创建 PM2 配置文件 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'green-tea-subs',
    script: './dist/server/entry.mjs',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

启动服务：
```bash
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 方式 C：使用 Systemd（Linux）

创建服务文件 `/etc/systemd/system/green-tea-subs.service`：

```ini
[Unit]
Description=Green Tea Subs Site
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/你的仓库名
ExecStart=/usr/bin/node /var/www/你的仓库名/dist/server/entry.mjs
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl daemon-reload
sudo systemctl enable green-tea-subs
sudo systemctl start green-tea-subs
sudo systemctl status green-tea-subs
```

### 步骤 6：配置 Nginx 反向代理

如果你希望通过域名访问，配置 Nginx：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 步骤 7：配置 HTTPS（推荐）

使用 Let's Encrypt：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 步骤 8：配置 Decap CMS

本地部署的 Decap CMS 需要 Git Gateway。推荐方案：

**方案 A：使用 Netlify Identity（最简单）**
- 按 Vercel 部署中的 Decap CMS 配置步骤操作
- 你的站点部署在哪里不重要，Netlify Identity 只提供认证服务

**方案 B：使用 GitHub OAuth（自建）**
1. 在 GitHub Settings -> Developer settings -> OAuth Apps 中新建应用
2. 设置 Authorization callback URL 为 `https://your-domain.com/admin/`
3. 获取 Client ID 和 Client Secret
4. 部署一个 [Git Gateway](https://github.com/netlify/git-gateway) 服务
5. 修改 `public/admin/config.yml` 使用 GitHub OAuth

### 本地部署完成！

更新代码后重新部署：
```bash
git pull origin main
npm install
npm run build
pm2 restart green-tea-subs
```

---

## 部署后配置

### 1. 配置 Giscus 评论

1. 确保你的仓库已开启 Discussions 功能（Settings -> General -> Discussions）
2. 访问 [giscus.app](https://giscus.app)
3. 输入你的仓库名，选择语言为 zh-CN
4. 复制生成的 `data-repo-id` 和 `data-category-id`
5. 填入 `.env` 文件，或直接在以下文件中替换：
   - `src/pages/works/[slug].astro`
   - `src/pages/misc/[slug].astro`

### 2. 配置展示板 RSS 解析

1. 在 GitHub 仓库设置中添加 Secrets：
   - `RSS_FEED_URL`：第三方 RSS 源地址
   - `GROUP_NAME`：你的字幕组名（如"绿茶字幕组"）
   - `GROUP_NAME_ALT`：别名（可选）

2. GitHub Action 会自动每 30 分钟运行一次，解析 RSS 并更新展示板数据

3. 如需修改运行频率，编辑 `.github/workflows/showcase.yml`：
```yaml
on:
  schedule:
    - cron: '*/30 * * * *'  # 每30分钟，可修改
```

### 3. 配置 Umami 统计（可选）

1. 自建 Umami 或使用官方托管
2. 添加站点，获取 Website ID
3. 在 `src/layouts/Layout.astro` 中替换脚本：
```html
<script defer src="你的Umami地址/script.js" data-website-id="你的ID"></script>
```

### 4. 配置字幕下载系统（可选）

1. 创建独立的字幕仓库（如 `subtitles`）
2. 在 `.env` 中配置：
```env
SUBTITLE_REPO=你的用户名/subtitles
SUBTITLE_REPO_BRANCH=main
```
3. 文件命名规范：
   - 字幕包：`[组名] 番剧名 - 集数 [版本][分辨率]--备注.zip`
   - 字体包：`番剧名 字体包.zip`
4. 开发 `scripts/generate-download-manifest.js` 生成下载清单

---

## 常用命令

```bash
# 开发模式
npm run dev

# 构建（含 Pagefind 索引）
npm run build

# 仅构建 Pagefind 索引
npm run pagefind

# 本地预览构建结果
npm run preview

# 更新依赖
npm update
```

---

## 目录结构

```
├── src/
│   ├── components/          # 组件
│   │   ├── Header.astro     # 导航栏
│   │   ├── Footer.astro     # 页脚
│   │   ├── DownloadButton.svelte  # 下载按钮
│   │   ├── ThemeToggle.svelte     # 主题切换
│   │   └── Search.svelte          # 搜索
│   ├── content/             # 内容集合
│   │   ├── works/           # 作品文章
│   │   ├── misc/            # 杂谈文章
│   │   ├── showcase/        # 展示板数据
│   │   └── about/           # 关于页面
│   ├── i18n/
│   │   └── ui.ts            # 多语言字典
│   ├── layouts/
│   │   └── Layout.astro     # 基础布局
│   ├── pages/               # 页面路由
│   └── styles/
│       └── global.css       # 全局样式
├── public/                  # 静态资源
│   ├── admin/               # Decap CMS
│   ├── favicon.svg
│   └── opensearch.xml
├── scripts/
│   └── parse-rss.js         # RSS 解析脚本
├── .github/workflows/
│   └── showcase.yml         # 展示板自动化
├── astro.config.mjs
├── package.json
├── README.md
├── .env.example
└── ecosystem.config.js      # PM2 配置（可选）
```

---

## 常见问题

### Q: 构建失败，提示 "Cannot find module"
A: 删除 `node_modules` 和 `package-lock.json`，重新运行 `npm install`

### Q: Pagefind 搜索不工作
A: 确保已运行 `npm run build`（构建脚本会自动调用 Pagefind）。开发模式下搜索不可用。

### Q: Decap CMS 登录后报错
A: 检查 Git Gateway 配置，确保 Netlify Identity 已正确设置，且回调 URL 匹配你的站点域名。

### Q: 展示板没有自动更新
A: 检查 GitHub Actions 是否运行成功，Secrets 是否正确设置。可手动触发 workflow 测试。

### Q: 如何修改站点主题色？
A: 编辑 `src/styles/global.css`，修改 CSS 变量中的颜色值。

---

## 贡献

欢迎提交 Issue 和 PR！

## 许可证

MIT License

---

Made with 💜 by 绿茶字幕组
