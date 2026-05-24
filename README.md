# 绿茶字幕组站点 (Green Tea Subs Site)

基于 Astro + Svelte + Tailwind CSS 构建的字幕组官方网站。

## 功能特性

- 🎬 **作品自动发布** — RSS 抓取 + 版本收集 + TMDB 信息填充，一集全版本到齐后自动生成作品页
- 📊 **季度展示板** — 自动 RSS 解析进度，实时跟踪番剧更新
- 🌐 多语言支持（中/日/英）
- 🌙 亮/暗双模式二次元主题
- 📝 Decap CMS 内容管理
- 🔍 Pagefind 搜索
- 💬 Giscus 评论
- 📈 Umami 统计
- 📡 RSS 输出

## 技术栈

- [Astro](https://astro.build/) - 静态站点生成器
- [Svelte](https://svelte.dev/) - 交互组件
- [Tailwind CSS](https://tailwindcss.com/) - 样式
- [Decap CMS](https://decapcms.org/) - 内容管理
- [Pagefind](https://pagefind.app/) - 搜索
- [Giscus](https://giscus.app/) - 评论

---

## 部署流程总览

```
1. 个性化配置  →  2. 选择部署方式  →  3. 配置第三方服务  →  4. 开始使用
     ↓                  ↓                      ↓
  改站点名称      Vercel 或自建          Giscus / TMDB
  换图标颜色      服务器               Umami（可选）
```

---

## 第一步：个性化配置（部署前必做）

### 1. 修改站点名称和图标

编辑 `src/config/site.ts`：

```typescript
export const siteConfig = {
  // 站点名称（支持多语言）
  name: '绿茶字幕组',        // 中文
  nameEn: 'Green Tea Subs', // 英文
  nameJa: '緑茶字幕組',     // 日文
  
  // 站点描述
  description: '用心翻译每一帧',
  descriptionEn: 'Translating every frame with heart',
  descriptionJa: '一つ一つのフレームに心を込めて',
  
  // 图标配置
  logo: {
    text: true,      // true=文字Logo, false=图片Logo
    iconText: 'G',   // Logo文字（单个字母或短文字）
    image: '',       // 图片Logo路径（如使用图片则填 /logo.png）
  },
  
  // 站点地址
  url: 'https://your-domain.com',
  
  // 版权后缀
  copyright: '用爱发电',
};
```

### 2. 更换图标

将图标文件放入 `public/` 目录：

| 文件 | 用途 | 建议尺寸 |
|------|------|---------|
| `public/favicon.svg` | 浏览器标签页图标 | SVG 矢量图 |
| `public/favicon.ico` | 旧浏览器兼容 | 32x32 |
| `public/images/og-default.jpg` | 社交分享封面图 | 1200x630 |

### 3. 修改主题色（可选）

编辑 `src/styles/global.css`，修改 CSS 变量：

```css
:root {
  --accent-purple: #a855f7;
  --accent-pink: #ec4899;
  /* 更多颜色变量... */
}
```

---

## 第二步：环境准备

### 系统要求

| 项目 | 最低版本 | 说明 |
|------|---------|------|
| Node.js | >= 22.12.0 | [下载](https://nodejs.org/) |
| npm | >= 10.x | 随 Node.js 安装 |
| Git | 任意 | [下载](https://git-scm.com/) |

### 你需要准备的账号和服务

| 项目 | 必需 | 用途 |
|------|------|------|
| GitHub 账号 | ✅ 必需 | 代码托管 + CMS 认证 |
| Giscus | ✅ 必需 | 评论区 |
| Vercel / 服务器 | ✅ 必需 | 网站托管 |
| TMDB API Key | ❌ 可选但推荐 | 自动填充作品信息（封面、简介、标签） |
| Umami | ❌ 可选 | 访问统计 |
| 自定义域名 | ❌ 可选 | 品牌域名 |

---

## 第三步：本地开发与测试

### 1. 克隆项目

```bash
# 使用你自己的仓库地址
git clone https://github.com/你的用户名/你的仓库名.git
cd 你的仓库名
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
# 复制示例文件
cp .env.example .env

# 编辑 .env（详见下方配置说明）
nano .env
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:4321 查看效果。

> 💡 **提示**：开发模式下 Pagefind 搜索不可用，构建后才可用。

---

## 第四步：选择部署方式

### 方式 A：Vercel 部署（推荐 ⭐）

适合：没有服务器经验、想要快速上线、需要全球 CDN

| 优点 | 缺点 |
|------|------|
| 自动构建部署 | 需要绑定 GitHub |
| 全球 CDN 加速 | 免费版有流量限制 |
| 自带 HTTPS | |
| 配置简单 | |

**步骤：**

1. **准备 GitHub 仓库**
   ```bash
   git init
   git add .
   git commit -m "init: 初始化字幕组站点"
   git branch -M main
   git remote add origin https://github.com/你的用户名/你的仓库名.git
   git push -u origin main
   ```

2. **连接 Vercel**
   - 访问 [vercel.com](https://vercel.com)，用 GitHub 登录
   - 点击 "Add New Project"
   - 选择你的仓库
   - 保持默认配置（Astro），点击 "Deploy"

3. **配置环境变量**
   - 进入 Vercel Dashboard → 你的项目 → Settings → Environment Variables
   - 添加以下变量（详见下方【第三方服务配置】）：
     - `GISCUS_REPO`
     - `GISCUS_REPO_ID`
     - `GISCUS_CATEGORY_ID`
     - `RSS_FEED_URL`
     - `GROUP_NAME`

4. **绑定域名（可选）**
   - Vercel Dashboard → Domains → Add
   - 按提示配置 DNS 记录

---

### 方式 B：自建服务器部署

适合：有服务器资源、需要完全控制、大流量站点

| 优点 | 缺点 |
|------|------|
| 完全控制 | 需要自己维护 |
| 无流量限制 | 需要服务器成本 |
| 数据自主 | 配置较复杂 |

**服务器要求：**

| 项目 | 要求 |
|------|------|
| 系统 | Linux (Ubuntu/Debian/CentOS) |
| Node.js | >= 22.12.0 |
| 内存 | >= 512MB |
| 带宽 | 根据访问量 |

**步骤：**

1. **安装依赖**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt install -y nodejs nginx git
   ```

2. **克隆并构建**
   ```bash
   cd /var/www
   git clone https://github.com/你的用户名/你的仓库名.git
   cd 你的仓库名
   npm install
   npm run build
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   nano .env
   # 填入配置（详见下方）
   ```

4. **启动服务（三选一）**

   **方案 1 - PM2（推荐）**
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

   **方案 2 - Systemd**
   ```bash
   sudo systemctl enable green-tea-subs
   sudo systemctl start green-tea-subs
   ```

   **方案 3 - Docker（最简单）**
   ```bash
   docker build -t subs-site .
   docker run -d -p 3000:3000 --name subs-site subs-site
   ```

5. **配置 Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/subs-site
   # 填入配置（详见下方 Nginx 配置）
   sudo ln -s /etc/nginx/sites-available/subs-site /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

6. **配置 HTTPS**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## 第五步：第三方服务配置

### Giscus 评论系统（必需）

1. 确保仓库已开启 Discussions（Settings → General → Discussions → 勾选）
2. 访问 [giscus.app](https://giscus.app)
3. 输入你的仓库名，选择语言 zh-CN
4. 复制以下信息到环境变量：
   - `GISCUS_REPO`: `你的用户名/仓库名`
   - `GISCUS_REPO_ID`: 从 giscus.app 获取
   - `GISCUS_CATEGORY_ID`: 从 giscus.app 获取

### GitHub OAuth 登录（可选）

站点支持用户通过 GitHub OAuth 登录，用于评论和个人资料。

**配置步骤：**

1. **创建 GitHub OAuth App**
   - 访问 GitHub Settings → Developer settings → OAuth Apps
   - 点击 "New OAuth App"
   - Application name: 你的站点名称
   - Homepage URL: 你的站点地址（如 `https://your-domain.com`）
   - Authorization callback URL: `https://your-domain.com/`
   - 创建后记录 **Client ID** 和 **Client Secret**

2. **配置 Netlify Identity**
   - 访问 [netlify.com](https://netlify.com)，导入同一仓库
   - 进入 Site settings → Identity → Enable Identity
   - External providers → GitHub → Add provider
   - 填入 GitHub OAuth App 的 Client ID 和 Client Secret
   - 保存

3. **配置站点**
   - 编辑 `src/components/Header.astro`（如需自定义登录按钮）
   - 用户现在可以在 Header 点击用户图标登录

> 💡 **说明**：Giscus 评论使用 GitHub Discussions，用户评论时需要通过 GitHub 授权。站点登录功能让用户可以在站点内保持登录状态，方便评论互动。

### 展示板 & 自动发布作品（必需）

站点支持从 RSS 源自动抓取字幕组发布，**等一集的所有版本到齐后自动生成作品页**。

**1. 配置展示板**

编辑 `src/content/showcase/2025-spring.md`（或其他季节文件）：

```yaml
---
season: "2025春"
shows:
  - title: "作品名 / 英文名"
    regex: '\[?(\d{2,3})\]?\[WebRip\]'     # 集数提取正则
    rss_search: "绿茶字幕组 作品名"          # RSS 搜索关键词
    tmdb_id: 261526                         # TMDB 作品 ID（可选，用于获取封面/简介）
    versions_expected:                       # 等这几个版本齐了才发布
      - "简日内嵌"
      - "繁日内嵌"
      - "简繁日内封"
    alsoIn: []
    versions:
      - name: "Web"
        episodes: []
---
```

**2. 设置环境变量（可选）**

```bash
TMDB_API_KEY=your-tmdb-api-key    # 可选但推荐，用于自动填充封面/简介/标签
```

**3. 自动运行**

GitHub Actions 每 30 分钟运行一次：
- `scripts/parse-rss.js` — 更新展示板进度
- `scripts/auto-publish.js` — 检测版本齐全后自动生成作品页

如需修改频率，编辑 `.github/workflows/showcase.yml`。

**4. 手动运行**

```bash
npm run parse-rss      # 仅更新展示板
npm run auto-publish   # 检测并发布作品
```

### Umami 统计（可选）

1. 自建 [Umami](https://umami.is/) 或使用官方托管
2. 添加站点，获取 Website ID
3. 编辑 `src/layouts/Layout.astro`，替换：
   ```html
   <script defer src="你的Umami地址/script.js" data-website-id="你的ID"></script>
   ```

### Decap CMS（可选）

需要 Git Gateway 后端，推荐 Netlify Identity（免费）：

1. 访问 [netlify.com](https://netlify.com)，导入同一仓库
2. Site settings → Identity → Enable Identity
3. Services → Git Gateway → Enable
4. 编辑 `public/admin/config.yml`：
   ```yaml
   backend:
     name: git-gateway
     branch: main
     repo: 你的用户名/你的仓库名
   ```

---

## 第六步：验证部署

部署完成后，检查以下功能是否正常：

- [ ] 首页正常显示
- [ ] 作品列表页有搜索框
- [ ] 展示板显示番剧进度
- [ ] 切换季度正常
- [ ] 搜索功能可用
- [ ] 评论区正常加载
- [ ] 暗/亮模式切换正常
- [ ] RSS 输出正常 (`/rss.xml`)
- [ ] CMS 后台可访问 (`/admin/`)

---

## 环境变量参考

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `GISCUS_REPO` | ✅ | GitHub 仓库路径 | `user/repo` |
| `GISCUS_REPO_ID` | ✅ | 从 giscus.app 获取 | `MDEw...` |
| `GISCUS_CATEGORY_ID` | ✅ | 从 giscus.app 获取 | `DIC_kw...` |
| `TMDB_API_KEY` | ❌ | TMDB API 密钥（自动发布作品用） | `a1b2c3...` |
| `UMAMI_WEBSITE_ID` | ❌ | Umami 站点 ID | `uuid...` |
| `UMAMI_SCRIPT_URL` | ❌ | Umami 脚本地址 | `https://.../script.js` |
| `SUBTITLE_REPO` | ❌ | 字幕仓库路径 | `user/subtitles` |
| `SUBTITLE_REPO_BRANCH` | ❌ | 字幕仓库分支 | `main` |

---

## 常用命令速查

```bash
# 开发
npm run dev              # 启动开发服务器

# 构建
npm run build            # 完整构建（含搜索索引）
npm run pagefind         # 仅更新搜索索引

# 预览
npm run preview          # 本地预览构建结果

# RSS 自动发布
npm run parse-rss        # 更新展示板进度
npm run auto-publish     # 检测并自动发布作品

# 更新
git pull origin main     # 拉取最新代码
npm install              # 安装/更新依赖
npm update               # 更新依赖到最新版本

# PM2（自建服务器）
pm2 status               # 查看状态
pm2 restart subs-site    # 重启服务
pm2 logs subs-site       # 查看日志
pm2 save                 # 保存配置
```

---

## 目录结构

```
SubtitleGroupSite/
├── src/
│   ├── config/
│   │   └── site.ts           # ⭐ 站点配置（名称、图标、颜色）
│   ├── components/           # UI 组件
│   │   ├── Header.astro      # 导航栏
│   │   ├── Footer.astro      # 页脚
│   │   ├── ThemeToggle.svelte # 主题切换
│   │   └── DownloadButton.svelte # 下载按钮
│   ├── content/              # 内容集合
│   │   ├── works/            # 作品文章 (*.md)
│   │   ├── misc/             # 杂谈文章 (*.md)
│   │   ├── showcase/         # 展示板数据 (*.md)
│   │   ├── about/            # 关于页面 (*.md)
│   │   └── .rss-cache/       # RSS 版本收集缓存（自动提交）
│   ├── i18n/
│   │   └── ui.ts             # 多语言字典
│   ├── layouts/
│   │   └── Layout.astro      # 页面基础布局
│   ├── pages/                # 页面路由
│   │   ├── index.astro       # 首页
│   │   ├── works/            # 作品列表/详情
│   │   ├── showcase/         # 展示板
│   │   ├── misc/             # 杂谈列表/详情
│   │   ├── about.astro       # 关于页面
│   │   └── rss.xml.js        # RSS 输出
│   └── styles/
│       └── global.css        # 全局样式 + CSS 变量
├── public/                   # 静态资源
│   ├── admin/                # Decap CMS 后台
│   ├── favicon.svg           # 站点图标
│   └── images/               # 图片资源
├── scripts/
│   ├── parse-rss.js          # RSS 解析脚本（更新展示板）
│   └── auto-publish.js       # 自动发布作品脚本（版本收集 + TMDB 查询）
├── .github/workflows/
│   └── showcase.yml          # 自动更新展示板
├── .env.example              # 环境变量示例
├── astro.config.mjs          # Astro 配置
└── ecosystem.config.js       # PM2 配置
```

---

## 故障排查

### 构建失败

| 错误 | 原因 | 解决 |
|------|------|------|
| `Cannot find module` | 依赖缺失 | `rm -rf node_modules package-lock.json && npm install` |
| `Cannot apply unknown utility class` | Tailwind 类名错误 | 检查 CSS 中是否使用了 `@apply` 未定义的类 |
| `Pagefind error` | 搜索索引失败 | 确保构建完成后再运行 `npm run pagefind` |

### 运行时问题

| 现象 | 原因 | 解决 |
|------|------|------|
| 搜索框不工作 | Pagefind 未索引 | 运行 `npm run build`（会自动索引） |
| 评论区不显示 | Giscus 配置错误 | 检查环境变量是否正确，仓库是否开启 Discussions |
| 展示板不更新 | GitHub Actions 失败 | 检查 Actions 日志，确认 Secrets 设置正确 |
| CMS 登录报错 | Git Gateway 未配置 | 检查 Netlify Identity / Git Gateway 是否启用 |
| 样式错乱 | 构建缓存问题 | 清除浏览器缓存，重新构建 |
| 作品未自动发布 | 版本未收集齐 | 检查 `versions_expected` 配置，确认 RSS 中已包含所有版本 |
| 作品封面未显示 | TMDB API Key 未设置 | 在环境变量中添加 `TMDB_API_KEY` |
| 展示板/作品重复发布 | 缓存丢失 | 确保 `src/content/.rss-cache/` 已提交到仓库 |

---

## 更新站点

日常内容更新通过 **Decap CMS** (`/admin/`) 或 **直接编辑 Markdown 文件**。

代码更新后重新部署：

```bash
# Vercel（自动）
git push origin main

# 自建服务器
git pull origin main
npm install
npm run build
pm2 restart subs-site
```

---

## 贡献

欢迎提交 Issue 和 PR！

## 许可证

MIT License

---

Made with 💜 by 绿茶字幕组
